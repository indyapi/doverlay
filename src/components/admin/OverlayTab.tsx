"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Copy, Check, ExternalLink, Bell, Trophy } from "lucide-react";

interface OverlayLinkCardProps {
  title: string;
  description: string;
  path: string;
  icon: React.ReactNode;
  size: string;
}

function OverlayLinkCard({ title, description, path, icon, size }: OverlayLinkCardProps) {
  const [copied, setCopied] = useState(false);
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const fullUrl = `${baseUrl}${path}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 hover:border-white/[0.14] transition-all duration-200">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-violet-600/20 rounded-lg flex items-center justify-center text-violet-400">
            {icon}
          </div>
          <div>
            <p className="text-sm font-medium text-white">{title}</p>
            <p className="text-xs text-white/30">{description}</p>
          </div>
        </div>
        <span className="text-[10px] text-white/20 bg-white/[0.04] px-2 py-1 rounded-md font-mono">
          {size}
        </span>
      </div>

      {/* URL */}
      <div className="bg-black/30 rounded-lg px-3 py-2 flex items-center justify-between gap-2 mb-3">
        <span className="text-xs text-white/30 font-mono truncate flex-1">{fullUrl}</span>
        <button
          onClick={handleCopy}
          className="flex-shrink-0 text-white/30 hover:text-violet-400 transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={handleCopy}
          className="flex-1 flex items-center justify-center gap-1.5 bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 rounded-lg py-2 text-xs font-medium transition-all"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "คัดลอกแล้ว!" : "คัดลอก URL"}
        </button>
        <a
          href={path}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 bg-white/[0.04] hover:bg-white/[0.08] text-white/40 hover:text-white/70 rounded-lg px-3 py-2 text-xs transition-all"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Preview
        </a>
      </div>
    </div>
  );
}

export default function OverlayTab() {
  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <p className="text-xs text-white/30 uppercase tracking-widest mb-1 font-sans">OBS Browser Source</p>
        <p className="text-sm text-white/50">คัดลอก URL แล้วนำไปวางใน Browser Source ของ OBS หรือโปรแกรม Streaming อื่นๆ</p>
      </div>

      <div className="space-y-3">
        <OverlayLinkCard
          title="Donation Alert"
          description="แจ้งเตือนเมื่อมีคนโดเนท พร้อม TTS อ่านข้อความ"
          path="/overlay/alert"
          icon={<Bell className="w-4 h-4" />}
          size="1920×200"
        />
        <OverlayLinkCard
          title="Top Donate"
          description="แสดงอันดับ Top 10 ผู้โดเนทสูงสุด"
          path="/overlay/topdonate"
          icon={<Trophy className="w-4 h-4" />}
          size="400×600"
        />
      </div>

      {/* How to use */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
        <p className="text-xs text-white/30 uppercase tracking-widest mb-3 font-sans">วิธีใช้งานใน OBS</p>
        <ol className="space-y-2">
          {[
            "คลิก + ใน Sources แล้วเลือก Browser",
            "วาง URL ที่คัดลอกมาในช่อง URL",
            "ตั้งค่า Width/Height ตามขนาดที่แสดง",
            "เปิดใช้งาน Shutdown source when not visible",
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-white/40">
              <span className="flex-shrink-0 w-5 h-5 bg-white/[0.05] rounded-md flex items-center justify-center text-[10px] text-white/30 font-mono mt-0.5">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
