import NextAuth, { type NextAuthOptions, type DefaultSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "ADMIN" | "CUSTOMER";
      accessToken: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: "ADMIN" | "CUSTOMER";
    accessToken: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "ADMIN" | "CUSTOMER";
    accessToken?: string;
  }
}

// ─── Auth options (exported so we can use getServerSession(authOptions) anywhere) ──
export const authOptions: NextAuthOptions = {
  providers: [
    // ── 1. Email + Password (talks to our Express API) ────────────────────────
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: credentials.email,
                password: credentials.password,
              }),
            },
          );

          if (!res.ok) return null;

          const { user, token } = await res.json();

          // Return shape must match User interface above
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            role: user.role,
            accessToken: token,
          };
        } catch (err) {
          console.error(err);
          return null;
        }
      },
    }),

    // ── 2. Google OAuth ───────────────────────────────────────────────────────
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],

  callbacks: {
    // Runs after every sign-in
    // For Google OAuth: we call our API to upsert the user in our DB
    // and get back our own JWT — same flow as email login
    async signIn({ user, account }) {
      // Credentials provider — already handled by authorize()
      if (account?.provider === "credentials") return true;

      // Google provider — sync to our DB
      if (account?.provider === "google") {
        try {
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/auth/oauth`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                provider: "google",
                email: user.email,
                name: user.name,
                image: user.image,
              }),
            },
          );

          if (!res.ok) return false;

          const { user: dbUser, token } = await res.json();

          // Mutate the user object — these flow into jwt() callback below
          user.id = dbUser.id;
          user.role = dbUser.role;
          user.accessToken = token;

          return true;
        } catch {
          return false;
        }
      }

      return false;
    },

    // Runs when JWT is created or updated
    async jwt({ token, user }) {
      // `user` is only present on initial sign-in
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.accessToken = user.accessToken;
      }
      return token;
    },

    // Runs whenever session is accessed via useSession() or getServerSession()
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      session.user.accessToken = token.accessToken ?? "";
      return session;
    },
  },

  pages: {
    signIn: "/login", // our custom login page
    error: "/login", // redirect errors to login with ?error= param
  },

  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
};
