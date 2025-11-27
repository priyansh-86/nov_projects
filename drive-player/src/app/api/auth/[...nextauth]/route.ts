// src/app/api/auth/[...nextauth]/route.ts

import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

// Initialize NextAuth with our options
const handler = NextAuth(authOptions);

// Export handler for GET and POST requests
export { handler as GET, handler as POST };