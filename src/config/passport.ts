import passport from "passport";
import { Strategy as GoogleStrategy, Profile } from "passport-google-oauth20";
import { VerifyCallback } from "passport-google-oauth20";
import { env } from "./env.js";
import prisma from "../lib/prisma.js";

interface AppId {
  user_id?: string;
  googleId: string | null;
  firstname: string | null;
  lastname: string | null;
  email: string;
}

passport.use(
  new GoogleStrategy(
    {
      clientID: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      callbackURL: env.GOOGLE_REDIRECT_URL,
    },
    async (
      accessToken: string,
      refreshToken: string,
      profile: Profile,
      done: VerifyCallback,
    ) => {
      try {
        const email = profile.emails?.[0]?.value?.trim().toLowerCase();

        if (!email) {
          return done(
            new Error("Google account did not provide an email address"),
            undefined,
          );
        }

        // Find account on database
        let user: AppId | null = await prisma.user.findFirst({
          where: { googleId: profile.id },
        });

        if (!user) {
          user = await prisma.user.upsert({
            where: { email },
            update: { googleId: profile.id },
            create: {
              googleId: profile.id,
              firstname: profile._json.given_name ?? "",
              lastname: profile._json.family_name ?? "",
              email,
              password: "",
              is_active: true,
              role: {
                create: {
                  role_name: "user",
                },
              },
            },
          });
        }

        return done(null, user);
      } catch (err: any | Error) {
        return done(err as Error, undefined);
      }
    },
  ),
);

export default passport;
