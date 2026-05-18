"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Volume2, Play, Save, Loader2, Check } from "lucide-react";
import { getVoices, speak, stopSpeaking } from "@/lib/tts";
import { listenTtsSettings, saveTtsSettings } from "@/lib/firestore";
import type { TtsSettings } from "@/types";

export default function TtsSettingsTab() {
  const [settings, setSettings] = useState<TtsSettings>({
    enabled: true,
    voiceURI: null,
    rate: 1.0,
    pitch: 1.0,
    volume: 1.0,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [testText, setTestText] = useState("ขอบคุณสำหรับการโดเนท ขอให้มีความสุขมากๆ นะครับ");

  useEffect(() => {
    const unsub = listenTtsSettings((s) => {
      if (s) setSettings(s);
      setLoading(false);
    });

    const loadVoices = () => {
      const v = getVoices();
      if (v.length > 0) {
        setVoices(v);
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      unsub();
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveTtsSettings(settings);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleTest = () => {
    speak(testText, {
      voiceURI: settings.voiceURI || undefined,
      rate: settings.rate,
      pitch: settings.pitch,
      volume: settings.volume,
    });
  };

  // กรองเสียงภาษาไทยและจัดกลุ่ม
  const thaiVoices = voices.filter(v => v.lang.startsWith("th"));
  const otherVoices = voices.filter(v => !v.lang.startsWith("th"));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 space-y-6">
        {/* Toggle Enabled */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-white">เปิดใช้งาน TTS</p>
            <p className="text-xs text-white/30">อ่านข้อความเมื่อมีคนโดเนท</p>
          </div>
          <button
            onClick={() => setSettings({ ...settings, enabled: !settings.enabled })}
            className={`relative w-11 h-6 rounded-full transition-colors ${
              settings.enabled ? "bg-violet-600" : "bg-white/10"
            }`}
          >
            <div
              className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                settings.enabled ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* Voice Selection */}
        <div className="space-y-2">
          <label className="text-[10px] text-white/30 uppercase tracking-widest block font-sans">
            เสียงพากย์ (Voice)
          </label>
          <select
            value={settings.voiceURI || ""}
            onChange={(e) => setSettings({ ...settings, voiceURI: e.target.value || null })}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/50 transition-all font-sans"
          >
            <option value="">Default (Auto-select Thai)</option>
            {thaiVoices.length > 0 && (
              <optgroup label="Thai Voices">
                {thaiVoices.map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </optgroup>
            )}
            <optgroup label="Other Voices">
              {otherVoices.map((v) => (
                <option key={v.voiceURI} value={v.voiceURI}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </optgroup>
          </select>
        </div>

        {/* Sliders */}
        <div className="grid grid-cols-1 gap-6">
          <div className="space-y-3">
            <div className="flex justify-between">
              <label className="text-[10px] text-white/30 uppercase tracking-widest block font-sans">
                Volume ({Math.round(settings.volume * 100)}%)
              </label>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={settings.volume}
              onChange={(e) => setSettings({ ...settings, volume: parseFloat(e.target.value) })}
              className="w-full accent-violet-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <label className="text-[10px] text-white/30 uppercase tracking-widest block font-sans">
                Speed Rate ({settings.rate}x)
              </label>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={settings.rate}
                onChange={(e) => setSettings({ ...settings, rate: parseFloat(e.target.value) })}
                className="w-full accent-violet-500"
              />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] text-white/30 uppercase tracking-widest block font-sans">
                Pitch ({settings.pitch})
              </label>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={settings.pitch}
                onChange={(e) => setSettings({ ...settings, pitch: parseFloat(e.target.value) })}
                className="w-full accent-violet-500"
              />
            </div>
          </div>
        </div>

        {/* Test Section */}
        <div className="pt-4 border-t border-white/5 space-y-3">
          <label className="text-[10px] text-white/30 uppercase tracking-widest block font-sans">
            ทดสอบเสียง (Test)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-violet-500/50 transition-all font-sans"
            />
            <button
              onClick={handleTest}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all border border-white/10 flex items-center gap-2"
            >
              <Play className="w-4 h-4" />
              <span className="text-xs font-medium">Test</span>
            </button>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-violet-600 hover:bg-violet-500 disabled:bg-violet-600/50 text-white px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-violet-600/20"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          บันทึกการตั้งค่า
        </button>
      </div>
    </div>
  );
}
