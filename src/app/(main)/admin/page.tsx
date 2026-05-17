"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import OverlayTab from "@/components/admin/OverlayTab";
import DashboardTab from "@/components/admin/DashboardTab";
import PaymentSetupTab from "@/components/admin/PaymentSetupTab";
import { LayoutDashboard, MonitorPlay, CreditCard, LogOut, Loader2 } from "lucide-react";

type Tab = "overlay" | "dashboard" | "payment";

const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "overlay", label: "Overlay", icon: <MonitorPlay className="w-4 h-4" /> },
  { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
  { id: "payment", label: "Payment Setup", icon: <CreditCard className="w-4 h-4" /> },
];

export default function AdminPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");

  useEffect(() => {
    if (!loading && !user) {
      router.push("/admin/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080b10] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#080b10] text-white">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-violet-600/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-cyan-500/4 rounded-full blur-[80px]" />
      </div>

      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-56 bg-white/[0.02] border-r border-white/[0.06] z-20 flex flex-col">
        <div className="px-5 py-5 border-b border-white/[0.06]">
          <h1 className="text-xl font-display font-bold tracking-tight">
            D<span className="text-violet-400">overlay</span>
          </h1>
          <p className="text-[10px] text-white/20 mt-0.5 font-sans">Admin Panel</p>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                activeTab === tab.id
                  ? "bg-violet-600/20 text-violet-300 border border-violet-500/20"
                  : "text-white/40 hover:text-white/70 hover:bg-white/[0.04]"
              }`}
            >
              {tab.icon}
              {tab.label}
              {activeTab === tab.id && (
                <motion.span
                  layoutId="activeTab"
                  className="ml-auto w-1.5 h-1.5 bg-violet-400 rounded-full"
                />
              )}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-white/[0.06]">
          <div className="px-3 py-2 mb-2">
            <p className="text-[10px] text-white/20 truncate">{user.email}</p>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-white/30 hover:text-red-400 hover:bg-red-400/[0.06] transition-all duration-200"
          >
            <LogOut className="w-4 h-4" />
            ออกจากระบบ
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-56 relative z-10">
        <div className="max-w-3xl mx-auto px-8 py-8">
          <div className="mb-7">
            <h2 className="text-xl font-display font-bold text-white">
              {tabs.find((t) => t.id === activeTab)?.label}
            </h2>
            <p className="text-sm text-white/30 mt-0.5 font-sans">
              {activeTab === "overlay" && "ลิงค์ Overlay สำหรับใช้ใน OBS Browser Source"}
              {activeTab === "dashboard" && "รายการโดเนทและยอดสรุป"}
              {activeTab === "payment" && "ตั้งค่าช่องทางรับเงิน"}
            </p>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === "overlay" && <OverlayTab />}
              {activeTab === "dashboard" && <DashboardTab />}
              {activeTab === "payment" && <PaymentSetupTab />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
