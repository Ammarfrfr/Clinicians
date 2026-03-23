// In-memory store for temporary recordings when MongoDB is unavailable
const tempRecordings = new Map();
let syncInProgress = false;

export function storeTemporaryRecording(recordingData) {
  const id = recordingData._id;
  tempRecordings.set(id, recordingData);
  console.log('Stored temporary recording:', id);
  return id;
}

export function getTemporaryRecording(recordingId) {
  return tempRecordings.get(recordingId);
}

export function updateTemporaryRecording(recordingId, updates) {
  const recording = tempRecordings.get(recordingId);
  if (!recording) {
    return null;
  }
  const updated = { ...recording, ...updates, updatedAt: new Date() };
  tempRecordings.set(recordingId, updated);
  return updated;
}

export function getAllTemporaryRecordingsForPatient(patientId) {
  return Array.from(tempRecordings.values()).filter(
    recording => recording.patientId === patientId
  );
}

export function getAllTemporaryRecordings() {
  return Array.from(tempRecordings.values());
}

export function deleteTemporaryRecording(recordingId) {
  return tempRecordings.delete(recordingId);
}

export function clearTemporaryRecording(recordingId) {
  tempRecordings.delete(recordingId);
  console.log('Cleared temporary recording from memory:', recordingId);
}

// Sync temporary recordings to MongoDB when it becomes available
export async function syncTemporaryRecordingsToMongoDB(RecordingModel) {
  if (syncInProgress || tempRecordings.size === 0) {
    return;
  }
  
  syncInProgress = true;
  console.log('Starting sync of temporary recordings to MongoDB...');
  
  try {
    const tempRecordingsList = Array.from(tempRecordings.values());
    
    for (const tempRecord of tempRecordingsList) {
      try {
        // Remove the temporary ID marker and isTemporary flag
        const { _id, isTemporary, ...recordingData } = tempRecord;
        
        // Create a new MongoDB recording without the temp _id
        const newRecording = new RecordingModel(recordingData);
        const savedRecording = await newRecording.save();
        
        console.log(`✅ Synced temporary recording to MongoDB:`, {
          tempId: _id,
          mongoId: savedRecording._id,
          patientId: savedRecording.patientId
        });
        
        // Remove from temporary store after successful sync
        tempRecordings.delete(_id);
      } catch (err) {
        console.error(`Failed to sync temporary recording ${tempRecord._id}:`, err.message);
        // Continue trying other recordings even if one fails
      }
    }
    
    if (tempRecordings.size === 0) {
      console.log('✅ All temporary recordings synced to MongoDB successfully!');
    } else {
      console.log(`⚠️ Some temporary recordings remain (${tempRecordings.size} left)`);
    }
  } catch (err) {
    console.error('Error during temporary recordings sync:', err.message);
  } finally {
    syncInProgress = false;
  }
}

export { tempRecordings };
