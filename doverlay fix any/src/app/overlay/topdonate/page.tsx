"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { listenTopDonators } from "@/lib/firestore";
import { formatCurrency } from "@/lib/utils";
import type { TopDonator } from "@/types";

const MEDAL: Record<number, string> = { 0: "🥇", 1: "🥈", 2: "🥉" };

const RANK_COLORS: Record<number, { bar: string; text: string; bg: string }> = {
  0: { bar: "from-yellow-400 to-amber-300",  text: "text-yellow-300",  bg: "bg-yellow-400/10 border-yellow-400/20" },
  1: { bar: "from-slate-300 to-slate-200",   text: "text-slate-300",   bg: "bg-slate-400/10 border-slate-400/20" },
  2: { bar: "from-orange-400 to-amber-500",  text: "text-orange-300",  bg: "bg-orange-400/10 border-orange-400/20" },
};

function DonatorRow({ donator, rank, maxAmount }: { donator: TopDonator; rank: number; maxAmount: number }) {
  const pct = maxAmount > 0 ? (donator.totalAmount / maxAmount) * 100 : 0;
  const color = RANK_COLORS[rank] ?? { bar: "from-violet-500 to-violet-400", text: "text-violet-300", bg: "bg-violet-400/10 border-violet-400/10" };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ delay: rank * 0.05, duration: 0.35 }}
      className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl border backdrop-blur-sm overflow-hidden ${color.bg}`}
    >
      {/* Rank */}
      <span className="text-base w-6 text-center flex-shrink-0">
        {MEDAL[rank] ?? <span className="text-xs text-white/30 font-mono">#{rank + 1}</span>}
      </span>

      {/* Name + bar */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-white truncate">{donator.name}</span>
          <span className={`text-sm font-mono font-bold flex-shrink-0 ml-2 ${color.text}`}>
            {formatCurrency(donator.totalAmount)}
          </span>
        </div>
        {/* Progress bar */}
        <div className="h-0.5 w-full bg-white/[0.06] rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full bg-gradient-to-r ${color.bar}`}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: "easeOut", delay: rank * 0.05 + 0.2 }}
          />
        </div>
      </div>
    </motion.div>
  );
}

export default function OverlayTopDonatePage() {
  const [top, setTop] = useState<TopDonator[]>([]);

  useEffect(() => {
    const unsub = listenTopDonators(setTop);
    return unsub;
  }, []);

  const maxAmount = top[0]?.totalAmount ?? 0;

  return (
    <div className="w-screen h-screen flex items-start justify-start p-4" style={{ background: "transparent" }}>
      <div className="w-72">
        {/* Header */}
        <div className="flex items-center gap-2 mb-3 px-1">
          <span className="text-lg">🏆</span>
          <span className="text-sm font-display font-bold text-white/80 uppercase tracking-widest">Top Donate</span>
        </div>

        {/* List */}
        <div className="space-y-1.5">
          <AnimatePresence>
            {top.length === 0 ? (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-white/20 text-center py-4"
              >
                ยังไม่มีข้อมูล
              </motion.p>
            ) : (
              top.map((d, i) => (
                <DonatorRow key={d.name} donator={d} rank={i} maxAmount={maxAmount} />
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
