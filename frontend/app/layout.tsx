import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import ClientShell from "./ClientShell";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "CodeDrop",
  description: "Share your code instantly",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${jetbrains.variable}`}>
      <body className="antialiased selection:bg-[#F6821F] selection:text-white">
        <ClientShell>
          {children}
        </ClientShell>
      </body>
    </html>
  );
}
