import { useState, useEffect, useRef } from 'react';
import { Stethoscope, ClipboardList } from 'lucide-react';
import { apiClient } from '../config.js';
import { copyNoteToClipboard } from '../utils/exportPDF.js';
import { FollowUpTodos } from './FollowUpTodos.jsx';
import { DrugSearchInput } from './DrugSearchInput.jsx';
import { ExportModal } from './ExportModal.jsx';
import { shareOnWhatsApp, generatePrescriptionMessage } from '../utils/whatsappHelper.js';
import { checkDrugAllergy } from '../utils/allergyChecker.js';
import { checkDosageSanity, checkDrugInteractions } from '../utils/drugSafetyChecker.js';
import exercisesDb from '../data/exercises.json';
import { getPhotoUrls } from '../utils/exercisePhotos.js';
import { Activity } from 'lucide-react';

const formatSectionText = (val) => {
  if (!val) return '';
  if (Array.isArray(val)) {
    return val
      .map(item => (typeof item === 'object' && item !== null ? `${item.drug || item.name || ''} ${item.dose || ''} ${item.frequency || ''}`.trim() : String(item)))
      .map(str => str.trim())
      .filter(str => str && str !== '0')
      .map(str => str.startsWith('-') ? str : `- ${str}`)
      .join('\n');
  }
  if (typeof val === 'object' && val !== null) {
    return Object.values(val)
      .map(v => (typeof v === 'object' ? JSON.stringify(v) : String(v).trim()))
      .filter(str => str && str !== '0')
      .map(str => str.startsWith('-') ? str : `- ${str}`)
      .join('\n');
  }
  return String(val)
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && line !== '0')
    .map(line => line.startsWith('-') ? line : `- ${line}`)
    .join('\n');
};

const normalizeExercisesArray = (rawExercises) => {
  if (!rawExercises) return [];
  if (Array.isArray(rawExercises)) {
    return rawExercises.map(item => {
      if (typeof item === 'object' && item !== null) {
        return {
          name: item.name || item.exercise || 'Prescribed Exercise',
          sets: item.sets || 3,
          reps: item.reps || 10,
          instruction: item.instruction || item.instructions || item.notes || ''
        };
      }
      return {
        name: String(item).replace(/^[-*•\d.]+\s*/, '').trim(),
        sets: 3,
        reps: 10,
        instruction: String(item).trim()
      };
    });
  }
  if (typeof rawExercises === 'string') {
    return rawExercises
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && line !== '0')
      .map(line => ({
        name: line.replace(/^[-*•\d.]+\s*/, '').trim(),
        sets: 3,
        reps: 10,
        instruction: line.trim()
      }));
  }
  return [];
};

const getSectionValue = (noteObj, key) => {
  if (!noteObj || typeof noteObj !== 'object') return '';

  const aliases = {
    subjective: ['chief_complaint', 'history', 'hpi', 'presenting_complaint'],
    objective: ['examination', 'exam', 'physical_exam', 'vitals'],
    assessment: ['diagnosis', 'impression', 'assessment_plan'],
    plan: ['treatment_plan', 'recommendations', 'followup'],
    chief_complaint: ['subjective'],
    history: ['subjective', 'hpi'],
    examination: ['objective', 'exam'],
    diagnosis: ['assessment', 'impression'],
    medications: ['prescription', 'prescription_text', 'discharge_medications'],
    exercises: ['exercises_text', 'rehabilitation', 'rehab']
  };

  if (key === 'medications') {
    const rx = noteObj.medications || noteObj.prescription || noteObj.discharge_medications;
    if (typeof rx === 'string' && rx.trim()) return rx;
    if (Array.isArray(rx) && rx.length > 0) {
      return rx.map((m, idx) => {
        if (typeof m === 'object' && m !== null) {
          const name = m.drug || m.name || '';
          const dose = m.dose ? ` - ${m.dose}` : '';
          const freq = m.frequency ? ` (${m.frequency})` : '';
          return `${idx + 1}. ${name}${dose}${freq}`.trim();
        }
        return `${idx + 1}. ${m}`;
      }).join('\n');
    }
  }

  if (key === 'exercises') {
    const ex = noteObj.exercises || noteObj.exercises_text;
    if (typeof ex === 'string' && ex.trim()) return ex;
    if (Array.isArray(ex) && ex.length > 0) {
      return ex.map((item, idx) => {
        if (typeof item === 'object' && item !== null) {
          const name = item.name || item.exercise || '';
          const sets = item.sets ? `${item.sets} sets` : '3 sets';
          const reps = item.reps ? `${item.reps} reps` : '10 reps';
          const instr = item.instruction ? ` (${item.instruction})` : '';
          return `${idx + 1}. ${name}: ${sets} x ${reps}${instr}`.trim();
        }
        return `${idx + 1}. ${item}`;
      }).join('\n');
    }
  }

  if (noteObj[key] && (typeof noteObj[key] !== 'string' || noteObj[key].trim())) {
    const val = noteObj[key];
    if (typeof val === 'string') return val;
    if (Array.isArray(val)) {
      return val.map((item, idx) => typeof item === 'object' ? `${idx + 1}. ${item.drug || item.name || ''} ${item.dose || ''} ${item.frequency || ''}`.trim() : `${idx + 1}. ${item}`).join('\n');
    }
    return String(val);
  }

  const keyAliases = aliases[key] || [];
  for (const alias of keyAliases) {
    if (noteObj[alias]) {
      const val = noteObj[alias];
      if (typeof val === 'string' && val.trim()) return val;
      if (Array.isArray(val) && val.length > 0) {
        return val.map((item, idx) => typeof item === 'object' ? `${idx + 1}. ${item.drug || item.name || ''} ${item.dose || ''} ${item.frequency || ''}`.trim() : `${idx + 1}. ${item}`).join('\n');
      }
    }
  }

  if (key === 'subjective') {
    const parts = [noteObj.chief_complaint, noteObj.history, noteObj.hpi].filter(Boolean);
    if (parts.length > 0) return parts.join('\n');
  }

  return '';
};

const cleanInlineVal = (val) => {
  if (!val) return '';
  let str = typeof val === 'string' ? val : String(val);
  str = str.replace(/^[-\s*•=:]+/, '').replace(/[\r\n]+/g, ' ').trim();
  return str;
};

const generateUnifiedText = (noteObj, template, patient) => {
  if (template?.id === 'sick_note') {
    const rawDate = (typeof noteObj === 'object' && getSectionValue(noteObj, 'assessment_date')) || '';
    const dateVal = cleanInlineVal(rawDate) || 'Friday, July 24, 2026';
    
    const rawAbsence = (typeof noteObj === 'object' && getSectionValue(noteObj, 'absence_period')) || '';
    const absenceVal = cleanInlineVal(rawAbsence) || '______ days';

    const pName = (patient && `${patient.firstName || ''} ${patient.lastName || ''}`.trim()) || patient?.name || (typeof noteObj === 'object' && (noteObj.patient_name || noteObj.patientName)) || 'the patient';
    
    const reasonVal = typeof noteObj === 'object' ? getSectionValue(noteObj, 'reason_for_absence') : '';
    const restrictionsVal = typeof noteObj === 'object' ? getSectionValue(noteObj, 'work_restrictions') : '';

    let text = `Date: ${dateVal}\n\nTo Whom It May Concern,\n\nThis is to certify that ${pName} has been seen and evaluated by me on ${dateVal}. Please be advised that due to medical reasons, they are recommended to refrain from professional responsibilities for the period of ${absenceVal}.\n\n`;
    if (reasonVal) text += `Reason for Absence:\n${formatSectionText(reasonVal)}\n\n`;
    if (restrictionsVal) text += `Work / Duty Restrictions:\n${formatSectionText(restrictionsVal)}\n\n`;
    text += `Sincerely,`;
    return text;
  }

  const sections = template?.sections || [
    { key: 'subjective', label: 'Subjective' },
    { key: 'objective', label: 'Objective' },
    { key: 'assessment', label: 'Assessment' },
    { key: 'plan', label: 'Plan' },
  ];
  
  if (!noteObj) {
    return sections.map(s => `${s.label.endsWith(':') ? s.label : s.label + ':'}\n`).join('\n');
  }
  
  if (typeof noteObj === 'string') return noteObj;
  
  return sections.map(s => {
    const rawVal = getSectionValue(noteObj, s.key);
    return `${s.label.endsWith(':') ? s.label : s.label + ':'}\n${formatSectionText(rawVal)}`;
  }).join('\n\n');
};

const generateRawUnifiedText = (noteObj, template) => {
  const sections = template?.sections || [
    { key: 'subjective', label: 'Subjective' },
    { key: 'objective', label: 'Objective' },
    { key: 'assessment', label: 'Assessment' },
    { key: 'plan', label: 'Plan' },
  ];
  
  if (!noteObj) {
    return sections.map(s => `${s.label.endsWith(':') ? s.label : s.label + ':'}\n`).join('\n');
  }
  if (typeof noteObj === 'string') return noteObj;

  return sections.map(s => {
    const rawVal = getSectionValue(noteObj, s.key);
    return `${s.label.endsWith(':') ? s.label : s.label + ':'}\n${rawVal}`;
  }).join('\n\n');
};

const parseUnifiedText = (text, template) => {
  const sections = template?.sections || [
    { key: 'subjective', label: 'Subjective' },
    { key: 'objective', label: 'Objective' },
    { key: 'assessment', label: 'Assessment' },
    { key: 'plan', label: 'Plan' },
  ];
  
  const result = {};
  sections.forEach(s => {
    result[s.key] = '';
  });
  
  if (!text) return result;
  
  const lines = text.split('\n');
  let currentKey = null;
  const sectionLines = {};
  sections.forEach(s => {
    sectionLines[s.key] = [];
  });
  
  lines.forEach(line => {
    const trimmed = line.trim();
    const matchedSection = sections.find(s => {
      const cleanLabel = s.label.replace(/:$/, '').trim().toLowerCase();
      const cleanLine = trimmed.replace(/:$/, '').trim().toLowerCase();
      return cleanLine === cleanLabel;
    });
    
    if (matchedSection) {
      currentKey = matchedSection.key;
    } else if (currentKey) {
      sectionLines[currentKey].push(line);
    }
  });
  
  sections.forEach(s => {
    result[s.key] = sectionLines[s.key].join('\n').trim();
  });
  
  return result;
};

const renderInlineMarkdown = (text) => {
  if (!text) return text;
  // Process inline markdown: bold (**), italic (*), underline (__), strikethrough (~~)
  const parts = [];
  // Use a regex to match all markdown patterns
  const regex = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(__(.+?)__)|(\~\~(.+?)\~\~)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    if (match[1]) {
      // Bold **text**
      parts.push(<strong key={match.index}>{match[2]}</strong>);
    } else if (match[3]) {
      // Italic *text*
      parts.push(<em key={match.index}>{match[4]}</em>);
    } else if (match[5]) {
      // Underline __text__
      parts.push(<u key={match.index}>{match[6]}</u>);
    } else if (match[7]) {
      // Strikethrough ~~text~~
      parts.push(<s key={match.index}>{match[8]}</s>);
    }
    lastIndex = match.index + match[0].length;
  }
  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }
  return parts.length > 0 ? parts : text;
};

const convertToHTML = (val) => {
  if (!val) return '';
  const text = formatSectionText(val);
  if (!text) return '';
  
  if (/<[a-z][\s\S]*>/i.test(text)) {
    return text.replace(/<div[^>]*>\s*0\s*<\/div>/gi, '');
  }
  
  let html = text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/__(.*?)__/g, '<u>$1</u>')
    .replace(/~~(.*?)~~/g, '<s>$1</s>');
    
  if (html.includes('|')) {
    const lines = html.split('\n');
    let inTable = false;
    let tableHtml = '<table class="w-full border-collapse border border-slate-300 my-2 text-xs font-sans">';
    const newLines = [];
    
    for (let line of lines) {
      if (line.trim().startsWith('|')) {
        if (!inTable) {
          inTable = true;
        }
        const cells = line.split('|').map(c => c.trim()).filter((c, idx, arr) => idx > 0 && idx < arr.length - 1);
        if (cells.every(c => c.startsWith('-'))) {
          continue;
        }
        tableHtml += '<tr class="border-b border-slate-200 bg-white">';
        cells.forEach(cell => {
          tableHtml += `<td class="border border-slate-300 px-2 py-1 text-slate-700 font-sans">${cell}</td>`;
        });
        tableHtml += '</tr>';
      } else {
        if (inTable) {
          tableHtml += '</table>';
          newLines.push(tableHtml);
          tableHtml = '<table class="w-full border-collapse border border-slate-300 my-2 text-xs font-sans">';
          inTable = false;
        }
        newLines.push(line);
      }
    }
    if (inTable) {
      tableHtml += '</table>';
      newLines.push(tableHtml);
    }
    html = newLines.join('\n');
  }

  html = html.split('\n').map(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed === '0') return '';
    if (trimmed.startsWith('<table') || trimmed.startsWith('<tr') || trimmed.startsWith('<td') || trimmed.startsWith('</table') || trimmed.startsWith('<thead') || trimmed.startsWith('<tbody') || trimmed.startsWith('</thead') || trimmed.startsWith('</tbody') || trimmed.startsWith('<th') || trimmed.startsWith('</th')) return line;
    return `<div class="min-h-[1rem]">${line}</div>`;
  }).filter(Boolean).join('');

  return html;
};

const generateUnifiedHTML = (noteObj, template, patient) => {
  if (template?.id === 'sick_note') {
    const rawDate = (typeof noteObj === 'object' && getSectionValue(noteObj, 'assessment_date')) || '';
    const dateVal = cleanInlineVal(rawDate) || 'Friday, July 24, 2026';
    
    const rawAbsence = (typeof noteObj === 'object' && getSectionValue(noteObj, 'absence_period')) || '';
    const absenceVal = cleanInlineVal(rawAbsence) || '______ days';

    const pName = (patient && `${patient.firstName || ''} ${patient.lastName || ''}`.trim()) || patient?.name || (typeof noteObj === 'object' && (noteObj.patient_name || noteObj.patientName)) || 'the patient';
    
    const reasonVal = typeof noteObj === 'object' ? getSectionValue(noteObj, 'reason_for_absence') : '';
    const restrictionsVal = typeof noteObj === 'object' ? getSectionValue(noteObj, 'work_restrictions') : '';

    return `
      <div class="font-sans text-slate-800 text-sm leading-relaxed space-y-4 text-left p-1">
        <div data-section="assessment_date" class="mb-4">
          <span class="font-bold text-slate-900 font-sans">Date: </span>
          <span class="text-slate-800 font-sans">${dateVal}</span>
        </div>

        <div class="font-bold text-slate-900 font-sans my-4">To Whom It May Concern,</div>

        <div class="text-slate-800 font-sans leading-relaxed my-4">
          This is to certify that ${pName} has been seen and evaluated by me on <strong>${dateVal}</strong>. Please be advised that due to medical reasons, they are recommended to refrain from professional responsibilities for the period of <strong data-section="absence_period">${absenceVal}</strong>.
        </div>

        ${reasonVal ? `
        <div data-section="reason_for_absence" class="mb-3">
          <div class="font-bold text-slate-900 text-xs font-sans">Reason for Absence:</div>
          <div class="text-slate-800 text-sm font-sans pl-1">${convertToHTML(reasonVal)}</div>
        </div>` : ''}

        ${restrictionsVal ? `
        <div data-section="work_restrictions" class="mb-3">
          <div class="font-bold text-slate-900 text-xs font-sans">Work / Duty Restrictions:</div>
          <div class="text-slate-800 text-sm font-sans pl-1">${convertToHTML(restrictionsVal)}</div>
        </div>` : ''}

        <div class="pt-6 font-sans">
          <div class="font-semibold text-slate-900">Sincerely,</div>
        </div>
      </div>
    `;
  }

  const sections = template?.sections || [
    { key: 'subjective', label: 'Subjective' },
    { key: 'objective', label: 'Objective' },
    { key: 'assessment', label: 'Assessment' },
    { key: 'plan', label: 'Plan' },
  ];
  
  if (!noteObj) {
    return sections.map(s => `
      <div data-section="${s.key}" class="mb-4 group text-left w-full">
        <div class="font-bold text-[#0A2947] text-base mb-1 select-none font-sans">${s.label.endsWith(':') ? s.label : s.label + ':'}</div>
        <div class="text-slate-400 text-sm leading-normal font-sans min-h-[1.5rem] pl-0.5">${s.placeholder ? `- ${s.placeholder}` : '- Click to type clinical details...'}</div>
      </div>
    `).join('\n');
  }
  
  if (typeof noteObj === 'string') return convertToHTML(noteObj);
  
  return sections.map(s => {
    const rawVal = getSectionValue(noteObj, s.key);
    const htmlVal = convertToHTML(rawVal);
    const labelText = s.label.endsWith(':') ? s.label : `${s.label}:`;
    return `
      <div data-section="${s.key}" class="mb-3 group text-left w-full">
        <div class="font-bold italic text-slate-900 text-sm mb-1 select-none font-sans">${labelText}</div>
        <div class="text-slate-800 text-sm leading-normal font-sans space-y-0.5 pl-0.5">${htmlVal || '<div class="h-2"></div>'}</div>
      </div>
    `;
  }).join('\n');
};

const parseUnifiedHTML = (html, template) => {
  const sections = template?.sections || [
    { key: 'subjective', label: 'Subjective' },
    { key: 'objective', label: 'Objective' },
    { key: 'assessment', label: 'Assessment' },
    { key: 'plan', label: 'Plan' },
  ];
  
  const result = {};
  sections.forEach(s => {
    result[s.key] = '';
  });
  
  if (!html) return result;
  
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  sections.forEach(s => {
    const container = doc.querySelector(`[data-section="${s.key}"]`);
    if (container) {
      const contentEl = container.querySelector('.text-slate-800') || container;
      result[s.key] = contentEl.innerHTML.trim();
    }
  });

  const hasDataSectionResult = Object.values(result).some(v => v.trim());
  if (hasDataSectionResult) return result;

  const children = Array.from(doc.body.childNodes);
  let currentKey = null;
  const sectionHTMLs = {};
  sections.forEach(s => { sectionHTMLs[s.key] = []; });
  
  children.forEach(node => {
    const textContent = node.textContent || '';
    const trimmed = textContent.trim();
    
    const matchedSection = sections.find(s => {
      const cleanLabel = s.label.replace(/:$/, '').trim().toLowerCase();
      const cleanText = trimmed.replace(/:$/, '').trim().toLowerCase();
      return cleanText === cleanLabel || cleanText.startsWith(cleanLabel);
    });
    
    if (matchedSection) {
      currentKey = matchedSection.key;
    } else if (currentKey) {
      if (node.nodeType === Node.TEXT_NODE) {
        sectionHTMLs[currentKey].push(node.textContent);
      } else {
        sectionHTMLs[currentKey].push(node.outerHTML);
      }
    }
  });
  
  sections.forEach(s => {
    result[s.key] = sectionHTMLs[s.key].join('').trim();
  });
  
  return result;
};

const renderFormattedUnifiedText = (text, template) => {
  if (!text) return null;
  
  const sections = template?.sections || [
    { key: 'subjective', label: 'Subjective' },
    { key: 'objective', label: 'Objective' },
    { key: 'assessment', label: 'Assessment' },
    { key: 'plan', label: 'Plan' },
  ];
  
  const lines = text.split('\n');
  return lines.map((line, idx) => {
    const trimmed = line.trim();
    const matchedSection = sections.find(s => {
      const cleanLabel = s.label.replace(/:$/, '').trim().toLowerCase();
      const cleanLine = trimmed.replace(/:$/, '').trim().toLowerCase();
      return cleanLine === cleanLabel;
    });
    
    if (matchedSection) {
      return (
        <div key={idx} className="font-bold italic text-slate-900 text-sm mt-3 mb-1" style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
          {matchedSection.label.endsWith(':') ? matchedSection.label : `${matchedSection.label}:`}
        </div>
      );
    }
    return (
      <div key={idx} className="text-sm text-slate-800 leading-normal font-sans min-h-[1rem]">
        {renderInlineMarkdown(line)}
      </div>
    );
  });
};

export function NotePanel({ note, noteError, loading, patient, doctor, transcript, recordingId, onSave, onNoteChange, onCancel, isOpenMobile, onCloseMobile, desktopWidth, template, lastVoiceCommand, setLastVoiceCommand, onRegenerate, embedded = false, showOnlyHandout = false }) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copyStatus, setCopyStatus] = useState('');
  const [editing, setEditing] = useState(false);
  const [editedNote, setEditedNote] = useState({
    chief_complaint: '',
    history: '',
    examination: '',
    diagnosis: '',
    prescription: [],
    followup: '',
    exercises: [],
  });
  const [showExportModal, setShowExportModal] = useState(false);
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [sharingPdf, setSharingPdf] = useState(false);
  const [showMedicationSection, setShowMedicationSection] = useState(false);
  const [showExerciseSection, setShowExerciseSection] = useState(false);

  // Local Dictation Audio Recording States & Refs (Per-section)
  const [recordingSection, setRecordingSection] = useState(null);
  const [transcribingSection, setTranscribingSection] = useState(null);
  const [notesRecordTime, setNotesRecordTime] = useState(0);
  const notesMediaRecorderRef = useRef(null);
  const notesAudioChunksRef = useRef([]);
  const notesTimerRef = useRef(null);
  const notesStreamRef = useRef(null);
  const editorRef = useRef(null);
  const isInitializedRef = useRef(false);

  // Sync phone state when patient changes
  useEffect(() => {
    if (patient?.contactInfo?.phone) {
      setWhatsappPhone(patient.contactInfo.phone);
    } else {
      setWhatsappPhone('');
    }
  }, [patient]);

  // Reset edit state when note changes or patient changes
  useEffect(() => {
    isInitializedRef.current = false;
    if (note) {
      let parsedNote = JSON.parse(JSON.stringify(note));
      const str = JSON.stringify(parsedNote);
      if (str.includes('Patient presented for') || str.includes('systemic examination pending')) {
        parsedNote = { subjective: '', objective: '', assessment: '', plan: '', prescription: [], followup: '' };
      }
      if (!parsedNote.exercises) parsedNote.exercises = [];
      setEditedNote(parsedNote);

      // Check if all section fields are empty — if so, start in editing mode
      const sectionKeys = (template?.sections || [
        { key: 'subjective' }, { key: 'objective' }, { key: 'assessment' }, { key: 'plan' }
      ]).map(s => s.key);
      const allEmpty = sectionKeys.every(key => {
        const val = getSectionValue(parsedNote, key);
        return !val || (typeof val === 'string' && val.trim() === '');
      });
      setEditing(allEmpty);
    } else {
      // Clear values when note is null (no active session note)
      const initialNote = {
        prescription: [],
        followup: '',
        exercises: [],
      };
      if (template && template.sections) {
        template.sections.forEach((s) => {
          initialNote[s.key] = '';
        });
      } else {
        initialNote.chief_complaint = '';
        initialNote.history = '';
        initialNote.examination = '';
        initialNote.diagnosis = '';
      }
      setEditedNote(initialNote);
      setEditing(true);
    }
  }, [note, patient?._id, template]);

  // Sync contentEditable innerHTML once when entering editing mode or when note updates
  useEffect(() => {
    if (editing) {
      if (editorRef.current && !isInitializedRef.current) {
        editorRef.current.innerHTML = generateUnifiedHTML(editedNote, template);
        isInitializedRef.current = true;
      }
    } else {
      isInitializedRef.current = false;
    }
  }, [editing, editedNote, template]);

  // Handle voice commands from useRecorder
  useEffect(() => {
    if (lastVoiceCommand && !loading) {
      const { command, args } = lastVoiceCommand;
      console.log('🔔 NotePanel executing voice command:', command, args);
      
      if (command === 'save') {
        // Trigger save and finalize
        handleSave(true);
        if (setLastVoiceCommand) setLastVoiceCommand(null);
      } else if (command === 'followup') {
        // Update followup field
        setEditedNote(prev => {
          const updated = { ...prev, followup: args };
          if (recordingId) {
            handleSaveDirectly(updated, false);
          }
          return updated;
        });
        if (setLastVoiceCommand) setLastVoiceCommand(null);
      }
    }
  }, [lastVoiceCommand, loading, recordingId, setLastVoiceCommand]);

  // Clean up recording timers/streams on unmount
  useEffect(() => {
    return () => {
      if (notesTimerRef.current) clearInterval(notesTimerRef.current);
      if (notesStreamRef.current) {
        notesStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Micro audio recorder handlers for specific sections
  const startSectionRecording = async (section) => {
    if (recordingSection || transcribingSection) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      notesStreamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream);
      notesMediaRecorderRef.current = mediaRecorder;
      notesAudioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          notesAudioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(notesAudioChunksRef.current, { type: 'audio/webm' });
        await processSectionAudio(section, audioBlob);
      };

      mediaRecorder.start();
      setRecordingSection(section);
      setNotesRecordTime(0);

      notesTimerRef.current = setInterval(() => {
        setNotesRecordTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error(`Failed to start recording for ${section}:`, err);
      alert('Microphone access denied or error starting recording.');
    }
  };

  const stopSectionRecording = () => {
    if (notesTimerRef.current) {
      clearInterval(notesTimerRef.current);
      notesTimerRef.current = null;
    }
    if (notesMediaRecorderRef.current && notesMediaRecorderRef.current.state !== 'inactive') {
      notesMediaRecorderRef.current.stop();
    }
    if (notesStreamRef.current) {
      notesStreamRef.current.getTracks().forEach(track => track.stop());
      notesStreamRef.current = null;
    }
    setRecordingSection(null);
  };

  const processSectionAudio = async (section, audioBlob) => {
    if (audioBlob.size === 0) return;
    setTranscribingSection(section);
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'dictation.webm');
      formData.append('section', section);

      // Get current value to merge/append
      let existingValue = '';
      if (section === 'prescription') {
        existingValue = JSON.stringify(editedNote?.prescription || []);
      } else {
        existingValue = editedNote?.[section] || '';
      }
      formData.append('existingValue', existingValue);

      const response = await apiClient.post('/api/analyze/dictate-section', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success && response.data.data.value !== undefined) {
        const newValue = response.data.data.value;

        setEditedNote(prev => {
          const updated = {
            ...prev,
            [section]: newValue
          };

          // Autosave if recordingId exists
          if (recordingId) {
            handleSaveDirectly(updated);
          }
          return updated;
        });
      }
    } catch (err) {
      console.error(`Dictation processing error for ${section}:`, err);
      alert('Processing failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setTranscribingSection(null);
    }
  };

  const handleSaveDirectly = async (noteToSave, isFinalizing = false) => {
    if (!noteToSave) return;
    setSaving(true);
    try {
      let response;
      if (recordingId) {
        // Update existing recording
        response = await apiClient.patch(`/api/recordings/${recordingId}/note`, {
          clinicalNote: noteToSave,
          processingStatus: 'completed',
          isFinalized: isFinalizing === true
        });
      } else {
        // Create a manual recording directly since no active session exists
        response = await apiClient.post('/api/recordings', {
          patientId: patient?._id,
          clinicalNote: noteToSave,
          tags: ['Medication']
        });
      }

      if (response.data.success) {
        setSaved(true);
        setEditing(false);
        if (onSave) onSave(response.data.data);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err) {
      console.error('Error saving note:', err);
      alert('Error saving note: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async (isFinalizing = false) => {
    await handleSaveDirectly(editing ? editedNote : note, isFinalizing);
  };

  const handleCopy = async () => {
    const noteData = editing ? editedNote : note;
    if (!noteData) return;
    const result = await copyNoteToClipboard(noteData, patient);
    if (result.success) {
      setCopyStatus('Copied!');
      setTimeout(() => setCopyStatus(''), 2000);
    }
  };

  const handleFieldChange = (field, value) => {
    setEditedNote((prev) => ({ ...prev, [field]: value }));
  };

  const toggleEditing = () => {
    if (editing) {
      handleSave();
    } else {
      setEditing(true);
    }
  };

  const handlePrescriptionChange = (index, field, value) => {
    setEditedNote((prev) => {
      const prescriptions = Array.isArray(prev.prescription) ? [...prev.prescription] : [];
      if (!prescriptions[index]) prescriptions[index] = { drug: '', dose: '1 tablet', frequency: 'Twice daily', timing: 'After food' };
      prescriptions[index] = { ...prescriptions[index], [field]: value };
      
      const updated = { ...prev, prescription: prescriptions };
      const formattedMedsText = prescriptions
        .filter(m => m && (typeof m === 'string' ? m.trim() : (m.drug || '').trim()))
        .map(m => {
          if (typeof m === 'object') {
            const details = [m.dose, m.frequency, m.timing].filter(Boolean).join(' · ');
            return details ? `- ${m.drug} (${details})` : `- ${m.drug}`;
          }
          return `- ${m}`;
        })
        .join('\n');
      updated.medications = formattedMedsText;
      if (onNoteChange) onNoteChange(updated);
      return updated;
    });
  };

  const addPrescriptionRow = () => {
    setEditedNote((prev) => {
      const prescriptions = Array.isArray(prev.prescription) ? [...prev.prescription] : [];
      prescriptions.push({ drug: '', dose: '1 tablet', frequency: 'Twice daily', timing: 'After food' });
      return { ...prev, prescription: prescriptions };
    });
  };

  const removePrescriptionRow = (index) => {
    setEditedNote((prev) => {
      const prescriptions = Array.isArray(prev.prescription) ? [...prev.prescription] : [];
      const updatedPrescriptions = prescriptions.filter((_, i) => i !== index);
      const updated = { ...prev, prescription: updatedPrescriptions };
      
      const formattedMedsText = updatedPrescriptions
        .filter(m => m && (typeof m === 'string' ? m.trim() : (m.drug || '').trim()))
        .map(m => {
          if (typeof m === 'object') {
            const details = [m.dose, m.frequency, m.timing].filter(Boolean).join(' · ');
            return details ? `- ${m.drug} (${details})` : `- ${m.drug}`;
          }
          return `- ${m}`;
        })
        .join('\n');
      updated.medications = formattedMedsText;
      if (onNoteChange) onNoteChange(updated);
      return updated;
    });
  };

  const handleAddDrugDirectly = (drugName) => {
    if (!drugName || !drugName.trim()) return;
    const nameLower = drugName.toLowerCase();
    const isTopical = nameLower.includes('cream') || nameLower.includes('gel') || nameLower.includes('ointment') || nameLower.includes('lotion') || nameLower.includes('spray') || nameLower.includes('emulgel') || nameLower.includes('solution') || nameLower.includes('patch');
    const isSyrup = nameLower.includes('syrup') || nameLower.includes('suspension') || nameLower.includes('elixir') || nameLower.includes('liquid');
    const isDrop = nameLower.includes('drop') || nameLower.includes('eye drop') || nameLower.includes('ear drop');

    const defaultDose = isTopical ? 'Apply thin layer' : isSyrup ? '5 ml' : isDrop ? '1 drop' : '1 tablet';
    const defaultTiming = isTopical ? 'Apply topically' : 'After food';

    const newMed = {
      drug: drugName.trim(),
      dose: defaultDose,
      frequency: 'Twice daily',
      timing: defaultTiming
    };
    
    setEditedNote((prev) => {
      const existingPrescriptions = Array.isArray(prev.prescription) ? [...prev.prescription] : [];
      existingPrescriptions.push(newMed);
      
      const updated = { ...prev, prescription: existingPrescriptions };
      const formattedMedsText = existingPrescriptions
        .filter(m => m && (typeof m === 'string' ? m.trim() : (m.drug || '').trim()))
        .map(m => {
          if (typeof m === 'object') {
            const details = [m.dose, m.frequency, m.timing].filter(Boolean).join(' · ');
            return details ? `- ${m.drug} (${details})` : `- ${m.drug}`;
          }
          return `- ${m}`;
        })
        .join('\n');
      updated.medications = formattedMedsText;
      if (onNoteChange) onNoteChange(updated);
      return updated;
    });
  };

  const handleAddExerciseDirectly = (ex) => {
    if (!ex) return;
    const newExerciseObj = {
      id: ex.id || String(Date.now()),
      name: ex.name,
      category: ex.category || 'General',
      sets: '3',
      reps: '10',
      frequency: 'Twice Daily',
      instruction: ex.instruction || 'Perform gently as directed.'
    };

    setEditedNote((prev) => {
      const existingExercises = normalizeExercisesArray(prev.exercises);
      if (existingExercises.some(e => e.name.toLowerCase() === ex.name.toLowerCase())) {
        return prev;
      }
      const updatedExercises = [...existingExercises, newExerciseObj];
      
      const updated = { ...prev, exercises: updatedExercises };
      const formattedExercisesText = updatedExercises
        .map((e) => `- ${e.name}: 3 sets x 10 reps (${e.instruction})`)
        .join('\n');
      updated.exercises_text = formattedExercisesText;
      if (onNoteChange) onNoteChange(updated);
      return updated;
    });
  };

  const displayNote = {
    ...(note || {}),
    ...(editedNote || {}),
  };

  const prescriptionArray = Array.isArray(displayNote?.prescription)
    ? displayNote.prescription
    : typeof displayNote?.prescription === 'string'
    ? [{ drug: displayNote.prescription, dose: '', frequency: '' }]
    : [];

  const editedPrescriptionArray = Array.isArray(editedNote?.prescription)
    ? editedNote.prescription
    : typeof editedNote?.prescription === 'string'
    ? [{ drug: editedNote.prescription, dose: '', frequency: '' }]
    : [];

  const exercisesArray = normalizeExercisesArray(displayNote?.exercises);
  const editedExercisesArray = normalizeExercisesArray(editedNote?.exercises);

  if (loading) {
    if (embedded) {
      return (
        <div className="flex-1 flex flex-col bg-white h-full w-full justify-center items-center py-16 text-center text-slate-500 gap-3">
          <svg className="animate-spin text-teal" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
          </svg>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Compiling Clinical Note...</span>
        </div>
      );
    }
    return (
      <aside className="w-96 flex flex-col bg-white border-l border-gray-200 h-full shrink-0 max-[768px]:w-full max-[768px]:border-l-0 max-[768px]:border-t">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white shrink-0">
          <span className="text-sm font-semibold text-navy">Clinical Note</span>
          <span className="px-2 py-0.5 text-[10.5px] font-semibold rounded-md uppercase tracking-[0.25px] bg-teal-light text-teal-dark animate-pulse">Generating</span>
        </div>
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 min-h-0">
          <div className="flex flex-col items-center justify-center gap-3 text-gray-500 py-16 text-center text-sm font-medium">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-teal">
              <path strokeLinecap="round" d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
            Processing audio...
          </div>
        </div>
      </aside>
    );
  }

  // Note fields mapping definitions
  const clinicalFields = template?.sections || [
    { key: 'subjective', label: 'Subjective', rows: 3, placeholder: 'Patient history, symptoms, onset...' },
    { key: 'objective', label: 'Objective', rows: 3, placeholder: 'Physical exam findings, test results, vitals...' },
    { key: 'assessment', label: 'Assessment', rows: 3, placeholder: 'Differential diagnosis, clinical impression...' },
    { key: 'plan', label: 'Plan', rows: 3, placeholder: 'Prescriptions, follow up instructions, care plan...' },
  ];

  const isCleanDocumentLayout = !!template;
  const isSoapTemplate = template?.id === 'soap';

  const handoutFields = [
    { key: 'followup', label: 'Follow-up' },
  ];

  const handleWhatsAppSend = () => {
    const activeNote = editing ? editedNote : note;
    if (!activeNote) return;
    const msg = generatePrescriptionMessage(patient, doctor, activeNote);
    shareOnWhatsApp(whatsappPhone, msg);
  };

  const handleSharePdfWhatsApp = async () => {
    const activeNote = editing ? editedNote : note;
    if (!activeNote) return;
    
    setSharingPdf(true);
    try {
      const patientName = `${patient?.firstName || 'Patient'} ${patient?.lastName || ''}`.trim();
      const docName = doctor?.profile?.name || 'Your Doctor';
      const docQual = doctor?.profile?.qualification || '';
      const hospital = doctor?.profile?.hospital || '';
      const todayStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

      let msg = `*SCRIBOLOGIST — Patient Handout*\n`;
      msg += `━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
      msg += `*${hospital || 'Clinic'}*\n`;
      msg += `*Dr. ${docName}* ${docQual ? `(${docQual})` : ''}\n`;
      msg += `Date: ${todayStr}\n\n`;
      msg += `━━━━━━━━━━━━━━━━━━━━━━━\n`;
      msg += `*Patient:* ${patientName}\n`;
      if (patient?.age || patient?.dateOfBirth) {
        const age = patient.age || (new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear());
        msg += `*Age:* ${age}  |  *Gender:* ${patient?.gender || 'N/A'}\n`;
      }
      msg += `━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

      // Prescriptions
      const rxArray = Array.isArray(activeNote.prescription) ? activeNote.prescription : [];
      if (rxArray.length > 0) {
        msg += `*PRESCRIPTION*\n`;
        msg += `──────────────────────\n`;
        rxArray.forEach((med, i) => {
          const drug = typeof med === 'object' ? med.drug : String(med);
          const dose = typeof med === 'object' ? med.dose || '' : '';
          const freq = typeof med === 'object' ? med.frequency || '' : '';
          msg += `  ${i + 1}. *${drug}*`;
          if (dose) msg += ` — ${dose}`;
          if (freq) msg += ` — _${freq}_`;
          msg += `\n`;
        });
        msg += `\n`;
      }

      // Exercises
      const exercises = activeNote.exercises || [];
      if (exercises.length > 0) {
        msg += `*REHABILITATION EXERCISES*\n`;
        msg += `──────────────────────\n`;
        exercises.forEach((ex, i) => {
          msg += `  ${i + 1}. *${ex.name}*`;
          if (ex.sets || ex.reps) msg += ` — ${ex.sets || '3'} sets × ${ex.reps || '10'} reps`;
          if (ex.frequency) msg += ` (${ex.frequency})`;
          msg += `\n`;
          if (ex.instruction) msg += `     ↳ _${ex.instruction}_\n`;
        });
        msg += `\n`;
      }

      // Follow-up
      if (activeNote.followup) {
        msg += `*FOLLOW-UP*\n`;
        msg += `──────────────────────\n`;
        msg += `${activeNote.followup}\n\n`;
      }

      msg += `━━━━━━━━━━━━━━━━━━━━━━━\n`;
      msg += `_Generated by Scribologist — AI Clinical Documentation_\n`;
      msg += `_Please retain this for your records._`;

      shareOnWhatsApp(whatsappPhone, msg);
    } catch (err) {
      console.error('Error sharing on WhatsApp:', err);
      alert('Error sharing: ' + err.message);
    } finally {
      setSharingPdf(false);
    }
  };

  const renderMicButton = (section) => {
    const isRecording = recordingSection === section;
    const isTranscribing = transcribingSection === section;

    return (
      <div className="flex items-center gap-1.5 shrink-0">
        {isRecording && (
          <span className="text-[10px] font-mono font-bold text-rose-600 animate-pulse">
            {Math.floor(notesRecordTime / 60)}:{String(notesRecordTime % 60).padStart(2, '0')}
          </span>
        )}
        {isTranscribing && (
          <svg className="animate-spin text-[#8B5E3C]" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <circle cx="12" cy="12" r="10" strokeDasharray="16" />
          </svg>
        )}
        <button
          type="button"
          onClick={isRecording ? stopSectionRecording : () => startSectionRecording(section)}
          disabled={transcribingSection !== null && transcribingSection !== section}
          className={`flex items-center justify-center border-none rounded-xl cursor-pointer transition-all ${
            isRecording
              ? 'bg-rose-600 text-white hover:bg-rose-700 p-1.5 animate-pulse'
              : 'bg-[#F3E4C9] text-[#8B5E3C] hover:bg-[#F3E4C9]/80 p-1.5'
          } disabled:opacity-40 disabled:cursor-not-allowed`}
          style={{ width: '26px', height: '26px' }}
          title={isRecording ? 'Stop recording' : 'Dictate for this section'}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            {isRecording ? (
              <rect x="4" y="4" width="16" height="16" rx="2" />
            ) : (
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3zM19 10v1a7 7 0 0 1-14 0v-1M12 19v4M8 23h8" />
            )}
          </svg>
        </button>
      </div>
    );
  };

  const renderMainContent = () => {
    if (showOnlyHandout && !editing) {
      const patientName = `${patient?.firstName || ''} ${patient?.lastName || ''}`.trim() || 'John Doe';
      const patientAge = patient?.age || (patient?.dateOfBirth ? new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear() : '35');
      const patientGender = patient?.gender || 'Male';
      const docName = doctor?.profile?.name || doctor?.name || 'Jane Smith';
      const docQual = doctor?.profile?.qualification || 'M.B.B.S, M.S. (Ortho)';
      const docLicense = doctor?.profile?.licenseNumber || 'MC-123456';
      const hospitalName = doctor?.profile?.hospital || 'SCRIBOLOGIST CLINICS & REHAB';
      const todayStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

      return (
        <div className="flex-1 overflow-y-auto p-8 bg-white min-h-[9.5in] flex flex-col justify-between text-left font-sans text-slate-800">
          <div>
            {/* Letterhead Header Banner */}
            <div className="border-b-4 border-slate-900 pb-4 mb-6 flex justify-between items-end">
              <div>
                <h1 className="text-xl font-bold uppercase tracking-tight text-slate-900 font-serif" style={{ fontFamily: "'Kalice', 'Kalice-Trial', 'Kalice-Regular', 'Instrument Serif', Georgia, serif" }}>
                  {hospitalName}
                </h1>
                <p className="text-xs text-slate-500 font-sans mt-0.5">Orthopedic Rehab & Sports Medicine Care Center</p>
              </div>
              <div className="text-right">
                <h2 className="text-sm font-bold text-slate-900">Dr. {docName}</h2>
                <p className="text-[10px] text-slate-500 font-mono font-medium">{docQual}</p>
                <p className="text-[9px] text-slate-400 font-mono">Reg No: {docLicense}</p>
              </div>
            </div>

            {/* Patient Info Grid */}
            <div className="bg-slate-50 border border-slate-200/60 rounded-lg p-4 mb-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-sans">
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">Patient Name</span>
                <span className="font-semibold text-slate-800">{patientName}</span>
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">Age / Gender</span>
                <span className="font-semibold text-slate-800">{patientAge} yrs / {patientGender}</span>
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">Date of Visit</span>
                <span className="font-semibold text-slate-800">{todayStr}</span>
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">Patient ID</span>
                <span className="font-semibold font-mono text-slate-800">#{patient?._id?.substring(18).toUpperCase() || 'P-9921'}</span>
              </div>
            </div>

            {/* Prescriptions Section (Rx Table) */}
            <div className="mb-6">
              <div className="flex items-center gap-1 border-b border-slate-200 pb-1.5 mb-3">
                <span className="text-base font-serif font-black italic tracking-wide text-slate-905" style={{ fontFamily: "'Kalice', 'Kalice-Trial', 'Kalice-Regular', 'Instrument Serif', Georgia, serif" }}>Rx</span>
                <span className="text-xs font-bold text-slate-900 uppercase font-sans">Prescription</span>
              </div>
              {prescriptionArray.length > 0 ? (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-[10px] uppercase font-bold text-slate-400">
                      <th className="py-2 w-10">#</th>
                      <th className="py-2">Medication Name</th>
                      <th className="py-2 w-28">Dosage</th>
                      <th className="py-2 w-40">Frequency & Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prescriptionArray.map((med, idx) => {
                      const drugName = typeof med === 'object' ? med.drug || 'Unknown' : med;
                      const doseString = typeof med === 'object' ? med.dose || 'As directed' : 'As directed';
                      const frequency = typeof med === 'object' ? med.frequency || 'Once daily' : 'Once daily';
                      return (
                        <tr key={idx} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                          <td className="py-2.5 font-semibold text-slate-400">{idx + 1}</td>
                          <td className="py-2.5 font-bold text-slate-850">{drugName}</td>
                          <td className="py-2.5 text-slate-700 font-medium">{doseString}</td>
                          <td className="py-2.5 text-slate-600 font-medium">{frequency}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <p className="text-xs text-slate-400 italic font-sans py-2">No active medications prescribed.</p>
              )}
            </div>

            {/* Prescribed Rehabilitation Exercises */}
            <div className="mb-6">
              <div className="border-b border-slate-200 pb-1.5 mb-3 flex items-center gap-1">
                <span className="text-xs font-bold text-slate-900 uppercase font-sans">Prescribed Rehabilitation & Exercises</span>
              </div>
              {exercisesArray.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {exercisesArray.map((ex, idx) => (
                    <div key={idx} className="border border-slate-150 rounded-xl p-3 flex flex-col justify-between bg-slate-50/30">
                      <div>
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="text-xs font-bold text-slate-850 font-sans">{ex.name}</h4>
                          <span className="text-[9px] font-bold text-teal-dark bg-teal-light px-1.5 py-0.5 rounded-md">
                            {ex.sets} sets × {ex.reps} reps
                          </span>
                        </div>
                        {ex.instruction && <p className="text-[11px] text-slate-500 leading-relaxed font-sans">{ex.instruction}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic font-sans py-2">No specific exercises prescribed.</p>
              )}
            </div>

            {/* General Advice & Follow-up */}
            {displayNote?.followup && (
              <div className="mb-6">
                <div className="border-b border-slate-200 pb-1.5 mb-2.5">
                  <span className="text-xs font-bold text-slate-900 uppercase font-sans">General Advice & Follow-up</span>
                </div>
                <p className="text-xs text-slate-655 leading-relaxed font-sans whitespace-pre-wrap">{displayNote.followup}</p>
              </div>
            )}
          </div>

          {/* Bottom Stamp / Digitally Signed Signature Block */}
          <div className="border-t border-slate-200 pt-6 mt-8 flex justify-between items-center text-xs">
            <div className="text-[9px] text-slate-400 font-mono">
              Generated via Scribologist Platform<br />
              Secure Digital Transaction
            </div>
            <div className="text-right flex flex-col items-end">
              <div className="inline-block border-2 border-emerald-500 bg-emerald-50/50 text-emerald-700 rounded-lg px-3 py-1 mb-2 font-mono text-[9px] font-bold uppercase tracking-wider text-center rotate-[-2deg]">
                Digitally Approved<br />
                Dr. {docName}
              </div>
              <p className="text-[10px] font-bold text-slate-800">Dr. {docName}</p>
              <p className="text-[9px] text-slate-400 font-mono">Licensed Orthopedic Clinician</p>
            </div>
          </div>
        </div>
      );
    }

    const templateSections = template?.sections || [
      { key: 'subjective' }, { key: 'objective' }, { key: 'assessment' }, { key: 'plan' }
    ];
    const isNoteEmpty = !displayNote || (
      typeof displayNote === 'object' &&
      templateSections.every(s => {
        const val = displayNote[s.key] || getSectionValue(displayNote, s.key);
        if (!val) return true;
        if (typeof val === 'string' && !val.trim()) return true;
        if (Array.isArray(val) && val.length === 0) return true;
        return false;
      }) &&
      (!displayNote.exercises || displayNote.exercises.length === 0) &&
      (!displayNote.prescription || displayNote.prescription.length === 0) &&
      !displayNote.subjective && !displayNote.objective && !displayNote.assessment && !displayNote.plan && !displayNote.chief_complaint
    );

    return (
      <>
        {/* Main Note Canvas Container (Veroscribe Full-Width Workspace) */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col min-h-0 text-left bg-white font-sans text-slate-800 w-full min-h-full relative pb-16">
          
          {/* Note Canvas Main Card */}
          <div className="bg-white flex flex-col flex-1 relative mb-6">

            {/* Quick Clinical Add Bar: + Add Medication & + Add Exercise (Top Search Popovers) */}
            <div className="relative z-40 flex items-center justify-between pb-3.5 border-b border-[#D3D4C0]/50 mb-3 shrink-0 select-none">
                <div className="flex items-center gap-2 relative">
                  
                  {/* + Add Medication Button & Top Popover Dropdown */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setShowMedicationSection(prev => !prev);
                        setShowExerciseSection(false);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs font-sans border ${
                        showMedicationSection
                          ? 'bg-[#0A2947] text-white border-[#0A2947]'
                          : 'bg-[#F9F6F1] text-[#0A2947] border-[#D3D4C0] hover:bg-[#F3E4C9]/60'
                      }`}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/></svg>
                      <span>+ Add Medication</span>
                    </button>

                    {/* TOP MEDICATION SEARCH & MANAGER POPOVER */}
                    {showMedicationSection && (
                      <div className="absolute top-10 left-0 bg-white border border-[#D3D4C0] rounded-2xl shadow-2xl p-4 z-50 w-[540px] md:w-[580px] max-w-[calc(100vw-32px)] text-left animate-fadeIn">
                        <div className="flex justify-between items-center mb-2.5">
                          <span className="text-xs font-bold text-[#0A2947] font-mono uppercase tracking-wider flex items-center gap-1.5">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/></svg>
                            Add & Manage Medications
                          </span>
                          <button onClick={() => setShowMedicationSection(false)} className="text-slate-400 hover:text-slate-700 text-xs font-bold border-none bg-transparent cursor-pointer">✕</button>
                        </div>
                        
                        {/* Fuzzy Drug Search Input */}
                        <div className="mb-3 relative z-30">
                          <DrugSearchInput
                            placeholder="Search drug or brand (e.g. Cosvate GM, Cipla, Augmentin)..."
                            onSelectDrug={(selectedDrugName) => {
                              if (selectedDrugName && selectedDrugName.trim()) {
                                handleAddDrugDirectly(selectedDrugName);
                                if (!editing) setEditing(true);
                              }
                            }}
                          />
                        </div>

                        {/* Active Prescriptions Cards in Popover - 100% visible, no horizontal scroll */}
                        <div className="flex flex-col gap-2.5 max-h-64 overflow-y-auto pr-1">
                          {editedPrescriptionArray.map((med, idx) => {
                            const currentDrug = typeof med === 'object' ? med.drug || '' : String(med);
                            const currentDose = typeof med === 'object' ? med.dose || '1 tablet' : '1 tablet';
                            const currentFreq = typeof med === 'object' ? med.frequency || 'Twice daily' : 'Twice daily';
                            const currentTiming = typeof med === 'object' ? med.timing || 'After food' : 'After food';

                            return (
                              <div key={idx} className="flex flex-col gap-2 bg-[#F9F6F1] p-3 rounded-2xl border border-[#D3D4C0]">
                                {/* Line 1: Drug Name + Red Delete Button */}
                                <div className="flex items-center gap-2">
                                  <span className="w-4 text-[11px] font-bold text-slate-400 font-mono text-center shrink-0">{idx + 1}.</span>
                                  <input
                                    type="text"
                                    value={currentDrug}
                                    placeholder="Drug name (e.g. Cosvate GM)"
                                    onChange={(e) => handlePrescriptionChange(idx, 'drug', e.target.value)}
                                    className="flex-1 text-xs px-2.5 py-1.5 bg-white border border-[#D3D4C0] rounded-xl focus:outline-none focus:border-[#0A2947] font-sans font-semibold text-[#0A2947]"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => removePrescriptionRow(idx)}
                                    className="text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl p-1.5 cursor-pointer font-bold text-xs shrink-0 flex items-center justify-center transition-colors"
                                    title="Delete medication"
                                  >
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                      <line x1="18" y1="6" x2="6" y2="18" />
                                      <line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                  </button>
                                </div>

                                {/* Line 2: 3 Dropdown Controls (Dose, Times a day, Food timing) */}
                                <div className="grid grid-cols-3 gap-2 pl-6">
                                  {/* Dropdown 1: Dose / How much */}
                                  <div className="flex flex-col gap-0.5 text-left">
                                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">Dose / Amount</label>
                                    <select
                                      value={currentDose}
                                      onChange={(e) => handlePrescriptionChange(idx, 'dose', e.target.value)}
                                      className="text-xs px-2 py-1 bg-white border border-[#D3D4C0] rounded-xl focus:outline-none focus:border-[#0A2947] font-sans text-slate-700 font-medium"
                                    >
                                      <optgroup label="Topical / Creams / Gels">
                                        <option value="Apply thin layer">Apply thin layer</option>
                                        <option value="Pea-sized amount">Pea-sized amount</option>
                                        <option value="Apply locally">Apply locally</option>
                                        <option value="1 FTU (fingertip unit)">1 FTU (fingertip unit)</option>
                                      </optgroup>
                                      <optgroup label="Tablets & Capsules">
                                        <option value="1 tablet">1 tablet</option>
                                        <option value="1/2 tablet">1/2 tablet</option>
                                        <option value="2 tablets">2 tablets</option>
                                        <option value="1 capsule">1 capsule</option>
                                      </optgroup>
                                      <optgroup label="Liquids & Syrups">
                                        <option value="5 ml">5 ml (1 tsp)</option>
                                        <option value="10 ml">10 ml (2 tsp)</option>
                                        <option value="15 ml">15 ml</option>
                                      </optgroup>
                                      <optgroup label="Others">
                                        <option value="1 sachet">1 sachet</option>
                                        <option value="1 puff">1 puff</option>
                                        <option value="2 puffs">2 puffs</option>
                                        <option value="1 drop">1 drop</option>
                                        <option value="2 drops">2 drops</option>
                                      </optgroup>
                                      {!['Apply thin layer','Pea-sized amount','Apply locally','1 FTU (fingertip unit)','1 tablet','1/2 tablet','2 tablets','1 capsule','5 ml','10 ml','15 ml','1 sachet','1 puff','2 puffs','1 drop','2 drops'].includes(currentDose) && (
                                        <option value={currentDose}>{currentDose}</option>
                                      )}
                                    </select>
                                  </div>

                                  {/* Dropdown 2: Frequency / Times a day */}
                                  <div className="flex flex-col gap-0.5 text-left">
                                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">Times a Day</label>
                                    <select
                                      value={currentFreq}
                                      onChange={(e) => handlePrescriptionChange(idx, 'frequency', e.target.value)}
                                      className="text-xs px-2 py-1 bg-white border border-[#D3D4C0] rounded-xl focus:outline-none focus:border-[#0A2947] font-sans text-slate-700 font-medium"
                                    >
                                      <option value="Once daily">Once daily (1x/day)</option>
                                      <option value="Twice daily">Twice daily (2x/day)</option>
                                      <option value="Thrice daily">Thrice daily (3x/day)</option>
                                      <option value="4 times daily">4 times daily (4x/day)</option>
                                      <option value="At bedtime (HS)">At bedtime (HS)</option>
                                      <option value="As needed (PRN)">As needed (PRN)</option>
                                      <option value="Every morning">Every morning</option>
                                      <option value="Every night">Every night</option>
                                      <option value="Every 8 hours">Every 8 hours</option>
                                      <option value="Every 12 hours">Every 12 hours</option>
                                      {!['Once daily','Twice daily','Thrice daily','4 times daily','At bedtime (HS)','As needed (PRN)','Every morning','Every night','Every 8 hours','Every 12 hours'].includes(currentFreq) && (
                                        <option value={currentFreq}>{currentFreq}</option>
                                      )}
                                    </select>
                                  </div>

                                  {/* Dropdown 3: Timing & Application Instructions */}
                                  <div className="flex flex-col gap-0.5 text-left">
                                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">Timing / Instruction</label>
                                    <select
                                      value={currentTiming}
                                      onChange={(e) => handlePrescriptionChange(idx, 'timing', e.target.value)}
                                      className="text-xs px-2 py-1 bg-white border border-[#D3D4C0] rounded-xl focus:outline-none focus:border-[#0A2947] font-sans text-slate-700 font-medium"
                                    >
                                      <optgroup label="Topical / External">
                                        <option value="Apply topically">Apply topically to affected area</option>
                                        <option value="External use only">External use only</option>
                                        <option value="Apply at night">Apply at night</option>
                                        <option value="Apply after bath">Apply after bath</option>
                                      </optgroup>
                                      <optgroup label="Oral / Food Timing">
                                        <option value="After food">After food (PC)</option>
                                        <option value="Before food">Before food (AC)</option>
                                        <option value="With food">With food</option>
                                        <option value="Empty stomach">Empty stomach</option>
                                      </optgroup>
                                      {!['Apply topically','External use only','Apply at night','Apply after bath','After food','Before food','With food','Empty stomach'].includes(currentTiming) && (
                                        <option value={currentTiming}>{currentTiming}</option>
                                      )}
                                    </select>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={addPrescriptionRow}
                            className="text-[11px] font-bold text-[#8B5E3C] hover:text-[#0A2947] cursor-pointer border-none bg-transparent"
                          >
                            + Add Blank Row
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowMedicationSection(false)}
                            className="px-3 py-1 bg-[#0A2947] text-white text-xs font-bold rounded-lg border-none cursor-pointer"
                          >
                            Done
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* + Add Exercise Button & Top Popover Dropdown */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setShowExerciseSection(prev => !prev);
                        setShowMedicationSection(false);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs font-sans border ${
                        showExerciseSection
                          ? 'bg-[#8B5E3C] text-white border-[#8B5E3C]'
                          : 'bg-[#F9F6F1] text-[#0A2947] border-[#D3D4C0] hover:bg-[#F3E4C9]/60'
                      }`}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M18 8h1a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-1"/><path d="M6 8H5a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h1"/><path d="M2 12h20"/><path d="M18 5v14"/><path d="M6 5v14"/></svg>
                      <span>+ Add Exercise</span>
                    </button>

                    {/* TOP EXERCISE SEARCH & MANAGER POPOVER */}
                    {showExerciseSection && (
                      <div className="absolute top-10 left-0 bg-white border border-[#D3D4C0] rounded-2xl shadow-2xl p-4 z-50 w-96 text-left animate-fadeIn">
                        <div className="flex justify-between items-center mb-2.5">
                          <span className="text-xs font-bold text-[#0A2947] font-mono uppercase tracking-wider flex items-center gap-1.5">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M18 8h1a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-1"/><path d="M6 8H5a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h1"/><path d="M2 12h20"/><path d="M18 5v14"/><path d="M6 5v14"/></svg>
                            Add & Manage Exercises
                          </span>
                          <button onClick={() => setShowExerciseSection(false)} className="text-slate-400 hover:text-slate-700 text-xs font-bold border-none bg-transparent cursor-pointer">✕</button>
                        </div>

                        {/* Prescribed Active Exercises List inside Popover */}
                        {editedExercisesArray.length > 0 && (
                          <div className="flex flex-col gap-2 mb-3 pb-2 border-b border-slate-100 max-h-40 overflow-y-auto">
                            <div className="text-[10px] font-bold uppercase text-slate-400 font-mono">Prescribed Exercises ({editedExercisesArray.length})</div>
                            {editedExercisesArray.map((ex, idx) => (
                              <div key={idx} className="flex items-center gap-1.5 bg-[#F9F6F1] p-2 rounded-xl border border-[#D3D4C0]">
                                <span className="flex-1 text-xs font-bold text-[#0A2947] truncate">{ex.name}</span>
                                <input
                                  type="text"
                                  value={ex.sets || '3'}
                                  placeholder="Sets"
                                  onChange={(e) => {
                                    setEditedNote(prev => {
                                      const updated = [...editedExercisesArray];
                                      updated[idx] = { ...updated[idx], sets: e.target.value };
                                      return { ...prev, exercises: updated };
                                    });
                                  }}
                                  className="w-14 text-xs px-1.5 py-1 bg-white border border-[#D3D4C0] rounded-lg text-center font-sans"
                                />
                                <input
                                  type="text"
                                  value={ex.reps || '10'}
                                  placeholder="Reps"
                                  onChange={(e) => {
                                    setEditedNote(prev => {
                                      const updated = [...editedExercisesArray];
                                      updated[idx] = { ...updated[idx], reps: e.target.value };
                                      return { ...prev, exercises: updated };
                                    });
                                  }}
                                  className="w-14 text-xs px-1.5 py-1 bg-white border border-[#D3D4C0] rounded-lg text-center font-sans"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditedNote(prev => ({
                                      ...prev,
                                      exercises: editedExercisesArray.filter((_, i) => i !== idx)
                                    }));
                                  }}
                                  className="text-slate-400 hover:text-rose-600 p-0.5 border-none bg-transparent cursor-pointer font-bold text-xs"
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Exercise Selector by Category */}
                        <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
                          <div className="text-[10px] font-bold uppercase text-slate-400 font-mono">Select Exercise to Add</div>
                          {['Knee', 'Hip', 'Low Back', 'Shoulder', 'Neck', 'Wrist'].map(cat => (
                            <div key={cat} className="flex flex-col gap-1">
                              <div className="text-[10px] font-bold uppercase tracking-wider text-[#8B5E3C] bg-[#F9F6F1] px-2 py-0.5 rounded font-mono">{cat}</div>
                              {exercisesDb
                                .filter(ex => ex.category === cat)
                                .map(ex => (
                                  <button
                                    key={ex.id}
                                    type="button"
                                    onClick={() => {
                                      handleAddExerciseDirectly(ex);
                                      if (!editing) setEditing(true);
                                    }}
                                    className="text-left px-2 py-1.5 text-xs text-slate-700 hover:bg-[#F3E4C9]/40 hover:text-[#0A2947] rounded-lg border-none bg-transparent cursor-pointer font-sans flex items-center justify-between font-medium"
                                  >
                                    <span>{ex.name}</span>
                                    <span className="text-[10px] font-mono text-[#8B5E3C] font-bold">+ Add</span>
                                  </button>
                                ))}
                            </div>
                          ))}
                        </div>

                        <div className="flex justify-end pt-2 border-t border-slate-100 mt-2">
                          <button
                            type="button"
                            onClick={() => setShowExerciseSection(false)}
                            className="px-3 py-1 bg-[#8B5E3C] text-white text-xs font-bold rounded-lg border-none cursor-pointer"
                          >
                            Done
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                </div>

                <button
                  type="button"
                  onClick={toggleEditing}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all border ${
                    editing
                      ? 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100'
                      : 'bg-white border-[#D3D4C0] text-[#0A2947] hover:bg-[#F9F6F1]'
                  }`}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    {editing ? (
                      <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>
                    ) : (
                      <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></>
                    )}
                  </svg>
                  <span>{editing ? 'Done Editing' : 'Edit Note'}</span>
                </button>
              </div>

            {noteError && (
              <div className="mt-4 p-3.5 rounded-xl bg-rose-50 text-rose-700 text-xs flex items-center gap-2 border border-rose-200 text-left">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                Note may be incomplete: {noteError}
              </div>
            )}

              {/* Structured clinical template fields */}
              <div className="flex flex-col gap-6 w-full max-w-none flex-1 mt-4">
                {isCleanDocumentLayout ? (
                  editing ? (
                    <div
                      ref={editorRef}
                      contentEditable
                      suppressContentEditableWarning
                      className="w-full max-w-none flex-1 bg-transparent border-none text-[15px] text-[#0A2947] leading-relaxed placeholder:text-slate-350 focus:outline-none focus:ring-0 min-h-[400px] outline-none font-sans cursor-text text-left"
                      onInput={(e) => {
                        const parsed = parseUnifiedHTML(e.target.innerHTML, template);
                        setEditedNote(prev => ({
                          ...prev,
                          ...parsed
                        }));
                      }}
                      onBlur={(e) => {
                        const related = e.relatedTarget;
                        if (related && (related.closest('.formatting-toolbar') || related.tagName === 'BUTTON')) {
                          return;
                        }
                        if (recordingId) handleSave(false);
                        setEditing(false);
                      }}
                    />
                  ) : (
                    <div 
                      className="w-full max-w-none flex-1 flex flex-col gap-2 text-left cursor-text min-h-[400px] font-sans text-[15px] text-[#0A2947] leading-relaxed"
                      onClick={() => setEditing(true)}
                      title="Click to edit clinical note"
                      dangerouslySetInnerHTML={{ __html: generateUnifiedHTML(displayNote, template, patient) }}
                    />
                  )
                ) : (
                  clinicalFields.map(({ key, label, rows, placeholder }) => {
                    const rawVal = displayNote?.[key];
                    let formattedVal = '';
                    if (rawVal) {
                      if (Array.isArray(rawVal)) {
                        formattedVal = rawVal.map(item => typeof item === 'object' ? `${item.drug || item.name || ''} ${item.dose || ''} ${item.frequency || ''}`.trim() : String(item))
                          .filter(Boolean)
                          .map(str => str.startsWith('-') ? str : `- ${str}`)
                          .join('\n');
                      } else if (typeof rawVal === 'string') {
                        formattedVal = rawVal.split('\n').map(line => {
                          const trimmed = line.trim();
                          if (!trimmed) return '';
                          return trimmed.startsWith('-') ? trimmed : `- ${trimmed}`;
                        }).filter(Boolean).join('\n');
                      } else {
                        formattedVal = String(rawVal);
                      }
                    }

                    return (
                      <div key={key} className="flex flex-col gap-1 text-left">
                        <div className="flex items-center justify-between">
                          <span className="text-base font-bold text-[#0A2947] font-187">
                            {label}:
                          </span>
                          {editing && renderMicButton(key)}
                        </div>
                        {editing ? (
                          <textarea
                            className="w-full bg-[#F9F6F1]/50 border border-[#D3D4C0] rounded-xl px-3 py-2 text-sm text-[#0A2947] leading-relaxed placeholder:text-slate-400 focus:outline-none resize-none font-sans"
                            value={editedNote?.[key] || ''}
                            onChange={(e) => handleFieldChange(key, e.target.value)}
                            onBlur={() => {
                              if (recordingId) handleSave(false);
                            }}
                            rows={rows || 3}
                            placeholder={placeholder || `Enter ${label.toLowerCase()}...`}
                          />
                        ) : formattedVal?.includes('Assessment not explicitly stated') ? (
                          <div className="text-sm text-amber-900 bg-amber-50/90 border border-amber-200/90 rounded-2xl p-3.5 leading-relaxed font-sans flex flex-col gap-1.5 shadow-xs my-1">
                            <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-800 uppercase tracking-wider">
                              <svg className="w-4 h-4 text-amber-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                              <span>Clinician Confirmation Required</span>
                            </div>
                            <div className="whitespace-pre-wrap italic text-amber-950/90 text-xs">
                              {formattedVal}
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-[#0A2947]/90 leading-relaxed px-1 py-0.5 whitespace-pre-wrap font-sans min-h-[1.5rem]">
                            {formattedVal || <div className="h-2"></div>}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
          </div>
        </div>


      </>
    );
  };

  if (embedded) {
    return (
      <div className="flex flex-col bg-white h-full w-full select-none">
        {renderMainContent()}
        <ExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          note={editing ? editedNote : note}
          patient={patient}
          doctor={doctor}
        />
      </div>
    );
  }

  return (
    <aside
      style={!isOpenMobile && desktopWidth ? { width: `${desktopWidth}px` } : undefined}
      className={`flex flex-col bg-white h-full shrink-0 transition-all duration-200 border-l border-slate-200/90 select-none
        ${isOpenMobile ? 'fixed inset-0 z-[100] w-full h-full' : 'hidden md:flex w-96'}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-white shrink-0">
        <div className="flex items-center font-sans">
          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="md:hidden block bg-transparent border-none text-slate-900 p-1 cursor-pointer mr-2 flex items-center justify-center"
              title="Back to Recorder"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
            </button>
          )}
          <span
            className="text-xl font-normal text-[#22252a] tracking-tight"
            style={{ fontFamily: "'Kalice', 'Kalice-Trial', 'Kalice-Regular', 'Instrument Serif', Georgia, serif" }}
          >
            Clinical SOAP Note
          </span>
        </div>
        <div className="flex items-center gap-2">
          {onRegenerate && (
            <button
              type="button"
              onClick={onRegenerate}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl cursor-pointer transition-all disabled:opacity-50 shadow-xs"
              title="Re-draft note using updated transcription context"
            >
              <svg className={`w-3.5 h-3.5 text-teal ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>{loading ? 'Re-drafting...' : 'Regenerate'}</span>
            </button>
          )}
          {note && (
            <button
              className={`flex items-center justify-center text-slate-400 hover:text-slate-900 border border-slate-200 rounded-xl bg-white cursor-pointer transition-all ${editing ? 'text-rose-600 border-rose-200 bg-rose-50' : ''}`}
              onClick={toggleEditing}
              title={editing ? 'Save and close editing' : 'Edit note'}
              style={{ width: '30px', height: '30px' }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                {editing ? (
                  <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>
                ) : (
                  <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></>
                )}
              </svg>
            </button>
          )}
        </div>
      </div>

      {renderMainContent()}

      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        note={editing ? editedNote : note}
        patient={patient}
        doctor={doctor}
      />
    </aside>
  );
}
