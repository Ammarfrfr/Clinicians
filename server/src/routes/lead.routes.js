import { Router } from 'express';
import { DemoLead } from '../models/demoLead.model.js';
import { ApiResponse } from '../Utils/ApiResponse.js';
import { ApiError } from '../Utils/ApiError.js';
import { asyncHandler } from '../Utils/asyncHandler.js';
import { verifyJwt } from '../middlewares/verifyJwt.js';

const router = Router();

const verifyAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    throw new ApiError(403, 'Access denied. Admin authorization required.');
  }
};

// Public Endpoint: Submit a Demo Lead
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { name, email, phone, clinic, specialty, preferredDate, preferredTime } = req.body;

    if (!name || !email || !phone) {
      throw new ApiError(400, 'Name, email, and phone number are required fields.');
    }

    const newLead = await DemoLead.create({
      name,
      email,
      phone,
      clinic: clinic || '',
      specialty: specialty || 'General Practice',
      preferredDate: preferredDate || '',
      preferredTime: preferredTime || '10:00 AM',
    });

    return res.status(201).json(
      new ApiResponse(201, newLead, 'Demo request submitted successfully!')
    );
  })
);

// Admin Endpoint: Fetch All Demo Leads (Admin Only)
router.get(
  '/admin/all',
  verifyJwt,
  verifyAdmin,
  asyncHandler(async (req, res) => {
    const leads = await DemoLead.find({}).sort({ createdAt: -1 });
    return res.status(200).json(
      new ApiResponse(200, leads, 'Demo leads fetched successfully')
    );
  })
);

// Admin Endpoint: Update Lead Status (Admin Only)
router.patch(
  '/admin/:id/status',
  verifyJwt,
  verifyAdmin,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!['Pending', 'Contacted', 'Completed'].includes(status)) {
      throw new ApiError(400, 'Invalid status value.');
    }

    const lead = await DemoLead.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!lead) {
      throw new ApiError(404, 'Demo lead not found.');
    }

    return res.status(200).json(
      new ApiResponse(200, lead, 'Lead status updated successfully')
    );
  })
);

export default router;
