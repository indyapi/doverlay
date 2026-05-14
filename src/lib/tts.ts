"use client";

export function speak(text: string, lang: string = "th-TH"): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      reject(new Error("Speech synthesis not supported"));
      return;
    }

    // หยุดเสียงก่อนหน้าถ้ามี
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // เลือก voice ภาษาไทยถ้ามี
    const voices = window.speechSynthesis.getVoices();
    const thaiVoice = voices.find((v) => v.lang === "th-TH");
    if (thaiVoice) utterance.voice = thaiVoice;

    utterance.onend = () => resolve();
    utterance.onerror = (e) => reject(e);

    window.speechSynthesis.speak(utterance);
  });
}

export function stopSpeaking() {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}
