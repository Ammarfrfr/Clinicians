export function generateClinicalNotePDF(note, patient = {}, doctor = {}, includeSections = null, options = {}) {
  // Default: include all sections
  const sections = includeSections || {
    notes: true,
    chief_complaint: true,
    history: true,
    examination: true,
    diagnosis: true,
    prescription: true,
    followup: true,
    vitals: true,
    exercises: true,
  };
  
  const { physicalLetterhead = false } = options;
  const docName = doctor?.profile?.name || doctor?.name || 'Dr. Clinician';
  const docQual = doctor?.profile?.qualification || doctor?.qualification || 'MBBS';

  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  const formattedTime = currentDate.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  // Helper function to escape HTML
  const escapeHtml = (text) => {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  // Generate prescription table rows
  const prescriptionRows = Array.isArray(note.prescription)
    ? note.prescription
        .map((med, idx) => {
          if (!med || typeof med !== 'object') return '';
          return `
        <tr class="rx-row">
          <td class="rx-num">${String(idx + 1).padStart(2, '0')}</td>
          <td>
            <div class="rx-name">${escapeHtml(med.drug || 'Unknown')}</div>
            <div class="rx-dose">${escapeHtml(med.dose || '')}${med.frequency ? ' — ' + escapeHtml(med.frequency) : ''}</div>
          </td>
          <td style="text-align:right;vertical-align:middle;">
            <span class="rx-route">${escapeHtml(med.route || 'Oral')}</span>
          </td>
        </tr>`;
        })
        .join('')
    : '';

  const exArray = Array.isArray(note.exercises) ? note.exercises : [];
  const exerciseRows = exArray
    .map((ex, idx) => {
      if (!ex) return '';
      return `
    <tr class="rx-row">
      <td class="rx-num">${String(idx + 1).padStart(2, '0')}</td>
      <td>
        <div class="rx-name">${escapeHtml(ex.name)} <span style="font-size:10px;font-family:'DM Mono',monospace;color:#64748b;margin-left:4px;">(${escapeHtml(ex.category)})</span></div>
        <div class="rx-dose">Frequency: ${escapeHtml(ex.sets || '3')} Sets x ${escapeHtml(ex.reps || '10')} Reps ${ex.frequency ? ' — ' + escapeHtml(ex.frequency) : ''}</div>
        <div style="font-size:11px;color:#475569;margin-top:4px;line-height:1.45;">${escapeHtml(ex.instruction)}</div>
      </td>
    </tr>`;
    })
    .join('');

  const apiBaseUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || 'http://localhost:7001';
  const qrDataUrl = `https://api.qrserver.com/v1/create-qr-code/?size=70x70&data=${encodeURIComponent(`${apiBaseUrl}/api/share/exercises?ids=${exArray.map(e => e.id).join(',')}`)}`;

  const exercisesSection = (sections.exercises !== false && exArray.length > 0)
    ? `<div class="section" style="margin-top:20px;">
      <div class="section-head"><div class="section-label">Prescribed Rehabilitation & Exercises</div><div class="section-line"></div></div>
      <table class="rx-table">
        ${exerciseRows}
      </table>
      <div style="margin-top:16px;padding:14px;background:#fafafc;border:1px solid #e2e8f0;border-radius:12px;display:flex;align-items:center;gap:16px;page-break-inside:avoid;">
        <img src="${qrDataUrl}" style="width:70px;height:70px;border-radius:8px;border:1px solid #cbd5e1;" alt="QR Code" />
        <div>
          <div style="font-size:12px;font-weight:700;color:#0f172a;">Scan for Visual Exercise Demonstrations</div>
          <div style="font-size:11px;color:#64748b;margin-top:3px;line-height:1.4;">Scan this QR code using your phone camera to access interactive 3D looping animations prescribed by your doctor.</div>
        </div>
      </div>
    </div>`
    : '';

  const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Scribologist Clinical Handout - ${escapeHtml(patient.firstName || 'Patient')} ${escapeHtml(patient.lastName || '')}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500;600;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
body{background:#f1f5f9;font-family:'DM Sans',sans-serif;padding:40px;display:flex;justify-content:center;}
.page{width:750px;background:#fff;border-radius:16px;overflow:hidden;font-size:13px;line-height:1.6;color:#0f172a;box-shadow:0 10px 30px rgba(0,0,0,0.06);border:1px solid #e2e8f0;}
.doc-header{background:#181a1e;padding:30px 40px;display:flex;align-items:center;justify-content:space-between;color:#fff;}
.doc-logo{font-family:'DM Sans',sans-serif;font-size:20px;font-weight:900;letter-spacing:-0.5px;text-transform:uppercase;color:#fff;}
.doc-tagline{font-size:10px;font-family:'DM Mono',monospace;color:#94a3b8;letter-spacing:1px;text-transform:uppercase;margin-top:3px;}
.doc-meta{text-align:right;}
.doc-meta-row{font-size:11px;font-family:'DM Mono',monospace;color:#cbd5e1;margin-bottom:2px;}
.doc-meta-row strong{color:#fff;}
.doc-badge{display:inline-block;margin-top:6px;font-size:9px;font-family:'DM Mono',monospace;padding:3px 10px;border-radius:6px;background:#22252a;border:1px solid #334155;color:#f8fafc;letter-spacing:.5px;text-transform:uppercase;}
.patient-strip{background:#fafafc;border-bottom:1px solid #e2e8f0;padding:18px 40px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:20px;}
.pfield-lbl{font-size:9px;font-family:'DM Mono',monospace;color:#94a3b8;letter-spacing:.8px;text-transform:uppercase;margin-bottom:3px;}
.pfield-val{font-size:14px;font-weight:700;color:#0f172a;}
.pfield-sub{font-size:11px;font-family:'DM Mono',monospace;color:#64748b;}
.vitals-strip{padding:16px 40px;border-bottom:1px solid #e2e8f0;display:flex;gap:0;background:#fff;}
.vital{flex:1;padding:0 16px 0 0;border-right:1px solid #f1f5f9;margin-right:16px;}
.vital:last-child{border-right:none;margin-right:0;}
.vital-lbl{font-size:9px;font-family:'DM Mono',monospace;color:#94a3b8;letter-spacing:.8px;text-transform:uppercase;margin-bottom:3px;}
.vital-val{font-size:18px;font-weight:700;color:#0f172a;font-family:'DM Sans',sans-serif;}
.vital-unit{font-size:11px;font-family:'DM Mono',monospace;color:#94a3b8;font-weight:400;}
.vital-flag{font-size:9px;font-family:'DM Mono',monospace;padding:2px 8px;border-radius:4px;margin-top:4px;display:inline-block;font-weight:600;}
.vf-normal{background:#f8fafc;color:#0f172a;border:1px solid #e2e8f0;}
.vf-high{background:#fef2f2;color:#991b1b;border:1px solid #fecaca;}
.vf-low{background:#eff6ff;color:#1e40af;border:1px solid #bfdbfe;}
.doc-body{padding:28px 40px 36px;display:flex;flex-direction:column;gap:24px;}
.section-head{display:flex;align-items:center;gap:12px;margin-bottom:10px;}
.section-label{font-size:10px;font-family:'DM Mono',monospace;color:#94a3b8;letter-spacing:1.2px;text-transform:uppercase;white-space:nowrap;font-weight:600;}
.section-line{flex:1;height:1px;background:#e2e8f0;}
.section-body{font-size:13.5px;color:#1e293b;line-height:1.75;}
.two-col{display:grid;grid-template-columns:1fr 1fr;gap:20px;}
.dx-box{background:#fafafc;border:1px solid #e2e8f0;border-left:4px solid #0f172a;padding:14px 18px;border-radius:12px;}
.dx-label{font-size:10px;font-family:'DM Mono',monospace;color:#0f172a;letter-spacing:.8px;text-transform:uppercase;margin-bottom:5px;font-weight:700;}
.dx-val{font-size:13.5px;color:#1e293b;line-height:1.65;font-weight:500;}
.fu-box{background:#fafafc;border:1px solid #e2e8f0;border-left:4px solid #475569;padding:14px 18px;border-radius:12px;}
.fu-label{font-size:10px;font-family:'DM Mono',monospace;color:#475569;letter-spacing:.8px;text-transform:uppercase;margin-bottom:5px;font-weight:700;}
.fu-val{font-size:13.5px;color:#1e293b;line-height:1.65;font-weight:500;}
.rx-table{width:100%;border-collapse:collapse;}
.rx-head td{font-size:10px;font-family:'DM Mono',monospace;color:#94a3b8;letter-spacing:.8px;text-transform:uppercase;padding:0 0 10px;border-bottom:1px solid #e2e8f0;font-weight:600;}
.rx-row td{padding:12px 0;border-bottom:1px solid #f1f5f9;}
.rx-row:last-child td{border-bottom:none;}
.rx-num{font-family:'DM Mono',monospace;font-size:11px;color:#94a3b8;padding-right:14px;vertical-align:top;padding-top:12px;width:28px;font-weight:600;}
.rx-name{font-weight:700;color:#0f172a;font-size:14px;}
.rx-dose{font-family:'DM Mono',monospace;font-size:11.5px;color:#64748b;margin-top:2px;}
.rx-route{font-size:10px;font-family:'DM Mono',monospace;padding:3px 10px;border-radius:6px;background:#f8fafc;border:1px solid #e2e8f0;color:#475569;white-space:nowrap;font-weight:600;}
.doc-footer{padding:20px 40px;border-top:1px solid #e2e8f0;background:#fafafc;display:flex;align-items:center;justify-content:space-between;}
.footer-sig-label{font-size:9px;font-family:'DM Mono',monospace;color:#94a3b8;letter-spacing:.8px;text-transform:uppercase;margin-bottom:8px;}
.footer-sig-line{width:180px;height:1px;background:#cbd5e1;margin-bottom:6px;}
.footer-sig-name{font-size:13px;font-weight:700;color:#0f172a;}
.footer-sig-qual{font-size:11px;font-family:'DM Mono',monospace;color:#64748b;}
.footer-note{font-size:9px;font-family:'DM Mono',monospace;color:#94a3b8;text-align:right;}
.footer-powered{margin-top:3px;font-size:9px;font-family:'DM Mono',monospace;color:#475569;text-align:right;}
.footer-powered span{color:#0f172a;font-weight:700;}
.hidden-vitals{display:none;}
@media print{body{background:#fff;padding:0;}.page{box-shadow:none;border-radius:0;border:none;}}
</style>
</head>
<body>
<div class="page">

  ${
    physicalLetterhead
      ? `<div class="doc-header-spacer" style="height: 180px;"></div>`
      : `
  <div class="doc-header">
    <div>
      <div class="doc-logo">Scribologist</div>
      <div class="doc-tagline">Clinical Patient Handout & Prescription</div>
    </div>
    <div class="doc-meta">
      <div class="doc-meta-row"><strong>Date</strong> &nbsp; ${formattedDate}</div>
      <div class="doc-meta-row"><strong>Time</strong> &nbsp; ${formattedTime}</div>
      <div class="doc-meta-row"><strong>Doctor</strong> &nbsp; ${escapeHtml(docName)}</div>
      <div class="doc-badge">Doctor Verified · DPDP Compliant</div>
    </div>
  </div>
  `
  }

  <div class="patient-strip" style="${physicalLetterhead ? 'background: transparent; border-top: 1px solid #e2e8f0;' : ''}">
    <div>
      <div class="pfield-lbl">Patient Name</div>
      <div class="pfield-val">${escapeHtml(patient.firstName || 'Unknown')} ${escapeHtml(patient.lastName || '')}</div>
      <div class="pfield-sub">Age: ${patient.age || 'N/A'}</div>
    </div>
    <div>
      <div class="pfield-lbl">Demographics</div>
      <div class="pfield-val">${patient.age || 'N/A'} yrs · ${escapeHtml(patient.gender || 'Not specified')}</div>
      <div class="pfield-sub">MRN: ${patient._id ? patient._id.slice(-6).toUpperCase() : 'N/A'}</div>
    </div>
    <div>
      <div class="pfield-lbl">Contact Details</div>
      <div class="pfield-val">${escapeHtml(patient.contactInfo?.phone || 'N/A')}</div>
      <div class="pfield-sub">${escapeHtml(patient.contactInfo?.email || 'N/A')}</div>
    </div>
  </div>

  ${
    sections.vitals && note.vitals && Object.keys(note.vitals).length > 0
      ? `
  <div class="vitals-strip">
    ${note.vitals.systolic ? `<div class="vital"><div class="vital-lbl">BP</div><div class="vital-val">${escapeHtml(note.vitals.systolic)}/<span class="vital-unit">${escapeHtml(note.vitals.diastolic || '0')} mmHg</span></div><div class="vital-flag ${note.vitals.systolic > 130 ? 'vf-high' : 'vf-normal'}">${note.vitals.systolic > 130 ? 'Elevated' : 'Normal'}</div></div>` : '<div class="vital hidden-vitals"></div>'}
    ${note.vitals.hr ? `<div class="vital"><div class="vital-lbl">Heart Rate</div><div class="vital-val">${escapeHtml(note.vitals.hr)}<span class="vital-unit"> bpm</span></div><div class="vital-flag vf-normal">Normal</div></div>` : '<div class="vital hidden-vitals"></div>'}
    ${note.vitals.spo2 ? `<div class="vital"><div class="vital-lbl">SpO2</div><div class="vital-val">${escapeHtml(note.vitals.spo2)}<span class="vital-unit">%</span></div><div class="vital-flag vf-normal">Normal</div></div>` : '<div class="vital hidden-vitals"></div>'}
    ${note.vitals.temp ? `<div class="vital"><div class="vital-lbl">Temp</div><div class="vital-val">${escapeHtml(note.vitals.temp)}<span class="vital-unit">°F</span></div><div class="vital-flag vf-normal">Normal</div></div>` : '<div class="vital hidden-vitals"></div>'}
    ${note.vitals.weight ? `<div class="vital"><div class="vital-lbl">Weight</div><div class="vital-val">${escapeHtml(note.vitals.weight)}<span class="vital-unit"> kg</span></div><div class="vital-flag vf-normal">Recorded</div></div>` : '<div class="vital hidden-vitals"></div>'}
  </div>
      `
      : ''
  }

  <div class="doc-body">

    ${
      sections.notes && note.notes
        ? `<div class="section">
      <div class="section-head"><div class="section-label">Clinical Summary</div><div class="section-line"></div></div>
      <div class="section-body">${escapeHtml(note.notes)}</div>
    </div>`
        : ''
    }

    ${
      sections.chief_complaint && note.chief_complaint
        ? `<div class="section">
      <div class="section-head"><div class="section-label">Chief Complaint</div><div class="section-line"></div></div>
      <div class="section-body">${escapeHtml(note.chief_complaint)}</div>
    </div>`
        : ''
    }

    ${
      sections.history && note.history
        ? `<div class="section">
      <div class="section-head"><div class="section-label">Clinical History</div><div class="section-line"></div></div>
      <div class="section-body">${escapeHtml(note.history)}</div>
    </div>`
        : ''
    }

    ${
      sections.examination && note.examination
        ? `<div class="section">
      <div class="section-head"><div class="section-label">Physical Examination</div><div class="section-line"></div></div>
      <div class="section-body">${escapeHtml(note.examination)}</div>
    </div>`
        : ''
    }

    ${
      (sections.diagnosis && note.diagnosis) || (sections.followup && note.followup)
        ? `<div class="two-col">
      ${
        sections.diagnosis && note.diagnosis
          ? `<div class="dx-box">
        <div class="dx-label">Clinical Diagnosis</div>
        <div class="dx-val">${escapeHtml(note.diagnosis)}</div>
      </div>`
          : ''
      }
      ${
        sections.followup && note.followup
          ? `<div class="fu-box">
        <div class="fu-label">Follow-up & Instructions</div>
        <div class="fu-val">${escapeHtml(note.followup)}</div>
      </div>`
          : ''
      }
    </div>`
        : ''
    }

    ${
      sections.prescription && prescriptionRows
        ? `<div class="section">
      <div class="section-head"><div class="section-label">Rx Prescribed Medications</div><div class="section-line"></div></div>
      <table class="rx-table">
        <tr class="rx-head">
          <td style="width:28px;">#</td>
          <td>Medication & Dosage</td>
          <td style="text-align:right;">Route</td>
        </tr>
        ${prescriptionRows}
      </table>
    </div>`
        : ''
    }

    ${exercisesSection}

  </div>

  ${
    physicalLetterhead
      ? ''
      : `
  <div class="doc-footer">
    <div>
      <div class="footer-sig-label">Attending Physician Approval</div>
      <div class="footer-sig-line"></div>
      <div class="footer-sig-name">${escapeHtml(docName)}</div>
      <div class="footer-sig-qual">${escapeHtml(docQual)}</div>
    </div>
    <div style="text-align:right;">
      <div class="footer-note">Issued: ${formattedDate}</div>
      <div class="footer-powered">Digitally compiled by <span>Scribologist AI</span></div>
    </div>
  </div>
  `
  }

</div>
</body>
</html>`;

  return html;
}

/**
 * Download HTML as PDF using iframe print strategy
 */
export async function downloadPDFFromHTML(htmlContent, filename = 'clinical-note.pdf') {
  try {
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    
    const doc = iframe.contentDocument;
    doc.open();
    doc.write(htmlContent);
    doc.close();
    
    const printDoc = () => {
      iframe.contentWindow.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    };

    // Wait for all images (like the QR code) to load before initiating the print dialog
    const images = iframe.contentWindow.document.querySelectorAll('img');
    if (images.length === 0) {
      setTimeout(printDoc, 500);
    } else {
      let loadedCount = 0;
      const onImageLoad = () => {
        loadedCount++;
        if (loadedCount === images.length) {
          setTimeout(printDoc, 200);
        }
      };
      
      images.forEach((img) => {
        if (img.complete) {
          onImageLoad();
        } else {
          img.addEventListener('load', onImageLoad);
          img.addEventListener('error', onImageLoad); // don't hang print if an image fails
        }
      });
      
      // Safety fallback timeout in case load events fail to trigger
      setTimeout(printDoc, 2500);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Failed to generate PDF:', error);
    return { success: false, error };
  }
}
