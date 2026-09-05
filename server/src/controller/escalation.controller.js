import { EscalationRule } from '../models/escalationRule.model.js';
import { ApiResponse } from '../Utils/ApiResponse.js';
import { ApiError } from '../Utils/ApiError.js';
import { asyncHandler } from '../Utils/asyncHandler.js';

export const getEscalationRules = asyncHandler(async (req, res) => {
  const doctorId = req.user?._id;
  let rules = await EscalationRule.findOne({ doctorId });

  if (!rules) {
    rules = {
      doctorId,
      keywords: [
        'bleeding',
        'severe pain',
        'unbearable',
        'cannot move',
        'cant move',
        'numbness',
        'chest pain',
        'fever',
        'shortness of breath',
        'allergy',
        'reaction',
        'emergency',
        'fracture',
        'broken',
        'fainting',
      ],
      isActive: true,
    };
  }

  return res.status(200).json(new ApiResponse(200, rules, 'Escalation rules retrieved'));
});

export const saveEscalationRules = asyncHandler(async (req, res) => {
  const doctorId = req.user?._id;
  const { keywords, isActive } = req.body;

  if (!keywords || !Array.isArray(keywords)) {
    throw new ApiError(400, 'Keywords array is required');
  }

  const cleanedKeywords = keywords.map((k) => String(k).trim().toLowerCase()).filter(Boolean);

  const rules = await EscalationRule.findOneAndUpdate(
    { doctorId },
    {
      doctorId,
      keywords: cleanedKeywords,
      isActive: isActive !== undefined ? isActive : true,
      createdBy: req.user?._id,
    },
    { upsert: true, new: true }
  );

  return res.status(200).json(new ApiResponse(200, rules, 'Escalation rules updated successfully'));
});
