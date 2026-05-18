"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, X, Clock, ChevronDown, ChevronUp, Trash2, Eye, Loader2 } from "lucide-react";
import { listenDonations, confirmDonation, updateDonationStatus, listenOverlayQueue, removeFromQueue, skipCurrentAlert } from "@/lib/firestore";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import type { Donation, OverlayQueueItem } from "@/types";

type ViewMode = "day" | "month";
type StatusFilter = "all" | "pending" | "approved" | "rejected";

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

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  auto_approved:   { label: "auto approved",   color: "text-green-400", bg: "bg-green-400/10", icon: Check },
  manual_approved: { label: "manual approved", color: "text-blue-400",  bg: "bg-blue-400/10",  icon: Check },
  completed:       { label: "completed",       color: "text-violet-400", bg: "bg-violet-400/10", icon: Check },
  pending:         { label: "pending",         color: "text-yellow-400", bg: "bg-yellow-400/10", icon: Clock },
  rejected:        { label: "rejected",        color: "text-red-400",    bg: "bg-red-400/10",    icon: X },
};

function DonationRow({ donation, onOpenDetail }: { donation: Donation; onOpenDetail: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const cfg = statusConfig[donation.status] || statusConfig.pending;
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
          {donation.ocrResult && <span className="ml-2">OCR {donation.ocrResult.confidence}%</span>}
        </p>
      </div>
      <div className="flex gap-1.5 flex-shrink-0">
        <button
          onClick={onOpenDetail}
          className="w-7 h-7 bg-white/5 hover:bg-white/10 text-white/40 hover:text-white rounded-lg flex items-center justify-center transition-all"
        >
          <Eye className="w-3.5 h-3.5" />
        </button>
        {donation.status === "pending" && (
          <>
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
          </>
        )}
      </div>
    </motion.div>
  );
}

function DonationModal({ donation, onClose }: { donation: Donation; onClose: () => void }) {
  const [confirming, setConfirming] = useState(false);
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#12141c] border border-white/[0.1] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
      >
        <div className="p-4 border-b border-white/[0.05] flex items-center justify-between">
          <h3 className="text-sm font-bold text-white uppercase tracking-widest">Donation Details</h3>
          <button onClick={onClose} className="text-white/30 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
          <div className="relative aspect-[3/4] bg-white/5 rounded-xl overflow-hidden border border-white/10">
            <img src={donation.slipUrl} alt="Slip" className="w-full h-full object-contain" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 rounded-xl p-3 border border-white/5">
              <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1">Donor Name</p>
              <p className="text-sm text-white font-medium truncate">{donation.name}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-3 border border-white/5">
              <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1">Amount</p>
              <p className="text-sm text-violet-400 font-bold">{formatCurrency(donation.amount)}</p>
            </div>
          </div>

          {donation.message && (
            <div className="bg-white/5 rounded-xl p-3 border border-white/5">
              <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1">Message</p>
              <p className="text-sm text-white/60 italic">"{donation.message}"</p>
            </div>
          )}

          {donation.ocrResult && (
            <div className="bg-violet-600/5 rounded-xl p-3 border border-violet-500/10 space-y-2">
              <p className="text-[10px] text-violet-300/50 uppercase tracking-widest">OCR Analysis ({donation.ocrResult.confidence}%)</p>
              <div className="grid grid-cols-2 gap-2">
                <div className={`flex items-center gap-1.5 text-xs ${donation.ocrResult.amountMatch ? "text-green-400" : "text-red-400"}`}>
                  {donation.ocrResult.amountMatch ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />} Amount Match
                </div>
                <div className={`flex items-center gap-1.5 text-xs ${donation.ocrResult.accountNameMatch ? "text-green-400" : "text-red-400"}`}>
                  {donation.ocrResult.accountNameMatch ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />} Name Match
                </div>
                <div className={`flex items-center gap-1.5 text-xs ${donation.ocrResult.isSlip ? "text-green-400" : "text-red-400"}`}>
                  {donation.ocrResult.isSlip ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />} Valid Slip
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-white/5">
                <p className="text-[10px] text-white/20 uppercase mb-1">Raw Text</p>
                <p className="text-[9px] text-white/10 font-mono line-clamp-3 leading-relaxed">{donation.ocrResult.extractedText}</p>
              </div>
            </div>
          )}
        </div>

        {donation.status === "pending" && (
          <div className="p-4 bg-white/[0.02] border-t border-white/[0.05] flex gap-3">
            <button 
              onClick={() => { updateDonationStatus(donation.id, "rejected"); onClose(); }}
              className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl py-3.5 text-xs font-bold uppercase tracking-widest transition-all"
            >
              Reject
            </button>
            <button 
              onClick={async () => { setConfirming(true); await confirmDonation(donation.id); setConfirming(false); onClose(); }}
              disabled={confirming}
              className="flex-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-xl py-3.5 text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2"
            >
              {confirming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Approve
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

function SummaryGroup({ label, donations, onOpenDetail }: { label: string; donations: Donation[]; onOpenDetail: (d: Donation) => void }) {
  const [open, setOpen] = useState(true);
  const approved = donations.filter(d => d.status === "auto_approved" || d.status === "manual_approved" || d.status === "completed");
  const total = approved.reduce((sum, d) => sum + d.amount, 0);

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
          {donations.map(d => <DonationRow key={d.id} donation={d} onOpenDetail={() => onOpenDetail(d)} />)}
        </div>
      )}
    </div>
  );
}

function QueueList() {
  const [queue, setQueue] = useState<OverlayQueueItem[]>([]);
  
  useEffect(() => {
    return listenOverlayQueue(setQueue);
  }, []);

  if (queue.length === 0) return null;

  return (
    <div className="bg-violet-600/5 border border-violet-500/10 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-bold text-violet-300 uppercase tracking-widest flex items-center gap-2">
          <Clock className="w-3 h-3" /> Real-time Queue ({queue.length})
        </h3>
        <button 
          onClick={() => skipCurrentAlert()}
          className="text-[10px] bg-red-500/20 hover:bg-red-500/30 text-red-400 px-2 py-1 rounded-md transition-all flex items-center gap-1 font-bold"
        >
          <X className="w-3 h-3" /> Stop Current Alert
        </button>
      </div>
      <div className="space-y-2">
        {queue.map((item, i) => (
          <div key={item.id} className="flex items-center justify-between bg-white/[0.03] rounded-lg px-3 py-2 border border-white/[0.05]">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono text-white/20">#{i + 1}</span>
              <span className="text-sm font-medium text-white">{item.name}</span>
              <span className="text-xs font-mono text-violet-400">{formatCurrency(item.amount)}</span>
            </div>
            <button 
              onClick={() => removeFromQueue(item.id)}
              className="w-7 h-7 flex items-center justify-center text-white/20 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardTab() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("day");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null);

  useEffect(() => {
    const unsub = listenDonations(setDonations);
    return unsub;
  }, []);

  const approved = donations.filter(d => d.status === "auto_approved" || d.status === "manual_approved" || d.status === "completed");
  const pending   = donations.filter(d => d.status === "pending");
  const totalAll  = approved.reduce((sum, d) => sum + d.amount, 0);

  const filteredDonations = donations.filter(d => {
    if (statusFilter === "all") return true;
    if (statusFilter === "pending") return d.status === "pending";
    if (statusFilter === "approved") return d.status === "auto_approved" || d.status === "manual_approved" || d.status === "completed";
    if (statusFilter === "rejected") return d.status === "rejected";
    return true;
  });

  const grouped = viewMode === "day" ? groupByDay(filteredDonations) : groupByMonth(filteredDonations);

  return (
    <div className="space-y-5">
      {selectedDonation && <DonationModal donation={selectedDonation} onClose={() => setSelectedDonation(null)} />}
      
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

      <QueueList />

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <p className="text-[10px] text-white/30 uppercase tracking-widest mr-1">Status</p>
            {(["all", "pending", "approved", "rejected"] as StatusFilter[]).map(filter => (
              <button key={filter} onClick={() => setStatusFilter(filter)}
                className={`text-[10px] px-3 py-1.5 rounded-lg transition-all font-medium uppercase tracking-wider ${
                  statusFilter === filter
                    ? "bg-violet-600/30 text-violet-300 border border-violet-500/30"
                    : "bg-white/[0.03] text-white/30 border border-white/[0.06] hover:border-white/[0.12]"
                }`}>
                {filter}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <p className="text-[10px] text-white/30 uppercase tracking-widest mr-1">Group By</p>
            {(["day", "month"] as ViewMode[]).map(mode => (
              <button key={mode} onClick={() => setViewMode(mode)}
                className={`text-[10px] px-3 py-1.5 rounded-lg transition-all font-medium uppercase tracking-wider ${
                  viewMode === mode
                    ? "bg-violet-600/30 text-violet-300 border border-violet-500/30"
                    : "bg-white/[0.03] text-white/30 border border-white/[0.06] hover:border-white/[0.12]"
                }`}>
                {mode === "day" ? "Daily" : "Monthly"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {Object.keys(grouped).length === 0 ? (
          <div className="text-center py-12 text-white/20 text-sm">No donations yet</div>
        ) : (
          Object.entries(grouped).map(([label, items]) => (
            <SummaryGroup key={label} label={label} donations={items} onOpenDetail={setSelectedDonation} />
          ))
        )}
      </div>
    </div>
  );
}
