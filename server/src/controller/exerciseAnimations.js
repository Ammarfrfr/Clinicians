/**
 * Exercise Animation SVGs — biomechanically accurate CSS transform animations.
 * Every exercise uses transform-origin rotation at the correct anatomical joint.
 * 
 * REWRITTEN for anatomical accuracy:
 *   - Contoured human figures with proper proportions
 *   - Visible fingers, toes, hair, facial features  
 *   - Smooth bezier curves for natural body shapes
 *   - Correct joint pivot points for each movement
 * 
 * LEGEND for supine (lying on back) views:
 *   Head is on LEFT, feet on RIGHT.
 *   Y increases downward. The floor/bed is at y≈97.
 *   Skin=#d6a374  Hair=#3d2b1f  Shirt=#f8f8f6  Shorts=#2d2d2a  Shoe=#3a3834
 *   Active highlight=#0ea5a0 (teal)
 *   Muscle highlight=#0ea5a0 at 30% opacity
 */

/* ── Color constants ──────────────────────────────────── */
const SKIN   = '#d6a374';
const SKIN_S = '#c9955e'; // skin shadow
const HAIR   = '#3d2b1f';
const SHIRT  = '#f8f8f6';
const SHIRT_S= '#e8e6e0'; // shirt shadow fold
const SHORTS = '#2d2d2a';
const SHOE   = '#3a3834';
const SHOE_S = '#555550'; // sole
const TEAL   = '#0ea5a0';
const BONE   = '#e8e5de';

/* ── Shared body part SVG snippets ─────────────────────── */

// Floor/bed surface
const floor = `<line x1="8" y1="98" x2="192" y2="98" stroke="${BONE}" stroke-width="2.5" stroke-linecap="round"/>`;

// Pillow 
const pillow = `<path d="M 16 97 Q 17 86 24 86 L 36 86 Q 42 86 42 92 L 42 97 Z" fill="#eae7e0" stroke="#ddd9d0" stroke-width="0.5"/>`;

// Head (left-facing profile, lying supine) — full anatomical head with face
const headSupine = `
  <g>
    <!-- Skull shape -->
    <ellipse cx="30" cy="78" rx="9" ry="8.5" fill="${SKIN}"/>
    <!-- Ear -->
    <ellipse cx="33" cy="80" rx="2" ry="3" fill="${SKIN_S}"/>
    <!-- Jaw/chin profile -->
    <path d="M 38 80 Q 40 78 39.5 75 Q 41 74 42 75" fill="${SKIN}" stroke="${SKIN}" stroke-width="0.5"/>
    <!-- Eye -->
    <ellipse cx="36" cy="75" rx="1.2" ry="0.7" fill="#2a2520"/>
    <!-- Eyebrow -->
    <path d="M 34.5 73.5 Q 36 72.8 37.8 73.5" fill="none" stroke="#4a3728" stroke-width="0.7" stroke-linecap="round"/>
    <!-- Nose profile -->
    <path d="M 39.5 75 L 41.5 74.5 L 40 76" fill="none" stroke="${SKIN_S}" stroke-width="0.7" stroke-linecap="round"/>
    <!-- Mouth -->
    <path d="M 38 78 Q 39.5 78.5 40 78" fill="none" stroke="#b8846a" stroke-width="0.5" stroke-linecap="round"/>
    <!-- Hair — layered flowing strands -->
    <path d="M 22 76 C 21 68 27 64 33 66 C 36 67 37 70 37 72 L 35 72 C 34 69 31 67 28 68 C 25 69 23 72 23 76 Z" fill="${HAIR}"/>
    <path d="M 23 80 C 21 78 21 72 23 69 C 22 73 22 77 24 80 Z" fill="${HAIR}" opacity="0.7"/>
  </g>
`;

// Neck (connects head to shoulder, lying position)
const neckSupine = `<path d="M 38 82 C 40 83 42 83 44 82 L 44 86 C 42 87 40 87 38 86 Z" fill="${SKIN}"/>`;

// Torso (lying supine — shirt with subtle folds)
const torsoSupine = `
  <g>
    <path d="M 44 76 Q 52 73 60 74 Q 66 75 70 78 L 70 90 Q 64 93 56 93 Q 48 93 44 90 Z" fill="${SHIRT}"/>
    <!-- Shirt fold lines -->
    <path d="M 50 78 Q 54 80 58 78" fill="none" stroke="${SHIRT_S}" stroke-width="0.4" opacity="0.6"/>
    <path d="M 48 84 Q 55 86 62 84" fill="none" stroke="${SHIRT_S}" stroke-width="0.4" opacity="0.5"/>
    <!-- Shoulder definition -->
    <circle cx="44" cy="83" r="2.5" fill="${SKIN}" opacity="0.5"/>
  </g>
`;

// Shorts/pelvis area
const shortsSupine = `
  <path d="M 70 78 Q 76 76 82 78 L 84 80 L 84 92 Q 78 94 70 92 Z" fill="${SHORTS}"/>
`;

// Resting arm along body (lying)
const armResting = `
  <g>
    <!-- Upper arm -->
    <path d="M 44 86 C 48 90 52 92 56 91" fill="none" stroke="${SKIN}" stroke-width="4.5" stroke-linecap="round"/>
    <!-- Forearm -->
    <path d="M 56 91 C 60 90 64 89 67 88" fill="none" stroke="${SKIN}" stroke-width="3.5" stroke-linecap="round"/>
    <!-- Hand with fingers -->
    <g transform="translate(67,88)">
      <ellipse cx="0" cy="0" rx="2.5" ry="2" fill="${SKIN}"/>
      <path d="M 2 -1.5 L 4 -2.5" stroke="${SKIN}" stroke-width="1" stroke-linecap="round"/>
      <path d="M 2.5 -0.5 L 5 -1" stroke="${SKIN}" stroke-width="1" stroke-linecap="round"/>
      <path d="M 2.5 0.5 L 5 0.5" stroke="${SKIN}" stroke-width="1" stroke-linecap="round"/>
      <path d="M 2 1.5 L 4 2" stroke="${SKIN}" stroke-width="0.9" stroke-linecap="round"/>
      <!-- Thumb -->
      <path d="M -0.5 -2 L 1 -3.5" stroke="${SKIN}" stroke-width="1.1" stroke-linecap="round"/>
    </g>
  </g>
`;

// Shoe (improved with sole, toe box, heel)
const shoeAt = (x, y) => `
  <g transform="translate(${x},${y})">
    <path d="M -2 -5 L 4 -8 Q 9 -5 8 0 Q 7 3 4 4 L -2 3 Q -4 1 -2 -5 Z" fill="${SHOE}"/>
    <path d="M -2 2 L 4 3.5 Q 7 2.5 8 0 L 8 2 Q 6 4 4 5 L -2 4 Z" fill="${SHOE_S}"/>
    <path d="M 4 -8 Q 6 -7 7 -5" fill="none" stroke="${SHOE}" stroke-width="0.8"/>
  </g>
`;

// Contoured leg (static, lying flat) — thigh tapers to calf
const staticLegSupine = `
  <g>
    <!-- Thigh -->
    <path d="M 84 80 Q 95 78 108 80 Q 118 81 120 83 L 120 94 Q 110 96 100 95 Q 90 95 84 93 Z" fill="${SKIN}"/>
    <!-- Knee cap -->
    <ellipse cx="120" cy="88" rx="4" ry="5" fill="${SKIN}" stroke="${SKIN_S}" stroke-width="0.5"/>
    <!-- Calf — slightly thinner, with gastrocnemius curve -->
    <path d="M 120 82 Q 132 80 145 83 Q 155 85 158 87 L 158 95 Q 152 97 142 96 Q 130 96 120 94 Z" fill="${SKIN}"/>
    <!-- Ankle -->
    <ellipse cx="158" cy="91" rx="3" ry="4" fill="${SKIN}"/>
    ${shoeAt(162, 93)}
  </g>
`;

// Bent support leg (lying position — knee bent, foot flat on bed)
const bentSupportLeg = `
  <g opacity="0.55">
    <!-- Thigh going up -->
    <path d="M 84 82 Q 92 75 100 65 L 104 65 Q 96 75 88 82 Z" fill="${SKIN}"/>
    <!-- Knee -->
    <ellipse cx="102" cy="63" rx="3.5" ry="4" fill="${SKIN_S}"/>
    <!-- Shin going down -->
    <path d="M 100 65 Q 108 75 112 88 L 116 88 Q 112 75 104 65 Z" fill="${SKIN}"/>
    <!-- Foot on surface -->
    <path d="M 112 88 Q 110 92 112 96 L 120 96 Q 122 92 120 88 Z" fill="${SHOE}"/>
  </g>
`;


/* ── CSS keyframes (injected once in <style>) ────────── */
export function getAnimationCSS() {
  return `
  /* ═══════ Shared Utilities ═══════ */
  @keyframes activeColor {
    0%,100%{ fill:${SKIN}; } 35%,65%{ fill:${TEAL}; }
  }
  @keyframes activePulse {
    0%,100%{ opacity: 0.15; } 50%{ opacity: 0.55; }
  }

  /* ROM Guides & Joint markers */
  .rom-guide { fill: none; stroke: ${TEAL}; stroke-width: 1.2; stroke-dasharray: 3,3; stroke-linecap: round; opacity: 0.5; }
  .rom-arrow { fill: none; stroke: ${TEAL}; stroke-width: 1.2; stroke-linecap: round; stroke-linejoin: round; opacity: 0.7; }
  .joint-dot { fill: ${SKIN_S}; stroke: #fff; stroke-width: 0.8; }
  .muscle-glow { fill: ${TEAL}; opacity: 0.2; animation: activePulse 3s infinite ease-in-out; }

  /* ═══════ Short Arc Quads ═══════ */
  .saq-shin { transform-origin: 30px 2px; animation: saqShin 3s infinite ease-in-out; }
  .saq-c { animation: activeColor 3s infinite ease-in-out; }
  @keyframes saqShin { 0%,100%{ transform:rotate(14deg); } 50%{ transform:rotate(-6deg); } }

  /* ═══════ Straight Leg Raises ═══════ */
  .slr-leg { transform-origin: 0px 0px; animation: slrLift 3s infinite ease-in-out; }
  .slr-c { animation: activeColor 3s infinite ease-in-out; }
  @keyframes slrLift { 0%,100%{ transform:rotate(0deg); } 50%{ transform:rotate(-20deg); } }

  /* ═══════ Quad Sets ═══════ */
  .qs-leg { animation: qsPress 3s infinite ease-in-out; }
  .qs-c { animation: activeColor 3s infinite ease-in-out; }
  .qs-muscle { animation: qsBulge 3s infinite ease-in-out; }
  @keyframes qsPress {
    0%,100%{ d: path('M 84 82 Q 120 85 158 89 L 158 97 Q 120 99 84 94 Z'); }
    50%{ d: path('M 84 82 Q 120 90 158 89 L 158 97 Q 120 99 84 94 Z'); }
  }
  @keyframes qsBulge {
    0%,100%{ transform: scaleY(1); opacity: 0.12; }
    50%{ transform: scaleY(1.4) scaleX(1.05); opacity: 0.6; }
  }

  /* ═══════ Knee Slides ═══════ */
  .ks-thigh { transform-origin: 0px 0px; animation: ksThigh 3s infinite ease-in-out; }
  .ks-shin  { transform-origin: 36px 3px; animation: ksShin 3s infinite ease-in-out; }
  .ks-c { animation: activeColor 3s infinite ease-in-out; }
  @keyframes ksThigh { 0%,100%{ transform:rotate(0deg); } 50%{ transform:rotate(-30deg); } }
  @keyframes ksShin  { 0%,100%{ transform:rotate(0deg); } 50%{ transform:rotate(82deg); } }

  /* ═══════ Ankle Pumps ═══════ */
  .ap-foot { transform-origin: 0px 0px; animation: apPump 2s infinite ease-in-out; }
  .ap-c { animation: activeColor 2s infinite ease-in-out; }
  @keyframes apPump { 0%,100%{ transform:rotate(15deg); } 50%{ transform:rotate(-18deg); } }

  /* ═══════ Gluteal Squeezes ═══════ */
  .gs-glute { transform-origin: 77px 85px; animation: gsSqueeze 3s infinite ease-in-out; }
  .gs-ripple { transform-origin: 77px 85px; animation: gsRipple 3s infinite ease-in-out; }
  @keyframes gsSqueeze {
    0%,100%{ transform: scale(1); fill:${SHORTS}; }
    35%,65%{ transform: scale(0.92) scaleY(0.86); fill:${TEAL}; }
  }
  @keyframes gsRipple {
    0%,100%{ transform: scale(0.8); opacity: 0; }
    50%{ transform: scale(1.2); opacity: 0.6; }
  }

  /* ═══════ Hip Abduction ═══════ */
  .ha-leg { transform-origin: 0px 0px; animation: haLift 3s infinite ease-in-out; }
  .ha-c { animation: activeColor 3s infinite ease-in-out; }
  @keyframes haLift { 0%,100%{ transform:rotate(0deg); } 50%{ transform:rotate(-28deg); } }

  /* ═══════ Bridging ═══════ */
  .br-torso { transform-origin: 44px 90px; animation: brLift 3.5s infinite ease-in-out; }
  .br-thigh { transform-origin: 0px 0px; animation: brThigh 3.5s infinite ease-in-out; }
  .br-shin  { transform-origin: 0px 0px; animation: brShin 3.5s infinite ease-in-out; }
  .br-c { animation: activeColor 3.5s infinite ease-in-out; }
  @keyframes brLift  { 0%,100%{ transform:rotate(0deg); } 50%{ transform:rotate(-16deg); } }
  @keyframes brThigh { 0%,100%{ transform:rotate(0deg); } 50%{ transform:rotate(42deg); } }
  @keyframes brShin  { 0%,100%{ transform:rotate(0deg); } 50%{ transform:rotate(-18deg); } }

  /* ═══════ Press-Up Sphinx ═══════ */
  .sph-upper { transform-origin: 100px 94px; animation: sphinxUp 3.5s infinite ease-in-out; }
  .sph-arm   { transform-origin: 0px 0px; animation: sphArm 3.5s infinite ease-in-out; }
  .sph-forearm { transform-origin: 6px 6px; animation: sphForearm 3.5s infinite ease-in-out; }
  .sph-c { animation: activeColor 3.5s infinite ease-in-out; }
  @keyframes sphinxUp  { 0%,100%{ transform:rotate(0deg); } 50%{ transform:rotate(20deg); } }
  @keyframes sphArm    { 0%,100%{ transform:rotate(0deg); } 50%{ transform:rotate(-42deg); } }
  @keyframes sphForearm{ 0%,100%{ transform:rotate(0deg); } 50%{ transform:rotate(28deg); } }

  /* ═══════ Knee to Chest ═══════ */
  .ktc-thigh { transform-origin: 0px 0px; animation: ktcThigh 3.5s infinite ease-in-out; }
  .ktc-shin  { transform-origin: 36px 3px; animation: ktcShin 3.5s infinite ease-in-out; }
  .ktc-arm   { transform-origin: 44px 86px; animation: ktcArm 3.5s infinite ease-in-out; }
  .ktc-c { animation: activeColor 3.5s infinite ease-in-out; }
  @keyframes ktcThigh { 0%,100%{ transform:rotate(0deg); } 50%{ transform:rotate(-72deg); } }
  @keyframes ktcShin  { 0%,100%{ transform:rotate(0deg); } 50%{ transform:rotate(82deg); } }
  @keyframes ktcArm   { 0%,100%{ transform:rotate(0deg); } 50%{ transform:rotate(-28deg); } }

  /* ═══════ Cat & Dog ═══════ */
  .cd-spine { animation: cdSpine 4s infinite ease-in-out; fill: none; }
  .cd-head  { transform-origin: 58px 68px; animation: cdHead 4s infinite ease-in-out; }
  @keyframes cdSpine {
    0%,100%{ d: path('M 72 75 Q 98 52 125 75'); }
    50%{ d: path('M 72 75 Q 98 88 125 75'); }
  }
  @keyframes cdHead {
    0%,100%{ transform: translate(2px, 4px) rotate(-12deg); }
    50%{ transform: translate(-2px, -4px) rotate(12deg); }
  }

  /* ═══════ Circular Pendulum ═══════ */
  .cp-arm { transform-origin: 85px 50px; animation: cpSwing 2.5s infinite ease-in-out; }
  .cp-c { animation: activeColor 2.5s infinite ease-in-out; }
  @keyframes cpSwing {
    0%, 100% { transform: rotate(0deg) scaleX(1); }
    25% { transform: rotate(14deg) scaleX(0.85); }
    50% { transform: rotate(0deg) scaleX(0.7); }
    75% { transform: rotate(-14deg) scaleX(0.85); }
  }

  /* ═══════ Shoulder Flexion ═══════ */
  .sf-arm { transform-origin: 0px 0px; animation: sfRaise 3.5s infinite ease-in-out; }
  .sf-c { animation: activeColor 3.5s infinite ease-in-out; }
  @keyframes sfRaise { 0%,100%{ transform:rotate(0deg); } 50%{ transform:rotate(-168deg); } }

  /* ═══════ Neck Glide ═══════ */
  .ng-neck { transform-origin: 80px 62px; animation: ngNeck 3s infinite ease-in-out; }
  .ng-head-group { transform-origin: 80px 32px; animation: ngHeadGroup 3s infinite ease-in-out; }
  .ng-c { animation: activeColor 3s infinite ease-in-out; }
  @keyframes ngNeck { 0%,100%{ transform: rotate(0deg); } 50%{ transform: rotate(-16deg); } }
  @keyframes ngHeadGroup { 0%,100%{ transform: rotate(0deg); } 50%{ transform: rotate(16deg); } }

  /* ═══════ Neck Rotation ═══════ */
  .nr-nose { transform-origin: 80px 32px; animation: nrTurn 3s infinite ease-in-out; }
  .nr-c { animation: activeColor 3s infinite ease-in-out; }
  @keyframes nrTurn { 0%,100%{ transform:scaleX(1); } 50%{ transform:scaleX(-1); } }

  /* ═══════ Wrist Flexion ═══════ */
  .wf-hand { transform-origin: 110px 70px; animation: wfBend 3s infinite ease-in-out; }
  .wf-c { animation: activeColor 3s infinite ease-in-out; }
  @keyframes wfBend { 0%,100%{ transform:rotate(0deg); } 50%{ transform:rotate(32deg); } }

  /* ═══════ Wrist Extension ═══════ */
  .we-hand { transform-origin: 110px 70px; animation: weBend 3s infinite ease-in-out; }
  .we-c { animation: activeColor 3s infinite ease-in-out; }
  @keyframes weBend { 0%,100%{ transform:rotate(0deg); } 50%{ transform:rotate(-32deg); } }

  /* ═══════ Grip Strengthening ═══════ */
  .grip-fingers { transform-origin: 105px 65px; animation: gripSq 3s infinite ease-in-out; }
  .grip-ball { animation: ballSq 3s infinite ease-in-out; }
  .grip-ripple { transform-origin: 128px 65px; animation: gripRipple 3s infinite ease-in-out; }
  @keyframes gripSq { 0%,100%{ transform:scale(1); } 50%{ transform:scale(0.88); } }
  @keyframes ballSq { 0%,100%{ r:12; fill:#ef4444; } 50%{ r:9; fill:#b91c1c; } }
  @keyframes gripRipple {
    0%,100%{ transform: scale(0.8); opacity: 0; stroke: #ef4444; }
    50%{ transform: scale(1.25); opacity: 0.55; stroke: #b91c1c; }
  }
`;
}


/* ── Hand snippet builder ─────────────────────────────── */
function hand(x, y, rot = 0) {
  return `
    <g transform="translate(${x},${y}) rotate(${rot})">
      <ellipse cx="0" cy="0" rx="3" ry="2.2" fill="${SKIN}"/>
      <!-- Index --> <path d="M 2.5 -1.5 L 5 -2.5" stroke="${SKIN}" stroke-width="0.9" stroke-linecap="round"/>
      <!-- Middle --> <path d="M 3 -0.5 L 5.5 -0.8" stroke="${SKIN}" stroke-width="0.9" stroke-linecap="round"/>
      <!-- Ring --> <path d="M 3 0.5 L 5.5 0.5" stroke="${SKIN}" stroke-width="0.8" stroke-linecap="round"/>
      <!-- Pinky --> <path d="M 2.5 1.5 L 4.5 2" stroke="${SKIN}" stroke-width="0.7" stroke-linecap="round"/>
      <!-- Thumb --> <path d="M -0.5 -2 L 1.5 -4" stroke="${SKIN}" stroke-width="1" stroke-linecap="round"/>
    </g>
  `;
}


/* ── SVG generators per exercise ID ──────────────────── */
export function getExerciseSVG(exerciseId) {
  const id = exerciseId.toLowerCase();
  const W = 'width:100%;max-width:260px;height:auto;';
  
  switch(id) {

    case 'short_arc_quads':
      /* Supine. Roller under knee. Shin raises to extension. */
      return `<svg viewBox="0 0 200 120" style="${W}">
        ${floor}${pillow}${headSupine}${neckSupine}${torsoSupine}${shortsSupine}${armResting}
        <!-- Foam roller under knee -->
        <ellipse cx="114" cy="92" rx="7" ry="5" fill="#c8c4bc" stroke="#b5b0a8" stroke-width="0.5"/>
        <ellipse cx="114" cy="92" rx="5" ry="3.5" fill="#d5d0c8"/>
        
        <!-- Static support leg (faded) -->
        <g opacity="0.4">
          <path d="M 84 82 Q 98 80 114 84 L 114 94 Q 98 96 84 93 Z" fill="${SKIN}"/>
          <path d="M 114 84 Q 136 85 158 88 L 158 95 Q 136 97 114 94 Z" fill="${SKIN}"/>
          ${shoeAt(162, 93)}
        </g>
        
        <!-- ROM Guide Arc -->
        <path class="rom-guide" d="M 150 100 A 36 36 0 0 0 154 85"/>
        <path class="rom-arrow" d="M 151 87 L 154 85 L 156 88"/>
        
        <!-- Active leg: thigh is static on roller, shin pivots -->
        <g transform="translate(84,87)">
          <circle class="joint-dot" cx="0" cy="0" r="3.5"/>
          <!-- Thigh on roller -->
          <path d="M 0 -6 Q 12 -5 24 -2 L 30 0 L 30 6 Q 18 8 6 7 L 0 6 Z" fill="${SKIN}"/>
          <!-- Knee cap -->
          <ellipse cx="30" cy="2" rx="3.5" ry="4" fill="${SKIN}" stroke="${SKIN_S}" stroke-width="0.4"/>
          
          <g class="saq-shin">
            <!-- Calf -->
            <path class="saq-c" d="M 30 -3 Q 45 -2 60 2 Q 68 4 70 6 L 70 12 Q 62 14 50 12 Q 38 10 30 8 Z" fill="${SKIN}"/>
            <!-- Ankle -->
            <ellipse cx="70" cy="9" rx="2.5" ry="3.5" fill="${SKIN}"/>
            ${shoeAt(74, 10)}
          </g>
        </g>
        
        <!-- Quad muscle highlight -->
        <ellipse class="muscle-glow" cx="102" cy="82" rx="14" ry="4.5"/>
        <text x="102" y="77" font-size="5.5" fill="${TEAL}" font-family="'DM Sans',sans-serif" text-anchor="middle" font-weight="600" opacity="0.7">EXTEND</text>
      </svg>`;

    case 'straight_leg_raises':
      /* Supine. Active leg lifts straight. */
      return `<svg viewBox="0 0 200 120" style="${W}">
        ${floor}${pillow}${headSupine}${neckSupine}${torsoSupine}${shortsSupine}${armResting}
        ${bentSupportLeg}
        
        <!-- ROM Guide Arc -->
        <path class="rom-guide" d="M 160 93 A 76 76 0 0 0 155 68"/>
        <path class="rom-arrow" d="M 152 70 L 155 68 L 158 71"/>
        
        <!-- Active leg -->
        <g transform="translate(84,87)">
          <g class="slr-leg">
            <circle class="joint-dot" cx="0" cy="0" r="3.5"/>
            <!-- Full contoured leg -->
            <path class="slr-c" d="M 0 -6 Q 18 -5 36 -2 Q 54 0 74 3 L 74 10 Q 54 10 36 8 Q 18 7 0 6 Z" fill="${SKIN}"/>
            <!-- Knee -->
            <ellipse cx="36" cy="3" rx="3" ry="4" fill="${SKIN}" stroke="${SKIN_S}" stroke-width="0.4"/>
            <!-- Ankle -->
            <ellipse cx="74" cy="6" rx="2.5" ry="3.5" fill="${SKIN}"/>
            ${shoeAt(78, 7)}
          </g>
        </g>
        
        <!-- Quad highlight on active leg -->
        <ellipse class="muscle-glow" cx="105" cy="84" rx="16" ry="4"/>
        <text x="130" y="75" font-size="5.5" fill="${TEAL}" font-family="'DM Sans',sans-serif" text-anchor="middle" font-weight="600" opacity="0.7">LIFT</text>
      </svg>`;

    case 'quad_sets':
      /* Supine. Thigh contracts isometrically, pressing knee into bed. */
      return `<svg viewBox="0 0 200 120" style="${W}">
        ${floor}${pillow}${headSupine}${neckSupine}${torsoSupine}${shortsSupine}
        
        <!-- Quad Muscle highlight/bulge -->
        <ellipse class="qs-muscle muscle-glow" cx="105" cy="83" rx="16" ry="5.5" style="transform-origin:105px 83px;"/>
        
        <!-- Leg that presses down -->
        <path class="qs-leg qs-c" d="M 84 82 Q 120 85 158 89 L 158 97 Q 120 99 84 94 Z" fill="${SKIN}"/>
        <!-- Knee cap -->
        <ellipse cx="120" cy="88" rx="3.5" ry="4.5" fill="${SKIN}" stroke="${SKIN_S}" stroke-width="0.4"/>
        <circle class="joint-dot" cx="84" cy="88" r="3.5"/>
        ${shoeAt(162, 93)}
        
        <!-- Down-press arrow at knee -->
        <path class="rom-guide" d="M 120 80 L 120 86"/>
        <path class="rom-arrow" d="M 117 83 L 120 86 L 123 83"/>
        
        <text x="105" y="78" font-size="5.5" fill="${TEAL}" font-family="'DM Sans',sans-serif" text-anchor="middle" font-weight="600" opacity="0.7">TIGHTEN</text>
      </svg>`;

    case 'knee_slides':
      /* Supine. Heel slides toward buttocks. */
      return `<svg viewBox="0 0 200 120" style="${W}">
        ${floor}${pillow}${headSupine}${neckSupine}${torsoSupine}${shortsSupine}${armResting}
        
        <!-- Static support leg -->
        <g opacity="0.4">${staticLegSupine}</g>
        
        <!-- Sliding arrow guide on bed -->
        <line class="rom-guide" x1="152" y1="97" x2="118" y2="97"/>
        <path class="rom-arrow" d="M 121 94 L 118 97 L 121 100 M 149 94 L 152 97 L 149 100"/>
        
        <!-- Active leg -->
        <g transform="translate(84,87)">
          <circle class="joint-dot" cx="0" cy="0" r="3.5"/>
          <g class="ks-thigh">
            <!-- Thigh — tapered -->
            <path class="ks-c" d="M 0 -6 Q 12 -5 24 -3 L 36 0 L 36 6 Q 24 8 12 7 L 0 6 Z" fill="${SKIN}"/>
            <!-- Knee -->
            <ellipse cx="36" cy="3" rx="3.5" ry="4" fill="${SKIN}" stroke="${SKIN_S}" stroke-width="0.4"/>
            
            <g class="ks-shin">
              <!-- Shin/calf -->
              <path class="ks-c" d="M 36 -2 Q 50 -1 64 3 Q 72 5 74 7 L 74 13 Q 66 14 52 12 Q 40 10 36 8 Z" fill="${SKIN}"/>
              <!-- Ankle -->
              <ellipse cx="74" cy="10" rx="2.5" ry="3.5" fill="${SKIN}"/>
              ${shoeAt(78, 11)}
            </g>
          </g>
        </g>
        
        <text x="138" y="90" font-size="5" fill="${TEAL}" font-family="'DM Sans',sans-serif" text-anchor="middle" font-weight="600" opacity="0.7">SLIDE</text>
      </svg>`;

    case 'ankle_pumps':
      /* Supine. Foot pumps at ankle joint. */
      return `<svg viewBox="0 0 200 120" style="${W}">
        ${floor}${pillow}${headSupine}${neckSupine}${torsoSupine}${shortsSupine}
        
        <!-- Full leg lying flat -->
        <path d="M 84 80 Q 120 78 155 85 L 155 94 Q 120 96 84 93 Z" fill="${SKIN}"/>
        <ellipse cx="120" cy="87" rx="3.5" ry="4.5" fill="${SKIN}" stroke="${SKIN_S}" stroke-width="0.4"/>
        <circle class="joint-dot" cx="84" cy="87" r="3.5"/>
        
        <!-- Ankle joint -->
        <ellipse cx="155" cy="90" rx="3" ry="4" fill="${SKIN}" stroke="${SKIN_S}" stroke-width="0.4"/>
        
        <!-- ROM Guide: dorsi/plantar arc -->
        <path class="rom-guide" d="M 170 80 A 14 14 0 0 1 168 98"/>
        <path class="rom-arrow" d="M 167 82 L 170 80 L 172 83 M 165 96 L 168 98 L 170 95"/>
        
        <!-- Animated foot -->
        <g transform="translate(155,90)">
          <g class="ap-foot">
            <!-- Proper foot shape with toes -->
            <path class="ap-c" d="M 0 -3 L 3 -9 Q 6 -11 9 -10 L 11 -8 Q 12 -4 10 0 L 7 3 L 0 2 Z" fill="${SKIN}"/>
            <!-- Toe lines -->
            <path d="M 9 -10 L 11 -11" stroke="${SKIN_S}" stroke-width="0.5" stroke-linecap="round"/>
            <path d="M 10 -8 L 12.5 -8.5" stroke="${SKIN_S}" stroke-width="0.5" stroke-linecap="round"/>
            <path d="M 10.5 -6 L 13 -5.5" stroke="${SKIN_S}" stroke-width="0.5" stroke-linecap="round"/>
            <path d="M 10.5 -4 L 12.5 -3" stroke="${SKIN_S}" stroke-width="0.4" stroke-linecap="round"/>
          </g>
        </g>
        
        <text x="170" y="72" font-size="5" fill="${TEAL}" font-family="'DM Sans',sans-serif" text-anchor="middle" font-weight="600" opacity="0.7">PUMP</text>
      </svg>`;

    case 'gluteal_squeezes':
      /* Supine. Glutes squeeze isometrically. */
      return `<svg viewBox="0 0 200 120" style="${W}">
        ${floor}${pillow}${headSupine}${neckSupine}${torsoSupine}
        
        <!-- Squeeze ripple -->
        <rect class="gs-ripple" x="65" y="75" width="24" height="20" rx="8" fill="none" stroke="${TEAL}" stroke-width="1.5" opacity="0.5"/>
        
        <!-- Shorts/glutes with squeeze animation -->
        <path class="gs-glute" d="M 70 78 Q 76 76 82 78 L 84 80 L 84 92 Q 78 94 70 92 Z" fill="${SHORTS}"/>
        
        <!-- Full leg -->
        ${staticLegSupine}
        
        <text x="77" y="74" font-size="5.5" fill="${TEAL}" font-family="'DM Sans',sans-serif" text-anchor="middle" font-weight="600" opacity="0.7">SQUEEZE</text>
      </svg>`;

    case 'hip_abduction_lying':
      /* Side-lying. Top leg raises. */
      return `<svg viewBox="0 0 200 120" style="${W}">
        ${floor}
        <!-- Side-lying head -->
        <g>
          <ellipse cx="32" cy="78" rx="9" ry="8.5" fill="${SKIN}"/>
          <ellipse cx="35" cy="80" rx="2" ry="3" fill="${SKIN_S}"/>
          <ellipse cx="37" cy="76" rx="1" ry="0.6" fill="#2a2520"/>
          <path d="M 24 76 C 23 68 29 64 35 66 C 37 67 38 70 38 72 L 36 72 C 35 69 33 67 30 68 C 27 69 25 72 25 76 Z" fill="${HAIR}"/>
        </g>
        <!-- Torso -->
        <path d="M 38 74 Q 52 71 66 74 L 70 78 L 70 92 Q 56 94 42 92 Z" fill="${SHIRT}"/>
        <path d="M 70 78 Q 76 76 82 78 L 84 80 L 84 92 Q 78 94 70 92 Z" fill="${SHORTS}"/>
        
        <!-- Bottom leg (static) -->
        <g opacity="0.55">
          <path d="M 84 84 Q 120 83 158 84 L 158 92 Q 120 93 84 92 Z" fill="${SKIN}"/>
          ${shoeAt(162, 90)}
        </g>
        
        <!-- ROM Guide Arc -->
        <path class="rom-guide" d="M 158 85 A 74 74 0 0 0 150 52"/>
        <path class="rom-arrow" d="M 147 55 L 150 52 L 153 55"/>
        
        <!-- Active top leg -->
        <g transform="translate(84,85)">
          <g class="ha-leg">
            <circle class="joint-dot" cx="0" cy="0" r="3.5"/>
            <!-- Contoured leg -->
            <path class="ha-c" d="M 0 -6 Q 25 -5 50 -3 Q 65 -2 74 0 L 74 6 Q 60 8 40 7 Q 20 6 0 6 Z" fill="${SKIN}"/>
            <!-- Knee -->
            <ellipse cx="36" cy="1" rx="3" ry="3.5" fill="${SKIN}" stroke="${SKIN_S}" stroke-width="0.3"/>
            <!-- Ankle -->
            <ellipse cx="74" cy="3" rx="2.5" ry="3" fill="${SKIN}"/>
            ${shoeAt(78, 3)}
          </g>
        </g>
        
        <text x="130" y="55" font-size="5.5" fill="${TEAL}" font-family="'DM Sans',sans-serif" text-anchor="middle" font-weight="600" opacity="0.7">LIFT</text>
      </svg>`;

    case 'bridging':
      /* Supine. Hips lift into bridge position. */
      return `<svg viewBox="0 0 200 120" style="${W}">
        ${floor}${pillow}
        
        <!-- Vertical rise guide -->
        <path class="rom-guide" d="M 77 88 L 77 72"/>
        <path class="rom-arrow" d="M 74 75 L 77 72 L 80 75"/>
        
        <!-- Head (stays on pillow) -->
        <g>
          <ellipse cx="30" cy="82" rx="8" ry="7.5" fill="${SKIN}"/>
          <ellipse cx="33" cy="83" rx="2" ry="2.5" fill="${SKIN_S}"/>
          <path d="M 24 80 C 23 72 29 68 34 70 C 36 71 36 74 36 76 L 34 76 C 34 73 32 71 30 72 C 27 73 25 76 25 80 Z" fill="${HAIR}"/>
        </g>
        
        <!-- Animated torso/hip that lifts -->
        <g class="br-torso">
          <circle class="joint-dot" cx="44" cy="90" r="3.5"/>
          <!-- Neck connection -->
          <path d="M 36 86 C 38 86 42 86 44 86" fill="none" stroke="${SKIN}" stroke-width="5" stroke-linecap="round"/>
          <!-- Torso -->
          <path d="M 44 80 Q 54 77 66 79 L 72 82 L 72 93 Q 60 95 48 94 L 44 92 Z" fill="${SHIRT}"/>
          <!-- Shorts/hips -->
          <path class="br-c" d="M 72 82 Q 78 80 86 82 L 90 85 L 90 93 Q 82 95 72 93 Z" fill="${SHORTS}"/>
          
          <!-- Thigh nested at hip (90,90) -->
          <g transform="translate(90,90)">
            <g class="br-thigh">
              <circle class="joint-dot" cx="0" cy="0" r="3.5"/>
              <!-- Thigh going up at angle -->
              <path class="br-c" d="M -3 -4 Q 5 -14 15 -22 L 21 -18 Q 11 -10 3 0 Z" fill="${SKIN}"/>
              
              <!-- Shin nested at knee (18,-20) -->
              <g transform="translate(18,-20)">
                <g class="br-shin">
                  <ellipse cx="0" cy="0" rx="3" ry="3.5" fill="${SKIN}" stroke="${SKIN_S}" stroke-width="0.3"/>
                  <!-- Shin going down to floor -->
                  <path class="br-c" d="M -3 0 Q 2 10 8 22 L 14 20 Q 8 8 3 0 Z" fill="${SKIN}"/>
                  <ellipse cx="11" cy="22" rx="2.5" ry="3" fill="${SKIN}"/>
                  ${shoeAt(15, 24)}
                </g>
              </g>
            </g>
          </g>
        </g>
        
        <text x="77" y="68" font-size="5.5" fill="${TEAL}" font-family="'DM Sans',sans-serif" text-anchor="middle" font-weight="600" opacity="0.7">LIFT HIPS</text>
      </svg>`;

    case 'press_up_sphinx':
      /* Prone. Upper body lifts on forearms. */
      return `<svg viewBox="0 0 200 120" style="${W}">
        ${floor}
        <!-- Lower body stays flat -->
        <path d="M 100 88 Q 130 87 158 89 L 158 96 Q 130 98 100 96 Z" fill="${SKIN}"/>
        <ellipse cx="130" cy="92" rx="3" ry="4" fill="${SKIN}" stroke="${SKIN_S}" stroke-width="0.3"/>
        ${shoeAt(162, 94)}
        <!-- Shorts -->
        <path d="M 88 88 L 102 88 L 102 97 L 88 97 Z" fill="${SHORTS}"/>
        
        <!-- Lift guide -->
        <path class="rom-guide" d="M 62 92 L 62 78"/>
        <path class="rom-arrow" d="M 59 81 L 62 78 L 65 81"/>
        
        <!-- Upper body that lifts -->
        <g class="sph-upper">
          <circle class="joint-dot" cx="100" cy="94" r="3.5"/>
          <!-- Back/torso -->
          <path class="sph-c" d="M 66 86 Q 80 83 100 86 L 100 96 Q 80 98 66 96 Z" fill="${SHIRT}"/>
          
          <!-- Head with face profile (looking forward) -->
          <g>
            <ellipse cx="56" cy="88" rx="8" ry="7.5" fill="${SKIN}"/>
            <ellipse cx="53" cy="90" rx="2" ry="2.5" fill="${SKIN_S}"/>
            <!-- Face -->
            <path d="M 49 87 L 47 86.5 L 48.5 88" fill="none" stroke="${SKIN_S}" stroke-width="0.6" stroke-linecap="round"/>
            <ellipse cx="52" cy="86" rx="1" ry="0.6" fill="#2a2520"/>
            <path d="M 50 85 Q 52 84.5 54 85" fill="none" stroke="#4a3728" stroke-width="0.5"/>
            <!-- Hair -->
            <path d="M 56 80 C 62 80 64 84 64 88 C 64 92 62 95 56 95 L 56 92 C 60 92 62 90 62 88 C 62 85 60 82 56 82 Z" fill="${HAIR}"/>
            <path d="M 56 80 C 52 80 50 82 50 84 L 52 84 C 52 82 54 81 56 81 Z" fill="${HAIR}" opacity="0.8"/>
          </g>
          
          <!-- Arm nested at shoulder (66,92) -->
          <g transform="translate(66,92)">
            <g class="sph-arm">
              <circle class="joint-dot" cx="0" cy="0" r="3"/>
              <!-- Upper arm -->
              <path class="sph-c" d="M -2 -2 L 4 4 L 8 8 L 4 6 L -2 2 Z" fill="${SKIN}" stroke="${SKIN}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
              
              <!-- Forearm nested at elbow -->
              <g transform="translate(6,6)">
                <g class="sph-forearm">
                  <circle class="joint-dot" cx="0" cy="0" r="2.5"/>
                  <path class="sph-c" d="M -1 -1 L -18 -1 L -18 2 L -1 2 Z" fill="${SKIN}" stroke="${SKIN}" stroke-width="2.5" stroke-linecap="round"/>
                  ${hand(-20, 0.5, 0)}
                </g>
              </g>
            </g>
          </g>
        </g>
        
        <text x="62" y="74" font-size="5.5" fill="${TEAL}" font-family="'DM Sans',sans-serif" text-anchor="middle" font-weight="600" opacity="0.7">PUSH UP</text>
      </svg>`;

    case 'knee_to_chest':
      /* Supine. One knee drawn to chest, arms pull. */
      return `<svg viewBox="0 0 200 120" style="${W}">
        ${floor}${pillow}${headSupine}${neckSupine}${torsoSupine}${shortsSupine}
        ${bentSupportLeg}
        
        <!-- Curved guide: knee-to-chest path -->
        <path class="rom-guide" d="M 122 93 Q 118 65 100 50"/>
        <path class="rom-arrow" d="M 103 49 L 100 50 L 100 53"/>
        
        <!-- Active leg -->
        <g transform="translate(84,87)">
          <circle class="joint-dot" cx="0" cy="0" r="3.5"/>
          <g class="ktc-thigh">
            <!-- Thigh -->
            <path class="ktc-c" d="M 0 -6 Q 12 -5 24 -3 L 36 0 L 36 6 Q 24 8 12 7 L 0 6 Z" fill="${SKIN}"/>
            <ellipse cx="36" cy="3" rx="3" ry="4" fill="${SKIN}" stroke="${SKIN_S}" stroke-width="0.3"/>
            <g class="ktc-shin">
              <!-- Shin -->
              <path class="ktc-c" d="M 36 -2 Q 50 -1 64 3 Q 72 5 74 7 L 74 13 Q 66 14 52 12 Q 40 10 36 8 Z" fill="${SKIN}"/>
              <ellipse cx="74" cy="10" rx="2.5" ry="3.5" fill="${SKIN}"/>
              ${shoeAt(78, 11)}
            </g>
          </g>
        </g>
        
        <!-- Arm reaching to hold knee -->
        <g class="ktc-arm">
          <circle class="joint-dot" cx="44" cy="86" r="3"/>
          <path class="ktc-c" d="M 44 83 Q 70 78 106 76 L 106 82 Q 70 84 44 89 Z" fill="${SKIN}"/>
          ${hand(108, 79, -5)}
        </g>
        
        <text x="100" y="44" font-size="5.5" fill="${TEAL}" font-family="'DM Sans',sans-serif" text-anchor="middle" font-weight="600" opacity="0.7">PULL</text>
      </svg>`;

    case 'cats_and_dogs':
      /* On hands and knees. Spine arches and sags. */
      return `<svg viewBox="0 0 200 120" style="${W}">
        ${floor}
        <!-- Left arm/hand on floor -->
        <path d="M 72 75 L 70 96 L 76 96 L 78 75 Z" fill="${SKIN}"/>
        ${hand(73, 97, 90)}
        <!-- Right arm/hand on floor -->
        <path d="M 125 75 L 123 96 L 129 96 L 131 75 Z" fill="${SKIN}"/>
        ${hand(126, 97, 90)}
        
        <!-- Knee pads (on floor) -->
        <ellipse cx="88" cy="97" rx="5" ry="2" fill="${SHORTS}" opacity="0.7"/>
        <ellipse cx="112" cy="97" rx="5" ry="2" fill="${SHORTS}" opacity="0.7"/>
        
        <!-- Spine deflection guides -->
        <path class="rom-guide" d="M 98 56 L 98 84"/>
        <path class="rom-arrow" d="M 95 59 L 98 56 L 101 59 M 95 81 L 98 84 L 101 81"/>
        
        <!-- Animated spine (shirt) -->
        <path class="cd-spine" d="M 72 75 Q 98 52 125 75" fill="none" stroke="${SHIRT}" stroke-width="16" stroke-linecap="round"/>
        <!-- Shoulder/hip joint markers -->
        <circle class="joint-dot" cx="72" cy="75" r="4"/>
        <circle class="joint-dot" cx="125" cy="75" r="4"/>
        
        <!-- Shorts on spine -->
        <path d="M 88 72 L 112 72 L 112 80 L 88 80 Z" fill="${SHORTS}" opacity="0.8"/>
        
        <!-- Head that dips/rises -->
        <g class="cd-head">
          <ellipse cx="56" cy="68" rx="8" ry="7.5" fill="${SKIN}"/>
          <ellipse cx="53" cy="70" rx="2" ry="2.5" fill="${SKIN_S}"/>
          <!-- Face -->
          <path d="M 49 67 L 47 66.5 L 48.5 68" fill="none" stroke="${SKIN_S}" stroke-width="0.6" stroke-linecap="round"/>
          <ellipse cx="52" cy="66" rx="1" ry="0.6" fill="#2a2520"/>
          <!-- Hair -->
          <path d="M 56 60 C 62 60 64 64 64 68 C 64 72 62 74 58 74 L 56 72 C 60 72 62 70 62 68 C 62 64 60 62 56 62 Z" fill="${HAIR}"/>
          <path d="M 56 60 C 52 60 50 62 50 64 L 52 64 C 52 62 54 61 56 61 Z" fill="${HAIR}" opacity="0.8"/>
        </g>
        
        <text x="98" y="50" font-size="5" fill="${TEAL}" font-family="'DM Sans',sans-serif" text-anchor="middle" font-weight="600" opacity="0.7">ARCH & SAG</text>
      </svg>`;

    case 'circular_pendulum':
      /* Standing bent forward. Hanging arm swings. */
      return `<svg viewBox="0 0 200 120" style="${W}">
        ${floor}
        <!-- Table/support -->
        <path d="M 132 42 L 155 42 L 155 98" stroke="#b0ac9f" stroke-width="3.5" fill="none" stroke-linejoin="round"/>
        <path d="M 130 40 L 157 40 L 157 44 L 130 44 Z" fill="#c8c4bc" rx="1"/>
        
        <!-- Legs with proper contour -->
        <path d="M 110 72 Q 112 80 112 90 L 112 97 L 118 97 L 118 90 Q 118 80 118 72 Z" fill="${SKIN}"/>
        <path d="M 122 72 Q 124 80 124 90 L 124 97 L 130 97 L 130 90 Q 130 80 128 72 Z" fill="${SKIN}"/>
        ${shoeAt(115, 98)}${shoeAt(127, 98)}
        
        <!-- Shorts -->
        <path d="M 112 58 Q 118 56 128 58 L 128 74 Q 120 76 112 74 Z" fill="${SHORTS}"/>
        
        <!-- Torso bent forward -->
        <path d="M 78 42 Q 96 35 120 48 L 122 56 Q 100 44 80 50 Z" fill="${SHIRT}"/>
        <path d="M 48 82 Q 52 80 56 78" fill="none" stroke="${SHIRT_S}" stroke-width="0.3" opacity="0.5"/>
        
        <!-- Support arm on table -->
        <path d="M 120 48 L 148 42" stroke="${SKIN}" stroke-width="5" stroke-linecap="round"/>
        ${hand(150, 42, 0)}
        
        <!-- Head looking down -->
        <g>
          <ellipse cx="74" cy="42" rx="8" ry="7.5" fill="${SKIN}"/>
          <ellipse cx="71" cy="44" rx="2" ry="2.5" fill="${SKIN_S}"/>
          <path d="M 68 41 L 66 40.5 L 67.5 42" fill="none" stroke="${SKIN_S}" stroke-width="0.6" stroke-linecap="round"/>
          <ellipse cx="70" cy="40" rx="1" ry="0.6" fill="#2a2520"/>
          <path d="M 74 34 C 79 34 82 38 82 42 C 82 44 81 46 78 46 L 76 44 C 79 44 80 42 80 40 C 80 37 78 36 74 36 Z" fill="${HAIR}"/>
        </g>
        
        <!-- Circular guide (perspective ellipse) -->
        <ellipse class="rom-guide" cx="85" cy="86" rx="14" ry="5"/>
        <path class="rom-arrow" d="M 99 86 L 97 83 M 71 86 L 73 89"/>
        
        <!-- Hanging/swinging arm -->
        <circle class="joint-dot" cx="85" cy="50" r="3"/>
        <g class="cp-arm">
          <path class="cp-c" d="M 82 50 Q 83 66 83 78 L 87 78 Q 87 66 88 50 Z" fill="${SKIN}"/>
          ${hand(85, 82, 0)}
        </g>
        
        <text x="85" y="78" font-size="4.5" fill="${TEAL}" font-family="'DM Sans',sans-serif" text-anchor="middle" font-weight="600" opacity="0.7">SWING</text>
      </svg>`;

    case 'shoulder_flexion_overhead':
      /* Standing front view. Arm raises overhead. */
      return `<svg viewBox="0 0 200 120" style="${W}">
        <!-- Head -->
        <ellipse cx="100" cy="16" rx="9" ry="8.5" fill="${SKIN}"/>
        <ellipse cx="97" cy="18" rx="2" ry="2.5" fill="${SKIN_S}"/>
        <ellipse cx="96" cy="15" rx="1" ry="0.6" fill="#2a2520"/>
        <path d="M 94 13.5 Q 96 13 98 13.5" fill="none" stroke="#4a3728" stroke-width="0.5"/>
        <!-- Hair -->
        <path d="M 91 16 C 91 8 109 8 109 16 C 109 19 107 21 100 21 L 100 18 C 105 18 107 17 107 15 C 107 10 93 10 93 15 C 93 17 95 18 100 18 L 100 21 C 93 21 91 19 91 16 Z" fill="${HAIR}"/>
        
        <!-- Neck -->
        <path d="M 96 24 L 104 24 L 103 28 L 97 28 Z" fill="${SKIN}"/>
        
        <!-- Torso (shirt) -->
        <path d="M 88 28 L 112 28 Q 110 42 108 56 L 92 56 Q 90 42 88 28 Z" fill="${SHIRT}"/>
        <path d="M 95 35 Q 100 37 105 35" fill="none" stroke="${SHIRT_S}" stroke-width="0.3" opacity="0.5"/>
        
        <!-- Shorts -->
        <path d="M 92 56 L 108 56 Q 110 66 110 74 L 90 74 Q 90 66 92 56 Z" fill="${SHORTS}"/>
        
        <!-- Left leg (standing) -->
        <path d="M 90 74 Q 91 82 92 90 L 92 106 L 96 106 L 96 90 Q 95 82 94 74 Z" fill="${SKIN}"/>
        ${shoeAt(94, 107)}
        
        <!-- Right leg (standing) -->
        <path d="M 106 74 Q 107 82 108 90 L 108 106 L 104 106 L 104 90 Q 105 82 106 74 Z" fill="${SKIN}"/>
        ${shoeAt(106, 107)}
        
        <!-- Static left arm (hanging) -->
        <path d="M 82 30 Q 80 42 80 56 L 80 62" stroke="${SKIN}" stroke-width="4.5" stroke-linecap="round" fill="none"/>
        ${hand(80, 64, 0)}
        
        <!-- ROM Guide Arc (large, right side) -->
        <path class="rom-guide" d="M 120 64 A 34 34 0 0 1 120 4"/>
        <path class="rom-arrow" d="M 117 7 L 120 4 L 123 7"/>
        
        <!-- Animated right arm (raises overhead) -->
        <circle class="joint-dot" cx="112" cy="30" r="3"/>
        <g transform="translate(112,30)">
          <g class="sf-arm">
            <path class="sf-c" d="M -3 0 Q -2 14 -1 28 L 3 28 Q 2 14 3 0 Z" fill="${SKIN}"/>
            <ellipse cx="1" cy="16" rx="2" ry="2.5" fill="${SKIN}" stroke="${SKIN_S}" stroke-width="0.3"/>
            ${hand(1, 32, 0)}
          </g>
        </g>
        
        <text x="136" y="35" font-size="5" fill="${TEAL}" font-family="'DM Sans',sans-serif" text-anchor="middle" font-weight="600" opacity="0.7">RAISE</text>
      </svg>`;

    case 'neck_glide':
      /* Seated profile. Chin tuck. */
      return `<svg viewBox="0 0 200 120" style="${W}">
        <!-- Seated torso -->
        <path d="M 74 62 Q 86 58 92 64 L 92 78 Q 86 84 80 98 L 72 112 L 64 112 Q 72 84 74 62 Z" fill="${SHIRT}"/>
        <!-- Chair seat -->
        <path d="M 64 112 L 130 112 L 130 118 L 64 118 Z" fill="#c8c4bc"/>
        <path d="M 56 112 L 56 98" stroke="#b0ac9f" stroke-width="3" stroke-linecap="round"/>
        
        <!-- Horizontal glide guide -->
        <path class="rom-guide" d="M 118 32 L 104 32"/>
        <path class="rom-arrow" d="M 107 29 L 104 32 L 107 35"/>
        
        <!-- Neck + head (animated) -->
        <circle class="joint-dot" cx="80" cy="62" r="3.5"/>
        <g class="ng-neck">
          <path class="ng-c" d="M 77 62 L 83 62 L 82 42 L 78 42 Z" fill="${SKIN}"/>
          <g class="ng-head-group">
            <ellipse cx="80" cy="30" rx="12" ry="11" fill="${SKIN}"/>
            <ellipse cx="77" cy="32" rx="2" ry="2.5" fill="${SKIN_S}"/>
            <!-- Face -->
            <path d="M 90 28 L 94 28 L 91 30" fill="none" stroke="${SKIN_S}" stroke-width="0.7" stroke-linecap="round"/>
            <ellipse cx="88" cy="27" rx="1.2" ry="0.7" fill="#2a2520"/>
            <path d="M 86 25 Q 88 24.5 90 25" fill="none" stroke="#4a3728" stroke-width="0.6"/>
            <path d="M 88 31 Q 90 31.5 91 31" fill="none" stroke="#b8846a" stroke-width="0.5"/>
            <!-- Hair -->
            <path d="M 80 19 C 70 19 66 25 66 30 C 66 38 72 41 80 41 L 80 38 C 74 38 69 36 69 30 C 69 26 72 22 80 22 Z" fill="${HAIR}"/>
            <path d="M 80 19 C 86 19 90 22 92 25 L 90 26 C 88 23 85 21 80 21 Z" fill="${HAIR}" opacity="0.7"/>
          </g>
        </g>
        
        <!-- Arms resting -->
        <path d="M 88 68 Q 92 78 94 88 L 98 88 Q 96 78 92 68 Z" fill="${SKIN}"/>
        ${hand(96, 90, 20)}
        
        <text x="80" y="12" font-size="5.5" fill="${TEAL}" font-family="'DM Sans',sans-serif" text-anchor="middle" font-weight="600" opacity="0.7">TUCK CHIN</text>
      </svg>`;

    case 'neck_rotation':
      /* Seated profile. Head turns side to side. */
      return `<svg viewBox="0 0 200 120" style="${W}">
        <!-- Seated torso -->
        <path d="M 74 62 Q 86 58 92 64 L 92 78 Q 86 84 80 98 L 72 112 L 64 112 Q 72 84 74 62 Z" fill="${SHIRT}"/>
        <path d="M 64 112 L 130 112 L 130 118 L 64 118 Z" fill="#c8c4bc"/>
        <path d="M 56 112 L 56 98" stroke="#b0ac9f" stroke-width="3" stroke-linecap="round"/>
        
        <!-- Rotational guide arc -->
        <path class="rom-guide" d="M 68 16 Q 80 10 92 16"/>
        <path class="rom-arrow" d="M 71 15 L 68 16 L 70 19 M 89 19 L 92 16 L 89 15"/>
        
        <!-- Neck -->
        <path d="M 77 62 L 83 62 L 82 42 L 78 42 Z" fill="${SKIN}"/>
        <circle class="joint-dot" cx="80" cy="42" r="3"/>
        
        <!-- Animated head (nose flip) -->
        <g class="nr-nose">
          <ellipse cx="80" cy="30" rx="12" ry="11" fill="${SKIN}"/>
          <ellipse cx="77" cy="32" rx="2" ry="2.5" fill="${SKIN_S}"/>
          <!-- Face -->
          <path d="M 90 28 L 94 28 L 91 30" fill="none" stroke="${SKIN_S}" stroke-width="0.7" stroke-linecap="round"/>
          <ellipse cx="88" cy="27" rx="1.2" ry="0.7" fill="#2a2520"/>
          <path d="M 86 25 Q 88 24.5 90 25" fill="none" stroke="#4a3728" stroke-width="0.6"/>
          <!-- Hair -->
          <path d="M 80 19 C 70 19 66 25 66 30 C 66 38 72 41 80 41 L 80 38 C 74 38 69 36 69 30 C 69 26 72 22 80 22 Z" fill="${HAIR}"/>
          <path d="M 80 19 C 86 19 90 22 92 25 L 90 26 C 88 23 85 21 80 21 Z" fill="${HAIR}" opacity="0.7"/>
        </g>
        
        <!-- Arms resting -->
        <path d="M 88 68 Q 92 78 94 88 L 98 88 Q 96 78 92 68 Z" fill="${SKIN}"/>
        ${hand(96, 90, 20)}
        
        <text x="80" y="8" font-size="5.5" fill="${TEAL}" font-family="'DM Sans',sans-serif" text-anchor="middle" font-weight="600" opacity="0.7">TURN</text>
      </svg>`;

    case 'wrist_flexion_passive':
      /* Arm forward, hand bends down at wrist. */
      return `<svg viewBox="0 0 200 120" style="${W}">
        <!-- Forearm -->
        <path d="M 22 60 Q 50 56 80 60 Q 95 62 110 66 L 110 76 Q 95 78 80 76 Q 50 78 22 72 Z" fill="${SKIN}"/>
        <!-- Sleeve -->
        <path d="M 22 59 L 50 56 L 50 76 L 22 73 Z" fill="${SHIRT}"/>
        
        <!-- Wrist joint -->
        <ellipse cx="110" cy="71" rx="3.5" ry="4.5" fill="${SKIN}" stroke="${SKIN_S}" stroke-width="0.5"/>
        
        <!-- Other hand pressing down -->
        <path d="M 128 54 Q 130 60 128 66" stroke="${SKIN_S}" stroke-width="4" stroke-linecap="round" fill="none" opacity="0.5"/>
        ${hand(129, 56, 15)}
        
        <!-- Flexion Guide Arc -->
        <path class="rom-guide" d="M 140 71 A 30 30 0 0 1 135 90"/>
        <path class="rom-arrow" d="M 132 87 L 135 90 L 138 87"/>
        
        <!-- Animated hand bending down -->
        <g class="wf-hand">
          <path class="wf-c" d="M 110 65 Q 120 63 132 66 L 138 68 L 140 71 L 138 74 Q 128 76 110 76 Z" fill="${SKIN}"/>
          <!-- Fingers -->
          <path d="M 138 67 L 142 65" stroke="${SKIN}" stroke-width="1" stroke-linecap="round"/>
          <path d="M 139 69 L 144 67.5" stroke="${SKIN}" stroke-width="1" stroke-linecap="round"/>
          <path d="M 140 71 L 145 70.5" stroke="${SKIN}" stroke-width="0.9" stroke-linecap="round"/>
          <path d="M 139 73 L 143 73.5" stroke="${SKIN}" stroke-width="0.8" stroke-linecap="round"/>
          <!-- Thumb -->
          <path d="M 125 64 L 128 60" stroke="${SKIN}" stroke-width="1.1" stroke-linecap="round"/>
        </g>
        
        <text x="80" y="50" font-size="5.5" fill="${TEAL}" font-family="'DM Sans',sans-serif" text-anchor="middle" font-weight="600" opacity="0.7">FLEX DOWN</text>
      </svg>`;

    case 'wrist_extension_passive':
      /* Arm forward, hand bends up at wrist. */
      return `<svg viewBox="0 0 200 120" style="${W}">
        <!-- Forearm -->
        <path d="M 22 60 Q 50 56 80 60 Q 95 62 110 66 L 110 76 Q 95 78 80 76 Q 50 78 22 72 Z" fill="${SKIN}"/>
        <!-- Sleeve -->
        <path d="M 22 59 L 50 56 L 50 76 L 22 73 Z" fill="${SHIRT}"/>
        
        <!-- Wrist joint -->
        <ellipse cx="110" cy="71" rx="3.5" ry="4.5" fill="${SKIN}" stroke="${SKIN_S}" stroke-width="0.5"/>
        
        <!-- Other hand pressing up -->
        <path d="M 128 88 Q 130 82 128 76" stroke="${SKIN_S}" stroke-width="4" stroke-linecap="round" fill="none" opacity="0.5"/>
        ${hand(129, 86, -15)}
        
        <!-- Extension Guide Arc -->
        <path class="rom-guide" d="M 140 71 A 30 30 0 0 0 135 52"/>
        <path class="rom-arrow" d="M 132 55 L 135 52 L 138 55"/>
        
        <!-- Animated hand bending up -->
        <g class="we-hand">
          <path class="we-c" d="M 110 65 Q 120 63 132 66 L 138 68 L 140 71 L 138 74 Q 128 76 110 76 Z" fill="${SKIN}"/>
          <!-- Fingers -->
          <path d="M 138 67 L 142 65" stroke="${SKIN}" stroke-width="1" stroke-linecap="round"/>
          <path d="M 139 69 L 144 67.5" stroke="${SKIN}" stroke-width="1" stroke-linecap="round"/>
          <path d="M 140 71 L 145 70.5" stroke="${SKIN}" stroke-width="0.9" stroke-linecap="round"/>
          <path d="M 139 73 L 143 73.5" stroke="${SKIN}" stroke-width="0.8" stroke-linecap="round"/>
          <!-- Thumb -->
          <path d="M 125 64 L 128 60" stroke="${SKIN}" stroke-width="1.1" stroke-linecap="round"/>
        </g>
        
        <text x="80" y="50" font-size="5.5" fill="${TEAL}" font-family="'DM Sans',sans-serif" text-anchor="middle" font-weight="600" opacity="0.7">EXTEND UP</text>
      </svg>`;

    case 'grip_strengthening':
      /* Hand squeezing ball with visible fingers wrapping. */
      return `<svg viewBox="0 0 200 120" style="${W}">
        <!-- Forearm -->
        <path d="M 22 55 Q 50 52 80 56 Q 95 58 105 62 L 105 72 Q 95 74 80 72 Q 50 74 22 70 Z" fill="${SKIN}"/>
        <!-- Sleeve -->
        <path d="M 22 54 L 50 52 L 50 72 L 22 71 Z" fill="${SHIRT}"/>
        
        <!-- Force ripples radiating from ball -->
        <circle class="grip-ripple" cx="128" cy="65" r="16" fill="none" stroke="#ef4444" stroke-width="1.5" opacity="0.5"/>
        <circle class="grip-ripple" cx="128" cy="65" r="20" fill="none" stroke="#ef4444" stroke-width="1" opacity="0.3" style="animation-delay: 0.5s;"/>
        
        <!-- Squeeze ball -->
        <circle class="grip-ball" cx="128" cy="65" r="12" fill="#ef4444"/>
        <ellipse cx="128" cy="65" rx="8" ry="5" fill="#f87171" opacity="0.4"/>
        
        <!-- Fingers wrapping around ball -->
        <g class="grip-fingers">
          <!-- Index finger -->
          <path d="M 105 58 C 110 52 120 51 128 54 L 130 56" fill="none" stroke="${SKIN}" stroke-width="3" stroke-linecap="round"/>
          <!-- Middle finger -->
          <path d="M 105 62 C 112 56 122 56 132 60" fill="none" stroke="${SKIN}" stroke-width="3" stroke-linecap="round"/>
          <!-- Ring finger -->
          <path d="M 105 68 C 112 74 122 74 132 70" fill="none" stroke="${SKIN}" stroke-width="3" stroke-linecap="round"/>
          <!-- Pinky -->
          <path d="M 105 72 C 110 78 120 79 128 76" fill="none" stroke="${SKIN}" stroke-width="2.5" stroke-linecap="round"/>
          <!-- Thumb (from top) -->
          <path d="M 108 56 C 112 50 118 48 122 50" fill="none" stroke="${SKIN}" stroke-width="3.5" stroke-linecap="round"/>
        </g>
        
        <text x="128" y="46" font-size="5.5" fill="${TEAL}" font-family="'DM Sans',sans-serif" text-anchor="middle" font-weight="600" opacity="0.7">SQUEEZE</text>
      </svg>`;

    default:
      return `<svg viewBox="0 0 200 120" style="${W}">
        <rect x="20" y="20" width="160" height="80" rx="12" fill="#faf9f5" stroke="${BONE}" stroke-width="1"/>
        <text x="100" y="55" font-size="11" fill="#b0ac9f" text-anchor="middle" font-family="'DM Sans',sans-serif" font-weight="500">Exercise</text>
        <text x="100" y="70" font-size="9" fill="#d5d0c8" text-anchor="middle" font-family="'DM Mono',monospace">Animation</text>
      </svg>`;
  }
}
