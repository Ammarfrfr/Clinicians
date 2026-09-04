import Groq from 'groq-sdk';
import { AssemblyAI } from 'assemblyai';
import axios from 'axios';
import { Recording } from '../models/recording.model.js';
import { asyncHandler } from '../Utils/asyncHandler.js'
import { ApiError } from '../Utils/ApiError.js';
import { ApiResponse } from '../Utils/ApiResponse.js'

async function uploadAudioToAssemblyAI(fileBuffer, apiKey) {
  try {
    const response = await axios.post('https://api.assemblyai.com/v2/upload', fileBuffer, {
      headers: {
        authorization: apiKey,
        'content-type': 'application/octet-stream',
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });
    return response.data.upload_url;
  } catch (error) {
    const status = error.response ? error.response.status : 'unknown';
    throw new Error(`Upload failed: ${status}`);
  }
}

function formatLabeledTranscript(utterances) {
  if (!utterances || utterances.length === 0) return '';

  return utterances
    .map(u => {
      const label = u.speaker === 'A' ? 'Doctor' : 'Patient';
      return `${label}: "${u.text}"`;
    })
    .join('\n');
}

function normalizeNoteObject(raw) {
  if (!raw || typeof raw !== 'object') return null;

  let src = raw;
  if (src.sections && typeof src.sections === 'object') {
    src = { ...src, ...src.sections };
  } else if (src.SOAP && typeof src.SOAP === 'object') src = src.SOAP;
  else if (src.soap && typeof src.soap === 'object') src = src.soap;
  else if (src.clinicalNote && typeof src.clinicalNote === 'object') src = src.clinicalNote;
  else if (src.note && typeof src.note === 'object') src = src.note;

  const normalized = { ...src };

  const extractString = (val) => {
    if (typeof val === 'string') return val;
    if (Array.isArray(val)) {
      return val.map(v => (typeof v === 'object' ? JSON.stringify(v) : String(v))).join('\n');
    }
    if (typeof val === 'object' && val !== null) {
      return Object.values(val).map(v => (typeof v === 'object' ? JSON.stringify(v) : String(v))).join('\n');
    }
    return String(val || '');
  };

  if (!normalized.subjective && src.chief_complaint) normalized.subjective = extractString(src.chief_complaint);
  if (!normalized.objective && src.examination) normalized.objective = extractString(src.examination);
  if (!normalized.assessment && src.diagnosis) normalized.assessment = extractString(src.diagnosis);
  if (!normalized.plan && src.treatment_plan) normalized.plan = extractString(src.treatment_plan);

  Object.keys(normalized).forEach(k => {
    if (k !== 'prescription' && k !== 'exercises' && k !== 'tags' && k !== 'missing_critical_information' && k !== 'source_conflicts') {
      if (normalized[k] !== undefined && normalized[k] !== null && typeof normalized[k] !== 'string') {
        normalized[k] = extractString(normalized[k]);
      }
    }
  });

  return normalized;
}

function isNoteContentPresent(noteObj) {
  if (!noteObj || typeof noteObj !== 'object') return false;
  const keys = Object.keys(noteObj).filter(k => 
    k !== 'document_type' && k !== 'missing_critical_information' && k !== 'source_conflicts' && k !== 'tags'
  );
  return keys.some(k => {
    const val = noteObj[k];
    if (!val) return false;
    if (typeof val === 'string' && val.trim().length > 0) return true;
    if (Array.isArray(val) && val.length > 0) return true;
    if (typeof val === 'object' && Object.keys(val).length > 0) return true;
    return false;
  });
}

export function createStructuredPrompt(transcript, templateSections, templateId = 'soap') {
  let docType = (templateId || '').toLowerCase();
  let documentName = '';
  let documentInstructions = '';
  let jsonSchema = '';

  if (templateSections && Array.isArray(templateSections)) {
    if (templateSections.some(s => s.key === 'absence_period' || s.key === 'work_restrictions')) docType = 'sick_note';
    else if (templateSections.some(s => s.key === 'hospital_course' || s.key === 'discharge_date')) docType = 'discharge_summary';
    else if (templateSections.some(s => s.key === 'clinical_question' || s.key === 'purpose')) docType = 'referral_letter';
    else if (templateSections.some(s => s.key === 'patient_identification' || s.key === 'presenting_complaint')) docType = 'admission_note';
    else if (templateSections.some(s => s.key === 'reason_for_consult' || s.key === 'consult_question')) docType = 'consult_note';
    else if (templateSections.some(s => s.key === 'diagnosis_summary' || s.key === 'warning_signs')) docType = 'patient_handout';
    else if (templateSections.some(s => s.key === 'ros')) docType = 'history_physical';
  }

  const isStandardSoap = !docType || docType === 'soap' || docType === 'soap_note' || 
    (templateSections && Array.isArray(templateSections) && 
     templateSections.length === 4 && 
     templateSections.every(s => ['subjective', 'objective', 'assessment', 'plan'].includes(s.key)));

  if (docType === 'patient_handout') {
    documentName = 'Patient Handout';
    documentInstructions = `Draft a patient-friendly handout using simple, clear non-technical language.
Include: A plain-language summary of what was found, medication instructions with dose and frequency, prescribed physical exercises/rehabilitation, lifestyle and care advice, red flag warning signs requiring immediate medical attention, and next appointment details.
Avoid medical jargon. Be warm, reassuring, and concise.`;
    jsonSchema = `{
  "document_type": "patient_handout",
  "diagnosis_summary": "Simple explanation of diagnosis and findings in patient-friendly language",
  "medications": "Clear list of prescribed medications with dosage and instructions",
  "exercises": "Prescribed exercises or physical rehab routines",
  "lifestyle_advice": "Dietary, physical rest, or lifestyle advice",
  "warning_signs": "Red flag symptoms requiring immediate medical attention",
  "followup": "Next appointment date and instructions",
  "prescription": [
    { "drug": "Medication name", "dose": "dosage", "frequency": "frequency" }
  ],
  "missing_critical_information": [],
  "source_conflicts": []
}`;
  } else if (docType === 'sick_note') {
    documentName = 'Sick Note / Medical Certificate';
    documentInstructions = `Draft an official Sick Note / Medical Certificate in formal medical letter format using only supplied facts.
Follow this exact letter structure:
Date: [Date of assessment]

To Whom It May Concern,

This is to certify that, has been seen and evaluated by me on [Date of assessment]. Please be advised that due to medical reasons, they are recommended to refrain from professional responsibilities for the period of [Absence Period].

Sincerely,

Include assessment_date, reason_for_absence, absence_period, work_restrictions, and notes.`;
    jsonSchema = `{
  "document_type": "sick_note",
  "assessment_date": "Date of clinical assessment e.g. Friday, July 24, 2026",
  "reason_for_absence": "General authorized clinical reason for leave (concise)",
  "absence_period": "Recommended period of absence e.g. 3 days",
  "work_restrictions": "Stated physical or duty restrictions if any",
  "notes": "Brief official certificate statement",
  "missing_critical_information": [],
  "source_conflicts": []
}`;
  } else if (docType === 'discharge_summary') {
    documentName = 'Discharge Summary';
    documentInstructions = `Draft a concise discharge summary using only the supplied hospital record/encounter data.
Include: Admission Date, Discharge Date, Primary Discharge Diagnosis, Secondary Diagnoses, Reason for Admission, Key Investigations and Procedures, Hospital Course (chronological), Condition at Discharge, Discharge Medications, Discharge Instructions, Follow-up and Pending Results.
Do NOT invent medication doses, follow-up intervals, test results, procedures, complications, or discharge condition. Keep the hospital course chronological.`;
    jsonSchema = `{
  "document_type": "discharge_summary",
  "admission_date": "Admission date if documented",
  "discharge_date": "Discharge date if documented",
  "primary_diagnosis": "Primary discharge diagnosis",
  "secondary_diagnoses": "Secondary diagnoses list",
  "reason_for_admission": "Chief complaint / reason for admission",
  "key_investigations_procedures": "Summary of key tests and procedures done during stay",
  "hospital_course": "Chronological summary of hospital stay",
  "condition_at_discharge": "Condition at discharge (e.g. stable, improved)",
  "discharge_medications": "Medications on discharge with dose & frequency",
  "discharge_instructions": "Care instructions at home",
  "followup": "Follow-up timeline and pending lab results",
  "missing_critical_information": [],
  "source_conflicts": []
}`;
  } else if (docType === 'referral_letter') {
    documentName = 'Referral Letter';
    documentInstructions = `Draft a concise referral letter to the named specialty using only supplied data.
State the referral reason and the exact clinical question early. Include only high-yield symptoms, chronology, examination findings, investigations, relevant treatment already tried, and requested specialist action.
Do NOT include placeholder recipient names. Do NOT add a diagnosis as confirmed if it is only suspected.`;
    jsonSchema = `{
  "document_type": "referral_letter",
  "recipient": "Recipient specialist or department",
  "specialty": "Target specialty (e.g., Cardiology, Orthopedics)",
  "clinical_question": "Exact clinical question for the specialist",
  "history_chronology": "Concise high-yield chronology and symptoms",
  "exam_findings_investigations": "Relevant exam findings and key test results",
  "treatment_tried": "Treatments already attempted",
  "requested_action": "Specific requested specialist action",
  "missing_critical_information": [],
  "source_conflicts": []
}`;
  } else if (docType === 'admission_note') {
    documentName = 'Admission Note';
    documentInstructions = `Draft an admission note using only the supplied data.
Include: Reason for Admission, HPI, Relevant Medical/Surgical History, Medications & Allergies, Examination & Initial Investigations, Assessment, Initial Management Plan.
Clearly distinguish confirmed diagnoses from differential diagnoses. Do NOT fabricate an admitting diagnosis, level of care, or orders.`;
    jsonSchema = `{
  "document_type": "admission_note",
  "reason_for_admission": "Reason for admission",
  "hpi": "History of present illness",
  "pmh": "Past medical and surgical history",
  "meds_allergies": "Current medications and documented allergies",
  "exam_investigations": "Physical exam findings and initial lab/imaging results",
  "assessment": "Confirmed vs differential diagnoses",
  "initial_management_plan": "Initial management plan and pending items",
  "missing_critical_information": [],
  "source_conflicts": []
}`;
  } else if (docType === 'consult_note' || docType === 'ortho_consult') {
    documentName = 'Consult Note';
    documentInstructions = `Draft a specialty consult note using only the supplied information.
Include: Consult Question, Relevant History, Examination Findings, Investigations Reviewed, Impression, Recommendations.
State whether recommendations are based on documented findings. Do NOT invent surgical indications, consent, operative plans, procedural risks, or perioperative orders.`;
    jsonSchema = `{
  "document_type": "consult_note",
  "consult_question": "Consultation question",
  "relevant_history": "Relevant history of present illness",
  "examination_findings": "Detailed physical exam findings",
  "investigations_reviewed": "Lab and imaging reports reviewed",
  "impression": "Clinical impression & diagnosis",
  "recommendations": "Specific management recommendations",
  "missing_critical_information": [],
  "source_conflicts": []
}`;
  } else if (docType === 'history_physical') {
    documentName = 'History & Physical (H&P)';
    documentInstructions = `Draft a History and Physical from the supplied data.
Include: Chief Complaint, History of Present Illness, Past History, Review of Systems, Physical Examination, Assessment & Plan.
Do NOT create normal examination findings, negative review-of-systems items, or missing history. Omit unsupported sections.`;
    jsonSchema = `{
  "document_type": "history_physical",
  "chief_complaint": "Chief complaint",
  "hpi": "History of present illness",
  "past_history": "Past medical and surgical history",
  "ros": "Review of systems",
  "physical_exam": "Physical examination findings",
  "assessment_plan": "Assessment and management plan",
  "missing_critical_information": [],
  "source_conflicts": []
}`;
  } else if (!isStandardSoap && templateSections && Array.isArray(templateSections) && templateSections.length > 0) {
    documentName = 'Custom Note';
    documentInstructions = templateSections.map((s, i) =>
      `${i + 1}. ${s.label}: Extract relevant clinical information for this field`
    ).join('\n');
    const schemaFields = templateSections.map(s => `  "${s.key}": "Relevant ${s.label.toLowerCase()} information"`).join(',\n');
    jsonSchema = `{
  "document_type": "custom",
${schemaFields},
  "missing_critical_information": [],
  "source_conflicts": []
}`;
  } else {
    // Default SOAP Note
    documentName = 'SOAP Note';
    documentInstructions = `SOAP NOTE GENERATION RULES:

1. SUBJECTIVE:
   - Include all patient-reported information: symptoms, history, duration, triggers.
   - Include self-monitored / home-recorded values here (e.g. glucometer readings, home BP logs, patient-reported weight) — these are patient-reported, not clinically measured, regardless of whether the number sounds precise.

2. OBJECTIVE:
   - Include ONLY findings measured, observed, or documented by the clinician during THIS visit: vitals taken in-clinic (BP, weight, temp), physical exam findings, test results reviewed in-session.
   - Do NOT include patient-reported home readings here, even if numeric.

3. ASSESSMENT:
   - Do NOT leave Assessment empty or output boilerplate hedging (such as "Assessment not explicitly stated").
   - If the doctor explicitly states a diagnosis, extract it cleanly.
   - If no diagnosis is explicitly stated out loud, infer a probable/working assessment based on the symptom pattern, physical exam findings, and tests/investigations ordered.
   - If tests were ordered to rule out a specific condition (e.g. Dengue NS1, CBC, Widal), state this explicitly as "r/o [condition]" (e.g., "Acute febrile illness, r/o Dengue: pending CBC, platelet count, NS1 antigen").
   - Format as: "- [Working impression]: r/o [suspected condition if applicable]: pending [investigations ordered]".
   - Preserve clinical reasoning links and relevant patient concern context (e.g., recent exposure or patient concern of Dengue linked to tests ordered).
   - Only if there is truly zero clinical signal available, write "Clinical impression pending further evaluation" instead of leaving it empty.

4. PLAN:
   - Include all prescribed medications with exact dosage, frequency, and duration as stated. Format prescribed medications as bullet points starting with "- Tab. " or "- Cap. " or "- Syr. ".
   - Include all follow-up instructions, investigations ordered, and lifestyle advice.
   - MANDATORY: preserve all patient safety counseling, warning signs, and red-flag instructions given by the doctor (e.g. "if you feel dizzy/numb/short of breath, do X immediately"). These must never be dropped for brevity: safety instructions take priority over conciseness.
   - If the doctor gives conditional/deferred plans (e.g. "we'll do an ultrasound if no improvement in 10 days"), include them under Plan as conditional items, not as separate assumptions.`;
    jsonSchema = `{
  "document_type": "soap_note",
  "subjective": "Concise bullet-point list of history, chief complaint, self-monitored home readings, and symptoms",
  "objective": "Concise bullet-point list of physical examination findings and in-clinic measured vitals only",
  "assessment": "Concise bullet-point list of working/inferred clinical impression, rule-out diagnoses (e.g., Acute febrile illness, r/o Dengue), and reasoning based on symptom pattern and tests ordered",
  "plan": "Concise bullet-point list of care plan, prescriptions, safety warnings, and follow-up",
  "prescription": [
    { "drug": "Medication name", "dose": "dosage e.g. 500mg or 1 tab", "frequency": "frequency e.g. once daily or twice daily" }
  ],
  "followup": "Follow-up instructions and care plan",
  "missing_critical_information": [],
  "source_conflicts": []
}`;
  }

  return `You are a clinician documentation assistant. Draft clinical documents only from the supplied encounter data, dictated transcript, structured fields, and uploaded records.

Do not invent diagnoses, medications, doses, allergies, examination findings, test results, dates, procedures, complications, follow-up plans, or patient identifiers. Where inference is required (as in Assessment fallback above), be explicit that it is inferred, and never present an inference as a stated clinical fact.

Remove conversational filler and organize information clinically. Preserve source modifiers, dates, units, routes, laterality, uncertainty, negations, and patient safety instructions.

Use the requested document type (${documentName}) and exact section headings. Keep the language professional and concise. The clinician must review and sign all output. Do not provide independent treatment recommendations unless explicitly requested.

Source Encounter Data:
${transcript || '(No encounter data or context provided)'}

Document Specific Instructions (${documentName}):
${documentInstructions}

CRITICAL RULES:
1. NEVER USE EM-DASHES (—) OR DOUBLE-DASHES (--) ANYWHERE IN THE GENERATED TEXT. Use natural colons (:), commas (,), or clean parentheses instead.
2. Extract EXACT facts from the supplied source text only. Do NOT fabricate unstated medical diagnoses.
3. Format clinical section text cleanly as concise bullet points starting with a dash (- ).
4. IF THE SUPPLIED SOURCE ENCOUNTER DATA IS BLANK OR CONTAINS NO CLINICAL INFORMATION, RETURN EMPTY STRINGS ("") FOR ALL SECTION FIELDS (subjective, objective, assessment, plan). DO NOT GENERATE DUMMY TEXT OR PLACEHOLDERS. HOWEVER, IF THERE IS CLINICAL INFORMATION IN THE SOURCE DATA (IN TRANSCRIPT OR TYPED/PASTED CONTEXT), YOU MUST POPULATE AND EXTRACT ALL RELEVANT FIELDS ACCORDINGLY. DO NOT RETURN EMPTY STRINGS IF CLINICAL DETAILS ARE PRESENT.
5. Return ONLY valid JSON matching this schema:
${jsonSchema}`;
}


export const analyzeAudio = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'No audio file provided');
  }

  if (!process.env.GROQ_API_KEY) {
    throw new ApiError(500, 'GROQ_API_KEY not configured');
  }

  if (!process.env.ASSEMBLYAI_API_KEY) {
    throw new ApiError(500, 'ASSEMBLYAI_API_KEY not configured');
  }

  let translatedText = '';
  let diarizedUtterances = [];

  // Parse custom template sections if provided
  let templateSections = null;
  try {
    if (req.body.templateSections) {
      templateSections = JSON.parse(req.body.templateSections);
    }
  } catch (e) {
    // Ignore parse errors — fall back to default SOAP
  }

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const client = new AssemblyAI({ apiKey: process.env.ASSEMBLYAI_API_KEY });

  try {
    // RUN WHISPER AND ASSEMBLY AI IN PARALLEL! Extremely fast.
    const [translation, diarizeTranscript] = await Promise.all([
      // Task 1: Groq Whisper Translation (takes ~3-5 seconds)
      groq.audio.translations.create({
        file: await Groq.toFile(req.file.buffer, req.file.originalname || 'audio.webm'),
        model: 'whisper-large-v3',
        prompt: 'This is a detailed clinical conversation between a doctor and a patient spoken in Hinglish (Hindi and English). Please translate everything faithfully to English. Do not hallucinate.',
      }),
      
      // Task 2: AssemblyAI Upload + Diarization Background task
      // Note: If you want to drop AssemblyAI entirely for massive speedup, you can comment Task 2 out completely.
      // But running it in parallel at least prevents sequential waiting. 
      // Actually, since AssemblyAI blocks for 1+ minutes, we will wrap it with a fast timeout
      // If it takes more than 10 seconds, we abandon AssemblyAI and rely PURELY on Groq LLM for diarization!
      Promise.race([
        (async () => {
          const audioUrl = await uploadAudioToAssemblyAI(req.file.buffer, process.env.ASSEMBLYAI_API_KEY);
          return await client.transcripts.transcribe({
            audio_url: audioUrl,
            speaker_labels: true,
            language_code: 'en',
            speech_models: ['universal-2'],
          });
        })(),
        new Promise((_, reject) => setTimeout(() => reject(new Error("AssemblyAI Timeout")), 12000))
      ]).catch(e => {
        console.warn("AssemblyAI skipped due to taking too long:", e.message);
        return null;
      })
    ]);

    translatedText = translation.text;

    if (diarizeTranscript && diarizeTranscript.status !== 'error') {
      diarizedUtterances = diarizeTranscript.utterances || [];
    }
  } catch (err) {
    throw new ApiError(400, `Audio processing failed: ${err.message}`);
  }

  if (!translatedText || translatedText.trim().length === 0) {
    throw new ApiError(400, 'No speech detected in audio');
  }

  // Step 3: Reconstruct speaker-labeled transcript AND generate clinical note IN PARALLEL
  let labeledTranscript = translatedText;
  const plainTranscript = translatedText;
  let noteError = null;
  let note;

  if (process.env.LLM_MODEL && process.env.GROQ_API_KEY) {
    const reconstructPrompt = `You are an expert medical transcription editor. I have a continuous English translation of a clinical consultation. It lacks speaker labels.

FULL TRANSLATION:
"""
${translatedText}
"""

${diarizedUtterances.length > 0 ? `SPEAKER SKELETON (Fragmented text, but shows rhythm of speaker turns. Use as a loose guide):\n"""\n${formatLabeledTranscript(diarizedUtterances)}\n"""` : ''}

Your task: Reconstruct the full conversation by assigning the correct "Doctor:" or "Patient:" labels to the sentences from the FULL TRANSLATION.
Use clinical context to figure out who is speaking:
- The Doctor asks medical questions, orders tests, gives advice and diagnoses.
- The Patient reports symptoms, answers questions, and expresses concerns.

Do not summarize or omit anything from the FULL TRANSLATION. Translate any leftover native words to English. Format strictly as:
Doctor: [Text]
Patient: [Text]

Put each speaker's turn on a new line. Return ONLY the reconstructed transcript, without any markdown formatting block or intro/outro.`;

    try {
      // Parallelize both LLM tasks completely to cut time in half
      const [reconstructResponse, noteResponse] = await Promise.all([
        // Task A: Reconstruct Transcript
        groq.chat.completions.create({
          model: process.env.LLM_MODEL || 'openai/gpt-oss-120b',
          messages: [{ role: 'user', content: reconstructPrompt }],
          temperature: 0.1,
        }),
        // Task B: Generate Clinical Note using the RAW plain transcript and typedContext!
        // (It doesn't actually need Doctor/Patient labels perfectly to understand the facts)
        groq.chat.completions.create({
          model: process.env.LLM_MODEL || 'openai/gpt-oss-120b',
          messages: [
            {
              role: 'system',
              content: 'You are an expert clinical documentation assistant. Return ONLY a valid JSON object.'
            },
            {
              role: 'user',
              content: (() => {
                const cleanTyped = req.body.typedContext ? req.body.typedContext.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').trim() : '';
                const parts = [];
                if (translatedText && translatedText.trim()) parts.push(`Audio Transcript:\n${translatedText.trim()}`);
                if (cleanTyped) parts.push(`Typed/Pasted Context:\n${cleanTyped}`);
                const sourceData = parts.join('\n\n') || translatedText;
                return createStructuredPrompt(
                  sourceData,
                  templateSections,
                  req.body.templateId || 'soap'
                );
              })()
            }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.2,
        })
      ]);

      // Assign Reconstructed Transcript
      labeledTranscript = reconstructResponse.choices[0].message.content.trim();

      // Assign Generated Note
      const rawContent = noteResponse.choices[0].message.content;
      const rawParsed = safeParseLLMJson(rawContent);
      if (rawParsed) {
        note = normalizeNoteObject(rawParsed) || rawParsed;
      } else {
        noteError = "Failed to parse AI response as valid JSON format.";
      }

    } catch (err) {
      console.error("LLM Operations failed:", err);
      // Fallback
      labeledTranscript = diarizedUtterances.length > 0 ? formatLabeledTranscript(diarizedUtterances) : translatedText;
      noteError = `LLM Error: ${err.message}`;
    }
  }

  // Fallback defaults if Note parsing completely failed or no LLM
  if (!note || !isNoteContentPresent(note)) {
    note = {
      subjective: '',
      objective: '',
      assessment: '',
      plan: '',
      prescription: [],
      followup: ''
    };
  }

  // Save to MongoDB
  const recording = new Recording({
    userId: req.user._id.toString(),
    patientId: req.body.patientId || null,
    transcript: {
      text: plainTranscript,
      labeledText: labeledTranscript,
      utterances: diarizedUtterances,
      language: 'en',
      hasSpokenLabels: diarizedUtterances.length > 0,
    },
    clinicalNote: note,
    tags: note.tags || [],
    metadata: {
      recordedAt: new Date(),
      recordingDuration: req.body.recordingDuration || 0,
      deviceInfo: req.get('user-agent'),
      ipAddress: req.ip,
    },
    processingStatus: 'completed',
  });

  const savedRecording = await recording.save();

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        transcript: labeledTranscript,
        plainTranscript,
        note,
        recordingId: savedRecording._id,
        noteError: noteError || null
      },
      'Audio analyzed successfully'
    )
  );
});

export const transcribeAudio = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'No audio file provided');
  }

  if (!process.env.GROQ_API_KEY) {
    throw new ApiError(500, 'GROQ_API_KEY not configured');
  }

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  try {
    const translation = await groq.audio.translations.create({
      file: await Groq.toFile(req.file.buffer, req.file.originalname || 'audio.webm'),
      model: 'whisper-large-v3',
      prompt: 'This is a clinical description or note dictated by a doctor. Please translate or transcribe it faithfully to English.',
    });

    return res.status(200).json(
      new ApiResponse(
        200,
        { text: translation.text },
        'Audio transcribed successfully'
      )
    );
  } catch (err) {
    console.error('Transcription error:', err);
    throw new ApiError(500, `Transcription failed: ${err.message}`);
  }
});

export const dictateSection = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'No audio file provided');
  }
  const { section, existingValue } = req.body;
  if (!section) {
    throw new ApiError(400, 'No section specified');
  }

  if (!process.env.GROQ_API_KEY) {
    throw new ApiError(500, 'GROQ_API_KEY not configured');
  }

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  // Step 1: Transcribe the audio
  let transcription = '';
  try {
    const translation = await groq.audio.translations.create({
      file: await Groq.toFile(req.file.buffer, req.file.originalname || 'audio.webm'),
      model: 'whisper-large-v3',
      prompt: 'This is clinical dictation by a doctor for a specific section of a medical SOAP note.',
    });
    transcription = translation.text;
  } catch (err) {
    console.error('Transcription failed:', err);
    throw new ApiError(500, `Transcription failed: ${err.message}`);
  }

  if (!transcription || transcription.trim().length === 0) {
    throw new ApiError(400, 'No speech detected in audio');
  }

  // Step 2: Use LLM to structure/refine the transcription for the specific section
  let finalValue;
  if (process.env.LLM_MODEL) {
    try {
      let prompt = '';
      if (section === 'prescription') {
        let existingPrescriptions = [];
        try {
          if (existingValue) {
            existingPrescriptions = JSON.parse(existingValue);
          }
        } catch (e) {
          existingPrescriptions = [];
        }

        prompt = `You are an expert clinical documentation assistant. Parse this transcribed medical dictation of medications into a structured JSON array of prescription objects.
Each medication object must have:
- "drug": medication name (properly capitalized)
- "dose": dosage details (e.g. "500 mg", "1 tab", or empty if not mentioned)
- "frequency": frequency (e.g. "once daily", "twice daily", "tds", or empty if not mentioned)

Dictated text:
"${transcription}"

Existing prescription list (merge or append to these):
${JSON.stringify(existingPrescriptions, null, 2)}

Return ONLY a valid JSON array of objects. Do not include markdown code block syntax (like \`\`\`json).
Example output format:
[
  { "drug": "Paracetamol", "dose": "500 mg", "frequency": "once daily" }
]`;
      } else {
        prompt = `You are an expert clinical documentation assistant. Refine and format the following transcribed clinical dictation into professional, clear medical prose for the "${section}" section of a SOAP note.
Make it grammatically correct and use standard clinical abbreviations where appropriate.

Dictated text:
"${transcription}"

${existingValue ? `Existing content for this section (intelligently integrate/append the new dictation with this):
"${existingValue}"` : ''}

Return ONLY the final cleaned text for this section, with absolutely no introduction, preamble, or markdown formatting.`;
      }

      const response = await groq.chat.completions.create({
        model: process.env.FAST_LLM_MODEL || 'qwen/qwen3.8-27b',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 1000,
      });

      const responseText = response.choices[0].message.content.trim();
      if (section === 'prescription') {
        let cleanText = responseText;
        if (cleanText.startsWith('```')) {
          cleanText = cleanText.replace(/^```json/i, '').replace(/^```/, '').replace(/```$/, '').trim();
        }
        finalValue = JSON.parse(cleanText);
      } else {
        finalValue = responseText;
      }
    } catch (err) {
      console.error('LLM structuring failed:', err);
      // Fallback
      if (section === 'prescription') {
        try {
          finalValue = existingValue ? JSON.parse(existingValue) : [];
        } catch (e) {
          finalValue = [];
        }
        finalValue.push({ drug: transcription, dose: '', frequency: '' });
      } else {
        finalValue = existingValue ? `${existingValue}\n${transcription}` : transcription;
      }
    }
  } else {
    // Fallback
    if (section === 'prescription') {
      try {
        finalValue = existingValue ? JSON.parse(existingValue) : [];
      } catch (e) {
        finalValue = [];
      }
      finalValue.push({ drug: transcription, dose: '', frequency: '' });
    } else {
      finalValue = existingValue ? `${existingValue}\n${transcription}` : transcription;
    }
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      { value: finalValue },
      'Section dictation processed successfully'
    )
  );
});

export const searchDrugsFromLLM = asyncHandler(async (req, res) => {
  const { q } = req.query;
  if (!q || q.trim().length < 2) {
    return res.status(200).json(new ApiResponse(200, [], 'Empty query'));
  }

  const query = q.trim();

  if (!process.env.GROQ_API_KEY) {
    console.warn('GROQ_API_KEY is not configured for drug search');
    return res.status(200).json(new ApiResponse(200, [], 'GROQ not configured'));
  }

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  const prompt = `You are a clinical medicine database search assistant.
Find matching commercial pharmaceutical products (medications/drugs) available in the Indian/global market matching the search query: "${query}".
The query can be a brand name (e.g. "Augmentin", "Dolo"), a generic name / composition (e.g. "Paracetamol"), or a combination of compounds (e.g. "tretinoin + glutathione").

Generate up to 8 accurate matching options.
For each option, provide:
1. "name": The brand name of the product (e.g., "Glycomet 500", "Crocin", "Tretin-A"). If it's a generic compound without a major single brand, suggest a standard generic formulation name.
2. "composition": The exact active ingredients and their strengths (e.g., "Tretinoin 0.025% + Glutathione 2%").
3. "brand": The pharmaceutical manufacturer/company name that produces/markets it (e.g., "Cipla", "Abbott", "Sun Pharma", "GlaxoSmithKline").

Return ONLY a valid JSON array of objects. Do not include markdown code block formatting (like \`\`\`json).
Format:
[
  { "name": "Brand/Generic Name", "composition": "Active Ingredients and Strengths", "brand": "Manufacturer/Company Name" }
]`;

  try {
    const response = await groq.chat.completions.create({
      model: process.env.FAST_LLM_MODEL || 'qwen/qwen3.8-27b',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: 1000,
    });

    let cleanText = response.choices[0].message.content.trim();
    if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/^```json/i, '').replace(/^```/, '').replace(/```$/, '').trim();
    }
    const drugsList = JSON.parse(cleanText);

    return res.status(200).json(
      new ApiResponse(200, drugsList, 'Drugs searched successfully')
    );
  } catch (err) {
    console.error('LLM drug search failed:', err);
    return res.status(200).json(
      new ApiResponse(200, [], `Search failed: ${err.message}`)
    );
  }
});

export const chatWithAssistant = asyncHandler(async (req, res) => {
  const { message, note, patient, transcript, typedContext } = req.body;

  if (!message || message.trim() === '') {
    throw new ApiError(400, 'Message is required');
  }

  if (!process.env.GROQ_API_KEY) {
    throw new ApiError(500, 'GROQ_API_KEY is not configured');
  }

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  const pMed = patient?.medicalInfo || {};
  const patientInfo = patient 
    ? `Patient Name: ${patient.firstName || ''} ${patient.lastName || ''}
Age: ${patient.age ? patient.age + ' years old' : 'N/A'}, Gender: ${patient.gender || 'N/A'}
Blood Group: ${pMed.bloodGroup || 'N/A'}
Known Allergies: ${Array.isArray(pMed.allergies) ? (pMed.allergies.length ? pMed.allergies.join(', ') : 'None documented') : (pMed.allergies || 'None documented')}
Current Medications: ${Array.isArray(pMed.currentMedications) ? (pMed.currentMedications.length ? pMed.currentMedications.join(', ') : 'None documented') : (pMed.currentMedications || 'None documented')}
Existing Conditions: ${Array.isArray(pMed.existingConditions) ? (pMed.existingConditions.length ? pMed.existingConditions.join(', ') : 'None documented') : (pMed.existingConditions || 'None documented')}
Medical History & Past Notes: ${pMed.medicalHistory || 'None documented'}`
    : 'No active patient selected';

  const cleanTranscript = typeof transcript === 'string' ? transcript.trim() : '';
  const cleanTypedContext = typeof typedContext === 'string' ? typedContext.trim() : '';

  const systemPrompt = `You are an expert clinical AI assistant for doctors. You answer medical queries, assist with diagnostic preparation, evaluate medication options, and help refine clinical notes.

Active Patient Background & History (FROM SIDEBAR / EHR CARD):
${patientInfo}

Active Encounter Audio Transcript:
${cleanTranscript || 'No transcript available.'}

Active Encounter Typed Context:
${cleanTypedContext || 'No typed context available.'}

Current Clinical Note (JSON format):
${JSON.stringify(note || {}, null, 2)}

CORE INSTRUCTIONS FOR YOUR RESPONSE:
1. RESPOND DIRECTLY & CONCISELY TO THE DOCTOR'S QUERY:
   - When asked for diagnostic questions, prep questions, or medication advice, respond directly in the exact logical order requested.
   - DO NOT dump rigid pre-encounter SOAP boilerplate templates (such as "### Brief Patient History & Background", "### Reason for Visit", "### Recommended Pre-encounter Checks", etc.) UNLESS the user explicitly asks for a full SOAP report.
   - Provide direct, actionable clinical responses. E.g.:
     • Diagnostic / Prep Questions to ask the patient (tailored specifically using the patient's age, history, allergies, and symptoms).
     • Recommended Medications (with exact drug name, dosage, route, frequency, duration, and rationale + allergy/contraindication safety checks).
2. USE THE ACTIVE PATIENT'S BACKGROUND (AGE, HISTORY, ALLERGIES, MEDS):
   - Always synthesize the patient's existing background (age, past history, allergies, current meds) into your reasoning.
   - If a medication is contraindicated or interacts with their history/allergies, explicitly mention it.
3. MODIFICATIONS TO NOTE:
   - If the doctor asks you to modify any field in the note (e.g. "add Paracetamol 500mg TDS to prescription", "set chief complaint to fever"), return the updated note in the "updatedNote" JSON property.
4. MANDATORY INTERACTIVE FOLLOW-UP QUESTIONS:
   - Include a "followUpQuestions" property containing an array of EXACTLY 3 short, relevant, high-yield follow-up questions that the doctor might want to click next (e.g., ["What red flag symptoms should I watch for?", "Should I order a complete blood count (CBC)?", "What dosage adjustments apply?"]).
5. STRICT MEDICAL DOMAIN GUARDRAIL:
   - Only answer queries related to medicine, healthcare, clinical documentation, pharmacology, diagnostics, or Scribologist features. Politely decline non-medical questions.
6. NO AI FORMATTING CLUTTER:
   - NEVER use em-dashes (—) or double-dashes (--) in your text. Use natural colons (:), commas (,), or clean bullet points instead.
7. MANDATORY JSON OUTPUT FORMAT:
   - Return ONLY a valid JSON object. Do NOT include markdown code block backticks (\`\`\`json).

Required JSON structure:
{
  "response": "Your direct, clear, beautifully formatted markdown response text",
  "updatedNote": null or { ... },
  "followUpQuestions": [
    "Short follow-up question 1?",
    "Short follow-up question 2?",
    "Short follow-up question 3?"
  ]
}`;

  try {
    const response = await groq.chat.completions.create({
      model: process.env.LLM_MODEL || 'openai/gpt-oss-120b',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 3000,
    });

    const cleanText = response.choices[0].message.content;
    const result = safeParseLLMJson(cleanText);
    if (!result) {
      throw new Error('Failed to parse AI chat response as JSON');
    }

    return res.status(200).json(
      new ApiResponse(200, result, 'Chat response generated successfully')
    );
  } catch (err) {
    console.error('AI chat failed:', err);
    return res.status(500).json(
      new ApiResponse(500, null, `Chat failed: ${err.message}`)
    );
  }
});

export const generateChatTitle = asyncHandler(async (req, res) => {
  const { message } = req.body;
  if (!message || !message.trim()) {
    throw new ApiError(400, 'Message is required to generate a title');
  }

  if (!process.env.GROQ_API_KEY) {
    const fallback = message.trim().length > 25 ? message.trim().substring(0, 25) + '...' : message.trim();
    return res.status(200).json(new ApiResponse(200, { title: fallback }, 'Fallback title'));
  }

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  try {
    const response = await groq.chat.completions.create({
      model: process.env.FAST_LLM_MODEL || 'qwen/qwen3.8-27b',
      messages: [
        {
          role: 'system',
          content: 'You generate short, elegant 2 to 4 word chat titles for medical/clinical conversations (like ChatGPT, Gemini, or Claude). Return ONLY the title text. Do NOT use quotes, code blocks, or periods.'
        },
        {
          role: 'user',
          content: `Generate a title for a chat starting with: "${message.trim()}"`
        }
      ],
      temperature: 0.4,
      max_tokens: 100,
    });

    let title = response.choices[0]?.message?.content?.trim() || '';
    title = title.replace(/^["']|["']$/g, '').replace(/```/g, '').trim();

    if (!title || title.length > 40) {
      title = message.trim().length > 25 ? message.trim().substring(0, 25) + '...' : message.trim();
    }

    return res.status(200).json(
      new ApiResponse(200, { title }, 'Title generated successfully')
    );
  } catch (err) {
    console.error('Title generation error:', err);
    const fallbackTitle = message.trim().length > 25 ? message.trim().substring(0, 25) + '...' : message.trim();
    return res.status(200).json(
      new ApiResponse(200, { title: fallbackTitle }, 'Fallback title generated')
    );
  }
});

function safeParseLLMJson(rawContent) {
  if (!rawContent || typeof rawContent !== 'string') return null;
  let str = rawContent.trim();
  if (str.includes('```')) {
    str = str.replace(/```json/gi, '').replace(/```/g, '').trim();
  }
  const jsonMatch = str.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    str = jsonMatch[0];
  }
  try {
    return JSON.parse(str);
  } catch (err1) {
    console.warn("Standard JSON.parse failed, attempting repair:", err1.message);
    try {
      const repaired = str
        .replace(/:\s*-\s+([^\n",\}]+)/g, ': "- $1"')
        .replace(/,\s*([\]\}])/g, '$1')
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
      return JSON.parse(repaired);
    } catch (err2) {
      console.error("Failed to parse LLM JSON output even after repair:", err2.message);
      return null;
    }
  }
}

export const analyzeText = asyncHandler(async (req, res) => {
  const { transcript, typedContext, templateSections, templateId, patientId } = req.body;

  if (!process.env.GROQ_API_KEY) {
    throw new ApiError(500, 'GROQ_API_KEY not configured');
  }

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const cleanTyped = (typedContext || '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').trim();
  const cleanTranscript = (transcript || '').trim();

  const parts = [];
  if (cleanTranscript) parts.push(`Audio Transcript:\n${cleanTranscript}`);
  if (cleanTyped) parts.push(`Typed/Pasted Context:\n${cleanTyped}`);
  const combinedText = parts.join('\n\n');

  let note = null;
  let noteError = null;

  try {
    let modelToUse = process.env.LLM_MODEL || 'openai/gpt-oss-120b';
    let fallbackModel = process.env.FAST_LLM_MODEL || 'qwen/qwen3.8-27b';
    let noteResponse;
    try {
      noteResponse = await groq.chat.completions.create({
        model: modelToUse,
        messages: [
          { role: 'system', content: 'You are an expert medical AI assistant. Return ONLY a valid JSON object.' },
          { role: 'user', content: createStructuredPrompt(combinedText, templateSections, templateId) }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2,
      });
    } catch (modelErr) {
      console.warn(`Primary model ${modelToUse} failed, falling back to ${fallbackModel}:`, modelErr.message);
      noteResponse = await groq.chat.completions.create({
        model: fallbackModel,
        messages: [
          { role: 'system', content: 'You are an expert medical AI assistant. Return ONLY a valid JSON object.' },
          { role: 'user', content: createStructuredPrompt(combinedText, templateSections, templateId) }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2,
      });
    }

    const rawContent = noteResponse.choices[0].message.content;
    const rawParsed = safeParseLLMJson(rawContent);
    if (rawParsed) {
      note = normalizeNoteObject(rawParsed) || rawParsed;
    } else {
      noteError = "Failed to parse AI structured response as JSON format.";
    }
  } catch (err) {
    console.error("LLM Operations failed:", err);
    noteError = `LLM Error: ${err.message}`;
  }

  const rawInputText = (typedContext || transcript || '').trim();
  if (!note || !isNoteContentPresent(note)) {
    note = {
      subjective: '',
      objective: '',
      assessment: '',
      plan: '',
      prescription: [],
      followup: ''
    };
  }

  // Create recording/session model
  const recording = await Recording.create({
    userId: req.user?._id?.toString() || 'anonymous',
    patientId: patientId || null,
    transcript: {
      text: transcript || '',
      labeledText: transcript || '',
      utterances: [],
      language: 'en',
      hasSpokenLabels: false
    },
    clinicalNote: note,
    processingStatus: 'completed',
    isFinalized: false
  });

  return res.status(200).json(
    new ApiResponse(200, {
      transcript: transcript || '',
      note: note,
      recordingId: recording._id,
      noteError: noteError
    }, 'Note generated successfully')
  );
});



