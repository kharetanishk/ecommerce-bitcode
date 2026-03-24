import NextAuth, { type NextAuthOptions, type DefaultSession } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider      from 'next-auth/providers/google'

// ─── Extend NextAuth types ────────────────────────────────────────────────────

declare module 'next-auth' {
  interface Session {
    user: {
      id:          string
      role:        'ADMIN' | 'CUSTOMER'
      accessToken: string
    } & DefaultSession['user']
  }

  interface User {
    id:           string
    role:         'ADMIN' | 'CUSTOMER'
    accessToken?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id:           string
    role:         'ADMIN' | 'CUSTOMER'
    accessToken?: string
  }
}

// ─── Auth options ─────────────────────────────────────────────────────────────
// Exported separately so getServerSession(authOptions) works in server components

export const authOptions: NextAuthOptions = {
  providers: [
    // ── Email + Password ───────────────────────────────────────────────────
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email:    { label: 'Email',    type: 'email'    },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        try {
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`,
            {
              method:  'POST',
              headers: { 'Content-Type': 'application/json' },
              body:    JSON.stringify({
                email:    credentials.email,
                password: credentials.password,
              }),
            }
          )

          if (!res.ok) return null

          const { user, token } = await res.json()

          return {
            id:          user.id,
            email:       user.email,
            name:        user.name,
            image:       user.image ?? null,
            role:        user.role,
            accessToken: token,
          }
        } catch {
          return null
        }
      },
    }),

    // ── Google OAuth ───────────────────────────────────────────────────────
    GoogleProvider({
      clientId:     process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt:        'consent',
          access_type:   'offline',
          response_type: 'code',
        },
      },
    }),
  ],

  callbacks: {
    // Runs on every sign-in attempt
    async signIn({ user, account }) {
      // Credentials: already handled by authorize()
      if (account?.provider === 'credentials') return true

      // Google: upsert user in our DB, get our own JWT back
      if (account?.provider === 'google') {
        try {
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/auth/oauth`,
            {
              method:  'POST',
              headers: { 'Content-Type': 'application/json' },
              body:    JSON.stringify({
                provider: 'google',
                email:    user.email,
                name:     user.name,
                image:    user.image,
              }),
            }
          )

          if (!res.ok) return false

          const { user: dbUser, token } = await res.json()

          // Mutate user object — flows into jwt() callback
          user.id          = dbUser.id
          user.role        = dbUser.role
          user.accessToken = token

          return true
        } catch {
          return false
        }
      }

      return false
    },

    // Runs when JWT is created or updated
    async jwt({ token, user }) {
      // user is only present on initial sign-in
      if (user) {
        token.id          = user.id
        token.role        = user.role
        token.accessToken = user.accessToken
      }
      return token
    },

    // Runs whenever session is accessed
    async session({ session, token }) {
      session.user.id          = token.id
      session.user.role        = token.role
      session.user.accessToken = token.accessToken ?? ''
      return session
    },
  },

  pages: {
    signIn: '/login',
    error:  '/login',   // errors redirect to /login?error=...
  },

  session: { strategy: 'jwt' },
  secret:  process.env.NEXTAUTH_SECRET,

  // Useful for debugging — remove in production
  debug: process.env.NODE_ENV === 'development',
}

// ─── Route handler ────────────────────────────────────────────────────────────
// Next.js App Router requires named GET and POST exports.
// NextAuth handles both — GET for redirects, POST for credentials sign-in.

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }