import { serverTimestamp  } from "firebase/database";
import type { TtsVoice } from "@/lib/tts";

// ---- Donation ----
export type PaymentMethod = "promptpay" | "bank";
export type DonationStatus = "pending" | "auto_approved" | "manual_approved" | "rejected" | "completed";

export interface OcrResult {
  success: boolean;
  isSlip: boolean;
  accountNameMatch: boolean;
  amountMatch: boolean;
  extractedText: string;
  confidence: number;
  extractedAmount?: number | null;
  extractedReceiver?: string | null;
}

export interface Donation {
  id: string;
  name: string;
  message: string;
  amount: number;
  paymentMethod: PaymentMethod;
  slipUrl: string;
  status: DonationStatus;
  ocrResult: OcrResult | null;
  isAutoApproved: boolean;
  queueOrder: number | null;
  reviewedBy: string | null;
  reviewedAt: number | null;
  createdAt: number; // Unix timestamp ms
  selectedVoice?: TtsVoice | null;
}

// ---- Overlay Queue ----
export interface OverlayQueueItem {
  id: string;
  donationId: string;
  name: string;
  message: string;
  amount: number;
  played: boolean;
  createdAt: number;
  selectedVoice?: TtsVoice | null;
}

// ---- Settings ----
export interface BankInfo {
  bankName: string;
  accountName: string;
  accountNumber: string;
}

export interface PaymentSettings {
  methods: PaymentMethod[];
  promptpayQR: string | null;
  bank: BankInfo | null;
}

export interface TtsSettings {
  enabled: boolean;
  voiceURI: string | null;
  rate: number;
  pitch: number;
  volume: number;
}

// ---- Top Donate ----
export interface TopDonator {
  name: string;
  totalAmount: number;
}
