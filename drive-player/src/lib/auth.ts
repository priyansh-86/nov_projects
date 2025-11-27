// src/lib/auth.ts

import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions: NextAuthOptions = {
  // Configure Google Provider
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          // IMPORTANT: Permissions we need from the user
          // 'drive.readonly' is strictly required to list and play files
          scope: "openid email profile https://www.googleapis.com/auth/drive.readonly",
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],
  callbacks: {
    // 1. JWT Callback: When user logs in, grab the access_token from Google
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    // 2. Session Callback: Pass that access_token to the frontend so we can use it
    async session({ session, token }: any) {
      session.accessToken = token.accessToken;
      return session;
    },
  },
  // Use a secret for encryption
  secret: process.env.NEXTAUTH_SECRET,
};