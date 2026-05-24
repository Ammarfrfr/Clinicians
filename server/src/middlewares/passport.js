import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { User } from '../models/user.model.js';

export default function configurePassport() {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.warn('⚠️ WARNING: Google OAuth client credentials (GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET) are missing in .env. Google login is disabled.');
    return;
  }

  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.CALLBACK_URL,
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const existingUser = await User.findOne({ googleId: profile.id });
      if (existingUser) {
        // Update avatar on each login
        existingUser.profile.avatar = profile.photos?.[0]?.value;
        await existingUser.save();
        return done(null, existingUser);
      }

      // Create new user from Google profile
      const user = new User({
        googleId: profile.id,
        email: profile.emails[0].value,
        profile: {
          name: profile.displayName,
          avatar: profile.photos?.[0]?.value,
        },
        onboardingComplete: false, // Will need to fill hospital/specialization later
      });

      await user.save();
      done(null, user);
    } catch (error) {
      console.error('Error in Google Strategy:', error);
      done(error, null);
    }
  }));
}
