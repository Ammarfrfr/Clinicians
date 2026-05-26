/**
 * Offline Queue — saves failed recording uploads to IndexedDB
 * and syncs them when connectivity resumes.
 *
 * This is the main-thread counterpart to the Background Sync logic
 * in the service worker (sw.js). For browsers that don't support
 * Background Sync, this module provides manual sync capabilities.
 */

const DB_NAME = 'qalam-offline';
const DB_VERSION = 1;
const STORE_NAME = 'pending-recordings';

/**
 * Open (or create) the IndexedDB database.
 */
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Save a recording to the offline queue.
 *
 * @param {Blob} audioBlob - The audio blob that failed to upload.
 * @param {string|null} patientId - The patient ID for this recording.
 * @param {object} metadata - Additional metadata (templateSections, etc.)
 */
export async function saveRecordingOffline(audioBlob, patientId, metadata = {}) {
  try {
    const db = await openDB();

    // Convert blob to ArrayBuffer for IndexedDB storage
    const arrayBuffer = await audioBlob.arrayBuffer();

    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    store.add({
      audioData: arrayBuffer,
      mimeType: audioBlob.type || 'audio/webm',
      patientId: patientId || null,
      metadata,
      savedAt: new Date().toISOString(),
    });

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => {
        console.log('📦 Recording saved offline successfully');
        // Request background sync if available
        if ('serviceWorker' in navigator && 'SyncManager' in window) {
          navigator.serviceWorker.ready.then((reg) => {
            reg.sync.register('sync-recordings').catch(() => {});
          });
        }
        resolve(true);
      };
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error('Failed to save recording offline:', err);
    return false;
  }
}

/**
 * Get the count of pending offline recordings.
 */
export async function getPendingCount() {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const countReq = store.count();

    return new Promise((resolve) => {
      countReq.onsuccess = () => resolve(countReq.result);
      countReq.onerror = () => resolve(0);
    });
  } catch {
    return 0;
  }
}

/**
 * Get all pending offline recordings.
 */
export async function getAllPending() {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const getAllReq = store.getAll();

    return new Promise((resolve) => {
      getAllReq.onsuccess = () => resolve(getAllReq.result || []);
      getAllReq.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

/**
 * Remove a successfully synced recording from the offline queue.
 */
export async function removeFromQueue(id) {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(id);

    return new Promise((resolve) => {
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
}

/**
 * Manually sync all pending offline recordings.
 * Called when the browser regains connectivity.
 *
 * @param {function} apiClient - The axios instance with auth headers.
 * @returns {{ synced: number, failed: number }}
 */
export async function syncPendingRecordings(apiClient) {
  const pending = await getAllPending();
  if (pending.length === 0) return { synced: 0, failed: 0 };

  let synced = 0;
  let failed = 0;

  for (const item of pending) {
    try {
      // Reconstruct Blob from ArrayBuffer
      const audioBlob = new Blob([item.audioData], { type: item.mimeType });
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      if (item.patientId) formData.append('patientId', item.patientId);
      if (item.metadata?.templateSections) {
        formData.append('templateSections', JSON.stringify(item.metadata.templateSections));
      }

      await apiClient.post('/api/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      await removeFromQueue(item.id);
      synced++;
      console.log(`✅ Synced offline recording #${item.id}`);
    } catch (err) {
      console.error(`❌ Failed to sync recording #${item.id}:`, err);
      failed++;
    }
  }

  return { synced, failed };
}
