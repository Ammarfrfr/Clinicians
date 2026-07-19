/**
 * Exercise Animations — Frontend utility for NotePanel.
 * Re-exports the SVG and CSS from server-side exerciseAnimations.js
 * adapted for React/browser use.
 * 
 * Photo mappings for the free-exercise-db toggle.
 */

const PHOTO_CDN_BASE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises';

const exercisePhotoMap = {
  'bridging': { dbId: 'Butt_Lift_Bridge', exact: true, label: 'Bridge / Hip Raise' },
  'cats_and_dogs': { dbId: 'Cat_Stretch', exact: true, label: 'Cat Stretch' },
  'ankle_pumps': { dbId: 'Ankle_Circles', exact: false, label: 'Ankle Circles (similar)' },
  'knee_to_chest': { dbId: 'Bent-Knee_Hip_Raise', exact: false, label: 'Bent-Knee Hip Raise (similar)' },
  'gluteal_squeezes': { dbId: 'Barbell_Glute_Bridge', exact: false, label: 'Glute Bridge (similar)' },
  'wrist_flexion_passive': { dbId: 'Cable_Wrist_Curl', exact: false, label: 'Wrist Curl (similar)' }
};

/**
 * Get photo URLs for a given exercise ID.
 * Returns null if no mapping exists.
 */
export function getPhotoUrls(exerciseId) {
  const mapping = exercisePhotoMap[exerciseId];
  if (!mapping) return null;
  return {
    start: `${PHOTO_CDN_BASE}/${mapping.dbId}/0.jpg`,
    end: `${PHOTO_CDN_BASE}/${mapping.dbId}/1.jpg`,
    exact: mapping.exact,
    label: mapping.label
  };
}
