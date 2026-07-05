import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import User from '../models/user.model.js';
import dotenv from 'dotenv';

dotenv.config();

// Cấu hình Google Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:3000/api/auth/google/callback"
    },
    async (accessToken, refreshToken, profile, done) => {
        try {
            // Tìm user theo oauth_id và provider
            let user = await User.findOne({ oauth_id: profile.id, oauth_provider: 'google' });
            
            if (!user) {
                // Nếu chưa có, tạo mới
                user = new User({
                    oauth_provider: 'google',
                    oauth_id: profile.id,
                    email: profile.emails?.[0]?.value,
                    first_name: profile.name?.givenName || profile.displayName || 'Google',
                    last_name: profile.name?.familyName || 'User',
                    avatar: profile.photos?.[0]?.value,
                    role: 'user'
                });
                await user.save();
            }
            return done(null, user);
        } catch (error) {
            return done(error, null);
        }
    }));
}

// Cấu hình Facebook Strategy
if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
    passport.use(new FacebookStrategy({
        clientID: process.env.FACEBOOK_APP_ID,
        clientSecret: process.env.FACEBOOK_APP_SECRET,
        callbackURL: process.env.FACEBOOK_CALLBACK_URL || "http://localhost:3000/api/auth/facebook/callback",
        profileFields: ['id', 'emails', 'name', 'picture.type(large)']
    },
    async (accessToken, refreshToken, profile, done) => {
        try {
            let user = await User.findOne({ oauth_id: profile.id, oauth_provider: 'facebook' });
            
            if (!user) {
                user = new User({
                    oauth_provider: 'facebook',
                    oauth_id: profile.id,
                    email: profile.emails?.[0]?.value,
                    first_name: profile.name?.givenName || profile.displayName || 'Facebook',
                    last_name: profile.name?.familyName || 'User',
                    avatar: profile.photos?.[0]?.value,
                    role: 'user'
                });
                await user.save();
            }
            return done(null, user);
        } catch (error) {
            return done(error, null);
        }
    }));
}

export default passport;
