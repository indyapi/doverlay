import Tesseract from "tesseract.js";
import type { OcrResult } from "@/types";

// รายชื่อธนาคารไทยที่ระบบรู้จัก
const THAI_BANKS = [
  "กสิกรไทย", "ไทยพาณิชย์", "กรุงเทพ", "กรุงไทย", "กรุงศรี",
  "ทหารไทย", "ออมสิน", "ธกส", "อาคารสงเคราะห์", "ซิตี้แบงก์",
  "KBANK", "SCB", "BBL", "KTB", "BAY", "TTB", "GSB",
];

// regex สำหรับดึงจำนวนเงินจากสลิปไทย
const AMOUNT_PATTERNS = [
  /(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*บาท/,
  /จำนวนเงิน[:\s]+(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/,
  /Amount[:\s]+(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,
  /THB\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,
  /(\d{1,3}(?:,\d{3})*\.\d{2})/,
];

// regex สำหรับดึงวันที่
const DATE_PATTERNS = [
  /(\d{2}\/\d{2}\/\d{4})/,
  /(\d{2}-\d{2}-\d{4})/,
  /(\d{1,2}\s+[ก-ฮ]+\s+\d{4})/,
];

function extractAmount(text: string): number | null {
  for (const pattern of AMOUNT_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      const raw = match[1].replace(/,/g, "");
      const value = parseFloat(raw);
      if (!isNaN(value) && value > 0) return value;
    }
  }
  return null;
}

function extractDate(text: string): string | null {
  for (const pattern of DATE_PATTERNS) {
    const match = text.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function extractReceiver(text: string): string | null {
  // หาชื่อผู้รับหลัง keyword ต่างๆ
  const patterns = [
    /ผู้รับ[:\s]+([^\n]+)/,
    /ชื่อบัญชี[:\s]+([^\n]+)/,
    /To[:\s]+([^\n]+)/i,
    /Receiver[:\s]+([^\n]+)/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1].trim();
  }
  return null;
}

function calculateConfidence(
  extractedAmount: number | null,
  expectedAmount: number,
  rawText: string
): number {
  let score = 0;

  // ถ้าอ่านออกมาได้จำนวนเงิน +40 คะแนน
  if (extractedAmount !== null) score += 40;

  // ถ้าจำนวนตรงกับที่ user กรอก +40 คะแนน
  if (extractedAmount !== null && Math.abs(extractedAmount - expectedAmount) < 1) score += 40;

  // ถ้าข้อความยาวพอ (สลิปจริงมีข้อมูลเยอะ) +20 คะแนน
  if (rawText.length > 100) score += 20;

  return score;
}

export async function extractSlipData(
  imageFile: File,
  expectedAmount: number,
  expectedReceiver?: string
): Promise<OcrResult> {
  try {
    const { data } = await Tesseract.recognize(imageFile, "tha+eng", {
      logger: () => {}, // ปิด log
    });

    const rawText = data.text;
    const extractedAmount = extractAmount(rawText);
    const extractedDate = extractDate(rawText);
    const extractedReceiver = extractReceiver(rawText);
    const confidence = calculateConfidence(extractedAmount, expectedAmount, rawText);

    return {
      extractedAmount,
      extractedReceiver,
      extractedDate,
      confidence,
      rawText,
    };
  } catch (error) {
    console.error("OCR Error:", error);
    return {
      extractedAmount: null,
      extractedReceiver: null,
      extractedDate: null,
      confidence: 0,
      rawText: "",
    };
  }
}

// ตรวจสอบว่าผ่านเกณฑ์หรือไม่
export const OCR_CONFIDENCE_THRESHOLD = 80;

export function isOcrConfident(result: OcrResult): boolean {
  return result.confidence >= OCR_CONFIDENCE_THRESHOLD;
}
