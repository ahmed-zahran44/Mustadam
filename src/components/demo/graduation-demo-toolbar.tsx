"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import {
  signOutAction,
  switchDemoPersonaAction,
  triggerInventoryAgingAndExpiryAction,
} from "@/lib/auth/actions";
import { DEMO_PERSONAS } from "@/lib/auth/rbac";
import {
  getAdminSubdomainOrigin,
  getCustomerDomainOrigin,
  isAdminSubdomain,
} from "@/lib/auth/subdomain";
import type { UserRole } from "@/types/domain";

export interface NotificationItem {
  notification_id: string;
  channel: string;
  type: string;
  message: string;
  created_at: string;
}

interface GraduationDemoToolbarProps {
  activeUserId: string | null;
  activeEmail: string | null;
  activeRole: UserRole | null;
  activeAccountType: string | null;
  notifications: NotificationItem[];
}

const PERSONA_GROUPS = [
  {
    groupKey: "groupCustomers",
    ids: [
      "seller-individual",
      "seller-corporate",
      "buyer-individual",
      "buyer-corporate",
    ],
  },
  {
    groupKey: "groupPartners",
    ids: [
      "courier-hub",
      "transport-bulky",
      "inspector",
      "refurb-tech",
      "dismantle-tech",
      "warehouse-mgr",
    ],
  },
  {
    groupKey: "groupAdmin",
    ids: ["customer-service", "admin"],
  },
] as const;

function formatPersonaLabel(rawLabel: string): string {
  return rawLabel.replace(/^[\d١-٩٠-٩]+\.\s*/, "").trim();
}

export function GraduationDemoToolbar({
  activeUserId,
  activeEmail,
  activeRole,
  activeAccountType,
  notifications,
}: GraduationDemoToolbarProps) {
  const locale = useLocale();
  const t = useTranslations("DemoToolbar");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [agingResult, setAgingResult] = useState<string | null>(null);

  const activePersona = DEMO_PERSONAS.find(
    (p) =>
      p.userId === activeUserId ||
      (activeEmail && p.email.toLowerCase() === activeEmail.toLowerCase()),
  );
  const activePersonaId = activePersona?.id ?? "";

  const handlePersonaSelect = (personaId: string) => {
    if (!personaId) return;
    startTransition(async () => {
      const res = await switchDemoPersonaAction(personaId);
      if (res.ok && res.defaultRoute) {
        const currentUrl = new URL(window.location.href);
        if (res.defaultRoute === "/admin") {
          const adminOrigin = getAdminSubdomainOrigin(currentUrl);
          window.location.assign(`${adminOrigin}/${locale}/admin`);
          return;
        }
        if (isAdminSubdomain(currentUrl.host)) {
          const customerOrigin = getCustomerDomainOrigin(currentUrl);
          window.location.assign(`${customerOrigin}/${locale}${res.defaultRoute}`);
          return;
        }
        window.location.assign(`/${locale}${res.defaultRoute}`);
      }
    });
  };

  const handleSignOut = () => {
    startTransition(async () => {
      await signOutAction();
      window.location.assign(`/${locale}`);
    });
  };

  const handleTriggerAging = () => {
    startTransition(async () => {
      const res = await triggerInventoryAgingAndExpiryAction();
      if (res.ok) {
        setAgingResult(t("agingJobSuccess"));
        setTimeout(() => setAgingResult(null), 4000);
        router.refresh();
      }
    });
  };

  return (
    <div className="sticky top-0 z-50 w-full bg-slate-950/95 backdrop-blur-md border-b border-slate-800 text-xs text-slate-100 select-none shadow-sm">
      <div className="mx-auto max-w-7xl px-3 sm:px-4 py-1 flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 min-h-[38px] relative">
        {/* Start side: Mode Badge + Persona Switcher Select */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600/90 text-white px-2.5 py-0.5 font-semibold text-[11px] tracking-wide uppercase shadow-sm shrink-0">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-200 animate-pulse" />
            {t("badge")}
          </span>

          <div className="flex items-center gap-1.5">
            <label
              htmlFor="persona-select"
              className="hidden sm:inline text-slate-400 font-medium text-[11px]"
            >
              {t("subtitle")}
            </label>
            <select
              id="persona-select"
              data-testid="persona-select"
              value={activePersonaId}
              disabled={isPending}
              onChange={(e) => handlePersonaSelect(e.target.value)}
              className="h-7 rounded-md bg-slate-900 border border-slate-700 hover:border-slate-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-slate-100 text-xs px-2.5 py-0.5 font-medium transition cursor-pointer disabled:opacity-50"
              aria-label={t("subtitle")}
            >
              <option value="" disabled>
                {isPending ? t("switching") : t("selectPersonaPrompt")}
              </option>
              {PERSONA_GROUPS.map((group) => (
                <optgroup key={group.groupKey} label={t(group.groupKey)}>
                  {group.ids.map((id) => {
                    const persona = DEMO_PERSONAS.find((p) => p.id === id);
                    if (!persona) return null;
                    const label = formatPersonaLabel(
                      locale === "ar" ? persona.labelAr : persona.labelEn,
                    );
                    return (
                      <option key={persona.id} value={persona.id}>
                        {label}
                      </option>
                    );
                  })}
                </optgroup>
              ))}
            </select>
            {isPending && (
              <span className="text-emerald-400 text-[11px] font-mono animate-pulse">
                {t("switching")}
              </span>
            )}
          </div>
        </div>

        {/* End side: Active User Chip + Actions */}
        <div className="flex items-center gap-2 flex-wrap ms-auto">
          {activeEmail ? (
            <div className="hidden lg:flex items-center gap-1.5 rounded-md bg-slate-900/90 border border-slate-800 px-2.5 py-0.5 text-slate-200 text-[11px]">
              <span className="font-semibold text-emerald-400">
                {activeRole}
              </span>
              {activeAccountType && (
                <span className="text-slate-400">({activeAccountType})</span>
              )}
              <span className="text-slate-600">•</span>
              <span
                dir="ltr"
                className="font-mono text-slate-300 max-w-[160px] truncate"
                title={activeEmail}
              >
                {activeEmail}
              </span>
            </div>
          ) : (
            <span className="hidden lg:inline text-slate-400 text-[11px]">
              {t("guestSession")}
            </span>
          )}

          <button
            type="button"
            onClick={handleTriggerAging}
            disabled={isPending || !activeUserId}
            title={t("runAgingBtn")}
            className="h-7 rounded-md bg-amber-600/90 hover:bg-amber-500 disabled:opacity-40 px-2 py-0.5 font-medium text-white transition text-[11px] flex items-center gap-1 shrink-0"
          >
            <span>⏱️</span>
            <span className="hidden md:inline">{t("runAgingBtn")}</span>
          </button>

          {/* Floating Popover Notifications */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setDrawerOpen((prev) => !prev)}
              className="h-7 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-700 px-2 py-0.5 font-medium text-slate-100 transition text-[11px] flex items-center gap-1.5 shrink-0"
              aria-expanded={drawerOpen}
              aria-haspopup="dialog"
              title={t("inboxBtn")}
            >
              <span>🔔</span>
              <span className="hidden md:inline">{t("inboxBtn")}</span>
              <span className="inline-flex items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold px-1.5 h-4 min-w-4">
                {notifications.length}
              </span>
            </button>

            {drawerOpen && (
              <>
                <div
                  className="fixed inset-0 z-40 bg-transparent"
                  onClick={() => setDrawerOpen(false)}
                  aria-hidden="true"
                />
                <div
                  role="dialog"
                  aria-modal="true"
                  aria-label={t("inboxTitle")}
                  className="absolute top-full end-0 mt-1.5 w-80 sm:w-96 max-h-80 overflow-y-auto rounded-xl bg-slate-950/95 backdrop-blur-md border border-slate-700 shadow-2xl p-3 space-y-2 z-50 text-start"
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                    <span className="font-semibold text-emerald-400 text-xs">
                      {t("inboxTitle")}
                    </span>
                    <button
                      type="button"
                      onClick={() => setDrawerOpen(false)}
                      className="text-slate-400 hover:text-white text-xs px-1"
                      aria-label={t("close")}
                    >
                      ✕
                    </button>
                  </div>
                  {notifications.length === 0 ? (
                    <p className="text-slate-400 py-3 text-center text-xs">
                      {t("inboxEmpty")}
                    </p>
                  ) : (
                    <ul className="space-y-1.5">
                      {notifications.map((n) => (
                        <li
                          key={n.notification_id}
                          className="rounded-lg bg-slate-900/90 border border-slate-800/80 p-2 text-xs flex flex-col gap-1"
                        >
                          <div className="flex items-center justify-between text-[10px] text-slate-400">
                            <span className="uppercase font-mono text-emerald-400 font-semibold">
                              [{n.channel} • {n.type}]
                            </span>
                            <span dir="ltr" className="font-mono">
                              {new Date(n.created_at).toLocaleTimeString(
                                locale,
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )}
                            </span>
                          </div>
                          <p className="text-slate-200 leading-snug">
                            {n.message}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            )}
          </div>

          {activeUserId && (
            <button
              type="button"
              onClick={handleSignOut}
              disabled={isPending}
              className="h-7 rounded-md bg-rose-700/80 hover:bg-rose-600 disabled:opacity-50 px-2 py-0.5 font-medium text-white transition text-[11px] shrink-0"
              title={t("signOut")}
            >
              {t("signOut")}
            </button>
          )}
        </div>

        {/* Floating Aging Alert Toast */}
        {agingResult && (
          <div className="absolute top-full start-1/2 -translate-x-1/2 mt-1.5 px-3 py-1.5 rounded-lg bg-emerald-900/95 border border-emerald-500 text-emerald-100 shadow-xl text-xs z-50 flex items-center gap-2 pointer-events-none">
            <span>✓</span>
            <span>{agingResult}</span>
          </div>
        )}
      </div>
    </div>
  );
}
