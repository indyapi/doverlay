import type { Metadata } from "next";
import { Space_Grotesk, Syne } from "next/font/google";
import "../globals.css";

const spacegrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-sans" });
const syne = Syne({ subsets: ["latin"], variable: "--font-display" });

export const metadata: Metadata = {
  title: "Doverlay Overlay",
};

// Overlay layout — ไม่มี AuthProvider, body transparent สำหรับ OBS
export default function OverlayLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body
        className={`${spacegrotesk.variable} ${syne.variable} font-sans`}
        style={{ background: "transparent", overflow: "hidden" }}
      >
        {children}
      </body>
    </html>
  );
}
