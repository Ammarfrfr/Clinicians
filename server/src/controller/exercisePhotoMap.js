/**
 * Exercise Photo Mapping — maps our ortho exercise IDs to the free-exercise-db
 * (https://github.com/yuhonas/free-exercise-db)
 * 
 * MIT licensed, no API key, images hotlinked from GitHub CDN.
 */

export const PHOTO_CDN_BASE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises';

export const exercisePhotoMap = {
  'bridging': {
    dbId: 'Butt_Lift_Bridge',
    exact: true,
    label: 'Bridge / Hip Raise'
  },
  'cats_and_dogs': {
    dbId: 'Cat_Stretch',
    exact: true,
    label: 'Cat Stretch'
  },
  'ankle_pumps': {
    dbId: 'Ankle_Circles',
    exact: false,
    label: 'Ankle Circles (similar)'
  },
  'knee_to_chest': {
    dbId: 'Bent-Knee_Hip_Raise',
    exact: false,
    label: 'Bent-Knee Hip Raise (similar)'
  },
  'gluteal_squeezes': {
    dbId: 'Barbell_Glute_Bridge',
    exact: false,
    label: 'Glute Bridge (similar)'
  },
  'wrist_flexion_passive': {
    dbId: 'Cable_Wrist_Curl',
    exact: false,
    label: 'Wrist Curl (similar)'
  }
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

/**
 * Generate the HTML for the photo toggle section.
 * Used server-side in share.controller.js
 */
export function getPhotoHTML(exerciseId) {
  const photos = getPhotoUrls(exerciseId);
  if (!photos) return '';

  const btnLabel = photos.exact ? '📷 See Real Demo' : '📷 See Similar Exercise';
  
  return `
    <div class="photo-toggle-section">
      <input type="checkbox" id="photo-toggle-${exerciseId}" class="photo-checkbox" hidden />
      <label for="photo-toggle-${exerciseId}" class="photo-toggle-btn">${btnLabel}</label>
      <div class="photo-panel">
        <div class="photo-grid">
          <div class="photo-card">
            <img src="${photos.start}" alt="Start position" loading="lazy" />
            <span class="photo-label">Start Position</span>
          </div>
          <div class="photo-card">
            <img src="${photos.end}" alt="End position" loading="lazy" />
            <span class="photo-label">End Position</span>
          </div>
        </div>
        ${!photos.exact ? `<div class="photo-note">💡 Showing a similar exercise for visual reference</div>` : ''}
      </div>
    </div>
  `;
}
