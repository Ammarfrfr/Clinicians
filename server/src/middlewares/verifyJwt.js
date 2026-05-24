import { User } from '../models/user.model.js';
import jwt from 'jsonwebtoken';
import { asyncHandler } from '../Utils/asyncHandler.js';
import { ApiError } from '../Utils/ApiError.js';

const verifyJwt = asyncHandler(async (req, res, next) => {
  try {
    const token = req.cookies?.accessToken || req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      throw new ApiError(401, 'No authentication token provided. Please login.');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded?.id).select('-password');

    if (!user) {
      throw new ApiError(401, 'User not found. Please login again.');
    }

    if (!user.isActive) {
      throw new ApiError(403, 'Account is deactivated. Contact support.');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(401, error?.message || 'Invalid authentication token');
  }
});

export { verifyJwt };
