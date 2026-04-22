import Groq from 'groq-sdk';
import { AssemblyAI } from 'assemblyai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Recording from '../models/recording.model.js';
import { asyncHandler } from '../Utils/asyncHandler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function uploadAudioToAssemblyAI(filePath, apiKey) {
  const uploadRes = await fetch('https://api.assemblyai.com/v2/upload', {
    method: 'POST',
    duplex: 'half',
    headers: {
      authorization: apiKey,
      'content-type': 'application/octet-stream',
    },
    body: fs.createReadStream(filePath),
  });

  if (!uploadRes.ok) {
    throw new Error(`Upload failed: ${uploadRes.status}`);
  }

  const uploadData = await uploadRes.json();
  return uploadData.upload_url;
}

function formatLabeledTranscript(utterances) {
  if (!utterances || utterances.length === 0) return '';

  return utterances
    .map(u => {
      const label = u.speaker === 'A' ? 'Doctor' : 'Patient';
      return `${label}: "${u.text}"`;
    })
    .join('\n');
}

function createStructuredPrompt(transcript) {
  return `You are an expert clinical documentation assistant for Indian doctors. Generate complete, structured medical documentation from a doctor-patient conversation.

Conversation transcript translated to English:
${transcript}

Extract and organize:
1. Chief Complaint: Main symptom, severity, duration, associated symptoms
2. History: Patient age, symptoms timeline, past medical history, medications tried, risk factors
3. Examination: Vital signs, physical findings, test results, observations
4. Diagnosis: Clinical impression or confirmed diagnosis
5. Prescription: Medication list with drug name, dose, route, frequency
6. Follow-up: Instructions including when to follow up, investigations, activity restrictions

CRITICAL: Extract EXACT information from conversation only. Use medical abbreviations. If information not mentioned, do not fabricate.

Return ONLY valid JSON:
{
  "chief_complaint": "Complete chief complaint with severity and duration",
  "history": "Comprehensive patient history with timeline",
  "examination": "All physical examination findings and vital signs",
  "diagnosis": "Doctor's clinical impression",
  "prescription": "Medications with dose and frequency",
  "followup": "Follow-up instructions and care plan"
}`;
}

export const analyzeAudio = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'No audio file provided' });
  }

  if (!process.env.GROQ_API_KEY) {
    return res.status(500).json({ success: false, error: 'GROQ_API_KEY not configured' });
  }

  if (!process.env.ASSEMBLYAI_API_KEY) {
    return res.status(500).json({ success: false, error: 'ASSEMBLYAI_API_KEY not configured' });
  }

  // Save buffer to temp file
  const tempPath = path.join(__dirname, `temp_audio_${Date.now()}.webm`);
  fs.writeFileSync(tempPath, req.file.buffer);

  let translatedText = '';
  let diarizedUtterances = [];

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const client = new AssemblyAI({ apiKey: process.env.ASSEMBLYAI_API_KEY });

  try {
    // RUN WHISPER AND ASSEMBLY AI IN PARALLEL! Extremely fast.
    const [translation, diarizeTranscript] = await Promise.all([
      // Task 1: Groq Whisper Translation (takes ~3-5 seconds)
      groq.audio.translations.create({
        file: fs.createReadStream(tempPath),
        model: 'whisper-large-v3',
        prompt: 'This is a detailed clinical conversation between a doctor and a patient spoken in Hinglish (Hindi and English). Please translate everything faithfully to English. Do not hallucinate.',
      }),
      
      // Task 2: AssemblyAI Upload + Diarization Background task
      // Note: If you want to drop AssemblyAI entirely for massive speedup, you can comment Task 2 out completely.
      // But running it in parallel at least prevents sequential waiting. 
      // Actually, since AssemblyAI blocks for 1+ minutes, we will wrap it with a fast timeout
      // If it takes more than 10 seconds, we abandon AssemblyAI and rely PURELY on Groq LLM for diarization!
      Promise.race([
        (async () => {
          const audioUrl = await uploadAudioToAssemblyAI(tempPath, process.env.ASSEMBLYAI_API_KEY);
          return await client.transcripts.transcribe({
            audio_url: audioUrl,
            speaker_labels: true,
            language_code: 'en',
            speech_models: ['universal-2'],
          });
        })(),
        new Promise((_, reject) => setTimeout(() => reject(new Error("AssemblyAI Timeout")), 12000))
      ]).catch(e => {
        console.warn("AssemblyAI skipped due to taking too long:", e.message);
        return null;
      })
    ]);

    translatedText = translation.text;

    if (diarizeTranscript && diarizeTranscript.status !== 'error') {
      diarizedUtterances = diarizeTranscript.utterances || [];
    }
  } catch (err) {
    fs.unlinkSync(tempPath);
    return res.status(400).json({ success: false, error: `Audio processing failed: ${err.message}` });
  }

  fs.unlinkSync(tempPath);

  if (!translatedText || translatedText.trim().length === 0) {
    return res.status(400).json({ success: false, error: 'No speech detected in audio' });
  }

  // Step 3: Reconstruct speaker-labeled transcript AND generate clinical note IN PARALLEL
  let labeledTranscript = translatedText;
  const plainTranscript = translatedText;
  let noteError = null;
  let note;

  if (process.env.LLM_MODEL && process.env.GROQ_API_KEY) {
    const reconstructPrompt = `You are an expert medical transcription editor. I have a continuous English translation of a clinical consultation. It lacks speaker labels.

FULL TRANSLATION:
"""
${translatedText}
"""

${diarizedUtterances.length > 0 ? `SPEAKER SKELETON (Fragmented text, but shows rhythm of speaker turns. Use as a loose guide):\n"""\n${formatLabeledTranscript(diarizedUtterances)}\n"""` : ''}

Your task: Reconstruct the full conversation by assigning the correct "Doctor:" or "Patient:" labels to the sentences from the FULL TRANSLATION.
Use clinical context to figure out who is speaking:
- The Doctor asks medical questions, orders tests, gives advice and diagnoses.
- The Patient reports symptoms, answers questions, and expresses concerns.

Do not summarize or omit anything from the FULL TRANSLATION. Translate any leftover native words to English. Format strictly as:
Doctor: [Text]
Patient: [Text]

Put each speaker's turn on a new line. Return ONLY the reconstructed transcript, without any markdown formatting block or intro/outro.`;

    try {
      // Parallelize both LLM tasks completely to cut time in half
      const [reconstructResponse, noteResponse] = await Promise.all([
        // Task A: Reconstruct Transcript
        groq.chat.completions.create({
          model: process.env.LLM_MODEL,
          messages: [{ role: 'user', content: reconstructPrompt }],
          temperature: 0.1,
        }),
        // Task B: Generate Clinical Note using the RAW plain transcript!
        // (It doesn't actually need Doctor/Patient labels perfectly to understand the facts)
        groq.chat.completions.create({
          model: process.env.LLM_MODEL,
          messages: [
            {
              role: 'system',
              content: 'You are a clinical documentation assistant. Return ONLY valid JSON, no markdown.'
            },
            {
              role: 'user',
              content: createStructuredPrompt(translatedText)
            }
          ],
        })
      ]);

      // Assign Reconstructed Transcript
      labeledTranscript = reconstructResponse.choices[0].message.content.trim();

      // Assign Generated Note
      try {
        let jsonString = noteResponse.choices[0].message.content.trim();
        if (jsonString.startsWith('```')) {
          jsonString = jsonString.replace(/^```json/i, '').replace(/^```/, '').replace(/```$/, '').trim();
        }
        note = JSON.parse(jsonString);
      } catch (parseErr) {
        noteError = `JSON Parse Error: ${parseErr.message}`;
      }

    } catch (err) {
      console.error("LLM Operations failed:", err);
      // Fallback
      labeledTranscript = diarizedUtterances.length > 0 ? formatLabeledTranscript(diarizedUtterances) : translatedText;
      noteError = `LLM Error: ${err.message}`;
    }
  }

  // Fallback defaults if Note parsing completely failed or no LLM
  if (!note) {
    note = {
      chief_complaint: 'See transcript for details',
      history: 'See transcript for details',
      examination: 'See transcript for details',
      diagnosis: 'See transcript for details',
      prescription: 'See transcript for details',
      followup: 'See transcript for details'
    };
    if(!noteError) noteError = 'No LLM configured or parsing failed';
  }

  // Save to MongoDB
  const recording = new Recording({
    userId: req.body.userId || 'anonymous',
    patientId: req.body.patientId || null,
    transcript: {
      text: plainTranscript,
      labeledText: labeledTranscript,
      utterances: diarizedUtterances,
      language: 'en',
      hasSpokenLabels: diarizedUtterances.length > 0,
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

  res.json({ 
    success: true, 
    transcript: labeledTranscript,
    plainTranscript,
    note,
    recordingId: savedRecording._id,
    noteError: noteError || null
  });
});
