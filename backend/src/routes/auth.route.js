import express from "express";
import passport from "../config/passport.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

const generateTokenAndRedirect = (req, res) => {
    const user = req.user;
    const token = jwt.sign(
        { id: user._id, username: user.username || user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
    );
    
    // Stringify user for frontend to store
    const userObj = encodeURIComponent(JSON.stringify({
        id: user._id,
        username: user.username || user.first_name,
        role: user.role,
        avatar: user.avatar
    }));

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    res.redirect(`${frontendUrl}/auth/callback?token=${token}&user=${userObj}`);
};

// Google OAuth routes
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

router.get("/google/callback", 
    passport.authenticate("google", { session: false, failureRedirect: "/user/login" }),
    generateTokenAndRedirect
);

// Facebook OAuth routes
router.get("/facebook", passport.authenticate("facebook", { scope: ["email"] }));

router.get("/facebook/callback", 
    passport.authenticate("facebook", { session: false, failureRedirect: "/user/login" }),
    generateTokenAndRedirect
);

export default router;
