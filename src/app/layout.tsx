import "./globals.css";
import { Providers } from "@/components/Providers";
import { Toaster } from "sonner";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className="min-h-screen bg-neutral-50 text-neutral-900 antialiased dark:bg-neutral-950 dark:text-neutral-100" suppressHydrationWarning>
        <Providers>
          {children}
          {/* TAMBAHKAN TOASTER DISINI */}
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