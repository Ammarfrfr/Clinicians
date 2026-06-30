import Groq from 'groq-sdk';
import { AssemblyAI } from 'assemblyai';
import axios from 'axios';
import { Recording } from '../models/recording.model.js';
import { asyncHandler } from '../Utils/asyncHandler.js'
import { ApiError } from '../Utils/ApiError.js';
import { ApiResponse } from '../Utils/ApiResponse.js'

async function uploadAudioToAssemblyAI(fileBuffer, apiKey) {
  try {
    const response = await axios.post('https://api.assemblyai.com/v2/upload', fileBuffer, {
      headers: {
        authorization: apiKey,
        'content-type': 'application/octet-stream',
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });
    return response.data.upload_url;
  } catch (error) {
    const status = error.response ? error.response.status : 'unknown';
    throw new Error(`Upload failed: ${status}`);
  }
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

function createStructuredPrompt(transcript, templateSections) {
  // If custom template sections are provided, build dynamic extraction instructions
  let sectionInstructions = '';
  let jsonSchema = '';

  if (templateSections && Array.isArray(templateSections) && templateSections.length > 0) {
    sectionInstructions = templateSections.map((s, i) =>
      `${i + 1}. ${s.label}: Extract relevant clinical information for this field`
    ).join('\n');
    sectionInstructions += `\n${templateSections.length + 1}. Prescription: Medication list with drug name, dose, route, frequency`;
    sectionInstructions += `\n${templateSections.length + 2}. Follow-up: Instructions including when to follow up, investigations, activity restrictions`;
    sectionInstructions += `\n${templateSections.length + 3}. Category Tags: Categorize this visit with one or more relevant tags from: "Surgery", "Medication", "Follow-up", "Consultation", "Investigation", "General".`;

    const schemaFields = templateSections.map(s =>
      `  "${s.key}": "Relevant ${s.label.toLowerCase()} information"`
    ).join(',\n');

    jsonSchema = `{
${schemaFields},
  "prescription": [
    { "drug": "Medication name", "dose": "dosage e.g. 500mg or 1 tab", "frequency": "frequency e.g. once daily or twice daily" }
  ],
  "followup": "Follow-up instructions and care plan",
  "tags": ["Tag1", "Tag2"]
}`;
  } else {
    // Default SOAP template
    sectionInstructions = `1. Chief Complaint: Main symptom, severity, duration, associated symptoms
2. History: Patient age, symptoms timeline, past medical history, medications tried, risk factors
3. Examination: Vital signs, physical findings, test results, observations
4. Diagnosis: Clinical impression or confirmed diagnosis
5. Prescription: Medication list with drug name, dose, route, frequency
6. Follow-up: Instructions including when to follow up, investigations, activity restrictions
7. Category Tags: Categorize this visit with one or more relevant tags from: "Surgery", "Medication", "Follow-up", "Consultation", "Investigation", "General".`;

    jsonSchema = `{
  "chief_complaint": "Complete chief complaint with severity and duration",
  "history": "Comprehensive patient history with timeline",
  "examination": "All physical examination findings and vital signs",
  "diagnosis": "Doctor's clinical impression",
  "prescription": [
    { "drug": "Medication name", "dose": "dosage e.g. 500mg or 1 tab", "frequency": "frequency e.g. once daily or twice daily" }
  ],
  "followup": "Follow-up instructions and care plan",
  "tags": ["Tag1", "Tag2"]
}`;
  }

  return `You are an expert clinical documentation assistant for Indian doctors. Generate complete, structured medical documentation from a doctor-patient conversation.

Conversation transcript translated to English:
${transcript}

Extract and organize:
${sectionInstructions}

CRITICAL: Extract EXACT information from conversation only. Use medical abbreviations. If information not mentioned, do not fabricate.

Return ONLY valid JSON:
${jsonSchema}`;
}


export const analyzeAudio = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'No audio file provided');
  }

  if (!process.env.GROQ_API_KEY) {
    throw new ApiError(500, 'GROQ_API_KEY not configured');
  }

  if (!process.env.ASSEMBLYAI_API_KEY) {
    throw new ApiError(500, 'ASSEMBLYAI_API_KEY not configured');
  }

  let translatedText = '';
  let diarizedUtterances = [];

  // Parse custom template sections if provided
  let templateSections = null;
  try {
    if (req.body.templateSections) {
      templateSections = JSON.parse(req.body.templateSections);
    }
  } catch (e) {
    // Ignore parse errors — fall back to default SOAP
  }

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const client = new AssemblyAI({ apiKey: process.env.ASSEMBLYAI_API_KEY });

  try {
    // RUN WHISPER AND ASSEMBLY AI IN PARALLEL! Extremely fast.
    const [translation, diarizeTranscript] = await Promise.all([
      // Task 1: Groq Whisper Translation (takes ~3-5 seconds)
      groq.audio.translations.create({
        file: await Groq.toFile(req.file.buffer, req.file.originalname || 'audio.webm'),
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
          const audioUrl = await uploadAudioToAssemblyAI(req.file.buffer, process.env.ASSEMBLYAI_API_KEY);
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
    throw new ApiError(400, `Audio processing failed: ${err.message}`);
  }

  if (!translatedText || translatedText.trim().length === 0) {
    throw new ApiError(400, 'No speech detected in audio');
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
              content: createStructuredPrompt(translatedText, templateSections)
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
    userId: req.user._id.toString(),
    patientId: req.body.patientId || null,
    transcript: {
      text: plainTranscript,
      labeledText: labeledTranscript,
      utterances: diarizedUtterances,
      language: 'en',
      hasSpokenLabels: diarizedUtterances.length > 0,
    },
    clinicalNote: {
      chief_complaint: note.chief_complaint || '',
      history: note.history || '',
      examination: note.examination || '',
      diagnosis: note.diagnosis || '',
      prescription: note.prescription || [],
      followup: note.followup || '',
    },
    tags: note.tags || [],
    metadata: {
      recordedAt: new Date(),
      recordingDuration: req.body.recordingDuration || 0,
      deviceInfo: req.get('user-agent'),
      ipAddress: req.ip,
    },
    processingStatus: 'completed',
  });

  const savedRecording = await recording.save();

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        transcript: labeledTranscript,
        plainTranscript,
        note,
        recordingId: savedRecording._id,
        noteError: noteError || null
      },
      'Audio analyzed successfully'
    )
  );
});

export const transcribeAudio = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'No audio file provided');
  }

  if (!process.env.GROQ_API_KEY) {
    throw new ApiError(500, 'GROQ_API_KEY not configured');
  }

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  try {
    const translation = await groq.audio.translations.create({
      file: await Groq.toFile(req.file.buffer, req.file.originalname || 'audio.webm'),
      model: 'whisper-large-v3',
      prompt: 'This is a clinical description or note dictated by a doctor. Please translate or transcribe it faithfully to English.',
    });

    return res.status(200).json(
      new ApiResponse(
        200,
        { text: translation.text },
        'Audio transcribed successfully'
      )
    );
  } catch (err) {
    console.error('Transcription error:', err);
    throw new ApiError(500, `Transcription failed: ${err.message}`);
  }
});

export const dictateSection = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'No audio file provided');
  }
  const { section, existingValue } = req.body;
  if (!section) {
    throw new ApiError(400, 'No section specified');
  }

  if (!process.env.GROQ_API_KEY) {
    throw new ApiError(500, 'GROQ_API_KEY not configured');
  }

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  // Step 1: Transcribe the audio
  let transcription = '';
  try {
    const translation = await groq.audio.translations.create({
      file: await Groq.toFile(req.file.buffer, req.file.originalname || 'audio.webm'),
      model: 'whisper-large-v3',
      prompt: 'This is clinical dictation by a doctor for a specific section of a medical SOAP note.',
    });
    transcription = translation.text;
  } catch (err) {
    console.error('Transcription failed:', err);
    throw new ApiError(500, `Transcription failed: ${err.message}`);
  }

  if (!transcription || transcription.trim().length === 0) {
    throw new ApiError(400, 'No speech detected in audio');
  }

  // Step 2: Use LLM to structure/refine the transcription for the specific section
  let finalValue;
  if (process.env.LLM_MODEL) {
    try {
      let prompt = '';
      if (section === 'prescription') {
        let existingPrescriptions = [];
        try {
          if (existingValue) {
            existingPrescriptions = JSON.parse(existingValue);
          }
        } catch (e) {
          existingPrescriptions = [];
        }

        prompt = `You are an expert clinical documentation assistant. Parse this transcribed medical dictation of medications into a structured JSON array of prescription objects.
Each medication object must have:
- "drug": medication name (properly capitalized)
- "dose": dosage details (e.g. "500 mg", "1 tab", or empty if not mentioned)
- "frequency": frequency (e.g. "once daily", "twice daily", "tds", or empty if not mentioned)

Dictated text:
"${transcription}"

Existing prescription list (merge or append to these):
${JSON.stringify(existingPrescriptions, null, 2)}

Return ONLY a valid JSON array of objects. Do not include markdown code block syntax (like \`\`\`json).
Example output format:
[
  { "drug": "Paracetamol", "dose": "500 mg", "frequency": "once daily" }
]`;
      } else {
        prompt = `You are an expert clinical documentation assistant. Refine and format the following transcribed clinical dictation into professional, clear medical prose for the "${section}" section of a SOAP note.
Make it grammatically correct and use standard clinical abbreviations where appropriate.

Dictated text:
"${transcription}"

${existingValue ? `Existing content for this section (intelligently integrate/append the new dictation with this):
"${existingValue}"` : ''}

Return ONLY the final cleaned text for this section, with absolutely no introduction, preamble, or markdown formatting.`;
      }

      const response = await groq.chat.completions.create({
        model: process.env.LLM_MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
      });

      const responseText = response.choices[0].message.content.trim();
      if (section === 'prescription') {
        let cleanText = responseText;
        if (cleanText.startsWith('```')) {
          cleanText = cleanText.replace(/^```json/i, '').replace(/^```/, '').replace(/```$/, '').trim();
        }
        finalValue = JSON.parse(cleanText);
      } else {
        finalValue = responseText;
      }
    } catch (err) {
      console.error('LLM structuring failed:', err);
      // Fallback
      if (section === 'prescription') {
        try {
          finalValue = existingValue ? JSON.parse(existingValue) : [];
        } catch (e) {
          finalValue = [];
        }
        finalValue.push({ drug: transcription, dose: '', frequency: '' });
      } else {
        finalValue = existingValue ? `${existingValue}\n${transcription}` : transcription;
      }
    }
  } else {
    // Fallback
    if (section === 'prescription') {
      try {
        finalValue = existingValue ? JSON.parse(existingValue) : [];
      } catch (e) {
        finalValue = [];
      }
      finalValue.push({ drug: transcription, dose: '', frequency: '' });
    } else {
      finalValue = existingValue ? `${existingValue}\n${transcription}` : transcription;
    }
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      { value: finalValue },
      'Section dictation processed successfully'
    )
  );
});

export const searchDrugsFromLLM = asyncHandler(async (req, res) => {
  const { q } = req.query;
  if (!q || q.trim().length < 2) {
    return res.status(200).json(new ApiResponse(200, [], 'Empty query'));
  }

  const query = q.trim();

  if (!process.env.GROQ_API_KEY) {
    console.warn('GROQ_API_KEY is not configured for drug search');
    return res.status(200).json(new ApiResponse(200, [], 'GROQ not configured'));
  }

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  const prompt = `You are a clinical medicine database search assistant.
Find matching commercial pharmaceutical products (medications/drugs) available in the Indian/global market matching the search query: "${query}".
The query can be a brand name (e.g. "Augmentin", "Dolo"), a generic name / composition (e.g. "Paracetamol"), or a combination of compounds (e.g. "tretinoin + glutathione").

Generate up to 8 accurate matching options.
For each option, provide:
1. "name": The brand name of the product (e.g., "Glycomet 500", "Crocin", "Tretin-A"). If it's a generic compound without a major single brand, suggest a standard generic formulation name.
2. "composition": The exact active ingredients and their strengths (e.g., "Tretinoin 0.025% + Glutathione 2%").
3. "brand": The pharmaceutical manufacturer/company name that produces/markets it (e.g., "Cipla", "Abbott", "Sun Pharma", "GlaxoSmithKline").

Return ONLY a valid JSON array of objects. Do not include markdown code block formatting (like \`\`\`json).
Format:
[
  { "name": "Brand/Generic Name", "composition": "Active Ingredients and Strengths", "brand": "Manufacturer/Company Name" }
]`;

  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: 500,
    });

    let cleanText = response.choices[0].message.content.trim();
    if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/^```json/i, '').replace(/^```/, '').replace(/```$/, '').trim();
    }
    const drugsList = JSON.parse(cleanText);

    return res.status(200).json(
      new ApiResponse(200, drugsList, 'Drugs searched successfully')
    );
  } catch (err) {
    console.error('LLM drug search failed:', err);
    return res.status(200).json(
      new ApiResponse(200, [], `Search failed: ${err.message}`)
    );
  }
});


