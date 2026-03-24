export function generateClinicalNotePDF(note, patient = {}, doctor = {}) {
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

  const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Qalam Clinical Note - ${escapeHtml(patient.firstName || 'Patient')} ${escapeHtml(patient.lastName || '')}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
body{background:#e8e5de;font-family:'DM Sans',sans-serif;padding:40px;display:flex;justify-content:center;}
.page{width:720px;background:#fff;border-radius:4px;overflow:hidden;font-size:13px;line-height:1.6;color:#1a1a18;box-shadow:0 4px 24px rgba(0,0,0,0.08);}
.doc-header{padding:28px 36px 20px;border-bottom:2px solid #0c0c0b;display:flex;align-items:flex-start;justify-content:space-between;}
.doc-logo{font-family:'Instrument Serif',serif;font-size:22px;color:#0c0c0b;font-weight:600;}
.doc-logo span{color:#1a7a4a;}
.doc-tagline{font-size:9px;font-family:'DM Mono',monospace;color:#b0ac9f;letter-spacing:1px;text-transform:uppercase;margin-top:3px;}
.doc-meta{text-align:right;}
.doc-meta-row{font-size:10px;font-family:'DM Mono',monospace;color:#6a6860;margin-bottom:2px;}
.doc-meta-row strong{color:#0c0c0b;}
.doc-badge{display:inline-block;margin-top:6px;font-size:9px;font-family:'DM Mono',monospace;padding:3px 10px;border-radius:3px;background:#edf5f0;border:1px solid #c2ddd0;color:#1a7a4a;letter-spacing:.5px;text-transform:uppercase;}
.patient-strip{background:#faf9f6;border-bottom:1px solid #e8e5de;padding:14px 36px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;}
.pfield-lbl{font-size:9px;font-family:'DM Mono',monospace;color:#b0ac9f;letter-spacing:.8px;text-transform:uppercase;margin-bottom:3px;}
.pfield-val{font-size:13px;font-weight:500;color:#0c0c0b;}
.pfield-sub{font-size:10px;font-family:'DM Mono',monospace;color:#6a6860;}
.vitals-strip{padding:14px 36px;border-bottom:1px solid #e8e5de;display:flex;gap:0;}
.vital{flex:1;padding:0 16px 0 0;border-right:1px solid #e8e5de;margin-right:16px;}
.vital:last-child{border-right:none;margin-right:0;}
.vital-lbl{font-size:8px;font-family:'DM Mono',monospace;color:#b0ac9f;letter-spacing:.8px;text-transform:uppercase;margin-bottom:3px;}
.vital-val{font-size:16px;font-family:'Instrument Serif',serif;color:#0c0c0b;}
.vital-unit{font-size:10px;font-family:'DM Mono',monospace;color:#b0ac9f;}
.vital-flag{font-size:8px;font-family:'DM Mono',monospace;padding:2px 6px;border-radius:2px;margin-top:3px;display:inline-block;}
.vf-normal{background:#edf5f0;color:#1a7a4a;}
.vf-high{background:#fdf0ee;color:#c0392b;}
.vf-low{background:#e3f2fd;color:#1565c0;}
.doc-body{padding:24px 36px 32px;display:flex;flex-direction:column;gap:20px;}
.section-head{display:flex;align-items:center;gap:10px;margin-bottom:9px;}
.section-label{font-size:9px;font-family:'DM Mono',monospace;color:#b0ac9f;letter-spacing:1.2px;text-transform:uppercase;white-space:nowrap;}
.section-line{flex:1;height:1px;background:#e8e5de;}
.section-body{font-size:13px;color:#1a1a18;line-height:1.75;}
.two-col{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
.dx-box{background:#faf9f6;border:1px solid #e8e5de;border-left:3px solid #1a7a4a;padding:12px 14px;}
.dx-label{font-size:9px;font-family:'DM Mono',monospace;color:#1a7a4a;letter-spacing:.8px;text-transform:uppercase;margin-bottom:5px;}
.dx-val{font-size:13px;color:#0c0c0b;line-height:1.65;}
.fu-box{background:#fdf6e8;border:1px solid #e8d4a0;border-left:3px solid #8a5c00;padding:12px 14px;}
.fu-label{font-size:9px;font-family:'DM Mono',monospace;color:#8a5c00;letter-spacing:.8px;text-transform:uppercase;margin-bottom:5px;}
.fu-val{font-size:13px;color:#0c0c0b;line-height:1.65;}
.rx-table{width:100%;border-collapse:collapse;}
.rx-head td{font-size:9px;font-family:'DM Mono',monospace;color:#b0ac9f;letter-spacing:.8px;text-transform:uppercase;padding:0 0 8px;border-bottom:1px solid #e8e5de;}
.rx-row td{padding:9px 0;border-bottom:1px solid #f5f3ee;}
.rx-row:last-child td{border-bottom:none;}
.rx-num{font-family:'DM Mono',monospace;font-size:10px;color:#b0ac9f;padding-right:14px;vertical-align:top;padding-top:11px;width:28px;}
.rx-name{font-weight:500;color:#0c0c0b;font-size:13px;}
.rx-dose{font-family:'DM Mono',monospace;font-size:11px;color:#6a6860;margin-top:2px;}
.rx-route{font-size:9px;font-family:'DM Mono',monospace;padding:2px 8px;border-radius:3px;background:#faf9f6;border:1px solid #e8e5de;color:#6a6860;white-space:nowrap;}
.doc-footer{padding:16px 36px;border-top:1px solid #e8e5de;background:#faf9f6;display:flex;align-items:center;justify-content:space-between;}
.footer-sig-label{font-size:9px;font-family:'DM Mono',monospace;color:#b0ac9f;letter-spacing:.8px;text-transform:uppercase;margin-bottom:6px;}
.footer-sig-line{width:160px;height:1px;background:#d4d0c7;margin-bottom:4px;}
.footer-sig-name{font-size:12px;font-weight:500;color:#0c0c0b;}
.footer-sig-qual{font-size:10px;font-family:'DM Mono',monospace;color:#6a6860;}
.footer-qr{width:54px;height:54px;background:#f5f3ee;border:1px solid #e8e5de;border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:8px;font-family:'DM Mono',monospace;color:#b0ac9f;text-align:center;line-height:1.5;margin-left:auto;margin-bottom:5px;}
.footer-note{font-size:8px;font-family:'DM Mono',monospace;color:#b0ac9f;text-align:right;}
.footer-powered{margin-top:2px;font-size:8px;font-family:'DM Mono',monospace;color:#c2ddd0;text-align:right;}
.footer-powered span{color:#1a7a4a;}
.hidden-vitals{display:none;}
@media print{body{background:#fff;padding:0;}.page{box-shadow:none;border-radius:0;}}
</style>
</head>
<body>
<div class="page">

  <div class="doc-header">
    <div>
      <div class="doc-logo">Qalam<span>.</span></div>
      <div class="doc-tagline">AI Medical Scribe · Clinical Note</div>
    </div>
    <div class="doc-meta">
      <div class="doc-meta-row"><strong>Date</strong> &nbsp; ${formattedDate}</div>
      <div class="doc-meta-row"><strong>Time</strong> &nbsp; ${formattedTime}</div>
      <div class="doc-meta-row"><strong>Doctor</strong> &nbsp; ${escapeHtml(doctor.name || 'Dr. [Name]')}</div>
      <div class="doc-badge">AI Generated · Doctor Reviewed</div>
    </div>
  </div>

  <div class="patient-strip">
    <div>
      <div class="pfield-lbl">Patient</div>
      <div class="pfield-val">${escapeHtml(patient.firstName || 'Unknown')} ${escapeHtml(patient.lastName || '')}</div>
      <div class="pfield-sub">Age: ${patient.age || 'N/A'}</div>
    </div>
    <div>
      <div class="pfield-lbl">Demographics</div>
      <div class="pfield-val">${patient.age || 'N/A'} years · ${escapeHtml(patient.gender || 'Not specified')}</div>
      <div class="pfield-sub">MRN: ${patient._id ? patient._id.slice(-6).toUpperCase() : 'N/A'}</div>
    </div>
    <div>
      <div class="pfield-lbl">Contact</div>
      <div class="pfield-val">${escapeHtml(patient.contactInfo?.phone || 'N/A')}</div>
      <div class="pfield-sub">${escapeHtml(patient.contactInfo?.email || 'N/A')}</div>
    </div>
  </div>

  ${
    note.vitals && Object.keys(note.vitals).length > 0
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
      note.chief_complaint
        ? `<div class="section">
      <div class="section-head"><div class="section-label">Chief Complaint</div><div class="section-line"></div></div>
      <div class="section-body">${escapeHtml(note.chief_complaint)}</div>
    </div>`
        : ''
    }

    ${
      note.history
        ? `<div class="section">
      <div class="section-head"><div class="section-label">History</div><div class="section-line"></div></div>
      <div class="section-body">${escapeHtml(note.history)}</div>
    </div>`
        : ''
    }

    ${
      note.examination
        ? `<div class="section">
      <div class="section-head"><div class="section-label">Examination</div><div class="section-line"></div></div>
      <div class="section-body">${escapeHtml(note.examination)}</div>
    </div>`
        : ''
    }

    ${
      note.diagnosis || note.followup
        ? `<div class="two-col">
      ${
        note.diagnosis
          ? `<div class="dx-box">
        <div class="dx-label">Diagnosis</div>
        <div class="dx-val">${escapeHtml(note.diagnosis)}</div>
      </div>`
          : ''
      }
      ${
        note.followup
          ? `<div class="fu-box">
        <div class="fu-label">Follow-up</div>
        <div class="fu-val">${escapeHtml(note.followup)}</div>
      </div>`
          : ''
      }
    </div>`
        : ''
    }

    ${
      prescriptionRows
        ? `<div class="section">
      <div class="section-head"><div class="section-label">Prescription</div><div class="section-line"></div></div>
      <table class="rx-table">
        <tr class="rx-head">
          <td style="width:28px;"></td>
          <td>Drug</td>
          <td style="text-align:right;">Route</td>
        </tr>
        ${prescriptionRows}
      </table>
    </div>`
        : ''
    }

  </div>

  <div class="doc-footer">
    <div>
      <div class="footer-sig-label">Doctor's Approval</div>
      <div class="footer-sig-line"></div>
      <div class="footer-sig-name">${escapeHtml(doctor.name || 'Dr. [Name]')}</div>
      <div class="footer-sig-qual">${escapeHtml(doctor.qualification || 'MBBS')}</div>
    </div>
    <div style="text-align:right;">
      <div class="footer-note">Generated: ${formattedDate}</div>
      <div class="footer-powered">Powered by <span>Qalam AI</span> · Doctor Reviewed</div>
    </div>
  </div>

</div>
</body>
</html>`;

  return html;
}

/**
 * Download HTML as PDF using html2pdf library
 */
export async function downloadPDFFromHTML(htmlContent, filename = 'clinical-note.pdf') {
  try {
    // Create a blob from the HTML
    const blob = new Blob([htmlContent], { type: 'text/html' });
    
    // Create an iframe to print the HTML
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    
    const doc = iframe.contentDocument;
    doc.open();
    doc.write(htmlContent);
    doc.close();
    
    // Wait for fonts to load and then print
    setTimeout(() => {
      iframe.contentWindow.print();
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    }, 500);
    
    return { success: true };
  } catch (error) {
    console.error('Failed to generate PDF:', error);
    return { success: false, error };
  }
}
