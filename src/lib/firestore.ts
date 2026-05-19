import {
  ref, set, push, update, onValue, query,
  orderByChild, equalTo, get, serverTimestamp, remove,
} from "firebase/database";
import { db } from "@/lib/firebase";
import type { Donation, OverlayQueueItem, PaymentSettings, TopDonator, TtsSettings } from "@/types";

// ---- ImgBB Upload ----
export async function uploadImage(file: File): Promise<string> {
  const apiKey = process.env.NEXT_PUBLIC_IMGBB_API_KEY!;
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const form = new FormData();
  form.append("key", apiKey);
  form.append("image", base64);

  const res = await fetch("https://api.imgbb.com/1/upload", {
    method: "POST",
    body: form,
  });
  const data = await res.json();
  if (!data.success) throw new Error("ImgBB upload failed");
  return data.data.url as string;
}

// ---- Donations ----
export async function createDonation(
  data: Omit<Donation, "id" | "createdAt" | "status" | "ocrResult" | "isAutoApproved" | "queueOrder" | "reviewedBy" | "reviewedAt">
): Promise<string> {
  const donationsRef = ref(db, "donations");
  const newRef = push(donationsRef);
  await set(newRef, {
    ...data,
    status: "pending",
    ocrResult: null,
    isAutoApproved: false,
    queueOrder: null,
    reviewedBy: null,
    reviewedAt: null,
    createdAt: Date.now(),
  });
  return newRef.key!;
}

export async function updateDonationStatus(
  id: string,
  status: Donation["status"],
  ocrResult?: Donation["ocrResult"]
) {
  const updates: Record<string, unknown> = { status };
  if (ocrResult) updates.ocrResult = ocrResult;
  await update(ref(db, `donations/${id}`), updates);
}

export async function approveDonation(id: string, isAuto: boolean = false) {
  const status = isAuto ? "auto_approved" : "manual_approved";
  await update(ref(db, `donations/${id}`), { 
    status, 
    isAutoApproved: isAuto,
    reviewedAt: Date.now()
  });

  const snap = await get(ref(db, `donations/${id}`));
  if (snap.exists()) {
    const d = snap.val() as Omit<Donation, "id">;
    const queueRef = push(ref(db, "overlayQueue"));
    await set(queueRef, {
      donationId: id,
      name: d.name,
      message: d.message,
      amount: d.amount,
      played: false,
      createdAt: Date.now(),
      selectedVoice: d.selectedVoice || null,
    });
  }
}

export async function confirmDonation(id: string) {
  return approveDonation(id, false);
}

export function listenDonations(callback: (donations: Donation[]) => void) {
  const q = query(ref(db, "donations"), orderByChild("createdAt"));
  return onValue(q, (snap) => {
    const result: Donation[] = [];
    snap.forEach((child) => {
      const val = child.val();
      // Migration for old status
      if (val.status === "confirmed") val.status = "manual_approved";
      result.unshift({ id: child.key!, ...val });
    });
    callback(result);
  });
}

// ---- Overlay Queue ----
export function listenOverlayQueue(callback: (items: OverlayQueueItem[]) => void) {
  const q = query(ref(db, "overlayQueue"), orderByChild("played"), equalTo(false));
  return onValue(q, (snap) => {
    const result: OverlayQueueItem[] = [];
    snap.forEach((child) => {
      result.push({ id: child.key!, ...child.val() });
    });
    result.sort((a, b) => a.createdAt - b.createdAt);
    callback(result);
  });
}

export async function markQueueItemPlayed(id: string) {
  await update(ref(db, `overlayQueue/${id}`), { played: true });
}

export async function removeFromQueue(id: string) {
  await remove(ref(db, `overlayQueue/${id}`));
}

// ---- Top Donate ----
export function listenTopDonators(callback: (top: TopDonator[]) => void) {
  const q = ref(db, "donations");
  return onValue(q, (snap) => {
    const map: Record<string, number> = {};
    snap.forEach((child) => {
      const d = child.val() as Omit<Donation, "id">;
      if (d.status === "auto_approved" || d.status === "manual_approved" || d.status === "completed" || d.status === ("confirmed" as any)) {
        map[d.name] = (map[d.name] || 0) + d.amount;
      }
    });
    const top = Object.entries(map)
      .map(([name, totalAmount]) => ({ name, totalAmount }))
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 10);
    callback(top);
  });
}

// ---- Settings ----
export function listenPaymentSettings(callback: (s: PaymentSettings | null) => void) {
  return onValue(ref(db, "settings/payment"), (snap) => {
    callback(snap.exists() ? (snap.val() as PaymentSettings) : null);
  });
}

export async function getPaymentSettings(): Promise<PaymentSettings | null> {
  const snap = await get(ref(db, "settings/payment"));
  return snap.exists() ? (snap.val() as PaymentSettings) : null;
}

export async function savePaymentSettings(settings: PaymentSettings) {
  await set(ref(db, "settings/payment"), settings);
}

export function listenTtsSettings(callback: (s: TtsSettings | null) => void) {
  return onValue(ref(db, "settings/tts"), (snap) => {
    callback(snap.exists() ? (snap.val() as TtsSettings) : null);
  });
}

export async function getTtsSettings(): Promise<TtsSettings | null> {
  const snap = await get(ref(db, "settings/tts"));
  return snap.exists() ? (snap.val() as TtsSettings) : null;
}

export async function saveTtsSettings(settings: TtsSettings) {
  await set(ref(db, "settings/tts"), settings);
}

// ---- Control ----
export async function skipCurrentAlert() {
  await set(ref(db, "control/skip"), Date.now());
}

export function listenControlSkip(callback: (val: number) => void) {
  return onValue(ref(db, "control/skip"), (snap) => {
    callback(snap.val() || 0);
  });
}

// Alias สำหรับ slip upload
export async function uploadSlip(file: File, _donationId: string): Promise<string> {
  return uploadImage(file);
}

export async function uploadPromptpayQR(file: File): Promise<string> {
  return uploadImage(file);
}
