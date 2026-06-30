import { v2 as cloudinary } from 'cloudinary';
import { asyncHandler } from '../Utils/asyncHandler.js';
import { ApiError } from '../Utils/ApiError.js';
import { ApiResponse } from '../Utils/ApiResponse.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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

  const host = req.get('host') || 'localhost:7001';
  // Generate the HTML
  const html = generatePrescriptionHTML(clinicalNote, patient, doctor, host);
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

  // Generate HTML page with CSS animations
  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Rehab & Exercise Routine</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #faf9f5; font-family: 'DM Sans', sans-serif; color: #1a1a18; padding: 16px; display: flex; justify-content: center; min-height: 100vh; }
  .container { width: 100%; max-width: 500px; display: flex; flex-direction: column; gap: 16px; }
  .header { text-align: center; padding: 24px 16px 12px; }
  .logo { font-size: 20px; font-weight: 700; color: #0ea5a0; letter-spacing: 0.5px; }
  .logo span { color: #1a1a18; }
  .title { font-size: 22px; font-weight: 700; color: #0c0c0b; margin-top: 6px; }
  .subtitle { font-size: 12px; font-family: 'DM Mono', monospace; color: #b0ac9f; text-transform: uppercase; margin-top: 2px; }
  .card { background: #fff; border-radius: 16px; border: 1px solid #f0ede4; box-shadow: 0 4px 16px rgba(0,0,0,0.03); overflow: hidden; padding: 20px; display: flex; flex-direction: column; gap: 14px; }
  .card-header { display: flex; justify-content: space-between; align-items: flex-start; }
  .ex-tag { font-size: 9px; font-family: 'DM Mono', monospace; padding: 3px 8px; border-radius: 4px; background: #e6f6f5; border: 1px solid #b2e0dd; color: #0b8480; text-transform: uppercase; font-weight: 500; }
  .ex-name { font-size: 16px; font-weight: 600; color: #0c0c0b; margin-top: 4px; }
  .ex-instructions { font-size: 13px; color: #6a6860; line-height: 1.6; }
  
  /* Visual Animation Box */
  .animation-box { width: 100%; height: 160px; background: #faf9f6; border-radius: 12px; border: 1px dashed #e8e5de; display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden; }
  
  /* CSS Animations for different categories */
  .anim-knee { position: relative; width: 120px; height: 120px; }
  .anim-knee .thigh { position: absolute; width: 50px; height: 8px; background: #b0ac9f; border-radius: 4px; left: 25px; top: 55px; transform: rotate(15deg); }
  .anim-knee .shin { position: absolute; width: 45px; height: 8px; background: #0ea5a0; border-radius: 4px; left: 70px; top: 68px; transform-origin: left center; animation: kneeBend 3s infinite ease-in-out; }
  .anim-knee .joint { position: absolute; width: 12px; height: 12px; background: #1a1a18; border-radius: 50%; left: 68px; top: 63px; }
  
  @keyframes kneeBend {
    0%, 100% { transform: rotate(0deg); }
    50% { transform: rotate(-75deg); }
  }

  .anim-hip { position: relative; width: 120px; height: 120px; }
  .anim-hip .pelvis { position: absolute; width: 18px; height: 18px; background: #1a1a18; border-radius: 50%; left: 30px; top: 50px; }
  .anim-hip .leg { position: absolute; width: 65px; height: 8px; background: #0ea5a0; border-radius: 4px; left: 40px; top: 55px; transform-origin: left center; animation: hipRaise 3s infinite ease-in-out; }
  
  @keyframes hipRaise {
    0%, 100% { transform: rotate(0deg); }
    50% { transform: rotate(-35deg); }
  }

  .anim-lowback { position: relative; width: 120px; height: 120px; display: flex; align-items: center; justify-content: center; }
  .anim-lowback svg { width: 100px; height: 80px; }
  .anim-lowback path { fill: none; stroke: #0ea5a0; stroke-width: 5; stroke-linecap: round; animation: backArch 3s infinite ease-in-out; }
  
  @keyframes backArch {
    0%, 100% { d: path("M 10 50 Q 50 50 90 50"); }
    50% { d: path("M 10 50 Q 50 20 90 50"); }
  }

  .anim-shoulder { position: relative; width: 120px; height: 120px; }
  .anim-shoulder .body-block { position: absolute; width: 24px; height: 50px; background: #e8e5de; border-radius: 4px; left: 35px; top: 35px; }
  .anim-shoulder .arm { position: absolute; width: 50px; height: 8px; background: #0ea5a0; border-radius: 4px; left: 45px; top: 40px; transform-origin: left center; animation: armSwing 3s infinite ease-in-out; }
  .anim-shoulder .joint { position: absolute; width: 10px; height: 10px; background: #1a1a18; border-radius: 50%; left: 40px; top: 39px; }
  
  @keyframes armSwing {
    0%, 100% { transform: rotate(0deg); }
    50% { transform: rotate(-90deg); }
  }

  .anim-neck { position: relative; width: 120px; height: 120px; }
  .anim-neck .chest { position: absolute; width: 45px; height: 25px; background: #e8e5de; border-radius: 4px; left: 38px; top: 70px; }
  .anim-neck .head { position: absolute; width: 26px; height: 26px; background: #0ea5a0; border-radius: 50%; left: 47px; top: 38px; transform-origin: center bottom; animation: headTilt 3s infinite ease-in-out; }
  
  @keyframes headTilt {
    0%, 100% { transform: rotate(0deg); }
    50% { transform: rotate(20deg); }
  }

  .anim-wrist { position: relative; width: 120px; height: 120px; }
  .anim-wrist .arm { position: absolute; width: 55px; height: 10px; background: #e8e5de; border-radius: 3px; left: 20px; top: 55px; }
  .anim-wrist .hand { position: absolute; width: 35px; height: 8px; background: #0ea5a0; border-radius: 3px; left: 72px; top: 56px; transform-origin: left center; animation: wristFlex 3s infinite ease-in-out; }
  
  @keyframes wristFlex {
    0%, 100% { transform: rotate(0deg); }
    50% { transform: rotate(45deg); }
  }

  .footer { text-align: center; padding: 24px 16px; font-size: 11px; font-family: 'DM Mono', monospace; color: #b0ac9f; }
  .footer span { color: #0ea5a0; font-weight: 500; }
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <div class="logo">Qa<span>lam Rehab</span></div>
    <div class="title">Prescribed Exercises</div>
    <div class="subtitle">Personalized Routine</div>
  </div>

  ${prescribedExercises.map(ex => {
    let animClass = 'anim-knee';
    let animHtml = '<div class="thigh"></div><div class="shin"></div><div class="joint"></div>';
    
    const cat = ex.category.toLowerCase();
    if (cat === 'hip') {
      animClass = 'anim-hip';
      animHtml = '<div class="pelvis"></div><div class="leg"></div>';
    } else if (cat === 'low back') {
      animClass = 'anim-lowback';
      animHtml = '<svg><path d="M 10 50 Q 50 50 90 50" /></svg>';
    } else if (cat === 'shoulder') {
      animClass = 'anim-shoulder';
      animHtml = '<div class="body-block"></div><div class="arm"></div><div class="joint"></div>';
    } else if (cat === 'neck') {
      animClass = 'anim-neck';
      animHtml = '<div class="chest"></div><div class="head"></div>';
    } else if (cat === 'wrist') {
      animClass = 'anim-wrist';
      animHtml = '<div class="arm"></div><div class="hand"></div>';
    }

    return `
  <div class="card">
    <div class="card-header">
      <div>
        <span class="ex-tag">${ex.category}</span>
        <h3 class="ex-name">${ex.name}</h3>
      </div>
    </div>
    
    <div class="animation-box">
      <div class="${animClass}">
        ${animHtml}
      </div>
    </div>

    <div class="ex-instructions">
      <strong>Instructions:</strong><br/>
      ${ex.instruction}
    </div>
  </div>`;
  }).join('')}

  <div class="footer">
    Powered by <span>Qalam AI Rehabilitation</span><br/>
    Consult with your doctor before starting any new routine.
  </div>
</div>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html');
  return res.status(200).send(htmlContent);
});
