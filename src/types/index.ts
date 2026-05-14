import { serverTimestamp  } from "firebase/database";

// ---- Donation ----
export type PaymentMethod = "promptpay" | "bank";
export type DonationStatus = "pending" | "confirmed" | "rejected";

export interface OcrResult {
  extractedAmount: number | null;
  extractedReceiver: string | null;
  extractedDate: string | null;
  confidence: number;
  rawText: string;
}

export interface Donation {
  id: string;
  name: string;
  message: string;
  amount: number;
  paymentMethod: PaymentMethod;
  slipUrl: string;
  status: DonationStatus;
  ocr: OcrResult | null;
  createdAt: number; // Unix timestamp ms
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

// ---- Top Donate ----
export interface TopDonator {
  name: string;
  totalAmount: number;
}
