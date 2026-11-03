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

        // Cek Verifikasi Email (Admin bebas)
        if (user.role !== "ADMIN" && !user.emailVerifiedAt) {
          throw new Error("EmailNotVerified");
        }

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
      // Saat login pertama kali, 'user' tersedia. Salin datanya ke 'token'
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.companyId = (user as any).companyId;
      }
      return token;
    },
    async session({ session, token }) {
      // Kirim data dari 'token' ke 'session' agar bisa dibaca frontend
      if (session.user) {
        (session.user as any).id = token.id || token.sub;
        (session.user as any).role = token.role;
        (session.user as any).companyId = token.companyId;
      }
      return session;
    },
  },
  pages: { signIn: "/id/login" }, // Sesuaikan dengan rute login default Anda
};