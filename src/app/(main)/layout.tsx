import type { Metadata } from "next";
import { Space_Grotesk, Syne } from "next/font/google";
import "../globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

const spacegrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
});

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "Doverlay",
  description: "Donation Overlay for Streamers",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body className={`${spacegrotesk.variable} ${syne.variable} font-sans antialiased`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
