"use client";

import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { adminLoginAction } from "@/lib/auth/actions";

export default function AdminLoginPage() {
  const t = useTranslations("AdminGate");
  const tAuth = useTranslations("Auth");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const denied = searchParams.get("denied") === "admin";
  const nextPath = searchParams.get("next");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    denied ? t("deniedError") : null,
  );
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await adminLoginAction({ email, password });
      if (!res.ok) {
        if (res.error === "ACCESS_DENIED_NON_ADMIN") {
          setError(t("deniedError"));
        } else {
          setError(res.error ?? tAuth("loginFailed"));
        }
        return;
      }

      const target =
        nextPath && nextPath.startsWith(`/${locale}/admin`) && !nextPath.includes("/admin/login")
          ? nextPath
          : `/${locale}/admin`;
      window.location.assign(target);
    });
  };

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <div className="rounded-2xl border border-neutral-200 bg-white p-7 shadow-sm space-y-6 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="space-y-2 text-start">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-600/20 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-950/50 dark:text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
            {t("badge")}
          </span>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            {t("title")}
          </h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            {t("subtitle")}
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-lg border border-rose-300 bg-rose-50 px-4 py-2.5 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-200"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="admin-login-email"
              className="mb-1 block text-sm font-medium text-start"
            >
              {tAuth("emailLabel")}
            </label>
            <input
              id="admin-login-email"
              type="email"
              required
              dir="ltr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@mustadama.eg"
              className="w-full rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-sm dark:border-neutral-700"
            />
          </div>

          <div>
            <label
              htmlFor="admin-login-password"
              className="mb-1 block text-sm font-medium text-start"
            >
              {tAuth("passwordLabel")}
            </label>
            <input
              id="admin-login-password"
              type="password"
              required
              dir="ltr"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-sm dark:border-neutral-700"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            data-testid="admin-login-submit"
            className="w-full rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-50"
          >
            {isPending ? tAuth("submitting") : t("submitBtn")}
          </button>
        </form>
      </div>
    </div>
  );
}

