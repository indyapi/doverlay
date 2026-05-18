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

// Keywords ที่มักพบในสลิปธนาคาร
const SLIP_KEYWORDS = [
  "รายการสำเร็จ", "โอนเงินสำเร็จ", "บันทึกช่วยจำ", "จำนวนเงิน",
  "ผู้โอน", "ผู้รับเงิน", "วัน-เวลาที่ทำรายการ", "รหัสอ้างอิง",
  "Transaction Successful", "Transfer Successful", "Successfully",
  "Ref. No", "Reference No", "Date/Time", "Amount",
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
  rawText: string,
  isSlip: boolean
): number {
  let score = 0;

  // ถ้าดูเหมือนเป็นสลิป +30 คะแนน
  if (isSlip) score += 30;

  // ถ้าอ่านออกมาได้จำนวนเงิน +30 คะแนน
  if (extractedAmount !== null) score += 30;

  // ถ้าจำนวนตรงกับที่ user กรอก +30 คะแนน
  if (extractedAmount !== null && Math.abs(extractedAmount - expectedAmount) < 1) score += 30;

  // ถ้าข้อความยาวพอ (สลิปจริงมีข้อมูลเยอะ) +10 คะแนน
  if (rawText.length > 100) score += 10;

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
    const extractedReceiver = extractReceiver(rawText);
    
    // ตรวจสอบว่าเป็นสลิปหรือไม่จาก Keyword หรือ Bank Name
    const hasSlipKeyword = SLIP_KEYWORDS.some(kw => rawText.toLowerCase().includes(kw.toLowerCase()));
    const hasBankName = THAI_BANKS.some(bank => rawText.toUpperCase().includes(bank.toUpperCase()));
    const isSlip = hasSlipKeyword || hasBankName;

    const amountMatch = extractedAmount !== null && Math.abs(extractedAmount - expectedAmount) < 0.1;
    const accountNameMatch = !!(expectedReceiver && extractedReceiver && 
      (extractedReceiver.toLowerCase().includes(expectedReceiver.toLowerCase()) || 
       expectedReceiver.toLowerCase().includes(extractedReceiver.toLowerCase())));

    const confidence = calculateConfidence(extractedAmount, expectedAmount, rawText, isSlip);

    return {
      success: true,
      isSlip,
      accountNameMatch,
      amountMatch,
      extractedText: rawText,
      confidence,
      extractedAmount,
      extractedReceiver,
    };
  } catch (error) {
    console.error("OCR Error:", error);
    return {
      success: false,
      isSlip: false,
      accountNameMatch: false,
      amountMatch: false,
      extractedText: "",
      confidence: 0,
    };
  }
}

// ตรวจสอบว่าผ่านเกณฑ์หรือไม่
export const OCR_CONFIDENCE_THRESHOLD = 80;

export function isOcrConfident(result: OcrResult): boolean {
  return result.confidence >= OCR_CONFIDENCE_THRESHOLD;
}

export function validateSlipWithOCR(result: OcrResult): boolean {
  // เกณฑ์การ Auto Approved: สำเร็จ + เป็นสลิป + จำนวนเงินตรง + ชื่อบัญชีตรง
  return result.success && result.isSlip && result.amountMatch && result.accountNameMatch;
}
