import { Appointment } from '../models/appointment.model.js';
import { PreConsultIntake } from '../models/preConsultIntake.model.js';
import { Recording } from '../models/recording.model.js';
import { Patient } from '../models/patient.model.js';
import { AuditLog } from '../models/auditLog.model.js';
import { ApiResponse } from '../Utils/ApiResponse.js';
import { ApiError } from '../Utils/ApiError.js';
import { asyncHandler } from '../Utils/asyncHandler.js';
import { sendTextMessage } from '../Utils/metaWhatsapp.js';

/**
 * Get all appointments for dashboard
 */
export const getAppointments = asyncHandler(async (req, res) => {
  const { status, date } = req.query;
  const filter = {};

  if (status) {
    filter.status = status;
  }

  if (date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    filter['proposedSlot.date'] = { $gte: startOfDay, $lte: endOfDay };
  }

  const appointments = await Appointment.find(filter)
    .populate('patientId')
    .populate('intakeId')
    .populate('recordingId')
    .populate('confirmedBy', 'profile.name email')
    .sort({ 'proposedSlot.date': 1, createdAt: -1 });

  return res.status(200).json(new ApiResponse(200, appointments, 'Appointments retrieved successfully'));
});

/**
 * Update Appointment Status (Confirm, Reschedule, Cancel, Complete)
 */
export const updateAppointmentStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, notes, newSlot } = req.body;

  const appointment = await Appointment.findById(id).populate('patientId doctorId');
  if (!appointment) {
    throw new ApiError(404, 'Appointment not found');
  }

  const previousStatus = appointment.status;
  if (status) appointment.status = status;
  if (notes) appointment.notes = notes;

  if (status === 'confirmed') {
    appointment.confirmedBy = req.user?._id || null;
    appointment.confirmedAt = new Date();

    // Notify patient via WhatsApp
    const patient = appointment.patientId;
    const phone = patient?.whatsappNumber || patient?.contactInfo?.phone;
    if (phone) {
      const docName = appointment.doctorId?.profile?.name || 'Dr. Specialist';
      const slotDate = new Date(appointment.proposedSlot.date).toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      });
      const confirmMsg =
        `✅ *Appointment Confirmed!*\n\n` +
        `Dear *${patient.firstName || 'Patient'}*,\n` +
        `Your consultation with *Dr. ${docName}* is confirmed for *${slotDate}* at *${appointment.proposedSlot.startTime}*.\n` +
        `📍 *Location:* ${appointment.proposedSlot.location}\n\n` +
        `We look forward to welcoming you. If you need any assistance before then, simply reply to this message.`;

      try {
        await sendTextMessage(phone, confirmMsg);
      } catch (err) {
        console.warn('Could not dispatch WhatsApp confirmation:', err.message);
      }
    }
  }

  if (newSlot) {
    appointment.proposedSlot = {
      ...appointment.proposedSlot,
      ...newSlot,
    };
  }

  await appointment.save();

  // Audit log
  await AuditLog.create({
    userId: req.user?._id,
    action: `updated_appointment_status_to_${status}`,
    resourceType: 'Appointment',
    resourceId: appointment._id,
    ipAddress: req.ip,
    details: { previousStatus, newStatus: status },
  });

  return res.status(200).json(new ApiResponse(200, appointment, 'Appointment updated successfully'));
});

/**
 * Get Longitudinal Timeline for a Patient (Intakes + Appointments + SOAP notes)
 */
export const getPatientTimeline = asyncHandler(async (req, res) => {
  const { patientId } = req.params;

  const [patient, intakes, appointments, recordings] = await Promise.all([
    Patient.findById(patientId),
    PreConsultIntake.find({ patientId }).sort({ createdAt: -1 }),
    Appointment.find({ patientId }).populate('confirmedBy', 'profile.name').sort({ createdAt: -1 }),
    Recording.find({ patientId }).sort({ createdAt: -1 }),
  ]);

  if (!patient) {
    throw new ApiError(404, 'Patient not found');
  }

  // Audit view log
  await AuditLog.create({
    userId: req.user?._id,
    action: 'viewed_patient_timeline',
    resourceType: 'Patient',
    resourceId: patient._id,
    ipAddress: req.ip,
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        patient,
        intakes,
        appointments,
        recordings,
      },
      'Patient longitudinal timeline retrieved'
    )
  );
});
