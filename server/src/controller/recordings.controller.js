import Recording from '../models/recording.model.js';
import { asyncHandler } from '../Utils/asyncHandler.js';

export const getUserRecordings = asyncHandler(async (req, res) => {
  const recordings = await Recording.find({ userId: req.params.userId })
    .sort({ createdAt: -1 })
    .select('transcript clinicalNote metadata processingStatus createdAt');
  
  res.json({ success: true, data: recordings });
});

export const getPatientVisits = asyncHandler(async (req, res) => {
  const recordings = await Recording.find({ patientId: req.params.patientId })
    .sort({ createdAt: -1 })
    .select('transcript clinicalNote metadata processingStatus createdAt vitals _id');
  
  const visits = recordings.map(r => ({
    _id: r._id,
    date: r.createdAt,
    transcript: r.transcript?.text || '',
    labeledTranscript: r.transcript?.labeledText || r.transcript?.text || '',
    plainTranscript: r.transcript?.text || '',
    note: r.clinicalNote,
    vitals: r.vitals || {},
  }));

  res.json({ success: true, visits });
});

export const getPatientSessions = asyncHandler(async (req, res) => {
  const { patientId } = req.params;
  
  const recordings = await Recording.find({ patientId })
    .sort({ createdAt: -1 })
    .select('transcript clinicalNote metadata processingStatus createdAt vitals _id');
  
  const sessions = recordings.map(r => ({
    _id: r._id,
    createdAt: r.createdAt,
    date: r.createdAt,
    transcript: r.transcript?.text || '',
    labeledTranscript: r.transcript?.labeledText || r.transcript?.text || '',
    plainTranscript: r.transcript?.text || '',
    note: r.clinicalNote,
    vitals: r.vitals || {},
  }));

  res.json({ success: true, sessions });
});

export const getRecordingById = asyncHandler(async (req, res) => {
  const recording = await Recording.findById(req.params.recordingId);
  
  if (!recording) {
    return res.status(404).json({ success: false, error: 'Recording not found' });
  }

  res.json({ success: true, data: recording });
});

export const updateRecordingNote = asyncHandler(async (req, res) => {
  const { clinicalNote, processingStatus } = req.body;

  if (!clinicalNote) {
    return res.status(400).json({ success: false, error: 'Clinical note is required' });
  }

  const recording = await Recording.findByIdAndUpdate(
    req.params.recordingId,
    { clinicalNote, processingStatus: processingStatus || 'completed' },
    { new: true }
  );

  if (!recording) {
    return res.status(404).json({ success: false, error: 'Recording not found' });
  }

  res.json({ success: true, data: recording });
});

export const updateRecordingVitals = asyncHandler(async (req, res) => {
  const { vitals } = req.body;

  if (!vitals) {
    return res.status(400).json({ success: false, error: 'Vitals data is required' });
  }

  const recording = await Recording.findByIdAndUpdate(
    req.params.recordingId,
    { vitals },
    { new: true }
  );

  if (!recording) {
    return res.status(404).json({ success: false, error: 'Recording/session not found' });
  }

  res.json({ success: true, data: recording, vitals: recording.vitals });
});

export const deleteRecording = asyncHandler(async (req, res) => {
  const recording = await Recording.findByIdAndDelete(req.params.recordingId);
  
  if (!recording) {
    return res.status(404).json({ success: false, error: 'Recording not found' });
  }

  res.json({ success: true, message: 'Recording deleted' });
});

export const archiveRecording = asyncHandler(async (req, res) => {
  const recording = await Recording.findByIdAndUpdate(
    req.params.recordingId,
    { isArchived: true },
    { new: true }
  );
  
  res.json({ success: true, data: recording });
});

export const searchRecordings = asyncHandler(async (req, res) => {
  const { q } = req.query;
  
  const recordings = await Recording.find({
    userId: req.params.userId,
    $or: [
      { 'transcript.text': { $regex: q, $options: 'i' } },
      { 'clinicalNote.diagnosis': { $regex: q, $options: 'i' } },
      { 'clinicalNote.chief_complaint': { $regex: q, $options: 'i' } },
    ],
  });

  res.json({ success: true, data: recordings });
});
