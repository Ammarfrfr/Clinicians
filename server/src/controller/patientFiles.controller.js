import { Patient } from '../models/patient.model.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../Utils/cloudinary.js';
import { asyncHandler } from '../Utils/asyncHandler.js';
import { ApiError } from '../Utils/ApiError.js';
import { ApiResponse } from '../Utils/ApiResponse.js';

export const uploadPatientFile = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { category, notes } = req.body;

  if (!req.file) {
    throw new ApiError(400, 'No file attachment provided');
  }

  // Find patient first and verify it belongs to user
  const patient = await Patient.findOne({ _id: id, userId: req.user._id });
  if (!patient) {
    throw new ApiError(404, 'Patient not found');
  }

  try {
    // Upload buffer to Cloudinary
    const folder = `scribologist_patients/${req.user._id}/${id}`;
    const uploadResult = await uploadToCloudinary(req.file.buffer, folder);

    // Save to patient schema
    const newFile = {
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      category: category || 'General',
      notes: notes || '',
      uploadedAt: new Date(),
    };

    patient.files.push(newFile);
    await patient.save();

    return res
      .status(200)
      .json(new ApiResponse(200, patient, 'Patient file uploaded successfully'));
  } catch (error) {
    throw new ApiError(500, `Failed to upload patient file: ${error.message}`);
  }
});

export const deletePatientFile = asyncHandler(async (req, res) => {
  const { id, fileId } = req.params;

  // Find patient and verify it belongs to user
  const patient = await Patient.findOne({ _id: id, userId: req.user._id });
  if (!patient) {
    throw new ApiError(404, 'Patient not found');
  }

  // Find file details in array
  const fileObj = patient.files.id(fileId);
  if (!fileObj) {
    throw new ApiError(404, 'Attached file not found');
  }

  try {
    // Delete from Cloudinary
    await deleteFromCloudinary(fileObj.publicId);

    // Delete from patient schema
    patient.files.pull(fileId);
    await patient.save();

    return res
      .status(200)
      .json(new ApiResponse(200, patient, 'Patient file deleted successfully'));
  } catch (error) {
    throw new ApiError(500, `Failed to delete patient file: ${error.message}`);
  }
});
