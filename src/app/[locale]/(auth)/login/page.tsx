"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { Link, useRouter } from "@/i18n/navigation";
import { loginWithEmailPasswordAction } from "@/lib/auth/actions";

export default function LoginPage() {
  const t = useTranslations("Auth");
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await loginWithEmailPasswordAction({ email, password });
      if (!res.ok) {
        setError(res.error ?? t("loginFailed"));
        return;
      }
      router.push("/store");
      router.refresh();
    });
  };

  return (
    <div className="mx-auto max-w-md px-6 py-12">
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm space-y-6">
        <div className="space-y-1 text-start">
          <h1 className="text-2xl font-bold text-emerald-700">
            {t("loginTitle")}
          </h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            {t("loginSubtitle")}
          </p>
        </div>

        {error && (
          <div className="rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 px-4 py-2.5 text-sm text-rose-700 dark:text-rose-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="login-email"
              className="block text-sm font-medium mb-1 text-start"
            >
              {t("emailLabel")}
            </label>
            <input
              id="login-email"
              type="email"
              required
              dir="ltr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="login-password"
              className="block text-sm font-medium mb-1 text-start"
            >
              {t("passwordLabel")}
            </label>
            <input
              id="login-password"
              type="password"
              required
              dir="ltr"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-lg bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 px-4 py-2.5 text-sm font-semibold text-white transition"
          >
            {isPending ? t("submitting") : t("loginBtn")}
          </button>
        </form>

        <p className="text-center text-sm text-neutral-600 dark:text-neutral-400">
          {t("noAccountPrompt")}{" "}
          <Link
            href="/register"
            className="font-semibold text-emerald-700 hover:underline"
          >
            {t("registerLink")}
          </Link>
        </p>
      </div>
    </div>
  );
}

