import express from 'express';
import multer from 'multer';
import Groq from 'groq-sdk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Recording from '../models/recording.model.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Fallback function to generate a clinical note from transcript without LLM
function generateFallbackNote(transcript) {
  return {
    chief_complaint: transcript.substring(0, 100) || 'Patient consultation',
    history: transcript.substring(0, 200) || 'See transcript for details',
    examination: 'See transcript for examination findings',
    diagnosis: 'Based on transcript review',
    prescription: [],
    followup: 'Follow up as clinically indicated. Review transcript for details.'
  };
}

router.post('/analyze', upload.single('audio'), async (req, res) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      console.error('No audio file received');
      return res.status(400).json({ success: false, error: 'No audio file provided' });
    }

    console.log('Received audio file:', req.file.originalname, 'Size:', req.file.size);

    // Initialize Groq here (after env vars are loaded)
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    // Save buffer to temp file — Groq needs a real file, not a buffer
    const tempPath = path.join(__dirname, 'temp_audio.webm');
    fs.writeFileSync(tempPath, req.file.buffer);
    console.log('Saved temp file:', tempPath);

    // STEP 1 — Transcribe with Groq Whisper
    console.log('Starting transcription with Groq Whisper...');
    const transcription = await groq.audio.transcriptions.create({
      file: fs.createReadStream(tempPath),
      model: 'whisper-large-v3',
      language: 'en',
    });

    // Delete temp file
    fs.unlinkSync(tempPath);
    console.log('Temp file deleted');

    const transcript = transcription.text;
    console.log('Transcription complete. Transcript:', transcript);

    if (!transcript || transcript.trim().length === 0) {
      console.error('Transcription resulted in empty text');
      return res.status(400).json({ success: false, error: 'No speech detected in audio' });
    }

    // STEP 2 — Structure with LLaMA via Groq (with fallback)
    console.log('Processing transcript into clinical note...');
    
    let note;
    
    // Try Groq LLM if model is configured, otherwise use fallback
    const llmModel = process.env.LLM_MODEL;
    
    if (llmModel) {
      console.log('Using LLM model:', llmModel);
      try {
        const response = await groq.chat.completions.create({
          model: llmModel,
          messages: [
            {
              role: 'system',
              content: `You are a clinical documentation assistant for Indian doctors. 
Return ONLY valid JSON, no extra text, no markdown backticks.`
            },
            {
              role: 'user',
              content: `Convert this consultation transcript into a clinical note.
Return ONLY this JSON structure:
{
  "chief_complaint": "string",
  "history": "string",
  "examination": "string",
  "diagnosis": "string",
  "prescription": [{ "drug": "string", "dose": "string" }],
  "followup": "string"
}

Transcript: ${transcript}`
            }
          ],
        });

        const raw = response.choices[0].message.content;
        console.log('LLaMA response:', raw);
        
        try {
          note = JSON.parse(raw);
          console.log('Successfully parsed note JSON');
        } catch (parseErr) {
          console.error('Failed to parse LLaMA response as JSON:', parseErr);
          note = generateFallbackNote(transcript);
        }
      } catch (llmErr) {
        console.error('LLM error:', llmErr.message);
        // If LLM fails, use fallback
        note = generateFallbackNote(transcript);
      }
    } else {
      console.log('No LLM_MODEL configured, using fallback clinical note generation');
      note = generateFallbackNote(transcript);
    }

    console.log('Sending response to client');
    
    // Save recording to MongoDB
    try {
      const recording = new Recording({
        userId: req.body.userId || 'anonymous',
        audioFile: {
          filename: req.file.originalname,
          fileSize: req.file.size,
          mimeType: req.file.mimetype,
          path: `/uploads/recordings/${Date.now()}_${req.file.originalname}`,
        },
        transcript: {
          text: transcript,
          language: 'en',
          confidence: 0.95,
        },
        clinicalNote: note,
        metadata: {
          recordedAt: new Date(),
          recordingDuration: req.body.recordingDuration || 0,
          deviceInfo: req.get('user-agent'),
          ipAddress: req.ip,
        },
        processingStatus: 'completed',
      });

      const savedRecording = await recording.save();
      console.log('Recording saved to MongoDB:', savedRecording._id);

      res.json({ 
        success: true, 
        transcript, 
        note,
        recordingId: savedRecording._id 
      });
    } catch (mongoErr) {
      console.error('Error saving to MongoDB:', mongoErr);
      res.json({ 
        success: true, 
        transcript, 
        note,
        warning: 'Data processed but not saved to database'
      });
    }

  } catch (err) {
    console.error('Top-level error in /analyze:', err);
    // If the error is a Groq model deprecation, return a clear message so
    // the developer can change the model in `.env` (LLM_MODEL).
    const msg = err?.message || '';
    if (msg.includes('model_decommissioned')) {
      return res.status(503).json({
        success: false,
        error: `Model decommissioned. Set a supported model in server .env (LLM_MODEL). See https://console.groq.com/docs/deprecations for options.`,
      });
    }

    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;