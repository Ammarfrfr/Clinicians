import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Groq from 'groq-sdk';
import { Patient } from '../models/patient.model.js';
import { User } from '../models/user.model.js';
import { Recording } from '../models/recording.model.js';
import { WhatsAppMessage } from '../models/whatsappMessage.model.js';
import { PreConsultIntake } from '../models/preConsultIntake.model.js';
import { DoctorSchedule } from '../models/doctorSchedule.model.js';
import { Appointment } from '../models/appointment.model.js';
import { EscalationRule } from '../models/escalationRule.model.js';
import { AuditLog } from '../models/auditLog.model.js';
import { ApiResponse } from '../Utils/ApiResponse.js';
import { ApiError } from '../Utils/ApiError.js';
import { asyncHandler } from '../Utils/asyncHandler.js';
import {
  sendTextMessage,
  sendInteractiveButtons,
  sendInteractiveList,
  downloadAndSaveMedia,
  formatPhoneNumber,
} from '../Utils/metaWhatsapp.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load default question set
let intakeConfig;
try {
  const configPath = path.join(__dirname, '../config/intakeQuestions.json');
  intakeConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
} catch (e) {
  intakeConfig = { steps: [] };
}

/**
 * Helper: Find or Auto-create Patient by Phone Number
 */
async function getOrCreatePatientByPhone(phone, defaultDoctorId = null) {
  const cleanPhone = formatPhoneNumber(phone);
  const regex = new RegExp(cleanPhone.slice(-10) + '$'); // Match last 10 digits

  let patient = await Patient.findOne({
    $or: [{ whatsappNumber: cleanPhone }, { 'contactInfo.phone': { $regex: regex } }],
  });

  if (!patient) {
    // Auto-create patient record
    patient = await Patient.create({
      userId: defaultDoctorId,
      firstName: 'WhatsApp',
      lastName: `Patient (${cleanPhone.slice(-4)})`,
      contactInfo: {
        phone: `+${cleanPhone}`,
      },
      whatsappNumber: cleanPhone,
      medicalInfo: {
        existingConditions: [],
        allergies: [],
        currentMedications: [],
      },
      notes: 'Auto-registered via WhatsApp consultation portal',
    });
    console.log(`✨ Created new patient profile for phone ${cleanPhone}: ${patient._id}`);
  } else if (!patient.whatsappNumber) {
    patient.whatsappNumber = cleanPhone;
    await patient.save();
  }

  return patient;
}

/**
 * Helper: Check for Escalation / Red Flag keywords
 */
async function checkEscalation(text, doctorId) {
  if (!text) return null;
  const lower = text.toLowerCase();

  const defaultKeywords = [
    'bleed',
    'severe pain',
    'unbearable',
    'cannot move',
    'cant move',
    'numbness',
    'chest pain',
    'fever',
    'shortness of breath',
    'swallowed',
    'allergy',
    'reaction',
    'emergency',
    'fracture',
    'broken',
    'fainting',
    'vomit',
  ];

  let customKeywords = [];
  if (doctorId) {
    const rules = await EscalationRule.findOne({ doctorId, isActive: true });
    if (rules && rules.keywords?.length) {
      customKeywords = rules.keywords;
    }
  }

  const allKeywords = [...new Set([...defaultKeywords, ...customKeywords])];
  for (const kw of allKeywords) {
    if (lower.includes(kw.toLowerCase())) {
      return kw;
    }
  }
  return null;
}

/**
 * Helper: Use Groq to extract structured orthopedic summary from intake
 */
async function extractIntakeSummary(responses, patient, doctor) {
  if (!process.env.GROQ_API_KEY) return null;
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  const conversationText = responses
    .map((r) => `Q: ${r.question}\nA: ${r.answer}${r.mediaUrl ? ` [Photo attached: ${r.mediaUrl}]` : ''}`)
    .join('\n\n');

  const prompt = `You are a clinical assistant for an orthopedic surgeon.
Analyze the following patient pre-consult intake responses and extract structured clinical fields.

PATIENT INTAKE TRANSCRIPT:
${conversationText}

Return ONLY a valid JSON object matching this structure:
{
  "chiefComplaint": "Short 1-line chief complaint",
  "affectedBodyPart": "Specific joint/bone/muscle",
  "onsetType": "Sudden or Gradual",
  "duration": "Reported duration",
  "painLevel": "Reported pain score",
  "triggers": "Aggravating or relieving factors",
  "associatedSymptoms": ["List of symptoms e.g. swelling, stiffness"],
  "priorHistory": "Previous surgeries or injuries",
  "medicationsTried": "Medications or treatments already attempted",
  "mobilityStatus": "Weight bearing/walking ability",
  "urgencyFlags": ["Any detected clinical red flags or empty list"],
  "summary": "2-3 sentence clinical summary for the orthopedic surgeon before consultation"
}`;

  try {
    const response = await groq.chat.completions.create({
      model: process.env.FAST_LLM_MODEL || 'qwen/qwen3.8-27b',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    });

    const parsed = JSON.parse(response.choices[0].message.content.trim());
    return parsed;
  } catch (e) {
    console.error('LLM Intake extraction failed:', e.message);
    return null;
  }
}

/**
 * Webhook Verification (GET /api/whatsapp/webhook)
 */
export const verifyWebhook = (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'scribologist_wa_secret_token';

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('✅ Meta WhatsApp Webhook Verified successfully');
    return res.status(200).send(challenge);
  }

  console.warn('❌ WhatsApp Webhook Verification failed. Token mismatch.');
  return res.sendStatus(403);
};

/**
 * Inbound Webhook Event Handler (POST /api/whatsapp/webhook)
 */
export const handleWebhookEvent = asyncHandler(async (req, res) => {
  // Always return 200 immediately to acknowledge Meta Graph API
  res.status(200).send('EVENT_RECEIVED');

  const body = req.body;
  if (!body) return;

  // Extract changes payload (handles both live Meta webhook and Meta Test Modal format)
  const changes = body.entry?.[0]?.changes?.[0]?.value || body.value || (body.field === 'messages' ? body.value : null);
  if (!changes) return;

  // 1. Handle message status updates (delivered, read, failed)
  if (changes?.statuses?.length) {
    const statusObj = changes.statuses[0];
    const waId = statusObj.id;
    const newStatus = statusObj.status;
    if (waId && newStatus) {
      await WhatsAppMessage.findOneAndUpdate({ waMessageId: waId }, { status: newStatus });
    }
    return;
  }

  // 2. Handle inbound messages
  if (!changes?.messages?.length) return;

  const msg = changes.messages[0];
  const fromPhone = msg.from; // e.g. "919876543210"
  const messageType = msg.type; // "text", "interactive", "image", "document"
  const waMessageId = msg.id;

  // Extract message content
  let incomingText = '';
  let selectedId = null;
  let mediaId = null;

  if (messageType === 'text') {
    incomingText = msg.text?.body?.trim() || '';
  } else if (messageType === 'interactive') {
    if (msg.interactive?.type === 'button_reply') {
      incomingText = msg.interactive.button_reply.title;
      selectedId = msg.interactive.button_reply.id;
    } else if (msg.interactive?.type === 'list_reply') {
      incomingText = msg.interactive.list_reply.title;
      selectedId = msg.interactive.list_reply.id;
    }
  } else if (messageType === 'image') {
    mediaId = msg.image?.id;
    incomingText = msg.image?.caption || '[Image received]';
  } else if (messageType === 'document') {
    mediaId = msg.document?.id;
    incomingText = msg.document?.filename || '[Document received]';
  }

  console.log(`📩 Inbound WhatsApp from ${fromPhone}: "${incomingText}" (${messageType})`);

  // Identify Pilot Doctor (use first doctor in DB or configured doctorId)
  const defaultDoctor = (await User.findOne({ role: 'doctor' })) || (await User.findOne());
  const doctorId = defaultDoctor?._id || null;

  // Find or create patient
  const patient = await getOrCreatePatientByPhone(fromPhone, doctorId);

  // If media was sent, download and store to Cloudinary & Patient files
  let uploadedMediaUrl = null;
  if (mediaId) {
    try {
      const upload = await downloadAndSaveMedia(mediaId);
      if (upload?.url) {
        uploadedMediaUrl = upload.url;
        // Save to patient's medical files repository
        patient.files.push({
          url: upload.url,
          publicId: upload.public_id || 'wa_file',
          category: 'WhatsApp Upload',
          notes: `Uploaded via WhatsApp on ${new Date().toLocaleDateString('en-IN')}`,
          uploadedAt: new Date(),
        });
        await patient.save();
        console.log(`🖼️ Saved patient WhatsApp upload to Cloudinary & Patient record: ${upload.url}`);
      }
    } catch (err) {
      console.error('Failed to process WhatsApp media upload:', err.message);
    }
  }

  // Store Inbound Message in DB
  await WhatsAppMessage.create({
    patientId: patient._id,
    doctorId,
    direction: 'inbound',
    body: incomingText,
    messageType: uploadedMediaUrl ? 'image' : messageType === 'interactive' ? 'interactive_button' : 'text',
    waMessageId,
    mediaUrl: uploadedMediaUrl,
    metadata: { raw: msg, selectedId },
  });

  // Step A: Immediate Escalation / Red-flag check
  const redFlagWord = await checkEscalation(incomingText, doctorId);
  if (redFlagWord) {
    console.warn(`🚨 RED FLAG DETECTED in WhatsApp message: "${redFlagWord}"`);

    // Flag intake if one exists
    await PreConsultIntake.findOneAndUpdate(
      { patientId: patient._id, status: 'in_progress' },
      {
        status: 'escalated',
        $push: { urgencyFlags: `Emergency keyword matched: "${redFlagWord}"` },
      }
    );

    const docName = defaultDoctor?.profile?.name || 'Dr. Specialist';
    const alertReply =
      `⚠️ *Priority Care Notice*\n\n` +
      `We noticed your message mentioned *"${redFlagWord}"*. Your safety is our utmost priority.\n\n` +
      `Our clinical team and *Dr. ${docName}* have been immediately notified. A team member will call you shortly.\n\n` +
      `_If you are experiencing a severe medical emergency or intense shortness of breath, please visit the nearest hospital emergency room immediately._`;

    await sendTextMessage(fromPhone, alertReply);

    await WhatsAppMessage.create({
      patientId: patient._id,
      doctorId,
      direction: 'outbound',
      body: alertReply,
      messageType: 'text',
      status: 'sent',
      metadata: { escalationReason: redFlagWord },
    });
    return;
  }

  // Step B: Check if patient is picking an appointment proposal slot
  if (selectedId && selectedId.startsWith('slot_')) {
    await handleSlotSelection(selectedId, patient, doctorId, fromPhone, defaultDoctor);
    return;
  }

  // Step C: Check if patient is answering an ongoing Pre-Consult Intake
  let intake = await PreConsultIntake.findOne({
    patientId: patient._id,
    status: 'in_progress',
  });

  if (intake) {
    await processIntakeStep(intake, incomingText, selectedId, uploadedMediaUrl, patient, doctorId, fromPhone, defaultDoctor);
    return;
  }

  // Step D: Check if patient has a recently completed consultation for Post-Consult RAG
  const recentRecording = await Recording.findOne({
    patientId: patient._id,
    processingStatus: 'completed',
  }).sort({ createdAt: -1 });

  const isAskingQuestion =
    incomingText.length > 5 &&
    !['hi', 'hello', 'hey', 'start', 'book', 'appointment', 'consult'].includes(incomingText.toLowerCase().trim());

  if (recentRecording && isAskingQuestion) {
    const answered = await handlePostConsultRAG(incomingText, recentRecording, patient, doctorId, fromPhone, defaultDoctor);
    if (answered) return;
  }

  // Step E: Default Route -> Start New Pre-Consult Intake flow
  await startNewIntakeFlow(patient, doctorId, fromPhone, defaultDoctor);
});

/**
 * State Machine: Start New Pre-Consult Intake
 */
async function startNewIntakeFlow(patient, doctorId, fromPhone, doctor) {
  const firstStep = intakeConfig.steps[0] || {
    id: 'visit_type',
    question: 'Is this a new orthopedic issue or a follow-up visit?',
    type: 'choice',
    options: ['New issue', 'Follow-up visit'],
  };

  // Check if patient had a prior visit to inject context
  let priorNoteText = '';
  const lastRecording = await Recording.findOne({ patientId: patient._id }).sort({ createdAt: -1 });
  if (lastRecording?.clinicalNote?.assessment) {
    priorNoteText = `\n(Our records show your previous consultation for: *${lastRecording.clinicalNote.assessment.slice(0, 80)}*)`;
  }

  const newIntake = await PreConsultIntake.create({
    patientId: patient._id,
    doctorId,
    currentStepId: firstStep.id,
    status: 'in_progress',
    responses: [],
  });

  const docName = doctor?.profile?.name || 'Dr. Specialist';
  const welcome = `👋 Hello! Welcome to *Dr. ${docName}'s* orthopedic clinic.${priorNoteText}\n\n${firstStep.question}`;

  if (firstStep.type === 'choice' && firstStep.options) {
    await sendInteractiveButtons(
      fromPhone,
      welcome,
      firstStep.options.map((opt, i) => ({ id: `opt_${i}_${opt}`, title: opt }))
    );
  } else {
    await sendTextMessage(fromPhone, welcome);
  }

  await WhatsAppMessage.create({
    patientId: patient._id,
    doctorId,
    direction: 'outbound',
    body: welcome,
    messageType: firstStep.type === 'choice' ? 'interactive_button' : 'text',
    metadata: { intakeId: newIntake._id, stepId: firstStep.id },
  });
}

/**
 * State Machine: Process Current Intake Step and Advance
 */
async function processIntakeStep(intake, answerText, selectedId, mediaUrl, patient, doctorId, fromPhone, doctor) {
  const currentStep = intakeConfig.steps.find((s) => s.id === intake.currentStepId) || intakeConfig.steps[0];

  // Save answer
  intake.responses.push({
    stepId: currentStep.id,
    question: currentStep.question,
    answer: answerText || (mediaUrl ? '[Photo Attached]' : ''),
    mediaUrl: mediaUrl || undefined,
    answeredAt: new Date(),
  });

  // Determine Next Step
  let nextStepId = null;

  if (currentStep.branches && currentStep.branches[answerText]) {
    nextStepId = currentStep.branches[answerText];
  } else if (currentStep.next) {
    nextStepId = currentStep.next;
  }

  // If follow-up branch was selected, mark visitType
  if (currentStep.id === 'visit_type') {
    intake.visitType = answerText.toLowerCase().includes('follow') ? 'follow-up' : 'new';
  }

  // If finished all questions -> Transition to Appointment Proposal
  if (!nextStepId || nextStepId === 'appointment_prompt') {
    intake.status = 'completed';
    intake.completedAt = new Date();

    // Run Groq LLaMA extraction on responses
    const structured = await extractIntakeSummary(intake.responses, patient, doctor);
    if (structured) {
      intake.structuredExtract = structured;
      intake.urgencyFlags = structured.urgencyFlags || [];
    }
    await intake.save();

    console.log(`✅ Completed intake for patient ${patient._id}. Proposing appointment slots...`);
    await proposeAppointmentSlots(patient, doctorId, fromPhone, doctor, intake);
    return;
  }

  // Advance to Next Question
  intake.currentStepId = nextStepId;
  await intake.save();

  const nextStep = intakeConfig.steps.find((s) => s.id === nextStepId);
  if (!nextStep) {
    await proposeAppointmentSlots(patient, doctorId, fromPhone, doctor, intake);
    return;
  }

  // Check if step has auto_prior_visit flag
  let questionPrompt = nextStep.question;
  if (nextStep.auto_prior_visit) {
    const priorRec = await Recording.findOne({ patientId: patient._id }).sort({ createdAt: -1 });
    if (priorRec?.clinicalNote?.plan) {
      questionPrompt = `During your last visit, the doctor advised:\n"${priorRec.clinicalNote.plan.slice(0, 150)}..."\n\n${nextStep.question}`;
    }
  }

  if (nextStep.type === 'choice' && nextStep.options) {
    await sendInteractiveButtons(
      fromPhone,
      questionPrompt,
      nextStep.options.map((opt, i) => ({ id: `opt_${i}_${opt}`, title: opt }))
    );
  } else {
    await sendTextMessage(fromPhone, questionPrompt);
  }

  await WhatsAppMessage.create({
    patientId: patient._id,
    doctorId,
    direction: 'outbound',
    body: questionPrompt,
    messageType: nextStep.type === 'choice' ? 'interactive_button' : 'text',
    metadata: { intakeId: intake._id, stepId: nextStep.id },
  });
}

/**
 * Step 4: Appointment Proposal Flow (Propose, don't auto-confirm)
 */
async function proposeAppointmentSlots(patient, doctorId, fromPhone, doctor, intake) {
  // Query DoctorSchedule
  const schedule = await DoctorSchedule.findOne({ doctorId });
  const activeSlots = schedule?.slots?.filter((s) => s.isActive) || [];

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Build next 3 available slot options over the next 7 days
  const proposedOptions = [];
  const today = new Date();

  for (let i = 1; i <= 7 && proposedOptions.length < 3; i++) {
    const targetDate = new Date();
    targetDate.setDate(today.getDate() + i);
    const dayOfWeek = targetDate.getDay();

    const matchingSlot = activeSlots.find((s) => s.dayOfWeek === dayOfWeek);
    if (matchingSlot) {
      const dateStr = targetDate.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', weekday: 'short' });
      const isoDate = targetDate.toISOString().split('T')[0];
      proposedOptions.push({
        id: `slot_${isoDate}_${matchingSlot.dayOfWeek}_${matchingSlot.location}_${matchingSlot.startTime}`,
        date: targetDate,
        dayName: dayNames[dayOfWeek],
        dateStr,
        location: matchingSlot.location,
        startTime: matchingSlot.startTime,
        endTime: matchingSlot.endTime,
      });
    }
  }

  // Fallback defaults if doctor hasn't configured schedule yet
  if (proposedOptions.length === 0) {
    for (let i = 1; i <= 3; i++) {
      const targetDate = new Date();
      targetDate.setDate(today.getDate() + i);
      const dateStr = targetDate.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', weekday: 'short' });
      const isoDate = targetDate.toISOString().split('T')[0];
      proposedOptions.push({
        id: `slot_${isoDate}_${targetDate.getDay()}_MainClinic_10:00`,
        date: targetDate,
        dayName: dayNames[targetDate.getDay()],
        dateStr,
        location: 'Main Orthopedic Clinic',
        startTime: '10:00 AM',
        endTime: '01:00 PM',
      });
    }
  }

  const docName = doctor?.profile?.name || 'Dr. Specialist';
  const introMsg =
    `✅ *Intake Received! Dr. ${docName} has your preliminary notes.*\n\n` +
    `Please choose your preferred consultation day & location below:`;

  if (proposedOptions.length <= 3) {
    const buttons = proposedOptions.map((opt) => ({
      id: opt.id,
      title: `${opt.dateStr} (${opt.startTime.slice(0, 5)})`.slice(0, 20),
    }));
    await sendInteractiveButtons(fromPhone, introMsg, buttons);
  } else {
    const rows = proposedOptions.map((opt) => ({
      id: opt.id,
      title: `${opt.dateStr} - ${opt.startTime}`,
      description: opt.location,
    }));
    await sendInteractiveList(fromPhone, introMsg, 'Select Slot', [{ title: 'Available Slots', rows }]);
  }

  await WhatsAppMessage.create({
    patientId: patient._id,
    doctorId,
    direction: 'outbound',
    body: introMsg,
    messageType: 'interactive_button',
    metadata: { intakeId: intake?._id, proposedOptions },
  });
}

/**
 * Handle Patient Slot Selection -> Create Proposed Appointment
 */
async function handleSlotSelection(selectedId, patient, doctorId, fromPhone, doctor) {
  // Format: slot_YYYY-MM-DD_dayOfWeek_Location_StartTime
  const parts = selectedId.split('_');
  const dateStr = parts[1];
  const dayOfWeek = parseInt(parts[2], 10) || 0;
  const location = parts[3] || 'Clinic';
  const startTime = parts[4] || '10:00 AM';

  const appointmentDate = new Date(dateStr);

  // Find linked intake
  const intake = await PreConsultIntake.findOne({ patientId: patient._id }).sort({ createdAt: -1 });

  // Create proposed appointment
  const appointment = await Appointment.create({
    patientId: patient._id,
    doctorId,
    intakeId: intake?._id || null,
    proposedSlot: {
      date: appointmentDate,
      dayOfWeek,
      location,
      startTime,
      endTime: 'TBD',
    },
    status: 'proposed',
  });

  if (intake) {
    intake.appointmentId = appointment._id;
    await intake.save();
  }

  const docName = doctor?.profile?.name || 'Dr. Specialist';
  const confirmMsg =
    `🎉 *Appointment Proposed!*\n` +
    `------------------------------------\n` +
    `👤 *Patient:* ${patient.firstName} ${patient.lastName || ''}\n` +
    `📍 *Location:* ${location}\n` +
    `📅 *Requested Date:* ${appointmentDate.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}\n` +
    `🕒 *Time:* ${startTime}\n` +
    `------------------------------------\n` +
    `Our front-desk team has received your request alongside your pre-consult brief for *Dr. ${docName}*. \n\n` +
    `📞 *Next Step:* Our clinic staff will call you shortly to confirm your exact token number and answer any travel/prep queries.`;

  await sendTextMessage(fromPhone, confirmMsg);

  await WhatsAppMessage.create({
    patientId: patient._id,
    doctorId,
    direction: 'outbound',
    body: confirmMsg,
    messageType: 'text',
    metadata: { appointmentId: appointment._id },
  });
}

/**
 * Step 7: Post-Consult Retrieval-Based (RAG) Responder
 */
async function handlePostConsultRAG(questionText, recording, patient, doctorId, fromPhone, doctor) {
  if (!process.env.GROQ_API_KEY) return false;

  const note = recording.clinicalNote || {};
  const docName = doctor?.profile?.name || 'Dr. Specialist';

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  const ragPrompt = `You are a medical follow-up assistant for Dr. ${docName}'s orthopedic clinic.
A patient who recently had a consultation is messaging with a question.
You MUST answer the question using ONLY the specific medical facts documented in their SOAP note below.
DO NOT extrapolate, guess, or provide medical advice not covered in the note.

PATIENT'S RECENT SOAP NOTE & CONSULTATION RECORD:
---
Subjective Complaint: ${note.subjective || 'Not recorded'}
Objective Findings: ${note.objective || 'Not recorded'}
Clinical Assessment / Diagnosis: ${note.assessment || 'Not recorded'}
Treatment Plan & Prescriptions: ${note.plan || 'Not recorded'}
Medications: ${JSON.stringify(note.prescription || [])}
Follow-up Advice: ${note.followup || 'Not recorded'}
Prescribed Exercises: ${JSON.stringify(note.exercises || [])}
---

PATIENT'S QUESTION:
"${questionText}"

CRITICAL INSTRUCTIONS:
1. If the question can be accurately answered from the SOAP note above (e.g. medication timing, diagnosis, prescribed exercise, next follow-up date), provide a warm, concise, patient-friendly answer.
2. If the SOAP note DOES NOT contain the answer, or if the question asks for new treatment, dosage changes, or new symptoms not documented in the note, you MUST respond EXACTLY with the flag token: "[ESCALATE_TO_STAFF]".
3. Keep the response under 3 sentences. No medical jargon. Never use em-dashes (—).`;

  try {
    const response = await groq.chat.completions.create({
      model: process.env.FAST_LLM_MODEL || 'qwen/qwen3.8-27b',
      messages: [{ role: 'user', content: ragPrompt }],
      temperature: 0.1,
    });

    const reply = response.choices[0].message.content.trim();

    if (reply.includes('[ESCALATE_TO_STAFF]') || reply.length < 10) {
      const fallback =
        `Dr. ${docName}'s clinic has received your query regarding your treatment. ` +
        `To ensure your safety, our clinic staff and doctor will review your file and message you back shortly.`;
      await sendTextMessage(fromPhone, fallback);
      await WhatsAppMessage.create({
        patientId: patient._id,
        doctorId,
        direction: 'outbound',
        body: fallback,
        messageType: 'text',
        metadata: { type: 'rag_fallback_escalate' },
      });
      return true;
    }

    const formattedReply = `*Dr. ${docName}'s Care Assistant*\n\n${reply}\n\n_If symptoms persist or worsen, please contact the clinic directly._`;
    await sendTextMessage(fromPhone, formattedReply);

    await WhatsAppMessage.create({
      patientId: patient._id,
      doctorId,
      direction: 'outbound',
      body: formattedReply,
      messageType: 'text',
      metadata: { type: 'post_consult_rag_response', recordingId: recording._id },
    });

    return true;
  } catch (err) {
    console.error('Post consult RAG error:', err.message);
    return false;
  }
}

/**
 * Manual Send WhatsApp Message (For doctor/staff from dashboard)
 */
export const sendDirectMessage = asyncHandler(async (req, res) => {
  const { patientId, message } = req.body;
  if (!patientId || !message) {
    throw new ApiError(400, 'patientId and message body are required.');
  }

  const patient = await Patient.findById(patientId);
  if (!patient) {
    throw new ApiError(404, 'Patient not found');
  }

  const phone = patient.whatsappNumber || patient.contactInfo?.phone;
  if (!phone) {
    throw new ApiError(400, 'Patient has no valid WhatsApp phone number.');
  }

  const result = await sendTextMessage(phone, message);

  const savedMsg = await WhatsAppMessage.create({
    patientId: patient._id,
    doctorId: req.user?._id || null,
    direction: 'outbound',
    body: message,
    messageType: 'text',
    status: 'sent',
    waMessageId: result?.messages?.[0]?.id,
  });

  // Audit log
  await AuditLog.create({
    userId: req.user?._id,
    action: 'sent_whatsapp_message',
    resourceType: 'WhatsAppMessage',
    resourceId: savedMsg._id,
    ipAddress: req.ip,
  });

  return res.status(200).json(new ApiResponse(200, savedMsg, 'WhatsApp message sent successfully'));
});

/**
 * Get WhatsApp conversation history for a patient
 */
export const getPatientMessages = asyncHandler(async (req, res) => {
  const { patientId } = req.params;
  const messages = await WhatsAppMessage.find({ patientId }).sort({ createdAt: 1 });
  return res.status(200).json(new ApiResponse(200, messages, 'Messages retrieved'));
});
