"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, QrCode, CreditCard, Copy, Check,
  Loader2, Heart, AlertCircle, CheckCircle2, X
} from "lucide-react";
import Image from "next/image";
import {
  listenPaymentSettings,
  createDonation,
  updateDonationStatus,
  approveDonation,
  confirmDonation,
  uploadSlip,
} from "@/lib/firestore";
import { extractSlipData, validateSlipWithOCR } from "@/lib/ocr";
import { formatCurrency } from "@/lib/utils";
import type { PaymentSettings, PaymentMethod } from "@/types";

type Step = "form" | "payment" | "uploading" | "result";
type ResultState = "success" | "pending" | "error";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="flex-shrink-0 p-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-white/40 hover:text-white/80 transition-all"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

function FormStep({ name, setName, message, setMessage, amount, setAmount, onNext }: {
  name: string; setName: (v: string) => void;
  message: string; setMessage: (v: string) => void;
  amount: string; setAmount: (v: string) => void;
  onNext: () => void;
}) {
  return (
    <motion.div key="form" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.3 }} className="space-y-4">
      <div>
        <label className="text-xs text-white/40 uppercase tracking-widest mb-1.5 block">ชื่อของคุณ *</label>
        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="ใส่ชื่อที่ต้องการแสดง" maxLength={32}
          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-violet-500/50 transition-all" />
      </div>
      <div>
        <label className="text-xs text-white/40 uppercase tracking-widest mb-1.5 block">ข้อความฝาก</label>
        <input type="text" value={message} onChange={e => setMessage(e.target.value)} placeholder="ฝากอะไรไว้ได้เลย..." maxLength={100}
          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-violet-500/50 transition-all" />
      </div>
      <div>
        <label className="text-xs text-white/40 uppercase tracking-widest mb-1.5 block">จำนวนเงิน (บาท) *</label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-white/30 font-mono">฿</span>
          <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" min={1}
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-8 pr-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-violet-500/50 transition-all font-mono" />
        </div>
        <div className="flex gap-2 mt-2">
          {[20, 50, 100, 200, 500].map(v => (
            <button key={v} onClick={() => setAmount(String(v))}
              className={`flex-1 text-xs py-1.5 rounded-lg transition-all ${amount === String(v) ? "bg-violet-600/30 text-violet-300 border border-violet-500/30" : "bg-white/[0.03] text-white/30 border border-white/[0.06] hover:border-white/[0.14]"}`}>
              {v}
            </button>
          ))}
        </div>
      </div>
      <button onClick={onNext} disabled={!name.trim() || !(Number(amount) > 0)}
        className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:bg-white/[0.05] disabled:text-white/20 text-white rounded-xl py-3.5 text-sm font-medium transition-all mt-2">
        <Heart className="w-4 h-4" />
        ถัดไป — เลือกวิธีชำระเงิน
      </button>
    </motion.div>
  );
}

function PaymentStep({ settings, amount, method, setMethod, slip, setSlip, onBack, onDonate, donating, donatingMsg }: {
  settings: PaymentSettings; amount: number;
  method: PaymentMethod | null; setMethod: (m: PaymentMethod) => void;
  slip: File | null; setSlip: (f: File | null) => void;
  onBack: () => void; onDonate: () => void; donating: boolean; donatingMsg: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  useEffect(() => {
    if (!slip) { setPreview(null); return; }
    const url = URL.createObjectURL(slip);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [slip]);

  return (
    <motion.div key="payment" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.3 }} className="space-y-4">
      <div className="bg-violet-600/10 border border-violet-500/20 rounded-xl px-4 py-3 flex items-center justify-between">
        <span className="text-sm text-white/50">ยอดโดเนท</span>
        <span className="text-xl font-mono font-bold text-violet-300">{formatCurrency(amount)}</span>
      </div>
      <div>
        <p className="text-xs text-white/40 uppercase tracking-widest mb-2">วิธีชำระเงิน</p>
        <div className="grid grid-cols-2 gap-2">
          {settings.methods.includes("promptpay") && (
            <button onClick={() => setMethod("promptpay")}
              className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${method === "promptpay" ? "bg-violet-600/20 border-violet-500/40 text-violet-300" : "bg-white/[0.03] border-white/[0.08] text-white/40 hover:border-white/[0.18]"}`}>
              <QrCode className="w-5 h-5" />
              <span className="text-xs font-medium">Promptpay QR</span>
            </button>
          )}
          {settings.methods.includes("bank") && (
            <button onClick={() => setMethod("bank")}
              className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${method === "bank" ? "bg-violet-600/20 border-violet-500/40 text-violet-300" : "bg-white/[0.03] border-white/[0.08] text-white/40 hover:border-white/[0.18]"}`}>
              <CreditCard className="w-5 h-5" />
              <span className="text-xs font-medium">บัญชีธนาคาร</span>
            </button>
          )}
        </div>
      </div>
      <AnimatePresence mode="wait">
        {method === "promptpay" && settings.promptpayQR && (
          <motion.div key="qr" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 flex flex-col items-center gap-3">
            <p className="text-xs text-white/30">สแกน QR Code เพื่อโอนเงิน</p>
            <div className="relative w-40 h-40 bg-white rounded-xl overflow-hidden">
              <Image src={settings.promptpayQR} alt="QR" fill className="object-contain p-2" />
            </div>
            <p className="text-xs text-white/20 text-center">
              โอน <span className="text-violet-300 font-mono">{formatCurrency(amount)}</span> แล้วบันทึกสลิป
            </p>
          </motion.div>
        )}
        {method === "bank" && settings.bank && (
          <motion.div key="bank" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 space-y-2.5">
            <p className="text-xs text-white/30 mb-1">ข้อมูลบัญชีปลายทาง</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/40">ธนาคาร</span>
              <span className="text-sm text-white">{settings.bank.bankName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/40">ชื่อบัญชี</span>
              <span className="text-sm text-white">{settings.bank.accountName}</span>
            </div>
            <div className="flex items-center justify-between border-t border-white/[0.06] pt-2.5">
              <span className="text-xs text-white/40">เลขบัญชี</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono text-white">{settings.bank.accountNumber}</span>
                <CopyButton text={settings.bank.accountNumber} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div>
        <p className="text-xs text-white/40 uppercase tracking-widest mb-2">อัพโหลดสลิป *</p>
        {preview ? (
          <div className="relative">
            <div className="relative w-full h-48 bg-white/[0.03] border border-white/[0.08] rounded-xl overflow-hidden">
              <Image src={preview} alt="Slip" fill className="object-contain p-2" />
            </div>
            <button onClick={() => setSlip(null)}
              className="absolute top-2 right-2 w-7 h-7 bg-black/60 hover:bg-black/80 rounded-lg flex items-center justify-center text-white/60 hover:text-white transition-all">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button onClick={() => fileRef.current?.click()}
            className="w-full border border-dashed border-white/[0.10] rounded-xl p-6 flex flex-col items-center gap-2 text-white/25 hover:border-violet-500/40 hover:text-violet-400 transition-all">
            <Upload className="w-6 h-6" />
            <span className="text-xs">คลิกเพื่ออัพโหลดสลิป</span>
            <span className="text-[10px] text-white/15">PNG, JPG ไม่เกิน 10MB</span>
          </button>
        )}
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && setSlip(e.target.files[0])} />
      </div>
      <div className="flex gap-2 pt-1">
        <button onClick={onBack} className="px-4 py-3 rounded-xl text-sm text-white/30 bg-white/[0.03] border border-white/[0.08] hover:border-white/[0.16] transition-all">
          ย้อนกลับ
        </button>
        <button onClick={onDonate} disabled={!method || !slip || donating}
          className="flex-1 flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:bg-white/[0.05] disabled:text-white/20 text-white rounded-xl py-3 text-sm font-medium transition-all">
          {donating ? <><Loader2 className="w-4 h-4 animate-spin" /> {donatingMsg}</> : <><Heart className="w-4 h-4" /> Donate!</>}
        </button>
      </div>
    </motion.div>
  );
}

function ResultStep({ state, onReset }: { state: ResultState; onReset: () => void }) {
  const cfg = {
    success: { icon: <CheckCircle2 className="w-12 h-12 text-green-400" />, title: "ขอบคุณมากครับ! 🎉", msg: "ระบบตรวจสอบสลิปเรียบร้อย โดเนทจะปรากฏบน Stream ในอีกไม่ช้า", color: "text-green-400", bg: "bg-green-400/10 border-green-400/20" },
    pending: { icon: <AlertCircle className="w-12 h-12 text-yellow-400" />, title: "อยู่ระหว่างตรวจสอบ", msg: "Streamer จะตรวจสอบและยืนยันให้เอง กรุณารอสักครู่", color: "text-yellow-400", bg: "bg-yellow-400/10 border-yellow-400/20" },
    error: { icon: <X className="w-12 h-12 text-red-400" />, title: "เกิดข้อผิดพลาด", msg: "ไม่สามารถส่งข้อมูลได้ กรุณาลองใหม่", color: "text-red-400", bg: "bg-red-400/10 border-red-400/20" },
  }[state];
  return (
    <motion.div key="result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}
      className={`border rounded-2xl p-8 flex flex-col items-center text-center gap-4 ${cfg.bg}`}>
      {cfg.icon}
      <div>
        <h3 className={`text-lg font-display font-bold ${cfg.color}`}>{cfg.title}</h3>
        <p className="text-sm text-white/40 mt-1 leading-relaxed">{cfg.msg}</p>
      </div>
      <button onClick={onReset} className="mt-2 px-6 py-2.5 bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] text-white/50 hover:text-white/80 rounded-xl text-sm transition-all">
        โดเนทอีกครั้ง
      </button>
    </motion.div>
  );
}

export default function DonatePage() {
  const [settings, setSettings] = useState<PaymentSettings | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const [slip, setSlip] = useState<File | null>(null);
  const [step, setStep] = useState<Step>("form");
  const [donating, setDonating] = useState(false);
  const [donatingMsg, setDonatingMsg] = useState("กำลังส่งข้อมูล...");
  const [result, setResult] = useState<ResultState>("success");

  useEffect(() => {
    const unsub = listenPaymentSettings(s => {
      setSettings(s);
      setLoadingSettings(false);
      if (s?.methods.length === 1) setMethod(s.methods[0]);
    });
    return unsub;
  }, []);

  const handleDonate = async () => {
    if (!slip || !method || !settings) return;
    setDonating(true);
    setStep("uploading");
    
    try {
      setDonatingMsg("กำลังตรวจสอบรูปภาพ...");
      const ocrResult = await extractSlipData(slip, Number(amount), settings.bank?.accountName);
      
      // Step 1: ตรวจสอบว่าเป็นสลิปหรือไม่
      if (!ocrResult.isSlip) {
        console.warn("Uploaded image does not look like a slip");
        // เรายังให้ไปต่อแบบ pending แต่บันทึกไว้ว่าไม่ใช่สลิปที่ระบบจำได้
      }

      setDonatingMsg("กำลังอัพโหลดสลิป...");
      const slipUrl = await uploadSlip(slip, "tmp");
      
      setDonatingMsg("กำลังบันทึกข้อมูล...");
      const donationId = await createDonation({ 
        name: name.trim(), 
        message: message.trim(), 
        amount: Number(amount), 
        paymentMethod: method, 
        slipUrl 
      });
      
      if (validateSlipWithOCR(ocrResult)) {
        setDonatingMsg("ยืนยันรายการสำเร็จ!");
        await approveDonation(donationId, true);
        setResult("success");
      } else {
        setDonatingMsg("รอการตรวจสอบจาก Streamer...");
        await updateDonationStatus(donationId, "pending", ocrResult);
        setResult("pending");
      }
      setStep("result");
    } catch (err) {
      console.error(err);
      setResult("error");
      setStep("result");
    } finally {
      setDonating(false);
      setDonatingMsg("กำลังส่งข้อมูล...");
    }
  };

  const handleReset = () => { setName(""); setMessage(""); setAmount(""); setMethod(null); setSlip(null); setStep("form"); };

  return (
    <div className="min-h-screen bg-[#080b10] flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-violet-600/[0.08] rounded-full blur-[130px]" />
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-cyan-500/[0.04] rounded-full blur-[80px]" />
        <div className="absolute bottom-0 left-0 w-[250px] h-[250px] bg-pink-500/[0.04] rounded-full blur-[80px]" />
      </div>
      <div className="relative z-10 w-full max-w-sm">
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6">
          <h1 className="text-3xl font-display font-bold tracking-tight text-white">D<span className="text-violet-400">overlay</span></h1>
          <p className="text-sm text-white/30 mt-1">Support your favorite streamer</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5 backdrop-blur-sm">
          {step !== "result" && (
            <div className="flex items-center gap-2 mb-5">
              {["form", "payment"].map((s, i) => (
                <div key={s} className="flex items-center gap-2 flex-1">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${step === s ? "bg-violet-600 text-white" : (step === "payment" || step === "uploading") && i === 0 ? "bg-green-500/30 text-green-400" : "bg-white/[0.06] text-white/20"}`}>
                    {(step === "payment" || step === "uploading") && i === 0 ? <Check className="w-3 h-3" /> : i + 1}
                  </div>
                  <span className={`text-xs ${step === s ? "text-white/60" : "text-white/20"}`}>{i === 0 ? "ข้อมูล" : "ชำระเงิน"}</span>
                  {i === 0 && <div className="flex-1 h-px bg-white/[0.06]" />}
                </div>
              ))}
            </div>
          )}
          {loadingSettings ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 text-violet-400 animate-spin" /></div>
          ) : !settings || settings.methods.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-white/30">ยังไม่ตั้งค่าช่องทางรับเงิน</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {step === "form" && <FormStep name={name} setName={setName} message={message} setMessage={setMessage} amount={amount} setAmount={setAmount} onNext={() => setStep("payment")} />}
              {(step === "payment" || step === "uploading") && <PaymentStep settings={settings} amount={Number(amount)} method={method} setMethod={setMethod} slip={slip} setSlip={setSlip} onBack={() => setStep("form")} onDonate={handleDonate} donating={donating} donatingMsg={donatingMsg} />}
              {step === "result" && <ResultStep state={result} onReset={handleReset} />}
            </AnimatePresence>
          )}
        </motion.div>
      </div>
    </div>
  );
}
