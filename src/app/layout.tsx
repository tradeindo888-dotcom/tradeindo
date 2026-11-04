import "./globals.css";
import { Providers } from "@/components/Providers";
import { Toaster } from "sonner";
import type { Metadata } from "next"; // 1. Tambahkan import ini

// 2. Tambahkan blok metadata ini
export const metadata: Metadata = {
  title: "Trade Indo",
  description: "Platform B2B untuk Supplier dan Buyer di Indonesia",
  verification: {
    google: "C5DPwXba66i6i60i7uh42uv5vY3Sgk8FjdVnHx318Qo", // Kode dari Google Search Console
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className="min-h-screen bg-neutral-50 text-neutral-900 antialiased dark:bg-neutral-950 dark:text-neutral-100" suppressHydrationWarning>
        <Providers>
          {children}
          <Toaster 
            position="top-center" 
            richColors 
            expand={false} 
            closeButton 
          />
        </Providers>
      </body>
    </html>
  );
}