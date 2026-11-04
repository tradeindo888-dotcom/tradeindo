import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "credentials",
      credentials: { email: { label: "Email", type: "email" }, password: { label: "Password", type: "password" } },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;
        
        const user = await prisma.user.findUnique({ where: { email: credentials.email } });
        if (!user) return null;

        // --- BLOKIR VERIFIKASI EMAIL TELAH DIHAPUS ---
        // if (user.role !== "ADMIN" && !user.emailVerifiedAt) {
        //   throw new Error("EmailNotVerified");
        // }

        // Cek Status Akun
        if (user.status === "SUSPENDED") {
          throw new Error(`AccountSuspended:${user.suspendReason || "Pelanggaran aturan platform."}`);
        }
        if (user.status === "BANNED") {
          throw new Error(`AccountBanned:${user.suspendReason || "Akun diblokir permanen."}`);
        }

        const ok = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!ok) return null;

        // KEMBALIKAN SEMUA DATA (Termasuk role)
        return { 
          id: user.id, 
          email: user.email, 
          name: user.name, 
          role: user.role, 
          companyId: user.companyId 
        } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.companyId = (user as any).companyId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id || token.sub;
        (session.user as any).role = token.role;
        (session.user as any).companyId = token.companyId;
      }
      return session;
    },
  },
  pages: { signIn: "/id/login" },
};