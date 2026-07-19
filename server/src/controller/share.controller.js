import { v2 as cloudinary } from 'cloudinary';
import { asyncHandler } from '../Utils/asyncHandler.js';
import { ApiError } from '../Utils/ApiError.js';
import { ApiResponse } from '../Utils/ApiResponse.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getAnimationCSS, getExerciseSVG } from './exerciseAnimations.js';
import { getPhotoHTML } from './exercisePhotoMap.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Generate the prescription HTML (server-side version of generateClinicalNotePDF).
 * Kept minimal and self-contained — no frontend dependencies.
 */
function generatePrescriptionHTML(note, patient, doctor, host = 'localhost:7001') {
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

  const exArray = Array.isArray(note?.exercises) ? note.exercises : [];
  const exRows = exArray.map((ex, idx) => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #f0ede4;font-family:'DM Mono',monospace;font-size:11px;color:#b0ac9f;width:30px;">${String(idx + 1).padStart(2, '0')}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f0ede4;">
        <div style="font-weight:500;color:#0c0c0b;font-size:14px;">${escapeHtml(ex.name)}</div>
        <div style="font-family:'DM Mono',monospace;font-size:11px;color:#6a6860;margin-top:2px;">Sets/Reps: ${escapeHtml(ex.sets || '3')} x ${escapeHtml(ex.reps || '10')}${ex.frequency ? ' · ' + escapeHtml(ex.frequency) : ''}</div>
        <div style="font-size:12px;color:#6a6860;margin-top:4px;line-height:1.4;">${escapeHtml(ex.instruction)}</div>
      </td>
    </tr>
  `).join('');

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=70x70&data=${encodeURIComponent(`http://${host}/api/share/exercises?ids=${exArray.map(e => e.id).join(',')}`)}`;

  const exercisesSection = exArray.length > 0 ? `
    <div class="section">
      <div class="section-title">Exercises & Rehabilitation</div>
      <table class="rx-table" style="width:100%;border-collapse:collapse;margin-top:4px;">
        ${exRows}
      </table>
      <div style="margin-top: 14px; padding: 12px; background: #faf9f6; border-radius: 8px; border: 1px dashed #e8e5de; display: flex; align-items: center; gap: 12px;">
        <img src="${qrUrl}" style="width: 70px; height: 70px; border-radius: 4px;" alt="QR Code" />
        <div>
          <div style="font-size: 11px; font-weight: 600; color: #0c0c0b;">Scan to watch demonstrations</div>
          <div style="font-size: 10px; color: #b0ac9f; margin-top: 2px;">Open your phone camera to watch looping exercise animations.</div>
        </div>
      </div>
    </div>
  ` : '';

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

    ${exercisesSection}
  </div>

  <div class="footer">
    <div>
      <div class="sig-label">Doctor's Signature</div>
      <div class="sig-line"></div>
      <div class="sig-name">${escapeHtml(docName)}</div>
      <div class="sig-qual">${escapeHtml(docQual)}</div>
    </div>
    <div>
      <div class="powered">Powered by <span>Scribologist AI</span></div>
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

  const host = req.get('host') || 'localhost:7001';
  // Generate the HTML
  const html = generatePrescriptionHTML(clinicalNote, patient, doctor, host);
  const htmlBuffer = Buffer.from(html, 'utf-8');

  // Upload to Cloudinary as raw HTML
  const timestamp = Date.now();
  const patientSlug = (patient?.firstName || 'patient').toLowerCase().replace(/\s+/g, '_');
  const publicId = `scribologist_prescriptions/${req.user._id}/${patientSlug}_${timestamp}`;

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

/**
 * GET /api/share/exercises?ids=ex1,ex2
 * Serves a dynamic mobile web page demonstrating looping visual animations for prescribed exercises.
 */
export const getSharedExercisesPage = asyncHandler(async (req, res) => {
  const { ids } = req.query;
  if (!ids) {
    return res.status(400).send('<h1>No exercises prescribed</h1>');
  }

  const exerciseIds = ids.split(',').map(id => id.trim().toLowerCase());
  
  // Read database
  const dbPath = path.join(__dirname, '../data/exercises.json');
  let exercisesDb = [];
  try {
    const rawData = fs.readFileSync(dbPath, 'utf8');
    exercisesDb = JSON.parse(rawData);
  } catch (err) {
    console.error('Error reading exercises database:', err);
    return res.status(500).send('<h1>Internal Server Error</h1>');
  }

  // Filter exercises
  const prescribedExercises = exercisesDb.filter(ex => exerciseIds.includes(ex.id.toLowerCase()));

  if (prescribedExercises.length === 0) {
    return res.status(404).send('<h1>Prescribed exercises not found</h1>');
  }

  // Generate HTML page with CSS animations and photo toggles
  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Rehab & Exercise Routine — Scribologist</title>
<meta name="description" content="Your personalized rehabilitation exercise routine with visual demonstrations.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { 
    background: #f5f4f0; 
    font-family: 'DM Sans', sans-serif; 
    color: #1a1a18; 
    padding: 16px; 
    display: flex; 
    justify-content: center; 
    min-height: 100vh; 
  }
  .container { width: 100%; max-width: 500px; display: flex; flex-direction: column; gap: 16px; }
  
  .header { 
    text-align: center; 
    padding: 28px 16px 16px; 
    background: linear-gradient(135deg, #0ea5a0 0%, #0b8480 100%);
    border-radius: 20px;
    color: #fff;
    box-shadow: 0 8px 24px rgba(14,165,160,0.2);
  }
  .logo { font-size: 18px; font-weight: 700; letter-spacing: 0.5px; opacity: 0.9; }
  .title { font-size: 24px; font-weight: 700; margin-top: 6px; }
  .subtitle { 
    font-size: 11px; font-family: 'DM Mono', monospace; 
    opacity: 0.7; text-transform: uppercase; 
    margin-top: 4px; letter-spacing: 1px; 
  }
  .exercise-count {
    display: inline-block;
    margin-top: 10px;
    font-size: 10px;
    font-family: 'DM Mono', monospace;
    padding: 4px 12px;
    border-radius: 20px;
    background: rgba(255,255,255,0.2);
    backdrop-filter: blur(4px);
    letter-spacing: 0.5px;
  }
  
  .card { 
    background: #fff; 
    border-radius: 18px; 
    border: 1px solid #eeebe4; 
    box-shadow: 0 2px 12px rgba(0,0,0,0.04); 
    overflow: hidden; 
    padding: 0; 
    display: flex; 
    flex-direction: column; 
  }
  .card-body { padding: 20px; display: flex; flex-direction: column; gap: 14px; }
  .card-header { display: flex; justify-content: space-between; align-items: flex-start; }
  .ex-tag { 
    font-size: 9px; font-family: 'DM Mono', monospace; 
    padding: 3px 10px; border-radius: 20px; 
    background: #e6f6f5; border: 1px solid #b2e0dd; 
    color: #0b8480; text-transform: uppercase; font-weight: 500; 
    letter-spacing: 0.5px;
  }
  .ex-name { font-size: 17px; font-weight: 600; color: #0c0c0b; margin-top: 6px; line-height: 1.3; }
  .ex-instructions { font-size: 13px; color: #6a6860; line-height: 1.65; }
  .ex-instructions strong { color: #3a3834; font-weight: 600; }
  
  /* ═══ Animation Box ═══ */
  .animation-box { 
    display: flex; 
    align-items: center; 
    justify-content: center; 
    padding: 16px 12px; 
    background: linear-gradient(135deg, #faf9f5 0%, #f5f3ee 100%); 
    border-top: 1px solid #f0ede4;
    border-bottom: 1px solid #f0ede4;
  }
  .animation-box svg { 
    filter: drop-shadow(0 1px 3px rgba(0,0,0,0.06));
  }
  
  /* ═══ Photo Toggle (CSS-only) ═══ */
  .photo-toggle-section { padding: 0 20px 16px; }
  .photo-checkbox { display: none; }
  .photo-toggle-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 7px 14px;
    font-size: 11px;
    font-weight: 600;
    font-family: 'DM Sans', sans-serif;
    color: #0b8480;
    background: #e6f6f5;
    border: 1px solid #b2e0dd;
    border-radius: 20px;
    cursor: pointer;
    transition: all 0.2s ease;
    user-select: none;
  }
  .photo-toggle-btn:hover { background: #d0f0ee; }
  .photo-toggle-btn:active { transform: scale(0.97); }
  
  .photo-panel {
    max-height: 0;
    overflow: hidden;
    opacity: 0;
    transition: max-height 0.4s ease, opacity 0.3s ease, margin 0.3s ease;
    margin-top: 0;
  }
  .photo-checkbox:checked ~ .photo-panel {
    max-height: 500px;
    opacity: 1;
    margin-top: 12px;
  }
  .photo-checkbox:checked ~ .photo-toggle-btn {
    background: #0b8480;
    color: #fff;
    border-color: #0b8480;
  }
  
  .photo-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  .photo-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
  }
  .photo-card img {
    width: 100%;
    border-radius: 12px;
    border: 1px solid #eeebe4;
    object-fit: cover;
    aspect-ratio: 3/4;
    background: #f5f3ee;
  }
  .photo-label {
    font-size: 9px;
    font-family: 'DM Mono', monospace;
    color: #b0ac9f;
    text-transform: uppercase;
    letter-spacing: 0.8px;
  }
  .photo-note {
    margin-top: 8px;
    font-size: 10px;
    color: #b0ac9f;
    text-align: center;
    font-style: italic;
  }
  
  ${getAnimationCSS()}

  .footer { 
    text-align: center; padding: 28px 16px; 
    font-size: 11px; font-family: 'DM Mono', monospace; 
    color: #b0ac9f; line-height: 1.7;
  }
  .footer span { color: #0ea5a0; font-weight: 500; }
  .footer-disclaimer {
    margin-top: 8px;
    font-size: 9px;
    color: #d5d0c8;
  }
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <div class="logo">Scribologist Rehab</div>
    <div class="title">Your Exercise Routine</div>
    <div class="subtitle">Prescribed by Your Doctor</div>
    <div class="exercise-count">${prescribedExercises.length} exercise${prescribedExercises.length > 1 ? 's' : ''} prescribed</div>
  </div>

  ${prescribedExercises.map((ex, idx) => {
    const svgContent = getExerciseSVG(ex.id);
    const photoHTML = getPhotoHTML(ex.id);
    
    return `
  <div class="card">
    <div class="animation-box">
      ${svgContent}
    </div>
    <div class="card-body">
      <div class="card-header">
        <div>
          <span class="ex-tag">${ex.category}</span>
          <h3 class="ex-name">${ex.name}</h3>
        </div>
      </div>
      
      <div class="ex-instructions">
        <strong>How to do it:</strong><br/>
        ${ex.instruction}
      </div>
      
      ${photoHTML}
    </div>
  </div>`;
  }).join('')}

  <div class="footer">
    Powered by <span>Scribologist AI Rehabilitation</span><br/>
    <div class="footer-disclaimer">
      Always consult with your doctor before starting any new exercise routine.<br/>
      Exercise photos sourced from open-source databases (MIT license).
    </div>
  </div>
</div>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html');
  return res.status(200).send(htmlContent);
});

