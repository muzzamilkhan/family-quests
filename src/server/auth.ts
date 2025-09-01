// import { PrismaAdapter } from "@auth/prisma-adapter"; // Removed - handling OAuth manually
import NextAuth, { type DefaultSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

import { db } from "~/lib/db";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      role: "PARENT" | "CHILD";
    } & DefaultSession["user"];
  }

  interface User {
    role: "PARENT" | "CHILD";
  }
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const { handlers, auth } = NextAuth({
  callbacks: {
    session: ({ session, token }) => {
      // All sessions use JWT now, so always use token data
      if (token) {
        return {
          ...session,
          user: {
            ...session.user,
            id: token.sub!,
            name: token.name || session.user?.name,
            email: token.email || session.user?.email,
            image: token.picture || session.user?.image,
            role: token.role as "PARENT" | "CHILD",
          },
        };
      }
      return session;
    },
    jwt: ({ token, user, account }) => {
      try {
        // Store user info in JWT for both OAuth and credentials
        if (user) {
          token.role = user.role;
          token.name = user.name;
          token.email = user.email;
          token.picture = user.image;
        }
        return token;
      } catch (error) {
        // Return a fresh token if there's an error
        return {
          sub: user?.id || token.sub,
          role: user?.role,
          name: user?.name || token.name,
          email: user?.email || token.email,
          picture: user?.image || token.picture,
        };
      }
    },
    async signIn({ user, account, profile }) {
      // For Google OAuth, ensure user exists in database
      if (account?.provider === "google" && profile) {
        try {
          // Check if a placeholder user already exists with this email
          const existingUser = await db.user.findUnique({
            where: { email: user.email! },
          });

          if (existingUser) {
            // Update existing placeholder user with Google account data
            await db.user.update({
              where: { email: user.email! },
              data: {
                name: user.name || existingUser.name, // Keep existing name if Google doesn't provide one
                image: user.image,
                // Don't override role - keep existing role (PARENT from addParent)
                // Don't override familyId - keep existing family connection
              },
            });
            
            // Create the OAuth account record to link Google account to existing user
            await db.account.upsert({
              where: {
                provider_providerAccountId: {
                  provider: account!.provider,
                  providerAccountId: account!.providerAccountId,
                },
              },
              update: {
                access_token: account!.access_token,
                refresh_token: account!.refresh_token,
                expires_at: account!.expires_at,
                token_type: account!.token_type,
                scope: account!.scope,
                id_token: account!.id_token,
                session_state: account!.session_state as string | null,
              },
              create: {
                userId: existingUser.id,
                type: account!.type,
                provider: account!.provider,
                providerAccountId: account!.providerAccountId,
                access_token: account!.access_token,
                refresh_token: account!.refresh_token,
                expires_at: account!.expires_at,
                token_type: account!.token_type,
                scope: account!.scope,
                id_token: account!.id_token,
                session_state: account!.session_state as string | null,
              },
            });
            
            // Update the user object to match the existing database user
            user.id = existingUser.id;
            user.role = existingUser.role;
          } else {
            // Create new user if no placeholder exists
            await db.user.create({
              data: {
                id: user.id!,
                email: user.email!,
                name: user.name!,
                image: user.image,
                role: "PARENT",
              },
            });
          }
        } catch (error) {
          console.error("❌ Failed to sync Google user:", error);
          return false; // Prevent sign-in on database error
        }
      }
      
      return true;
    },
  },
  // Removed PrismaAdapter since we handle OAuth account creation manually in signIn callback
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          role: "PARENT", // Default to parent role for Google OAuth
        };
      },
    }),
    CredentialsProvider({
      id: "permalink",
      name: "Permalink Login",
      credentials: {
        permalink: { label: "Permalink", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.permalink) return null;

        const user = await db.user.findUnique({
          where: { permalink: credentials.permalink },
        });

        if (!user || user.role !== "CHILD") {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email || `${user.id}@permalink.local`, // Provide a fake email for children
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt", // Use JWT to support both OAuth and Credentials properly
  },
  jwt: {
    // Add explicit maxAge to ensure tokens don't get corrupted
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  // Ensure we have debug info
  debug: process.env.NODE_ENV === "development",
});

/**
 * Wrapper for `auth` so that you don't need to import the `auth` in every file.
 *
 * @see https://next-auth.js.org/configuration/nextjs
 */
export const getServerAuthSession = () => {
  return auth();
};