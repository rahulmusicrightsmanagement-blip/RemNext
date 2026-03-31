import { Router, Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma";
import { Role } from "../../generated/prisma/client";
import { authenticate, authorize, AuthRequest } from "../middleware/auth";
import { sendOtpEmail } from "../lib/mailer";
import passport from "../lib/passport";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret";
const SALT_ROUNDS = 10;
const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

// In-memory OTP store: email → { otp, expiresAt, name, passwordHash }
const otpStore = new Map<string, { otp: string; expiresAt: number; name: string; passwordHash: string }>();

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// POST /api/auth/send-otp — step 1: validate, send OTP email
router.post("/send-otp", async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ error: "Name, email, and password are required" });
      return;
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ error: "Email already registered" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const otp = generateOtp();
    const expiresAt = Date.now() + OTP_EXPIRY_MS;

    otpStore.set(email, { otp, expiresAt, name, passwordHash });

    await sendOtpEmail(email, name, otp);

    res.status(200).json({ message: "OTP sent to your email" });
  } catch (err) {
    console.error("Send OTP error:", err);
    res.status(500).json({ error: "Failed to send verification email" });
  }
});

// POST /api/auth/verify-otp — step 2: verify OTP and create account
router.post("/verify-otp", async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      res.status(400).json({ error: "Email and OTP are required" });
      return;
    }

    const record = otpStore.get(email);
    if (!record) {
      res.status(400).json({ error: "No pending verification for this email. Please sign up again." });
      return;
    }

    if (Date.now() > record.expiresAt) {
      otpStore.delete(email);
      res.status(400).json({ error: "OTP has expired. Please sign up again." });
      return;
    }

    if (record.otp !== otp) {
      res.status(400).json({ error: "Invalid OTP. Please try again." });
      return;
    }

    // Double-check email not registered during OTP window
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      otpStore.delete(email);
      res.status(409).json({ error: "Email already registered" });
      return;
    }

    const user = await prisma.user.create({
      data: { name: record.name, email, password: record.passwordHash },
    });

    otpStore.delete(email);

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(201).json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error("Verify OTP error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/auth/google — redirect to Google consent screen
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// GET /api/auth/google/callback — Google redirects here after consent
router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "http://localhost:5173/login?error=google_auth_failed",
  }),
  (req: Request, res: Response) => {
    const user = req.user as any;
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.redirect(
      `http://localhost:5173/auth/callback?token=${token}&role=${user.role}`
    );
  }
);

// POST /api/auth/signup
router.post("/signup", async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ error: "Name, email, and password are required" });
      return;
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ error: "Email already registered" });
      return;
    }

    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await prisma.user.create({
      data: { name, email, password: hashed },
    });

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(201).json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/auth/login
router.post("/login", async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/auth/me — get current user profile
router.get("/me", authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.authPayload!.userId },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json({ user });
  } catch (err) {
    console.error("Get profile error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/auth/users — admin-only: list all users
router.get(
  "/users",
  authenticate,
  authorize("ADMIN"),
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const users = await prisma.user.findMany({
        select: { id: true, name: true, email: true, role: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      });
      res.json({ users });
    } catch (err) {
      console.error("List users error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// PATCH /api/auth/users/:id/role — admin-only: change a user's role
router.patch(
  "/users/:id/role",
  authenticate,
  authorize("ADMIN"),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params.id as string;
      const { role } = req.body;

      if (!role || !["USER", "ADMIN"].includes(role)) {
        res.status(400).json({ error: "Role must be USER or ADMIN" });
        return;
      }

      const user = await prisma.user.update({
        where: { id },
        data: { role: role as Role },
        select: { id: true, name: true, email: true, role: true },
      });

      res.json({ user });
    } catch (err) {
      console.error("Update role error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
