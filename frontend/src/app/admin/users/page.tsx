"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useAdminData } from "../admin-data";
import { useLanguage } from "@/context/LanguageContext";
import { getAdminUsers, AdminUser } from "@/lib/apiServices";
import { UserDetailModal, AdjustCreditsModal, AdjustTarget } from "../_components/modals";
import {
  AdminCard, SectionHeading, RoleBadge, StatusPill, AdminButton, SearchInput,
  EmptyState, SkeletonTable, statusTone,
} from "@/components/admin/ui";
import { Eye, Coins, ChevronLeft, ChevronRight } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// /admin/users — full platform directory: debounced server search + pagination.
// ─────────────────────────────────────────────────────────────────────────────

const PAGE_SIZE = 15;

export default function AdminUsersPage() {
  const { language } = useLanguage();
  const isBn = language === "bn";
  const { isLoading, usersList, setUsersList, load } = useAdminData();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [viewingId, setViewingId] = useState<number | null>(null);
  const [adjustTarget, setAdjustTarget] = useState<AdjustTarget | null>(null);

  // Debounced server search (endpoint supports ?search=).
  useEffect(() => {
    const q = search.trim();
    const timer = setTimeout(async () => {
      const results = await getAdminUsers(q || undefined);
      if (Array.isArray(results)) setUsersList(results);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const totalPages = Math.max(1, Math.ceil(usersList.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = usersList.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <SectionHeading
          title={isBn ? "সব প্ল্যাটফর্ম ইউজার" : "All Platform Users"}
          sub={isBn ? "সম্পূর্ণ ইউজার ডিরেক্টরি — সার্ভার-সাইড সার্চ" : "Complete user directory — server-side search"}
          count={usersList.length}
        />
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder={isBn ? "নাম, ইমেইল বা ID..." : "Search by name, email, ID..."}
        />
      </div>

      {isLoading ? (
        <SkeletonTable rows={8} cols={5} />
      ) : (
        <AdminCard className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-(--bg-surface) border-b border-(--text-primary)/10">
                  {["User", "Contact", "Role", "Credits", "Status", ""].map((h, i) => (
                    <th key={i} className={`px-5 py-3.5 font-mono font-bold text-(--text-muted) text-[10px] uppercase tracking-widest ${i === 5 ? "text-right" : ""}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-(--text-primary)/5">
                {pageRows.map((u) => (
                  <tr key={u.id} className="hover:bg-(--bg-surface)/60 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {u.profile_photo_url ? (
                          <Image src={u.profile_photo_url} alt={u.full_name || "User"} width={36} height={36} className="w-9 h-9 rounded-xl object-cover border border-(--text-primary)/10" unoptimized />
                        ) : (
                          <span className="w-9 h-9 rounded-xl bg-(--bg-surface) border border-(--text-primary)/10 flex items-center justify-center text-sm font-serif font-bold text-(--text-primary) shrink-0">
                            {u.full_name?.charAt(0) || "—"}
                          </span>
                        )}
                        <div>
                          <p className="font-bold text-(--text-primary)">{u.full_name}</p>
                          <p className="text-[10px] text-(--text-muted) font-mono">#{u.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-(--text-primary) font-medium truncate max-w-[180px]">{u.email}</p>
                      <p className="text-[10px] text-(--text-muted)">{u.phone || "—"}</p>
                    </td>
                    <td className="px-5 py-4"><RoleBadge role={u.role} /></td>
                    <td className="px-5 py-4">
                      <span className="font-mono font-bold text-(--text-primary) tabular-nums">{u.credit_balance.toLocaleString()}</span>
                      <span className="text-[10px] text-(--text-muted)"> cr</span>
                      {u.enterprise_id && (
                        <p className="text-[9px] text-(--text-muted) italic">{isBn ? "ব্যক্তিগত ওয়ালেট" : "Personal wallet"}</p>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <StatusPill
                        label={u.is_active ? "Active" : "Suspended"}
                        tone={statusTone(u.is_active ? "ACTIVE" : "SUSPENDED")}
                        pulse={u.is_active}
                      />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        <AdminButton
                          variant="ghost"
                          onClick={() => {
                            setAdjustTarget({
                              kind: "user",
                              id: u.id,
                              label: u.full_name || u.email,
                              currentBalance: u.credit_balance,
                              enterpriseId: u.enterprise_id,
                            });
                          }}
                        >
                          <Coins className="w-3 h-3" /> {isBn ? "সমন্বয়" : "Adjust"}
                        </AdminButton>
                        <AdminButton variant="outline" onClick={() => setViewingId(u.id)}>
                          <Eye className="w-3 h-3" /> {isBn ? "দেখুন" : "View"}
                        </AdminButton>
                      </div>
                    </td>
                  </tr>
                ))}
                {pageRows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-4">
                      <EmptyState
                        message={search ? (isBn ? "এই সার্চে কোনো ইউজার মেলেনি।" : "No users match your search.") : (isBn ? "কোনো ইউজার নেই।" : "No users found.")}
                      />
                    </td>
                  </tr>
                )}
              </tbody>
              {usersList.length > 0 && (
                <tfoot>
                  <tr className="border-t border-(--text-primary)/10 bg-(--bg-surface)/50">
                    <td colSpan={6} className="px-5 py-3 flex items-center justify-between">
                      <span className="text-[10px] font-mono text-(--text-muted) tabular-nums">
                        {((safePage - 1) * PAGE_SIZE) + 1}–{Math.min(safePage * PAGE_SIZE, usersList.length)} / {usersList.length}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          disabled={safePage <= 1}
                          aria-label="Previous page"
                          className="p-1.5 rounded-lg text-(--text-muted) hover:text-(--text-primary) hover:bg-(--text-primary)/10 disabled:opacity-30 cursor-pointer transition-colors"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-[10px] font-mono text-(--text-muted) tabular-nums px-2">
                          {safePage} / {totalPages}
                        </span>
                        <button
                          type="button"
                          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                          disabled={safePage >= totalPages}
                          aria-label="Next page"
                          className="p-1.5 rounded-lg text-(--text-muted) hover:text-(--text-primary) hover:bg-(--text-primary)/10 disabled:opacity-30 cursor-pointer transition-colors"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </AdminCard>
      )}

      <UserDetailModal
        userId={viewingId}
        onClose={() => setViewingId(null)}
        onAdjustCredits={(detail) => {
          setAdjustTarget({
            kind: "user",
            id: detail.id,
            label: detail.full_name || detail.email,
            currentBalance: detail.credit_balance,
            enterpriseId: detail.enterprise_id,
            enterpriseName: detail.enterprise_details?.name || null,
            enterpriseBalance: detail.enterprise_details?.pool_balance ?? null,
          });
        }}
      />

      {adjustTarget && (
        <AdjustCreditsModal
          target={adjustTarget}
          onClose={() => setAdjustTarget(null)}
          onSaved={() => { load(true); }}
        />
      )}
    </div>
  );
}
