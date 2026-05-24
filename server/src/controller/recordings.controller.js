import { Recording } from '../models/recording.model.js';
import { asyncHandler } from '../Utils/asyncHandler.js';
import { ApiError } from '../Utils/ApiError.js';
import { ApiResponse } from '../Utils/ApiResponse.js';

export const getUserRecordings = asyncHandler(async (req, res) => {
  const recordings = await Recording.find({ userId: req.user._id.toString() })
    .sort({ createdAt: -1 })
    .select('transcript clinicalNote metadata processingStatus createdAt');
  
  return res
    .status(200)
    .json(new ApiResponse(200, recordings, 'User recordings fetched successfully'));
});

export const getPatientVisits = asyncHandler(async (req, res) => {
  const recordings = await Recording.find({ patientId: req.params.patientId, userId: req.user._id.toString() })
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

  return res
    .status(200)
    .json(new ApiResponse(200, visits, 'Patient visits fetched successfully'));
});

export const getPatientSessions = asyncHandler(async (req, res) => {
  const { patientId } = req.params;
  const { all } = req.query;
  
  const filter = { patientId, userId: req.user._id.toString() };
  if (all !== 'true') {
    filter.isFinalized = true;
  }

  const recordings = await Recording.find(filter)
    .sort({ createdAt: -1 })
    .select('transcript clinicalNote metadata processingStatus createdAt vitals followUpTodos tags _id isFinalized');
  
  const sessions = recordings.map(r => ({
    _id: r._id,
    createdAt: r.createdAt,
    date: r.createdAt,
    transcript: r.transcript?.text || '',
    labeledTranscript: r.transcript?.labeledText || r.transcript?.text || '',
    plainTranscript: r.transcript?.text || '',
    note: r.clinicalNote,
    vitals: r.vitals || {},
    followUpTodos: r.followUpTodos || [],
    tags: r.tags || [],
    isFinalized: r.isFinalized || false,
  }));

  return res
    .status(200)
    .json(new ApiResponse(200, sessions, 'Patient sessions fetched successfully'));
});

export const getRecordingById = asyncHandler(async (req, res) => {
  const recording = await Recording.findOne({ _id: req.params.recordingId, userId: req.user._id.toString() });
  
  if (!recording) {
    throw new ApiError(404, 'Recording not found');
  }

  return res
    .status(200)
    .json(new ApiResponse(200, recording, 'Recording fetched successfully'));
});

export const updateRecordingNote = asyncHandler(async (req, res) => {
  const { clinicalNote, processingStatus, isFinalized } = req.body;

  if (!clinicalNote) {
    throw new ApiError(400, 'Clinical note is required');
  }

  const updateFields = { clinicalNote, processingStatus: processingStatus || 'completed' };
  if (isFinalized !== undefined) {
    updateFields.isFinalized = isFinalized;
  }

  const recording = await Recording.findOneAndUpdate(
    { _id: req.params.recordingId, userId: req.user._id.toString() },
    updateFields,
    { returnDocument: 'after' }
  );

  if (!recording) {
    throw new ApiError(404, 'Recording not found');
  }

  return res
    .status(200)
    .json(new ApiResponse(200, recording, 'Recording note updated successfully'));
});

export const updateRecordingVitals = asyncHandler(async (req, res) => {
  const { vitals } = req.body;

  if (!vitals) {
    throw new ApiError(400, 'Vitals data is required');
  }

  const recording = await Recording.findOneAndUpdate(
    { _id: req.params.recordingId, userId: req.user._id.toString() },
    { vitals },
    { new: true }
  );

  if (!recording) {
    throw new ApiError(404, 'Recording/session not found');
  }

  return res
    .status(200)
    .json(new ApiResponse(200, recording, 'Recording vitals updated successfully'));
});

export const deleteRecording = asyncHandler(async (req, res) => {
  const recording = await Recording.findOneAndDelete({ _id: req.params.recordingId, userId: req.user._id.toString() });
  
  if (!recording) {
    throw new ApiError(404, 'Recording not found');
  }

  return res
    .status(200)
    .json(new ApiResponse(200, null, 'Recording deleted successfully'));
});

export const archiveRecording = asyncHandler(async (req, res) => {
  const recording = await Recording.findOneAndUpdate(
    { _id: req.params.recordingId, userId: req.user._id.toString() },
    { isArchived: true },
    { new: true }
  );
  
  return res
    .status(200)
    .json(new ApiResponse(200, recording, 'Recording archived successfully'));
});

export const searchRecordings = asyncHandler(async (req, res) => {
  const { q } = req.query;
  
  const recordings = await Recording.find({
    userId: req.user._id.toString(),
    $or: [
      { 'transcript.text': { $regex: q, $options: 'i' } },
      { 'clinicalNote.diagnosis': { $regex: q, $options: 'i' } },
      { 'clinicalNote.chief_complaint': { $regex: q, $options: 'i' } },
    ],
  });

  return res
    .status(200)
    .json(new ApiResponse(200, recordings, 'Recordings searched successfully'));
});

export const updateFollowUp = asyncHandler(async (req, res) => {
  const { scheduledFollowUp } = req.body;

  const recording = await Recording.findOneAndUpdate(
    { _id: req.params.recordingId, userId: req.user._id.toString() },
    { scheduledFollowUp: scheduledFollowUp || null },
    { new: true }
  );

  if (!recording) {
    throw new ApiError(404, 'Recording not found');
  }

  return res
    .status(200)
    .json(new ApiResponse(200, recording, 'Recording follow-up updated successfully'));
});

export const getUpcomingFollowUps = asyncHandler(async (req, res) => {
  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const query = {
    userId: req.user._id.toString(),
    scheduledFollowUp: { $gte: now, $lte: nextWeek },
  };

  if (req.query.patientIds) {
    query.patientId = { $in: req.query.patientIds.split(',') };
  }

  const recordings = await Recording.find(query).sort({ scheduledFollowUp: 1 });

  return res
    .status(200)
    .json(new ApiResponse(200, recordings, 'Upcoming follow-ups fetched successfully'));
});

export const updateFollowUpTodos = asyncHandler(async (req, res) => {
  const { todos } = req.body;

  if (!Array.isArray(todos)) {
    throw new ApiError(400, 'Todos must be an array');
  }

  const recording = await Recording.findOneAndUpdate(
    { _id: req.params.recordingId, userId: req.user._id.toString() },
    { followUpTodos: todos },
    { new: true }
  );

  if (!recording) {
    throw new ApiError(404, 'Recording not found');
  }

  return res
    .status(200)
    .json(new ApiResponse(200, recording.followUpTodos, 'Follow-up todos updated successfully'));
});

export const createManualVisit = asyncHandler(async (req, res) => {
  const { patientId, clinicalNote, tags } = req.body;

  const recording = new Recording({
    userId: req.user._id.toString(),
    patientId: patientId || null,
    transcript: {
      text: clinicalNote?.notes || '',
      labeledText: clinicalNote?.notes || '',
      utterances: [],
      language: 'en',
      hasSpokenLabels: false,
    },
    clinicalNote: {
      chief_complaint: clinicalNote?.chief_complaint || '',
      history: clinicalNote?.history || '',
      examination: clinicalNote?.examination || '',
      diagnosis: clinicalNote?.diagnosis || '',
      prescription: clinicalNote?.prescription || [],
      followup: clinicalNote?.followup || '',
      notes: clinicalNote?.notes || '',
    },
    tags: tags || ['Medication'],
    metadata: {
      recordedAt: new Date(),
      recordingDuration: 0,
      deviceInfo: req.get('user-agent'),
      ipAddress: req.ip,
    },
    processingStatus: 'completed',
    isFinalized: true, // Mark as finalized immediately since it's manually saved
  });

  const savedRecording = await recording.save();

  return res
    .status(201)
    .json(new ApiResponse(201, savedRecording, 'Visit saved successfully'));
});
