"use client";

import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Suspense, useState, useTransition } from "react";
import { adminLoginAction } from "@/lib/auth/actions";

function AdminLoginForm() {
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
        nextPath &&
        nextPath.startsWith(`/${locale}/admin`) &&
        !nextPath.includes("/admin/login")
          ? nextPath
          : `/${locale}/admin`;
      window.location.assign(target);
    });
  };

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <div className="rounded-2xl border border-neutral-200 bg-white p-7 space-y-6 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="space-y-2 text-start">
          <div className="flex items-center gap-2 text-xs font-medium text-emerald-700 dark:text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-600 dark:bg-emerald-400" />
            <span>{t("badge")}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-[-0.02em] text-neutral-900 dark:text-neutral-100">
            {t("title")}
          </h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
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
              className="mb-1.5 block text-sm font-medium text-neutral-800 dark:text-neutral-200 text-start"
            >
              {tAuth("emailLabel")}
            </label>
            <input
              id="admin-login-email"
              type="email"
              required
              autoComplete="username"
              dir="ltr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@mustadama.eg"
              className="w-full rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 dark:border-neutral-700 focus:border-emerald-600 focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="admin-login-password"
              className="mb-1.5 block text-sm font-medium text-neutral-800 dark:text-neutral-200 text-start"
            >
              {tAuth("passwordLabel")}
            </label>
            <input
              id="admin-login-password"
              type="password"
              required
              autoComplete="current-password"
              dir="ltr"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 dark:border-neutral-700 focus:border-emerald-600 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            data-testid="admin-login-submit"
            className="w-full rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-50 cursor-pointer"
          >
            {isPending ? tAuth("submitting") : t("submitBtn")}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-md px-6 py-16">
          <div className="h-80 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 animate-pulse" />
        </div>
      }
    >
      <AdminLoginForm />
    </Suspense>
  );
}
