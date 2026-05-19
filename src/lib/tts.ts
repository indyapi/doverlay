"use client";

export interface TtsVoice {
  name: string;
  voiceURI: string;
  lang: string;
}

export interface SpeakOptions {
  voiceURI?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
}

/**
 * ดึงรายการเสียงทั้งหมดที่มีในเครื่อง
 */
export function getVoices(): SpeechSynthesisVoice[] {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    return [];
  }
  return window.speechSynthesis.getVoices();
}

/**
 * ดึงรายการเสียงภาษาไทยที่มีในเครื่อง
 */
export async function getThaiVoices(): Promise<TtsVoice[]> {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    return [];
  }

  return new Promise((resolve) => {
    let voices = window.speechSynthesis.getVoices();
    
    const filterThai = (vList: SpeechSynthesisVoice[]) => 
      vList
        .filter(v => v.lang.startsWith("th"))
        .map(v => ({ name: v.name, voiceURI: v.voiceURI, lang: v.lang }));

    if (voices.length > 0) {
      resolve(filterThai(voices));
    } else {
      window.speechSynthesis.onvoiceschanged = () => {
        voices = window.speechSynthesis.getVoices();
        resolve(filterThai(voices));
      };
      
      // Fallback สำหรับบาง Browser ที่อาจจะไม่ trigger onvoiceschanged
      setTimeout(() => {
        resolve(filterThai(window.speechSynthesis.getVoices()));
      }, 1000);
    }
  });
}

/**
 * อ่านข้อความด้วยเสียงที่กำหนด
 */
export function speak(text: string, options: SpeakOptions = {}): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      reject(new Error("Speech synthesis not supported"));
      return;
    }

    // หยุดเสียงที่กำลังเล่นอยู่
    window.speechSynthesis.cancel();

    // สร้าง Utterance
    const utterance = new SpeechSynthesisUtterance(text);
    
    // ตั้งค่าพื้นฐาน (บังคับ th-TH เสมอตามนโยบาย)
    utterance.lang = "th-TH";
    utterance.rate = options.rate ?? 1.0;
    utterance.pitch = options.pitch ?? 1.0;
    utterance.volume = options.volume ?? 1.0;

    // เลือก Voice
    const voices = window.speechSynthesis.getVoices();
    if (options.voiceURI) {
      const selectedVoice = voices.find(v => v.voiceURI === options.voiceURI);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
    }

    // ถ้าไม่มี Voice ที่เลือก หรือหาไม่เจอ ให้หาภาษาไทยตัวอื่นเป็น fallback
    if (!utterance.voice) {
      const thaiVoice = voices.find(v => v.lang.startsWith("th"));
      if (thaiVoice) utterance.voice = thaiVoice;
    }

    utterance.onend = () => resolve();
    utterance.onerror = (e) => reject(e);

    window.speechSynthesis.speak(utterance);
  });
}

/**
 * หยุดการพูดทันที
 */
export function stopSpeaking() {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}
