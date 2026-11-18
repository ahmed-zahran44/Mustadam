"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { Link, useRouter } from "@/i18n/navigation";
import { registerCustomerAction } from "@/lib/auth/actions";
import type { AccountType, CustomerSegment } from "@/types/domain";

export default function RegisterPage() {
  const t = useTranslations("Auth");
  const router = useRouter();
  const [accountType, setAccountType] = useState<AccountType>("Individual");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [taxId, setTaxId] = useState("");
  const [commercialReg, setCommercialReg] = useState("");
  const [segment, setSegment] = useState<CustomerSegment>("Startup");
  const [companyAddress, setCompanyAddress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await registerCustomerAction({
        name,
        email,
        phone,
        password,
        accountType,
        taxId: accountType === "Company" ? taxId : undefined,
        commercialReg: accountType === "Company" ? commercialReg : undefined,
        segment: accountType === "Company" ? segment : "Individual",
        companyAddress: accountType === "Company" ? companyAddress : undefined,
      });

      if (!res.ok) {
        setError(res.error ?? t("registerFailed"));
        return;
      }

      router.push("/seller");
      router.refresh();
    });
  };

  return (
    <div className="mx-auto max-w-lg px-6 py-12">
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm space-y-6">
        <div className="space-y-1 text-start">
          <h1 className="text-2xl font-bold text-emerald-700">
            {t("registerTitle")}
          </h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            {t("registerSubtitle")}
          </p>
        </div>

        {/* Account Type Selector: Individual vs Company (FR-01) */}
        <div className="grid grid-cols-2 gap-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 p-1">
          <button
            type="button"
            onClick={() => setAccountType("Individual")}
            className={`rounded-md py-2 text-sm font-medium transition ${
              accountType === "Individual"
                ? "bg-emerald-700 text-white shadow"
                : "text-neutral-700 dark:text-neutral-300"
            }`}
          >
            {t("individualAccount")}
          </button>
          <button
            type="button"
            onClick={() => setAccountType("Company")}
            className={`rounded-md py-2 text-sm font-medium transition ${
              accountType === "Company"
                ? "bg-emerald-700 text-white shadow"
                : "text-neutral-700 dark:text-neutral-300"
            }`}
          >
            {t("companyAccount")}
          </button>
        </div>

        {error && (
          <div className="rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 px-4 py-2.5 text-sm text-rose-700 dark:text-rose-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="reg-name"
              className="block text-sm font-medium mb-1 text-start"
            >
              {accountType === "Company" ? t("companyNameLabel") : t("nameLabel")}
            </label>
            <input
              id="reg-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="reg-email"
                className="block text-sm font-medium mb-1 text-start"
              >
                {t("emailLabel")}
              </label>
              <input
                id="reg-email"
                type="email"
                required
                dir="ltr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="reg-phone"
                className="block text-sm font-medium mb-1 text-start"
              >
                {t("phoneLabel")}
              </label>
              <input
                id="reg-phone"
                type="tel"
                required
                dir="ltr"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+201000000000"
                className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-sm"
              />
            </div>
          </div>

          {accountType === "Company" && (
            <div className="space-y-4 rounded-lg border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20 p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="reg-tax"
                    className="block text-sm font-medium mb-1 text-start"
                  >
                    {t("taxIdLabel")}
                  </label>
                  <input
                    id="reg-tax"
                    type="text"
                    required
                    dir="ltr"
                    value={taxId}
                    onChange={(e) => setTaxId(e.target.value)}
                    placeholder="123-456-789"
                    className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-sm font-mono"
                  />
                </div>

                <div>
                  <label
                    htmlFor="reg-cr"
                    className="block text-sm font-medium mb-1 text-start"
                  >
                    {t("commercialRegLabel")}
                  </label>
                  <input
                    id="reg-cr"
                    type="text"
                    required
                    dir="ltr"
                    value={commercialReg}
                    onChange={(e) => setCommercialReg(e.target.value)}
                    placeholder="CR-123456"
                    className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-sm font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="reg-segment"
                    className="block text-sm font-medium mb-1 text-start"
                  >
                    {t("segmentLabel")}
                  </label>
                  <select
                    id="reg-segment"
                    value={segment}
                    onChange={(e) =>
                      setSegment(e.target.value as CustomerSegment)
                    }
                    className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm"
                  >
                    <option value="Startup">{t("segmentStartup")}</option>
                    <option value="Enterprise">{t("segmentEnterprise")}</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="reg-addr"
                    className="block text-sm font-medium mb-1 text-start"
                  >
                    {t("companyAddressLabel")}
                  </label>
                  <input
                    id="reg-addr"
                    type="text"
                    required
                    value={companyAddress}
                    onChange={(e) => setCompanyAddress(e.target.value)}
                    className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          <div>
            <label
              htmlFor="reg-password"
              className="block text-sm font-medium mb-1 text-start"
            >
              {t("passwordLabel")}
            </label>
            <input
              id="reg-password"
              type="password"
              required
              minLength={8}
              dir="ltr"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-lg bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 px-4 py-2.5 text-sm font-semibold text-white transition"
          >
            {isPending ? t("submitting") : t("registerBtn")}
          </button>
        </form>

        <p className="text-center text-sm text-neutral-600 dark:text-neutral-400">
          {t("haveAccountPrompt")}{" "}
          <Link
            href="/login"
            className="font-semibold text-emerald-700 hover:underline"
          >
            {t("loginLink")}
          </Link>
        </p>
      </div>
    </div>
  );
}

