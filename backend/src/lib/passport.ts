import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import bcrypt from "bcrypt";
import crypto from "crypto";
import prisma from "./prisma";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: "http://localhost:4000/api/auth/google/callback",
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        const name = profile.displayName || profile.emails?.[0]?.value || "User";

        if (!email) {
          return done(new Error("No email provided by Google"), undefined);
        }

        let user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
          // Google users get a random unhashed password since they won't use password login
          const randomPassword = await bcrypt.hash(
            crypto.randomBytes(32).toString("hex"),
            10
          );
          user = await prisma.user.create({
            data: { name, email, password: randomPassword },
          });
        }

        return done(null, user);
      } catch (err) {
        return done(err as Error, undefined);
      }
    }
  )
);

// Minimal serialize/deserialize — only used during the OAuth handshake
passport.serializeUser((user: any, done) => done(null, user.id));
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    done(null, user);
  } catch (err) {
    done(err);
  }
});

export default passport;
