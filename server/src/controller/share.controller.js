import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Custom 2D Character SVG Vector Renderer
 * Renders the character (Orange Hoodie #ea580c, Teal Trousers #0f766e, Dark Ponytail #374151, Brown Shoes #78350f)
 * performing physical therapy & rehabilitation exercises.
 */
function renderCharacterSVG(exerciseId, position, name, category) {
  const id = (exerciseId || '').toLowerCase();
  const cat = (category || '').toLowerCase();
  const isStart = position === 'start';

  const skin = "#fed7aa";
  const hair = "#374151";
  const hoodie = "#ea580c";
  const drawstrings = "#ffffff";
  const trousers = "#0f766e";
  const shoes = "#78350f";
  const blueMotion = "#2563eb";

  // 1. Short Arc Quads
  if (id.includes('short_arc_quads')) {
    return `<svg viewBox="0 0 220 140" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <rect width="220" height="140" rx="14" fill="#fafafc"/>
      <path d="M15 115 L205 115" stroke="#cbd5e1" stroke-width="3"/>
      <!-- Towel Roll -->
      <circle cx="110" cy="103" r="10" fill="#94a3b8"/>
      <!-- Head & Ponytail -->
      <circle cx="35" cy="100" r="12" fill="${skin}"/>
      <path d="M22 96 C20 85, 35 85, 38 92" stroke="${hair}" stroke-width="6" stroke-linecap="round" fill="none"/>
      <path d="M22 98 Q15 105 18 112" stroke="${hair}" stroke-width="5" stroke-linecap="round" fill="none"/>
      <!-- Orange Hoodie Torso -->
      <path d="M45 102 L95 102" stroke="${hoodie}" stroke-width="18" stroke-linecap="round"/>
      <path d="M48 102 L58 102" stroke="${drawstrings}" stroke-width="2"/>
      <!-- Teal Trousers & Legs -->
      <path d="M95 102 L110 98" stroke="${trousers}" stroke-width="14" stroke-linecap="round"/>
      <path d="M110 98 ${isStart ? 'L180 105' : 'L175 68'}" stroke="${trousers}" stroke-width="12" stroke-linecap="round"/>
      <!-- Brown Shoe -->
      <ellipse cx="${isStart ? '185' : '178'}" cy="${isStart ? '105' : '65'}" rx="7" ry="5" fill="${shoes}"/>
      <!-- Movement Arc -->
      ${!isStart ? `<path d="M160 100 Q175 90 174 72" stroke="${blueMotion}" stroke-width="2.5" stroke-dasharray="4" fill="none"/>` : ''}
      <text x="110" y="24" font-family="sans-serif" font-size="10" font-weight="800" fill="#0f172a" text-anchor="middle">${isStart ? 'START: Knee Rested on Bolster' : 'STEP 2: Extend Lower Leg Straight'}</text>
    </svg>`;
  }

  // 2. Straight Leg Raises
  if (id.includes('straight_leg_raises')) {
    return `<svg viewBox="0 0 220 140" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <rect width="220" height="140" rx="14" fill="#fafafc"/>
      <path d="M15 115 L205 115" stroke="#cbd5e1" stroke-width="3"/>
      <!-- Head & Ponytail -->
      <circle cx="35" cy="100" r="12" fill="${skin}"/>
      <path d="M22 96 C20 85, 35 85, 38 92" stroke="${hair}" stroke-width="6" stroke-linecap="round" fill="none"/>
      <!-- Torso -->
      <path d="M45 102 L95 102" stroke="${hoodie}" stroke-width="18" stroke-linecap="round"/>
      <!-- Bent Non-Target Leg -->
      <path d="M95 102 L120 82 L138 108" stroke="${trousers}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity="0.6"/>
      <!-- Target Straight Leg -->
      <path d="M95 102 ${isStart ? 'L180 105' : 'L168 62'}" stroke="${trousers}" stroke-width="12" stroke-linecap="round"/>
      <ellipse cx="${isStart ? '185' : '172'}" cy="${isStart ? '105' : '58'}" rx="7" ry="5" fill="${shoes}"/>
      ${!isStart ? `<path d="M155 100 Q170 85 168 66" stroke="${blueMotion}" stroke-width="2.5" stroke-dasharray="4" fill="none"/>` : ''}
      <text x="110" y="24" font-family="sans-serif" font-size="10" font-weight="800" fill="#0f172a" text-anchor="middle">${isStart ? 'START: Lie Flat, Opposite Knee Bent' : 'STEP 2: Raise Straight Leg 6-12 Inches'}</text>
    </svg>`;
  }

  // 3. Quad Sets & Ankle Pumps
  if (id.includes('quad_sets') || id.includes('ankle_pumps')) {
    return `<svg viewBox="0 0 220 140" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <rect width="220" height="140" rx="14" fill="#fafafc"/>
      <path d="M15 115 L205 115" stroke="#cbd5e1" stroke-width="3"/>
      <circle cx="35" cy="100" r="12" fill="${skin}"/>
      <path d="M22 96 C20 85, 35 85, 38 92" stroke="${hair}" stroke-width="6" stroke-linecap="round" fill="none"/>
      <path d="M45 102 L95 102" stroke="${hoodie}" stroke-width="18" stroke-linecap="round"/>
      <path d="M95 102 L180 102" stroke="${trousers}" stroke-width="12" stroke-linecap="round"/>
      <ellipse cx="185" cy="${isStart ? '100' : '94'}" rx="7" ry="9" fill="${shoes}"/>
      ${!isStart ? `<path d="M185 82 L185 92 M181 87 L185 92 L189 87" stroke="${blueMotion}" stroke-width="2.5" stroke-linecap="round"/>` : ''}
      <text x="110" y="24" font-family="sans-serif" font-size="10" font-weight="800" fill="#0f172a" text-anchor="middle">${isStart ? 'START: Leg Resting Flat' : 'STEP 2: Flex Ankle / Tighten Thigh'}</text>
    </svg>`;
  }

  // 4. Heel Slides & Knee Slides
  if (id.includes('heel_slides') || id.includes('knee_slides')) {
    return `<svg viewBox="0 0 220 140" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <rect width="220" height="140" rx="14" fill="#fafafc"/>
      <path d="M15 115 L205 115" stroke="#cbd5e1" stroke-width="3"/>
      <circle cx="35" cy="100" r="12" fill="${skin}"/>
      <path d="M22 96 C20 85, 35 85, 38 92" stroke="${hair}" stroke-width="6" stroke-linecap="round" fill="none"/>
      <path d="M45 102 L95 102" stroke="${hoodie}" stroke-width="18" stroke-linecap="round"/>
      <path d="M95 102 ${isStart ? 'L180 105' : 'L130 75 L145 108'}" stroke="${trousers}" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <ellipse cx="${isStart ? '185' : '148'}" cy="108" rx="7" ry="5" fill="${shoes}"/>
      ${!isStart ? `<path d="M175 105 L152 105 M158 101 L152 105 L158 109" stroke="${blueMotion}" stroke-width="2.5" stroke-linecap="round"/>` : ''}
      <text x="110" y="24" font-family="sans-serif" font-size="10" font-weight="800" fill="#0f172a" text-anchor="middle">${isStart ? 'START: Leg Flat on Bed' : 'STEP 2: Slide Heel Backward'}</text>
    </svg>`;
  }

  // 5. Bridging
  if (id.includes('bridging') || id.includes('bridge')) {
    return `<svg viewBox="0 0 220 140" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <rect width="220" height="140" rx="14" fill="#fafafc"/>
      <path d="M15 115 L205 115" stroke="#cbd5e1" stroke-width="3"/>
      <circle cx="35" cy="105" r="12" fill="${skin}"/>
      <path d="M22 101 C20 90, 35 90, 38 97" stroke="${hair}" stroke-width="6" stroke-linecap="round" fill="none"/>
      <!-- Elevated Torso & Thighs -->
      <path d="M45 105 ${isStart ? 'L95 105 L135 75 L155 108' : 'L100 78 L140 78 L160 108'}" stroke="${hoodie}" stroke-width="18" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <path d="${isStart ? 'M95 105 L135 75 L155 108' : 'M100 78 L140 78 L160 108'}" stroke="${trousers}" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <ellipse cx="162" cy="108" rx="7" ry="5" fill="${shoes}"/>
      ${!isStart ? `<path d="M120 98 L120 84 M116 89 L120 84 L124 89" stroke="${blueMotion}" stroke-width="2.5" stroke-linecap="round"/>` : ''}
      <text x="110" y="24" font-family="sans-serif" font-size="10" font-weight="800" fill="#0f172a" text-anchor="middle">${isStart ? 'START: Knees Bent, Feet Flat' : 'STEP 2: Lift Hips Off Bed'}</text>
    </svg>`;
  }

  // 6. Long Arc Quads & Seated Exercises
  if (id.includes('long_arc_quads') || id.includes('sitting')) {
    return `<svg viewBox="0 0 220 140" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <rect width="220" height="140" rx="14" fill="#fafafc"/>
      <!-- Wooden Chair -->
      <path d="M75 55 L75 95 L105 95 M75 75 L105 75 L105 120 M75 75 L75 120" stroke="#94a3b8" stroke-width="4" stroke-linecap="round" fill="none"/>
      <!-- Seated Character -->
      <circle cx="70" cy="38" r="11" fill="${skin}"/>
      <path d="M58 32 C55 22, 70 22, 73 29" stroke="${hair}" stroke-width="6" stroke-linecap="round" fill="none"/>
      <path d="M60 48 L78 72 L105 72" stroke="${hoodie}" stroke-width="16" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <path d="M105 72 ${isStart ? 'L105 112' : 'L160 72'}" stroke="${trousers}" stroke-width="12" stroke-linecap="round"/>
      <ellipse cx="${isStart ? '105' : '165'}" cy="${isStart ? '115' : '72'}" rx="7" ry="5" fill="${shoes}"/>
      ${!isStart ? `<path d="M120 100 Q145 98 152 78" stroke="${blueMotion}" stroke-width="2.5" stroke-dasharray="4" fill="none"/>` : ''}
      <text x="110" y="24" font-family="sans-serif" font-size="10" font-weight="800" fill="#0f172a" text-anchor="middle">${isStart ? 'START: Seated with Knee Bent 90°' : 'STEP 2: Extend Lower Leg Horizontal'}</text>
    </svg>`;
  }

  // 7. Circular Pendulum & Leaning Exercises
  if (id.includes('circular_pendulum') || id.includes('pendulum')) {
    return `<svg viewBox="0 0 220 140" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <rect width="220" height="140" rx="14" fill="#fafafc"/>
      <path d="M40 80 L90 80 M65 80 L65 125" stroke="#cbd5e1" stroke-width="4"/>
      <!-- Character Leaning -->
      <circle cx="115" cy="55" r="11" fill="${skin}"/>
      <path d="M105 50 C100 40, 118 40, 120 47" stroke="${hair}" stroke-width="6" stroke-linecap="round" fill="none"/>
      <path d="M140 120 L140 80 L90 68" stroke="${trousers}" stroke-width="12" stroke-linecap="round" fill="none"/>
      <path d="M140 80 L90 68" stroke="${hoodie}" stroke-width="16" stroke-linecap="round" fill="none"/>
      <path d="M90 68 ${isStart ? 'L90 108' : 'L85 110'}" stroke="${skin}" stroke-width="5" stroke-linecap="round"/>
      <ellipse cx="140" cy="122" rx="7" ry="5" fill="${shoes}"/>
      ${!isStart ? `<ellipse cx="85" cy="110" rx="14" ry="6" stroke="${blueMotion}" stroke-width="2" stroke-dasharray="3" fill="none"/>` : ''}
      <text x="110" y="24" font-family="sans-serif" font-size="10" font-weight="800" fill="#0f172a" text-anchor="middle">${isStart ? 'START: Lean Forward, Arm Hanging' : 'STEP 2: Swing Arm in Gentle Circles'}</text>
    </svg>`;
  }

  // 8. Cat and Dog Stretch & All Fours
  if (id.includes('cat') || id.includes('dog') || id.includes('bird_dog')) {
    return `<svg viewBox="0 0 220 140" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <rect width="220" height="140" rx="14" fill="#fafafc"/>
      <path d="M15 118 L205 118" stroke="#cbd5e1" stroke-width="3"/>
      <!-- Hands & Knees -->
      <path d="M60 118 L60 85 M160 118 L160 85" stroke="${skin}" stroke-width="6" stroke-linecap="round"/>
      <!-- Spine Curve -->
      <path d="${isStart ? 'M60 85 Q110 50 160 85' : 'M60 82 Q110 105 160 82'}" stroke="${hoodie}" stroke-width="18" stroke-linecap="round" fill="none"/>
      <path d="${isStart ? 'M120 72 Q145 62 160 85' : 'M120 95 Q145 92 160 82'}" stroke="${trousers}" stroke-width="12" stroke-linecap="round" fill="none"/>
      <circle cx="50" cy="${isStart ? '88' : '75'}" r="11" fill="${skin}"/>
      <path d="M40 82 C35 72, 50 72, 53 79" stroke="${hair}" stroke-width="6" stroke-linecap="round" fill="none"/>
      <text x="110" y="24" font-family="sans-serif" font-size="10" font-weight="800" fill="#0f172a" text-anchor="middle">${isStart ? 'CAT STRETCH: Arch Spine Upward' : 'DOG STRETCH: Arch Spine Downward'}</text>
    </svg>`;
  }

  // 9. Standing Character (Shoulder Abduction/Flexion/Shrugs/Hip Abduction/Squats/Neck)
  return `<svg viewBox="0 0 220 140" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
    <rect width="220" height="140" rx="14" fill="#fafafc"/>
    <!-- Head & Hair Ponytail -->
    <circle cx="110" cy="38" r="11" fill="${skin}"/>
    <path d="M98 32 C95 22, 110 22, 113 29" stroke="${hair}" stroke-width="6" stroke-linecap="round" fill="none"/>
    <path d="M118 36 Q128 42 125 54" stroke="${hair}" stroke-width="5" stroke-linecap="round" fill="none"/>
    <!-- Orange Hoodie -->
    <path d="M110 48 L110 82" stroke="${hoodie}" stroke-width="18" stroke-linecap="round"/>
    <path d="M107 50 L107 62 M113 50 L113 62" stroke="${drawstrings}" stroke-width="2"/>
    <!-- Arms -->
    <path d="${isStart ? 'M101 54 L85 75 L85 82 M119 54 L135 75 L135 82' : 'M101 54 L65 54 M119 54 L175 30'}" stroke="${hoodie}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <circle cx="${isStart ? '85' : '60'}" cy="${isStart ? '84' : '54'}" r="4" fill="${skin}"/>
    <circle cx="${isStart ? '135' : '178'}" cy="${isStart ? '84' : '28'}" r="4" fill="${skin}"/>
    <!-- Teal Trousers & Legs -->
    <path d="M104 82 L100 120 M116 82 L120 120" stroke="${trousers}" stroke-width="9" stroke-linecap="round"/>
    <!-- Brown Shoes -->
    <ellipse cx="96" cy="122" rx="7" ry="4" fill="${shoes}"/>
    <ellipse cx="124" cy="122" rx="7" ry="4" fill="${shoes}"/>
    ${!isStart ? `<path d="M140 68 Q165 52 170 35" stroke="${blueMotion}" stroke-width="2.5" stroke-dasharray="4" fill="none"/>` : ''}
    <text x="110" y="24" font-family="sans-serif" font-size="10" font-weight="800" fill="#0f172a" text-anchor="middle">${isStart ? 'START POSITION' : 'STEP 2: MOVEMENT EXTENSION'}</text>
  </svg>`;
}

/**
 * POST /api/share/prescription
 * Uploads HTML prescription content to Cloudinary,
 * as a raw HTML file, and returns the public URL to share via WhatsApp.
 */
export const generateShareableLink = asyncHandler(async (req, res) => {
  const { clinicalNote, patient, doctor } = req.body;

  if (!clinicalNote) {
    throw new ApiError(400, 'Clinical note content is required');
  }

  try {
    const apiBaseUrl = process.env.VITE_API_URL || 'http://localhost:7001';
    const exArray = Array.isArray(clinicalNote.exercises) ? clinicalNote.exercises : [];
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=70x70&data=${encodeURIComponent(`${apiBaseUrl}/api/share/exercises?ids=${exArray.map(e => e.id).join(',')}`)}`;

    const docName = doctor?.name || 'Dr. Clinician';
    const docQual = doctor?.qualification || 'MBBS';
    const docHospital = doctor?.hospital || 'Clinic';
    const currentDate = new Date().toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Digital Prescription — Dr. ${docName}</title>
<style>
  body { font-family: 'DM Sans', system-ui, sans-serif; background: #fafafc; color: #0f172a; padding: 20px; }
  .card { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 24px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
  .header { border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 20px; }
  .brand { font-size: 20px; font-weight: 900; text-transform: uppercase; letter-spacing: -0.5px; }
  .doc { font-size: 14px; font-weight: 700; color: #0f172a; margin-top: 4px; }
  .meta { font-size: 12px; color: #64748b; margin-top: 2px; }
  .section { margin-bottom: 20px; }
  .sec-title { font-size: 11px; font-family: monospace; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 1px; margin-bottom: 8px; }
  .content { font-size: 13.5px; line-height: 1.6; color: #1e293b; }
  .rx-table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  .rx-table th { font-size: 10px; font-family: monospace; text-transform: uppercase; color: #64748b; text-align: left; padding-bottom: 8px; border-bottom: 1px solid #e2e8f0; }
  .rx-table td { padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
  .qr-box { margin-top: 24px; padding: 16px; background: #fafafc; border: 1px solid #e2e8f0; border-radius: 12px; display: flex; align-items: center; gap: 16px; }
  .footer { margin-top: 24px; text-align: center; font-size: 11px; color: #94a3b8; font-family: monospace; }
</style>
</head>
<body>
<div class="card">
  <div class="header">
    <div class="brand">Scribologist</div>
    <div class="doc">Dr. ${docName} (${docQual})</div>
    <div class="meta">${docHospital} · Date: ${currentDate}</div>
  </div>
  <div class="section">
    <div class="sec-title">Patient Profile</div>
    <div class="content"><strong>${patient?.firstName || 'Patient'} ${patient?.lastName || ''}</strong> (${patient?.age || 'N/A'} yrs)</div>
  </div>
  ${clinicalNote.diagnosis ? `
  <div class="section">
    <div class="sec-title">Diagnosis</div>
    <div class="content">${clinicalNote.diagnosis}</div>
  </div>` : ''}
  ${clinicalNote.prescription && clinicalNote.prescription.length > 0 ? `
  <div class="section">
    <div class="sec-title">Rx Prescribed Medications</div>
    <table class="rx-table">
      <thead><tr><th>Medication</th><th>Dosage</th><th>Route</th></tr></thead>
      <tbody>
        ${clinicalNote.prescription.map(m => `<tr><td><strong>${m.drug}</strong></td><td>${m.dose || ''} ${m.frequency || ''}</td><td>${m.route || 'Oral'}</td></tr>`).join('')}
      </tbody>
    </table>
  </div>` : ''}
  ${exArray.length > 0 ? `
  <div class="qr-box">
    <img src="${qrUrl}" width="70" height="70" style="border-radius:8px;" alt="QR" />
    <div>
      <div style="font-size:12px;font-weight:700;">Scan for Visual Exercise Routine</div>
      <div style="font-size:11px;color:#64748b;margin-top:2px;">Scan with your mobile camera for HD rehabilitation demonstrations.</div>
    </div>
  </div>` : ''}
  <div class="footer">Digitally compiled by Scribologist AI · Doctor Reviewed</div>
</div>
</body>
</html>`;

    // Upload buffer to Cloudinary
    const cloudinaryResponse = await uploadToCloudinary(Buffer.from(htmlContent, 'utf-8'), 'prescriptions');

    if (!cloudinaryResponse?.url) {
      throw new ApiError(500, 'Failed to upload prescription to cloud storage');
    }

    return res.status(200).json(
      new ApiResponse(200, { url: cloudinaryResponse.secure_url || cloudinaryResponse.url }, 'Prescription link generated successfully')
    );
  } catch (err) {
    console.error('Cloudinary upload error:', err);
    throw new ApiError(500, `Failed to generate shareable link: ${err.message}`);
  }
});

/**
 * GET /api/share/exercises?ids=ex1,ex2
 * Dynamic mobile web page demonstrating exercise demonstrations matched cleanly to title & instructions.
 */
export const getSharedExercisesPage = asyncHandler(async (req, res) => {
  const { ids } = req.query;
  if (!ids) {
    return res.status(400).send('<h1 style="font-family:sans-serif;padding:40px;text-align:center;">No exercises specified</h1>');
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

  // Fuzzy match exercises against IDs and names
  const prescribedExercises = exerciseIds.map(query => {
    const q = query.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!q) return null;
    return exercisesDb.find(ex => {
      const exId = ex.id.toLowerCase().replace(/[^a-z0-9]/g, '');
      const exName = ex.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      return exId === q || exId.includes(q) || q.includes(exId) || exName.includes(q) || q.includes(exName);
    });
  }).filter(Boolean);

  if (prescribedExercises.length === 0) {
    return res.status(404).send('<h1 style="font-family:sans-serif;padding:40px;text-align:center;">Prescribed exercises not found</h1>');
  }

  // Generate HTML page with 2D character SVG vector illustrations
  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Rehab & Exercise Routine — Scribologist</title>
<meta name="description" content="Your personalized rehabilitation exercise routine with visual demonstrations.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500;700&family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500;600;700;900&display=swap" rel="stylesheet">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { 
    background: #fafafc; 
    font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif; 
    color: #0f172a; 
    padding: 20px 16px; 
    display: flex; 
    justify-content: center; 
    min-height: 100vh; 
  }
  .container { width: 100%; max-width: 540px; display: flex; flex-direction: column; gap: 20px; }
  
  .header { 
    text-align: left; 
    padding: 28px; 
    background: #181a1e;
    border-radius: 24px;
    color: #fff;
    box-shadow: 0 10px 30px rgba(0,0,0,0.08);
    border: 1px solid #27272a;
  }
  .brand { font-size: 18px; font-weight: 900; letter-spacing: -0.5px; text-transform: uppercase; color: #fff; }
  .title { 
    font-family: 'Instrument Serif', Georgia, serif; 
    font-size: 32px; 
    font-weight: 400; 
    margin-top: 8px; 
    line-height: 1.1; 
    letter-spacing: -0.5px;
  }
  .subtitle { 
    font-size: 11px; 
    font-family: 'DM Mono', monospace; 
    color: #94a3b8; 
    text-transform: uppercase; 
    margin-top: 6px; 
    letter-spacing: 1px; 
  }
  .exercise-count {
    display: inline-block;
    margin-top: 14px;
    font-size: 10px;
    font-family: 'DM Mono', monospace;
    font-weight: 700;
    padding: 4px 12px;
    border-radius: 8px;
    background: #22252a;
    border: 1px solid #334155;
    color: #f8fafc;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }
  
  .card { 
    background: #fff; 
    border-radius: 24px; 
    border: 1px solid #e2e8f0; 
    box-shadow: 0 4px 20px rgba(0,0,0,0.03); 
    overflow: hidden; 
    display: flex; 
    flex-direction: column; 
  }
  
  .card-body { padding: 24px; display: flex; flex-direction: column; gap: 16px; text-align: left; }
  .card-header { display: flex; justify-content: space-between; align-items: flex-start; }
  .ex-tag { 
    font-size: 10px; font-family: 'DM Mono', monospace; 
    padding: 3px 10px; border-radius: 6px; 
    background: #f1f5f9; border: 1px solid #cbd5e1; 
    color: #334155; text-transform: uppercase; font-weight: 700; 
    letter-spacing: 0.8px;
  }
  .ex-name { 
    font-family: 'Instrument Serif', Georgia, serif;
    font-size: 26px; 
    font-weight: 400; 
    color: #0f172a; 
    margin-top: 8px; 
    line-height: 1.2; 
  }
  .ex-instructions { font-size: 13px; color: #475569; line-height: 1.65; }
  .ex-instructions strong { color: #0f172a; font-weight: 700; }

  /* ═══ Demonstration Media Grid ═══ */
  .media-box { 
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    padding: 24px;
    background: #fafafc; 
    border-top: 1px solid #f1f5f9;
  }
  
  .media-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
  }
  
  .media-card svg {
    width: 100%;
    aspect-ratio: 4/3;
    border-radius: 14px;
    border: 1px solid #e2e8f0;
    background: #fafafc;
  }
  
  .media-label {
    font-size: 9px;
    font-family: 'DM Mono', monospace;
    font-weight: 700;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.8px;
  }
  
  .sets-badge {
    display: inline-block;
    font-size: 11px;
    font-family: 'DM Mono', monospace;
    font-weight: 700;
    color: #0f172a;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    padding: 4px 10px;
    border-radius: 8px;
    margin-top: 4px;
  }

  .footer { 
    text-align: center; 
    padding: 24px 16px; 
    font-size: 11px; 
    font-family: 'DM Mono', monospace; 
    color: #94a3b8; 
    line-height: 1.7;
  }
  .footer span { color: #0f172a; font-weight: 700; }
  .footer-disclaimer {
    margin-top: 8px;
    font-size: 9.5px;
    color: #cbd5e1;
  }
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <div class="brand">Scribologist</div>
    <div class="title">Prescribed Rehabilitation</div>
    <div class="subtitle">Doctor Prescribed Exercise Protocol</div>
    <div class="exercise-count">${prescribedExercises.length} exercise${prescribedExercises.length > 1 ? 's' : ''} active</div>
  </div>

  ${prescribedExercises.map((ex) => {
    const startSvg = renderCharacterSVG(ex.id, 'start', ex.name, ex.category);
    const endSvg = renderCharacterSVG(ex.id, 'end', ex.name, ex.category);

    return `
  <div class="card">
    <div class="card-body">
      <div class="card-header">
        <div>
          <span class="ex-tag">${ex.category}</span>
          <h3 class="ex-name">${ex.name}</h3>
        </div>
      </div>
      
      <div class="sets-badge">
        ${ex.defaultSetsReps || '3 sets of 10 reps'}
      </div>

      <div class="ex-instructions">
        <strong>Prescribed Instruction:</strong><br/>
        ${ex.instruction}
      </div>
    </div>

    <div class="media-box">
      <div class="media-card">
        ${startSvg}
        <span class="media-label">Start Position</span>
      </div>
      <div class="media-card">
        ${endSvg}
        <span class="media-label">Extension Position</span>
      </div>
    </div>
  </div>`;
  }).join('')}

  <div class="footer">
    Digitally compiled by <span>Scribologist AI Rehabilitation</span><br/>
    <div class="footer-disclaimer">
      Always consult with your attending clinician before adjusting exercise frequency or load.
    </div>
  </div>
</div>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html');
  return res.status(200).send(htmlContent);
});
