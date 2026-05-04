"use client";

import { useState } from "react";

type LoanType = "pi" | "io";
type ActiveTab = "weekly" | "fortnightly" | "monthly";

interface FormState {
  loanAmount: string;
  interestRate: string;
  loanTerm: string;
  loanType: LoanType;
}

interface Results {
  monthly: number;
  fortnightly: number;
  weekly: number;
  totalRepaid: number;
  totalInterest: number;
}

function fmt(n: number): string {
  return "$" + n.toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function LoanRepaymentCalculator() {
  const [form, setForm] = useState<FormState>({
    loanAmount: "",
    interestRate: "6.5",
    loanTerm: "30",
    loanType: "pi",
  });
  const [results, setResults] = useState<Results | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>("monthly");

  function calculate() {
    const P = parseFloat(form.loanAmount.replace(/,/g, ""));
    const annualRate = parseFloat(form.interestRate);
    const years = parseInt(form.loanTerm) || 30;
    if (!P || P <= 0 || !annualRate) return;

    const r = annualRate / 12 / 100;
    const n = years * 12;
    let monthly: number;

    if (form.loanType === "pi") {
      monthly = P * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    } else {
      monthly = P * r;
    }

    const totalRepaid = form.loanType === "pi" ? monthly * n : monthly * n + P;
    const totalInterest = totalRepaid - P;

    setResults({
      monthly,
      fortnightly: monthly / 2,
      weekly: monthly / 4.33,
      totalRepaid,
      totalInterest,
    });
  }

  const tabValues: Record<ActiveTab, number | undefined> = {
    monthly: results?.monthly,
    fortnightly: results?.fortnightly,
    weekly: results?.weekly,
  };

  return (
    <div className="grid lg:grid-cols-2 gap-0">
      {/* Form */}
      <div className="p-8 border-b lg:border-b-0 lg:border-r border-line">
        <p className="font-mono text-[11px] uppercase tracking-widest text-ink/40 mb-3 pb-2 border-b border-line">
          Loan Details
        </p>

        <div className="space-y-5">
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-widest text-ink/60 mb-1">
              Loan Amount ($)
            </label>
            <input
              type="number"
              value={form.loanAmount}
              onChange={(e) => setForm({ ...form, loanAmount: e.target.value })}
              placeholder="500000"
              className="w-full border border-line bg-white font-sans text-[14px] px-3 py-2.5 outline-none focus:border-orange/60"
            />
          </div>

          <div>
            <label className="block font-mono text-[10px] uppercase tracking-widest text-ink/60 mb-1">
              Annual Interest Rate (%)
            </label>
            <input
              type="number"
              step="0.1"
              value={form.interestRate}
              onChange={(e) => setForm({ ...form, interestRate: e.target.value })}
              className="w-full border border-line bg-white font-sans text-[14px] px-3 py-2.5 outline-none focus:border-orange/60"
            />
          </div>

          <div>
            <label className="block font-mono text-[10px] uppercase tracking-widest text-ink/60 mb-1">
              Loan Term (years)
            </label>
            <input
              type="number"
              value={form.loanTerm}
              onChange={(e) => setForm({ ...form, loanTerm: e.target.value })}
              className="w-full border border-line bg-white font-sans text-[14px] px-3 py-2.5 outline-none focus:border-orange/60"
            />
          </div>

          <div>
            <label className="block font-mono text-[10px] uppercase tracking-widest text-ink/60 mb-2">
              Loan Type
            </label>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="loanType"
                  checked={form.loanType === "pi"}
                  onChange={() => setForm({ ...form, loanType: "pi" })}
                  className="accent-orange"
                />
                <span className="font-sans text-[14px]">Principal &amp; Interest</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="loanType"
                  checked={form.loanType === "io"}
                  onChange={() => setForm({ ...form, loanType: "io" })}
                  className="accent-orange"
                />
                <span className="font-sans text-[14px]">Interest Only</span>
              </label>
            </div>
          </div>
        </div>

        <button
          onClick={calculate}
          className="mt-8 bg-orange text-white font-mono text-[11px] uppercase tracking-widest px-8 py-3 hover:bg-orange/90 transition-colors"
        >
          Calculate
        </button>
      </div>

      {/* Results */}
      <div className="p-8 bg-navy flex flex-col justify-center min-h-[400px]">
        {results ? (
          <div className="space-y-6">
            {/* Tabs */}
            <div className="flex border border-white/10">
              {(["weekly", "fortnightly", "monthly"] as ActiveTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 font-mono text-[10px] uppercase tracking-widest py-2.5 transition-colors ${
                    activeTab === tab
                      ? "bg-orange text-white"
                      : "text-white/40 hover:text-white/70"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-white/50 mb-1 capitalize">
                {activeTab} Repayment
              </p>
              <p className="font-mono text-[2.4rem] leading-none text-orange font-medium">
                {tabValues[activeTab] !== undefined ? fmt(tabValues[activeTab]!) : "-"}
              </p>
            </div>

            <div className="border-t border-white/10 pt-5 space-y-3">
              <div className="flex justify-between">
                <span className="font-sans text-[13px] text-white/60">Monthly</span>
                <span className="font-mono text-[13px] text-white">{fmt(results.monthly)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-sans text-[13px] text-white/60">Fortnightly</span>
                <span className="font-mono text-[13px] text-white">{fmt(results.fortnightly)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-sans text-[13px] text-white/60">Weekly</span>
                <span className="font-mono text-[13px] text-white">{fmt(results.weekly)}</span>
              </div>
            </div>

            <div className="border-t border-white/10 pt-5 space-y-3">
              <div className="flex justify-between">
                <span className="font-sans text-[13px] text-white/60">Total Repaid</span>
                <span className="font-mono text-[13px] text-white">{fmt(results.totalRepaid)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-sans text-[13px] text-white/60">Total Interest Paid</span>
                <span className="font-mono text-[13px] text-orange">{fmt(results.totalInterest)}</span>
              </div>
            </div>

            {form.loanType === "io" && (
              <div className="bg-white/5 border border-white/10 px-4 py-3">
                <p className="font-sans text-[11px] text-white/40 leading-relaxed">
                  Interest only period shown. Total repaid includes principal repayment at end of term.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center">
            <p className="font-mono text-[11px] uppercase tracking-widest text-white/30">
              Enter loan details to calculate
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
