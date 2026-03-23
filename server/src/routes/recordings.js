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
