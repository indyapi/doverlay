"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, CreditCard, QrCode, Check, Loader2, Trash2, Building2 } from "lucide-react";
import { getPaymentSettings, savePaymentSettings, uploadPromptpayQR } from "@/lib/firestore";
import type { PaymentSettings, PaymentMethod } from "@/types";
import Image from "next/image";

const THAI_BANKS = [
  { value: "kbank", label: "ธนาคารกสิกรไทย (KBANK)", color: "#138f2d" },
  { value: "scb", label: "ธนาคารไทยพาณิชย์ (SCB)", color: "#4e2d8c" },
  { value: "bbl", label: "ธนาคารกรุงเทพ (BBL)", color: "#1a3e8f" },
  { value: "ktb", label: "ธนาคารกรุงไทย (KTB)", color: "#00a0e9" },
  { value: "bay", label: "ธนาคารกรุงศรีอยุธยา (BAY)", color: "#fec42d" },
  { value: "ttb", label: "ธนาคารทหารไทยธนชาต (TTB)", color: "#ecb11e" },
  { value: "gsb", label: "ธนาคารออมสิน (GSB)", color: "#e91b8e" },
  { value: "baac", label: "ธ.ก.ส. (BAAC)", color: "#4caf50" },
  { value: "ghb", label: "ธนาคารอาคารสงเคราะห์ (GHB)", color: "#f57c00" },
];

export default function PaymentSetupTab() {
  const [settings, setSettings] = useState<PaymentSettings>({
    methods: [],
    promptpayQR: null,
    bank: null,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadingQR, setUploadingQR] = useState(false);
  const qrInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getPaymentSettings().then((s) => {
      if (s) setSettings(s);
    });
  }, []);

  const toggleMethod = (method: PaymentMethod) => {
    setSettings((prev) => ({
      ...prev,
      methods: prev.methods.includes(method)
        ? prev.methods.filter((m) => m !== method)
        : [...prev.methods, method],
    }));
  };

  const handleQRUpload = async (file: File) => {
    setUploadingQR(true);
    try {
      const url = await uploadPromptpayQR(file);
      setSettings((prev) => ({ ...prev, promptpayQR: url }));
    } finally {
      setUploadingQR(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await savePaymentSettings(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  const hasPromptpay = settings.methods.includes("promptpay");
  const hasBank = settings.methods.includes("bank");

  return (
    <div className="space-y-6 max-w-xl">

      {/* Section: เลือกวิธีรับเงิน */}
      <div>
        <p className="text-xs text-white/30 uppercase tracking-widest mb-3 font-sans">
          วิธีรับเงิน
        </p>
        <div className="grid grid-cols-2 gap-3">
          {/* Promptpay */}
          <button
            onClick={() => toggleMethod("promptpay")}
            className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200 ${
              hasPromptpay
                ? "bg-violet-600/20 border-violet-500/50 text-violet-300"
                : "bg-white/[0.03] border-white/[0.08] text-white/40 hover:border-white/20"
            }`}
          >
            {hasPromptpay && (
              <span className="absolute top-2 right-2 w-4 h-4 bg-violet-500 rounded-full flex items-center justify-center">
                <Check className="w-2.5 h-2.5 text-white" />
              </span>
            )}
            <QrCode className="w-6 h-6" />
            <span className="text-xs font-medium">Promptpay QR</span>
          </button>

          {/* Bank */}
          <button
            onClick={() => toggleMethod("bank")}
            className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200 ${
              hasBank
                ? "bg-violet-600/20 border-violet-500/50 text-violet-300"
                : "bg-white/[0.03] border-white/[0.08] text-white/40 hover:border-white/20"
            }`}
          >
            {hasBank && (
              <span className="absolute top-2 right-2 w-4 h-4 bg-violet-500 rounded-full flex items-center justify-center">
                <Check className="w-2.5 h-2.5 text-white" />
              </span>
            )}
            <CreditCard className="w-6 h-6" />
            <span className="text-xs font-medium">บัญชีธนาคาร</span>
          </button>
        </div>
      </div>

      {/* Section: Promptpay QR */}
      <AnimatePresence>
        {hasPromptpay && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4">
              <p className="text-xs text-white/30 uppercase tracking-widest mb-3 font-sans flex items-center gap-2">
                <QrCode className="w-3.5 h-3.5" /> Promptpay QR Code
              </p>

              {settings.promptpayQR ? (
                <div className="flex items-center gap-4">
                  <div className="relative w-20 h-20 bg-white rounded-lg overflow-hidden flex-shrink-0">
                    <Image
                      src={settings.promptpayQR}
                      alt="Promptpay QR"
                      fill
                      className="object-contain p-1"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-white/50 mb-2">อัพโหลดแล้ว</p>
                    <button
                      onClick={() => setSettings((p) => ({ ...p, promptpayQR: null }))}
                      className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> ลบและอัพโหลดใหม่
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => qrInputRef.current?.click()}
                  disabled={uploadingQR}
                  className="w-full border border-dashed border-white/[0.12] rounded-xl p-6 flex flex-col items-center gap-2 text-white/30 hover:border-violet-500/40 hover:text-violet-400 transition-all duration-200"
                >
                  {uploadingQR ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <Upload className="w-6 h-6" />
                  )}
                  <span className="text-xs">
                    {uploadingQR ? "กำลังอัพโหลด..." : "คลิกเพื่ออัพโหลด QR Code"}
                  </span>
                </button>
              )}

              <input
                ref={qrInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleQRUpload(e.target.files[0])}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Section: Bank Account */}
      <AnimatePresence>
        {hasBank && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 space-y-3">
              <p className="text-xs text-white/30 uppercase tracking-widest font-sans flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5" /> ข้อมูลบัญชีธนาคาร
              </p>

              {/* เลือกธนาคาร */}
              <div>
                <label className="text-xs text-white/30 mb-1.5 block">ธนาคาร</label>
                <select
                  value={settings.bank?.bankName || ""}
                  onChange={(e) =>
                    setSettings((p) => ({
                      ...p,
                      bank: { ...(p.bank || { accountName: "", accountNumber: "" }), bankName: e.target.value },
                    }))
                  }
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/50 transition-all appearance-none"
                >
                  <option value="" disabled className="bg-[#0d1117]">เลือกธนาคาร</option>
                  {THAI_BANKS.map((b) => (
                    <option key={b.value} value={b.label} className="bg-[#0d1117]">
                      {b.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* ชื่อบัญชี */}
              <div>
                <label className="text-xs text-white/30 mb-1.5 block">ชื่อบัญชี</label>
                <input
                  type="text"
                  value={settings.bank?.accountName || ""}
                  onChange={(e) =>
                    setSettings((p) => ({
                      ...p,
                      bank: { ...(p.bank || { bankName: "", accountNumber: "" }), accountName: e.target.value },
                    }))
                  }
                  placeholder="ชื่อ นามสกุล"
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-violet-500/50 transition-all"
                />
              </div>

              {/* เลขบัญชี */}
              <div>
                <label className="text-xs text-white/30 mb-1.5 block">เลขบัญชี</label>
                <input
                  type="text"
                  value={settings.bank?.accountNumber || ""}
                  onChange={(e) =>
                    setSettings((p) => ({
                      ...p,
                      bank: { ...(p.bank || { bankName: "", accountName: "" }), accountNumber: e.target.value },
                    }))
                  }
                  placeholder="xxx-x-xxxxx-x"
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-violet-500/50 transition-all font-mono"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={saving || settings.methods.length === 0}
        className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:bg-white/[0.05] disabled:text-white/20 text-white rounded-xl py-3 text-sm font-medium transition-all duration-200"
      >
        {saving ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : saved ? (
          <>
            <Check className="w-4 h-4" /> บันทึกแล้ว
          </>
        ) : (
          "บันทึกการตั้งค่า"
        )}
      </button>
    </div>
  );
}
