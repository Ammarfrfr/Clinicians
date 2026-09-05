import mongoose, { Schema } from 'mongoose';

const whatsappMessageSchema = new Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
      index: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      index: true,
      default: null,
    },
    direction: {
      type: String,
      enum: ['inbound', 'outbound'],
      required: true,
    },
    body: {
      type: String,
      required: true,
    },
    messageType: {
      type: String,
      enum: ['text', 'interactive_list', 'interactive_button', 'image', 'document', 'template', 'location'],
      default: 'text',
    },
    waMessageId: {
      type: String,
      index: true,
    },
    status: {
      type: String,
      enum: ['sent', 'delivered', 'read', 'failed'],
      default: 'sent',
    },
    mediaUrl: {
      type: String,
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

whatsappMessageSchema.index({ patientId: 1, createdAt: -1 });
whatsappMessageSchema.index({ doctorId: 1, createdAt: -1 });

export const WhatsAppMessage = mongoose.model('WhatsAppMessage', whatsappMessageSchema);
