"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { listenOverlayQueue, markQueueItemPlayed } from "@/lib/firestore";
import { speak } from "@/lib/tts";
import { formatCurrency } from "@/lib/utils";
import type { OverlayQueueItem } from "@/types";

function AlertCard({ item }: { item: OverlayQueueItem }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 60, scale: 0.85 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -40, scale: 0.9 }}
      transition={{
        type: "spring",
        stiffness: 280,
        damping: 22,
      }}
      className="relative w-full max-w-lg"
    >
      {/* Glow */}
      <div className="absolute inset-0 rounded-2xl bg-violet-500/20 blur-xl scale-110 pointer-events-none" />

      {/* Card */}
      <div className="relative bg-[#0d0f1a]/90 border border-violet-500/30 rounded-2xl px-5 py-4 backdrop-blur-md flex items-center gap-4 shadow-2xl overflow-hidden">
        {/* Icon */}
        <div className="flex-shrink-0 w-12 h-12 bg-violet-600/30 border border-violet-500/30 rounded-xl flex items-center justify-center text-2xl">
          💜
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-white font-display font-bold text-lg leading-tight">
              {item.name}
            </span>
            <span className="text-violet-300 font-mono font-bold text-base flex-shrink-0">
              {formatCurrency(item.amount)}
            </span>
          </div>
          {item.message && (
            <motion.p
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="text-white/60 text-sm mt-0.5 truncate"
            >
              {item.message}
            </motion.p>
          )}
        </div>

        {/* Progress bar */}
        <motion.div
          className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-violet-500 via-cyan-400 to-violet-500"
          initial={{ width: "100%" }}
          animate={{ width: "0%" }}
          transition={{ duration: 6, ease: "linear" }}
        />
      </div>
    </motion.div>
  );
}

export default function OverlayAlertPage() {
  const [current, setCurrent] = useState<OverlayQueueItem | null>(null);
  const processingRef = useRef(false);
  const queueRef = useRef<OverlayQueueItem[]>([]);

  const processNext = useCallback(async () => {
    if (processingRef.current) return;
    const next = queueRef.current[0];
    if (!next) return;

    processingRef.current = true;
    setCurrent(next);
    await markQueueItemPlayed(next.id);

    if (next.message) {
      try {
        await speak(`${next.name} โดเนท ${next.amount} บาท ${next.message}`);
      } catch {
        await new Promise(r => setTimeout(r, 6000));
      }
    } else {
      await new Promise(r => setTimeout(r, 600));
    }

    await new Promise(r => setTimeout(r, 600));
    setCurrent(null);
    processingRef.current = false;
    setTimeout(processNext, 400);
  }, []);

  useEffect(() => {
    const unsub = listenOverlayQueue(items => {
      queueRef.current = items;
      if (items.length > 0 && !processingRef.current) {
        setTimeout(processNext, 100);
      }
    });
    return unsub;
  }, [processNext]);

  return (
    <div className="w-screen h-screen flex items-end justify-start p-6" style={{ background: "transparent" }}>
      <AnimatePresence mode="wait">
        {current && <AlertCard key={current.id} item={current} />}
      </AnimatePresence>
    </div>
  );
}
