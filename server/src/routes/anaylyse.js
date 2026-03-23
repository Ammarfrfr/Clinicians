import express from 'express';
import multer from 'multer';
import Groq from 'groq-sdk';
import { AssemblyAI } from 'assemblyai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Recording from '../models/recording.model.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Initialize AssemblyAI client - will use env var loaded by parent
let client;

function getAssemblyAIClient() {
  if (!client) {
    const apiKey = process.env.ASSEMBLYAI_API_KEY;
    if (!apiKey) {
      throw new Error('ASSEMBLYAI_API_KEY not configured in .env');
    }
    client = new AssemblyAI({ apiKey });
  }
  return client;
}

// Format speaker-labeled transcript
function formatLabeledTranscript(utterances) {
  if (!utterances || utterances.length === 0) {
    return '';
  }

  // Determine who speaks first (usually the doctor)
  const firstSpeaker = utterances[0].speaker;
  const otherSpeaker = firstSpeaker === 'A' ? 'B' : 'A';
  
  const doctorLabel = 'Doctor';
  const patientLabel = 'Patient';
  
  // Assign roles based on who spoke first
  const doctorSpeaker = firstSpeaker;
  const patientSpeaker = otherSpeaker;

  return utterances
    .map(u => {
      const label = u.speaker === doctorSpeaker ? doctorLabel : patientLabel;
      return `${label}: "${u.text}"`;
    })
    .join('\n');
}

// Create structured prompt for LLM with labeled transcript
function createStructuredPrompt(labeledTranscript) {
  return `You are an expert clinical documentation assistant for Indian doctors. Your task is to generate complete, structured medical documentation from a doctor-patient conversation.

Conversation:
${labeledTranscript}

Generate complete clinical documentation by extracting and organizing information from this conversation:

1. **Chief Complaint**: The main symptom/reason for visit. Include severity, duration, and associated symptoms mentioned. Be specific.

2. **History**: Detailed patient history including:
   - Age and any relevant demographics mentioned
   - Duration and timeline of symptoms
   - Associated symptoms or complaints
   - Relevant past medical history
   - Medications or treatments already tried
   - Risk factors mentioned

3. **Examination**: Physical examination findings mentioned by the doctor, including:
   - Vital signs (BP, HR, SpO2, Temperature if mentioned)
   - Physical findings (chest, abdomen, heart sounds, etc.)
   - Test results mentioned (ECG, labs, etc.)
   - Objective observations

4. **Diagnosis**: The doctor's clinical impression, differential diagnosis, or confirmed diagnosis stated in the conversation.

5. **Prescription**: List each medication prescribed with:
   - Drug name
   - Dose/strength
   - Route (PO, IM, IV, SL, etc.)
   - Frequency (stat, BD, TID, OD, PRN, etc.)

6. **Follow-up**: Complete follow-up instructions including:
   - When to follow up
   - What investigations or tests to repeat
   - When to return or seek emergency care
   - Activity restrictions

CRITICAL INSTRUCTIONS:
- Extract EXACT information from the conversation, not generic text
- Use medical abbreviations and terminology appropriately
- Be comprehensive and specific based on what's discussed
- Format prescriptions clearly with dose and frequency
- Include all clinical findings mentioned, even if brief
- If information is not mentioned, do not fabricate it
- Return structured, complete medical documentation

Return ONLY valid JSON, no markdown, no code blocks, no extra text:
{
  "chief_complaint": "Complete chief complaint with severity, duration, and associated symptoms",
  "history": "Comprehensive patient history with demographics, timeline, risk factors",
  "examination": "All physical examination findings, vital signs, and test results mentioned",
  "diagnosis": "Doctor's clinical impression or diagnosis from the conversation",
  "prescription": "Formatted prescription list with drugs, doses, and frequencies",
  "followup": "Complete follow-up instructions and care plan"
}`;
}

// Fallback function to generate a clinical note from labeled transcript without LLM
function generateFallbackNote(labeledTranscript) {
  return {
    chief_complaint: 'See transcript for chief complaint details',
    history: 'See transcript for medical history and symptom timeline',
    examination: 'See transcript for physical examination findings and vital signs',
    diagnosis: 'See transcript for clinical impression and diagnosis',
    prescription: 'See transcript for prescribed medications',
    followup: 'See transcript for follow-up instructions and care plan'
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

    // Get AssemblyAI client (will check if API key is set)
    let client;
    try {
      client = getAssemblyAIClient();
    } catch (err) {
      console.error('AssemblyAI initialization error:', err.message);
      return res.status(500).json({ 
        success: false, 
        error: 'AssemblyAI API key not configured. Sign up at assemblyai.com and add ASSEMBLYAI_API_KEY to .env' 
      });
    }

    // Save buffer to temp file for AssemblyAI
    const tempPath = path.join(__dirname, `temp_audio_${Date.now()}.webm`);
    fs.writeFileSync(tempPath, req.file.buffer);
    console.log('Saved temp file:', tempPath);

    // STEP 1 — Upload audio to AssemblyAI then transcribe with diarization
    console.log('Uploading audio to AssemblyAI upload endpoint...');
    const apiKey = process.env.ASSEMBLYAI_API_KEY;
    if (!apiKey) throw new Error('ASSEMBLYAI_API_KEY missing at transcription time');

    // Node's fetch requires the `duplex` option when sending a stream as the body.
    const uploadRes = await fetch('https://api.assemblyai.com/v2/upload', {
      method: 'POST',
      // duplex: 'half' is required for streaming bodies in Node's fetch implementation
      duplex: 'half',
      headers: {
        authorization: apiKey,
        'content-type': 'application/octet-stream',
      },
      body: fs.createReadStream(tempPath),
    });

    if (!uploadRes.ok) {
      const text = await uploadRes.text();
      fs.unlinkSync(tempPath);
      console.error('AssemblyAI upload failed:', uploadRes.status, text);
      return res.status(502).json({ success: false, error: `AssemblyAI upload failed: ${uploadRes.status}` });
    }

    // AssemblyAI /v2/upload returns JSON with upload_url field
    let audioUrl;
    try {
      const uploadData = await uploadRes.json();
      audioUrl = uploadData.upload_url;
      console.log('Audio uploaded to:', audioUrl);
    } catch (parseErr) {
      // Fallback: maybe it's plain text URL
      const text = await uploadRes.text();
      audioUrl = text;
      console.log('Audio uploaded (plain text) to:', audioUrl);
    }

    if (!audioUrl || !audioUrl.startsWith('http')) {
      fs.unlinkSync(tempPath);
      console.error('Invalid upload_url from AssemblyAI:', audioUrl);
      return res.status(502).json({ success: false, error: 'AssemblyAI upload returned invalid URL' });
    }

    // Delete temp file after upload
    try { fs.unlinkSync(tempPath); } catch (e) { /* ignore */ }

    console.log('Starting transcription with AssemblyAI (with speaker diarization)...');
    // AssemblyAI requires a speech_models list. Use 'universal-2' for general transcription.
    const transcript = await client.transcripts.transcribe({
      audio_url: audioUrl,
      speaker_labels: true, // Enable diarization
      language_code: 'en',
      speech_models: ['universal-2'],
    });

    // Check transcription status
    if (transcript.status === 'error') {
      console.error('AssemblyAI transcription error:', transcript.error);
      return res.status(400).json({ 
        success: false, 
        error: `Transcription failed: ${transcript.error}` 
      });
    }

    console.log('Transcription complete. Status:', transcript.status);
    console.log('Utterances:', transcript.utterances?.length || 0);
    
    // Debug: log first few utterances to see speaker labels
    if (transcript.utterances && transcript.utterances.length > 0) {
      console.log('First 3 utterances (for debugging speaker detection):');
      transcript.utterances.slice(0, 3).forEach((u, i) => {
        console.log(`  [${i}] Speaker: ${u.speaker || 'NONE'}, Text: ${u.text.substring(0, 50)}...`);
      });
    }

    if (!transcript.utterances || transcript.utterances.length === 0) {
      console.error('No speech detected in audio');
      return res.status(400).json({ success: false, error: 'No speech detected in audio' });
    }

    // STEP 2 — Format labeled transcript with speaker identification
    const labeledTranscript = formatLabeledTranscript(transcript.utterances);
    console.log('Labeled transcript:\n', labeledTranscript);

    // Also get plain transcript for fallback
    const plainTranscript = transcript.utterances
      .map(u => u.text)
      .join(' ');

    // STEP 3 — Structure with LLaMA via Groq (with fallback)
    console.log('Processing transcript into clinical note...');
    
    let note;
    let noteError = null;
    const llmModel = process.env.LLM_MODEL;
    const groqApiKey = process.env.GROQ_API_KEY;
    
    console.log('LLM_MODEL env var:', llmModel ? '✅ Set' : '❌ Not set');
    console.log('GROQ_API_KEY env var:', groqApiKey ? '✅ Set' : '❌ Not set');
    
    if (llmModel && groqApiKey) {
      console.log('Using LLM model:', llmModel);
      const groq = new Groq({ apiKey: groqApiKey });
      
      try {
        console.log('Sending request to Groq LLM...');
        const response = await groq.chat.completions.create({
          model: llmModel,
          messages: [
            {
              role: 'system',
              content: 'You are a clinical documentation assistant for Indian doctors. Return ONLY valid JSON, no markdown, no extra text.'
            },
            {
              role: 'user',
              content: createStructuredPrompt(labeledTranscript)
            }
          ],
        });

        const raw = response.choices[0].message.content;
        console.log('LLaMA response (first 200 chars):', raw.substring(0, 200));
        
        try {
          note = JSON.parse(raw);
          console.log('✅ Successfully parsed note JSON');
        } catch (parseErr) {
          console.error('❌ Failed to parse LLaMA response as JSON:', parseErr.message);
          console.log('Raw response:', raw);
          noteError = `JSON Parse Error: ${parseErr.message}. Raw: ${raw.substring(0, 300)}`;
          note = generateFallbackNote(labeledTranscript);
        }
      } catch (llmErr) {
        console.error('❌ LLM error:', llmErr.message);
        console.error('Full LLM error:', llmErr);
        noteError = `LLM Error: ${llmErr.message}`;
        note = generateFallbackNote(labeledTranscript);
      }
    } else {
      console.log('❌ No LLM_MODEL or GROQ_API_KEY configured, using fallback clinical note generation');
      noteError = 'No LLM_MODEL or GROQ_API_KEY configured';
      note = generateFallbackNote(labeledTranscript);
    }

    console.log('Sending response to client');
    
    // Save recording to MongoDB (without audio file - just transcript and metadata)
    let recordingId = null;
    try {
      const recording = new Recording({
        userId: req.body.userId || 'anonymous',
        patientId: req.body.patientId || null, // Link to patient if provided
        // Skip audioFile - don't save the audio blob itself
        transcript: {
          text: plainTranscript,
          labeledText: labeledTranscript, // Speaker-labeled version
          utterances: transcript.utterances, // Raw utterances with speaker info
          language: 'en',
          hasSpokenLabels: true,
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
      recordingId = savedRecording._id;
      console.log('Recording saved to MongoDB:', recordingId);

      res.json({ 
        success: true, 
        transcript: labeledTranscript, // Send labeled transcript to frontend
        plainTranscript,
        note,
        recordingId,
        noteError: noteError || null // Include error info if any
      });
    } catch (mongoErr) {
      console.error('Error saving to MongoDB:', mongoErr);
      return res.status(500).json({ success: false, error: 'Failed to save recording to database: ' + mongoErr.message });
    }

  } catch (err) {
    console.error('Top-level error in /analyze:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;