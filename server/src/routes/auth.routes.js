import { Router } from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import { verifyJwt } from '../middlewares/verifyJwt.js';
import { register, login, getCurrentUser, logout, completeOnboarding } from '../controller/auth.controller.js';

const router = Router();

// Helper to resolve frontend redirect URL
const getFrontendUrl = () => {
  if (process.env.FRONTEND_URL) return process.env.FRONTEND_URL;
  if (process.env.CORS && process.env.CORS !== '*') return process.env.CORS;
  return 'http://localhost:5173';
};

// Helper to check if Google OAuth is configured
const isGoogleConfigured = () => {
  return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
};

// Google OAuth
router.get('/google', (req, res, next) => {
  if (!isGoogleConfigured()) {
    const frontendUrl = getFrontendUrl();
    return res.redirect(`${frontendUrl}/login?error=google_not_configured`);
  }
  passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});

router.get('/google/callback', (req, res, next) => {
  if (!isGoogleConfigured()) {
    const frontendUrl = getFrontendUrl();
    return res.redirect(`${frontendUrl}/login?error=google_not_configured`);
  }
  passport.authenticate('google', { session: false })(req, res, next);
}, (req, res) => {
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

    const token = jwt.sign(
      { id: req.user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_SECRET_EXPIRY || '7d' },
    );

    const isProduction = process.env.NODE_ENV === 'production';

    res.cookie('accessToken', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: getExpiryMs(process.env.JWT_SECRET_EXPIRY),
    });

    const frontendUrl = getFrontendUrl();
    res.redirect(`${frontendUrl}/?token=${token}`);
  },
);

// Manual auth
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/me', verifyJwt, getCurrentUser);
router.post('/logout', verifyJwt, logout);
router.patch('/onboarding', verifyJwt, completeOnboarding);

export default router;
