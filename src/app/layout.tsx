import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { AuthProvider } from "@/providers/auth-provider";
import { LanguageProvider } from "@/providers/language-provider";
import { LanguageSwitcher } from "@/components/ui/language-switcher";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pathshala Plus",
  description: "Sign in to Pathshala Plus with your mobile number.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-slate-50 text-slate-900">
        <LanguageProvider>
          <AuthProvider>{children}</AuthProvider>
          <div className="fixed bottom-4 right-4 z-50">
            <LanguageSwitcher />
          </div>
        </LanguageProvider>
      </body>
    </html>
  );
}
