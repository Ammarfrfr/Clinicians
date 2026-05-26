import { v2 as cloudinary } from 'cloudinary';
import { asyncHandler } from '../Utils/asyncHandler.js';
import { ApiError } from '../Utils/ApiError.js';
import { ApiResponse } from '../Utils/ApiResponse.js';

/**
 * Generate the prescription HTML (server-side version of generateClinicalNotePDF).
 * Kept minimal and self-contained — no frontend dependencies.
 */
function generatePrescriptionHTML(note, patient, doctor) {
  const escapeHtml = (text) => {
    if (!text) return '';
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  };

  const docName = doctor?.name || 'Dr. Clinician';
  const docQual = doctor?.qualification || 'MBBS';
  const docHospital = doctor?.hospital || '';
  const patientName = `${patient?.firstName || 'Patient'} ${patient?.lastName || ''}`.trim();
  const now = new Date();
  const formattedDate = now.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  const rxArray = Array.isArray(note?.prescription) ? note.prescription : [];
  const rxRows = rxArray.map((med, idx) => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #f0ede4;font-family:'DM Mono',monospace;font-size:11px;color:#b0ac9f;width:30px;">${String(idx + 1).padStart(2, '0')}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f0ede4;">
        <div style="font-weight:500;color:#0c0c0b;font-size:14px;">${escapeHtml(med.drug || 'Unknown')}</div>
        <div style="font-family:'DM Mono',monospace;font-size:11px;color:#6a6860;margin-top:2px;">${escapeHtml(med.dose || '')}${med.frequency ? ' — ' + escapeHtml(med.frequency) : ''}</div>
      </td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Prescription - ${escapeHtml(patientName)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0;}
body{background:#f8f6f1;font-family:'DM Sans',sans-serif;padding:24px;display:flex;justify-content:center;min-height:100vh;}
.page{width:100%;max-width:600px;background:#fff;border-radius:12px;overflow:hidden;font-size:14px;line-height:1.6;color:#1a1a18;box-shadow:0 4px 24px rgba(0,0,0,0.06);}
.header{padding:24px 28px 18px;border-bottom:2px solid #0c0c0b;display:flex;align-items:flex-start;justify-content:space-between;}
.logo{font-family:'Instrument Serif',serif;font-size:24px;color:#0c0c0b;font-weight:600;}
.logo span{color:#0ea5a0;}
.tagline{font-size:9px;font-family:'DM Mono',monospace;color:#b0ac9f;letter-spacing:1.2px;text-transform:uppercase;margin-top:3px;}
.meta{text-align:right;font-size:11px;font-family:'DM Mono',monospace;color:#6a6860;}
.meta strong{color:#0c0c0b;}
.badge{display:inline-block;margin-top:6px;font-size:9px;font-family:'DM Mono',monospace;padding:3px 10px;border-radius:4px;background:#e6f6f5;border:1px solid #b2e0dd;color:#0b8480;letter-spacing:.5px;text-transform:uppercase;}
.patient-bar{background:#faf9f6;border-bottom:1px solid #f0ede4;padding:14px 28px;display:flex;gap:24px;flex-wrap:wrap;}
.pf{flex:1;min-width:120px;}
.pf-label{font-size:9px;font-family:'DM Mono',monospace;color:#b0ac9f;letter-spacing:.8px;text-transform:uppercase;margin-bottom:3px;}
.pf-value{font-size:13px;font-weight:500;color:#0c0c0b;}
.body{padding:20px 28px 28px;}
.section{margin-bottom:18px;}
.section-title{font-size:9px;font-family:'DM Mono',monospace;color:#b0ac9f;letter-spacing:1.2px;text-transform:uppercase;margin-bottom:8px;display:flex;align-items:center;gap:10px;}
.section-title::after{content:'';flex:1;height:1px;background:#f0ede4;}
.section-text{font-size:13px;color:#1a1a18;line-height:1.75;}
.rx-table{width:100%;border-collapse:collapse;margin-top:4px;}
.dx-box{background:#faf9f6;border:1px solid #f0ede4;border-left:3px solid #0ea5a0;padding:12px 14px;border-radius:6px;margin-bottom:12px;}
.dx-label{font-size:9px;font-family:'DM Mono',monospace;color:#0b8480;letter-spacing:.8px;text-transform:uppercase;margin-bottom:4px;}
.fu-box{background:#fef9ee;border:1px solid #e8d4a0;border-left:3px solid #8a5c00;padding:12px 14px;border-radius:6px;}
.fu-label{font-size:9px;font-family:'DM Mono',monospace;color:#8a5c00;letter-spacing:.8px;text-transform:uppercase;margin-bottom:4px;}
.footer{padding:16px 28px;border-top:1px solid #f0ede4;background:#faf9f6;display:flex;align-items:center;justify-content:space-between;}
.sig-label{font-size:9px;font-family:'DM Mono',monospace;color:#b0ac9f;letter-spacing:.8px;text-transform:uppercase;margin-bottom:6px;}
.sig-line{width:140px;height:1px;background:#d4d0c7;margin-bottom:4px;}
.sig-name{font-size:12px;font-weight:500;color:#0c0c0b;}
.sig-qual{font-size:10px;font-family:'DM Mono',monospace;color:#6a6860;}
.powered{font-size:8px;font-family:'DM Mono',monospace;color:#b0ac9f;text-align:right;}
.powered span{color:#0ea5a0;}
@media print{body{background:#fff;padding:0;}.page{box-shadow:none;border-radius:0;}}
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div>
      <div class="logo">Qa<span>lam</span></div>
      <div class="tagline">AI Medical Scribe · Prescription</div>
    </div>
    <div class="meta">
      <div><strong>Date</strong> &nbsp; ${formattedDate}</div>
      <div><strong>Doctor</strong> &nbsp; ${escapeHtml(docName)}</div>
      ${docHospital ? `<div>${escapeHtml(docHospital)}</div>` : ''}
      <div class="badge">AI Generated · Doctor Reviewed</div>
    </div>
  </div>

  <div class="patient-bar">
    <div class="pf">
      <div class="pf-label">Patient</div>
      <div class="pf-value">${escapeHtml(patientName)}</div>
    </div>
    <div class="pf">
      <div class="pf-label">Age / Gender</div>
      <div class="pf-value">${patient?.age || 'N/A'} yrs · ${escapeHtml(patient?.gender || 'N/A')}</div>
    </div>
    <div class="pf">
      <div class="pf-label">Contact</div>
      <div class="pf-value">${escapeHtml(patient?.contactInfo?.phone || 'N/A')}</div>
    </div>
  </div>

  <div class="body">
    ${note?.diagnosis ? `
    <div class="dx-box">
      <div class="dx-label">Diagnosis</div>
      <div class="section-text">${escapeHtml(note.diagnosis)}</div>
    </div>` : ''}

    ${rxRows ? `
    <div class="section">
      <div class="section-title">Prescription</div>
      <table class="rx-table">${rxRows}</table>
    </div>` : ''}

    ${note?.followup ? `
    <div class="fu-box">
      <div class="fu-label">Follow-up Instructions</div>
      <div class="section-text">${escapeHtml(note.followup)}</div>
    </div>` : ''}
  </div>

  <div class="footer">
    <div>
      <div class="sig-label">Doctor's Signature</div>
      <div class="sig-line"></div>
      <div class="sig-name">${escapeHtml(docName)}</div>
      <div class="sig-qual">${escapeHtml(docQual)}</div>
    </div>
    <div>
      <div class="powered">Powered by <span>Qalam AI</span></div>
    </div>
  </div>
</div>
</body>
</html>`;
}

/**
 * POST /api/share/prescription
 *
 * Generates a beautiful prescription HTML, uploads it to Cloudinary
 * as a raw HTML file, and returns the public URL to share via WhatsApp.
 */
export const generateShareableLink = asyncHandler(async (req, res) => {
  const { clinicalNote, patient, doctor } = req.body;

  if (!clinicalNote) {
    throw new ApiError(400, 'No clinical note provided');
  }

  // Generate the HTML
  const html = generatePrescriptionHTML(clinicalNote, patient, doctor);
  const htmlBuffer = Buffer.from(html, 'utf-8');

  // Upload to Cloudinary as raw HTML
  const timestamp = Date.now();
  const patientSlug = (patient?.firstName || 'patient').toLowerCase().replace(/\s+/g, '_');
  const publicId = `qalam_prescriptions/${req.user._id}/${patientSlug}_${timestamp}`;

  try {
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'raw',
          public_id: publicId,
          format: 'html',
          type: 'upload',
          access_mode: 'public',
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
      uploadStream.end(htmlBuffer);
    });

    return res.status(200).json(
      new ApiResponse(200, {
        url: result.secure_url,
        publicId: result.public_id,
      }, 'Shareable prescription link generated')
    );
  } catch (err) {
    console.error('Cloudinary upload error:', err);
    throw new ApiError(500, `Failed to generate shareable link: ${err.message}`);
  }
});
