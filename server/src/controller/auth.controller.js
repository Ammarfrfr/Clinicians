import { User } from '../models/user.model.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { asyncHandler } from '../Utils/asyncHandler.js';
import { ApiError } from '../Utils/ApiError.js';
import { ApiResponse } from '../Utils/ApiResponse.js';

const getExpiryMs = (expiryStr) => {
  if (!expiryStr) return 7 * 24 * 60 * 60 * 1000; // default 7 days
  const num = parseInt(expiryStr, 10);
  const unit = expiryStr.slice(-1);
  switch (unit) {
    case 'd': return num * 24 * 60 * 60 * 1000;
    case 'h': return num * 60 * 60 * 1000;
    case 'm': return num * 60 * 1000;
    case 's': return num * 1000;
    default: return num;
  }
};

const signToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_SECRET_EXPIRY || '7d' }
  );
};

const setCookieAndRespond = (res, user, statusCode = 200, message = 'Success') => {
  const token = signToken(user._id);
  const isProduction = process.env.NODE_ENV === 'production';

  res.cookie('accessToken', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: getExpiryMs(process.env.JWT_SECRET_EXPIRY),
  });

  // Strip password from response
  const userObj = user.toObject();
  delete userObj.password;

  return res.status(statusCode).json(
    new ApiResponse(statusCode, { user: userObj, token }, message)
  );
};

// Manual Registration
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, hospital, specialization, licenseNumber, qualification, phone, username } = req.body;

  if (!name || !email || !password) {
    throw new ApiError(400, 'Name, email, and password are required');
  }

  if (password.length < 6) {
    throw new ApiError(400, 'Password must be at least 6 characters');
  }

  // Check if email already exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new ApiError(409, 'An account with this email already exists');
  }

  // Check username uniqueness if provided
  if (username) {
    const existingUsername = await User.findOne({ 'profile.username': username });
    if (existingUsername) {
      throw new ApiError(409, 'This username is already taken');
    }
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = new User({
    email: email.toLowerCase(),
    password: hashedPassword,
    profile: {
      name,
      username: username || undefined,
      hospital: hospital || '',
      specialization: specialization || '',
      licenseNumber: licenseNumber || '',
      qualification: qualification || '',
      phone: phone || '',
    },
    onboardingComplete: true,
  });

  await user.save();

  return setCookieAndRespond(res, user, 201, 'Account created successfully');
});

// Manual Login
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, 'Email and password are required');
  }

  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }

  if (!user.password) {
    throw new ApiError(401, 'This account uses Google sign-in. Please use "Sign in with Google".');
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new ApiError(401, 'Invalid email or password');
  }

  if (!user.isActive) {
    throw new ApiError(403, 'Account is deactivated. Contact support.');
  }

  return setCookieAndRespond(res, user, 200, 'Login successful');
});

// Get Current User
export const getCurrentUser = asyncHandler(async (req, res) => {
  return res.status(200).json(
    new ApiResponse(200, req.user, 'User fetched successfully')
  );
});

// Logout
export const logout = asyncHandler(async (req, res) => {
  const isProduction = process.env.NODE_ENV === 'production';

  res.clearCookie('accessToken', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
  });

  return res.status(200).json(
    new ApiResponse(200, null, 'Logged out successfully')
  );
});

// Complete Onboarding (for Google OAuth users or completing profile)
export const completeOnboarding = asyncHandler(async (req, res) => {
  const { name, hospital, specialization, licenseNumber, qualification, phone, username } = req.body;

  if (!name) {
    throw new ApiError(400, 'Name is required');
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // Check username uniqueness if provided and changed
  if (username && username !== user.profile.username) {
    const existingUsername = await User.findOne({ 'profile.username': username });
    if (existingUsername) {
      throw new ApiError(409, 'This username is already taken');
    }
    user.profile.username = username;
  }

  user.profile.name = name;
  user.profile.hospital = hospital || '';
  user.profile.specialization = specialization || '';
  user.profile.licenseNumber = licenseNumber || '';
  user.profile.qualification = qualification || '';
  user.profile.phone = phone || '';
  user.onboardingComplete = true;

  await user.save();

  // Strip password from response
  const userObj = user.toObject();
  delete userObj.password;

  return res.status(200).json(
    new ApiResponse(200, userObj, 'Onboarding completed successfully')
  );
});
