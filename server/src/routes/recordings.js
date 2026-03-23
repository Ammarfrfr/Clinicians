import express from 'express';
import Recording from '../models/recording.model.js';

const router = express.Router();

// GET all recordings for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const recordings = await Recording.find({ userId: req.params.userId })
      .sort({ createdAt: -1 })
      .select('transcript clinicalNote metadata processingStatus createdAt');
    
    res.json({ success: true, data: recordings });
  } catch (err) {
    console.error('Error fetching recordings:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET past visits (recordings/sessions) for a specific patient
router.get('/patient/:patientId/visits', async (req, res) => {
  try {
    const recordings = await Promise.race([
      Recording.find({ patientId: req.params.patientId })
        .sort({ createdAt: -1 })
        .select('transcript clinicalNote metadata processingStatus createdAt vitals _id')
        .exec(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('MongoDB timeout')), 5000)
      )
    ]);
    
    // Format for frontend display
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
  } catch (err) {
    console.error('Error fetching patient visits:', err.message);
    // Fallback: return empty visits if MongoDB is down
    res.json({ success: true, visits: [] });
  }
});

// GET all sessions for a patient
router.get('/patients/:patientId/sessions', async (req, res) => {
  try {
    const patientId = req.params.patientId;
    
    console.log('Fetching sessions for patientId:', patientId);
    
    const recordings = await Recording.find({ patientId: patientId })
      .sort({ createdAt: -1 })
      .select('transcript clinicalNote metadata processingStatus createdAt vitals _id')
      .exec();
    
    console.log('Found recordings:', recordings.length);
    
    // Format for frontend display
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

    console.log('Formatted sessions:', sessions.map(s => ({
      _id: s._id,
      hasLabeledTranscript: !!s.labeledTranscript,
      transcriptLength: s.labeledTranscript?.length || 0,
      hasNote: !!s.note
    })));

    res.json({ success: true, sessions });
  } catch (err) {
    console.error('Error fetching patient sessions:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET single recording by ID
router.get('/:recordingId', async (req, res) => {
  try {
    const recording = await Recording.findById(req.params.recordingId);
    
    if (!recording) {
      return res.status(404).json({ success: false, error: 'Recording not found' });
    }

    res.json({ success: true, data: recording });
  } catch (err) {
    console.error('Error fetching recording:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// UPDATE clinical note for a recording (edit note)
router.patch('/:recordingId/note', async (req, res) => {
  try {
    const { clinicalNote, processingStatus } = req.body;
    const recordingId = req.params.recordingId;

    if (!clinicalNote) {
      return res.status(400).json({ success: false, error: 'Clinical note is required' });
    }

    const recording = await Recording.findByIdAndUpdate(
      recordingId,
      { clinicalNote, processingStatus: processingStatus || 'completed' },
      { new: true }
    );

    if (!recording) {
      return res.status(404).json({ success: false, error: 'Recording not found' });
    }

    res.json({ success: true, data: recording });
  } catch (err) {
    console.error('Error updating recording note:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// UPDATE vitals for a recording/session
router.patch('/:recordingId/vitals', async (req, res) => {
  try {
    const { vitals } = req.body;
    const recordingId = req.params.recordingId;

    if (!vitals) {
      return res.status(400).json({ success: false, error: 'Vitals data is required' });
    }

    const recording = await Recording.findByIdAndUpdate(
      recordingId,
      { vitals },
      { new: true }
    );

    if (!recording) {
      return res.status(404).json({ success: false, error: 'Recording/session not found' });
    }

    res.json({ success: true, data: recording, vitals: recording.vitals });
  } catch (err) {
    console.error('Error updating vitals:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE recording
router.delete('/:recordingId', async (req, res) => {
  try {
    const recording = await Recording.findByIdAndDelete(req.params.recordingId);
    
    if (!recording) {
      return res.status(404).json({ success: false, error: 'Recording not found' });
    }

    res.json({ success: true, message: 'Recording deleted' });
  } catch (err) {
    console.error('Error deleting recording:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ARCHIVE recording
router.patch('/:recordingId/archive', async (req, res) => {
  try {
    const recording = await Recording.findByIdAndUpdate(
      req.params.recordingId,
      { isArchived: true },
      { new: true }
    );
    
    res.json({ success: true, data: recording });
  } catch (err) {
    console.error('Error archiving recording:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// SEARCH recordings by transcript or diagnosis
router.get('/search/:userId', async (req, res) => {
  try {
    const { q } = req.query; // Search query
    
    const recordings = await Recording.find({
      userId: req.params.userId,
      $or: [
        { 'transcript.text': { $regex: q, $options: 'i' } },
        { 'clinicalNote.diagnosis': { $regex: q, $options: 'i' } },
        { 'clinicalNote.chief_complaint': { $regex: q, $options: 'i' } },
      ],
    });

    res.json({ success: true, data: recordings });
  } catch (err) {
    console.error('Error searching recordings:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
