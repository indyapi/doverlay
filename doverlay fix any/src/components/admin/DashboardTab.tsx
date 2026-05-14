"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, X, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { listenDonations, confirmDonation, updateDonationStatus } from "@/lib/firestore";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import type { Donation } from "@/types";

type ViewMode = "day" | "month";

function groupByDay(donations: Donation[]) {
  const map: Record<string, Donation[]> = {};
  donations.forEach((d) => {
    const date = new Date(d.createdAt);
    const key = date.toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" });
    if (!map[key]) map[key] = [];
    map[key].push(d);
  });
  return map;
}

function groupByMonth(donations: Donation[]) {
  const map: Record<string, Donation[]> = {};
  donations.forEach((d) => {
    const date = new Date(d.createdAt);
    const key = date.toLocaleDateString("th-TH", { year: "numeric", month: "long" });
    if (!map[key]) map[key] = [];
    map[key].push(d);
  });
  return map;
}

const statusConfig = {
  confirmed: { label: "confirmed", color: "text-green-400", bg: "bg-green-400/10", icon: Check },
  pending:   { label: "pending",   color: "text-yellow-400", bg: "bg-yellow-400/10", icon: Clock },
  rejected:  { label: "rejected",  color: "text-red-400",    bg: "bg-red-400/10",    icon: X },
};

function DonationRow({ donation }: { donation: Donation }) {
  const [confirming, setConfirming] = useState(false);
  const cfg = statusConfig[donation.status];
  const Icon = cfg.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 py-3 border-b border-white/[0.05] last:border-0"
    >
      <span className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded-md font-medium flex-shrink-0 ${cfg.bg} ${cfg.color}`}>
        <Icon className="w-3 h-3" />{cfg.label}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white truncate">{donation.name}</span>
          <span className="text-sm font-mono text-violet-400 flex-shrink-0">{formatCurrency(donation.amount)}</span>
        </div>
        {donation.message && (
          <p className="text-xs text-white/30 truncate mt-0.5">"{donation.message}"</p>
        )}
        <p className="text-[10px] text-white/20 mt-0.5">
          {formatDateTime(new Date(donation.createdAt))}
          {donation.ocr && <span className="ml-2">OCR {donation.ocr.confidence}%</span>}
        </p>
      </div>
      {donation.status === "pending" && (
        <div className="flex gap-1.5 flex-shrink-0">
          <button
            onClick={async () => { setConfirming(true); await confirmDonation(donation.id); setConfirming(false); }}
            disabled={confirming}
            className="w-7 h-7 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg flex items-center justify-center transition-all"
          >
            <Check className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => updateDonationStatus(donation.id, "rejected")}
            className="w-7 h-7 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg flex items-center justify-center transition-all"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </motion.div>
  );
}

function SummaryGroup({ label, donations }: { label: string; donations: Donation[] }) {
  const [open, setOpen] = useState(true);
  const confirmed = donations.filter(d => d.status === "confirmed");
  const total = confirmed.reduce((sum, d) => sum + d.amount, 0);

  return (
    <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-white">{label}</span>
          <span className="text-xs text-white/30">{donations.length} items</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-mono text-violet-400">{formatCurrency(total)}</span>
          {open ? <ChevronUp className="w-4 h-4 text-white/30" /> : <ChevronDown className="w-4 h-4 text-white/30" />}
        </div>
      </button>
      {open && (
        <div className="px-4 pb-2 border-t border-white/[0.05]">
          {donations.map(d => <DonationRow key={d.id} donation={d} />)}
        </div>
      )}
    </div>
  );
}

export default function DashboardTab() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("day");

  useEffect(() => {
    const unsub = listenDonations(setDonations);
    return unsub;
  }, []);

  const confirmed = donations.filter(d => d.status === "confirmed");
  const pending   = donations.filter(d => d.status === "pending");
  const totalAll  = confirmed.reduce((sum, d) => sum + d.amount, 0);
  const grouped   = viewMode === "day" ? groupByDay(donations) : groupByMonth(donations);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-3">
          <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1">Total</p>
          <p className="text-lg font-mono font-bold text-violet-400">{formatCurrency(totalAll)}</p>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-3">
          <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1">All</p>
          <p className="text-lg font-mono font-bold text-white">{donations.length}</p>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-3">
          <p className="text-[10px] text-yellow-400/60 uppercase tracking-widest mb-1">Pending</p>
          <p className="text-lg font-mono font-bold text-yellow-400">{pending.length}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <p className="text-xs text-white/30 uppercase tracking-widest mr-1">View</p>
        {(["day", "month"] as ViewMode[]).map(mode => (
          <button key={mode} onClick={() => setViewMode(mode)}
            className={`text-xs px-3 py-1.5 rounded-lg transition-all ${
              viewMode === mode
                ? "bg-violet-600/30 text-violet-300 border border-violet-500/30"
                : "bg-white/[0.03] text-white/30 border border-white/[0.06] hover:border-white/[0.12]"
            }`}>
            {mode === "day" ? "Daily" : "Monthly"}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {Object.keys(grouped).length === 0 ? (
          <div className="text-center py-12 text-white/20 text-sm">No donations yet</div>
        ) : (
          Object.entries(grouped).map(([label, items]) => (
            <SummaryGroup key={label} label={label} donations={items} />
          ))
        )}
      </div>
    </div>
  );
}
