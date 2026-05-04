"use client";

import { useState } from "react";

type ApplicantType = "single" | "couple";

interface FormState {
  applicantType: ApplicantType;
  grossIncome: string;
  partnerIncome: string;
  otherIncome: string;
  monthlyLiving: string;
  otherRepayments: string;
  creditCardLimits: string;
  dependants: number;
  interestRate: string;
  loanTerm: string;
}

interface Results {
  maxLoan: number;
  monthlyRepayment: number;
  monthlyNetIncome: number;
  monthlySurplus: number;
  maxRepayment: number;
}

function fmt(n: number): string {
  return "$" + Math.round(n).toLocaleString("en-AU");
}

export default function BorrowingPowerCalculator() {
  const [form, setForm] = useState<FormState>({
    applicantType: "single",
    grossIncome: "",
    partnerIncome: "",
    otherIncome: "",
    monthlyLiving: "",
    otherRepayments: "",
    creditCardLimits: "",
    dependants: 0,
    interestRate: "6.5",
    loanTerm: "30",
  });
  const [results, setResults] = useState<Results | null>(null);

  function num(s: string): number {
    return parseFloat(s.replace(/,/g, "")) || 0;
  }

  function calculate() {
    const grossIncome = num(form.grossIncome);
    if (grossIncome <= 0) return;

    const partnerIncome = form.applicantType === "couple" ? num(form.partnerIncome) : 0;
    const otherIncome = num(form.otherIncome);
    const monthlyLiving = num(form.monthlyLiving);
    const otherRepayments = num(form.otherRepayments);
    const creditCardLimits = num(form.creditCardLimits);
    const interestRate = num(form.interestRate);
    const loanTerm = num(form.loanTerm) || 30;

    const assessmentRate = interestRate + 3;
    const r = assessmentRate / 12 / 100;
    const n = loanTerm * 12;

    const netIncome = grossIncome * 0.72 + partnerIncome * 0.72 + otherIncome;
    const monthlyNetIncome = netIncome / 12;

    const ccMonthly = creditCardLimits * 0.038;
    const monthlyCommitments = otherRepayments + ccMonthly + form.dependants * 300;
    const monthlySurplus = monthlyNetIncome - monthlyLiving - monthlyCommitments;
    const maxRepayment = Math.max(0, monthlySurplus * 0.85);

    const maxLoan = r > 0
      ? maxRepayment * ((Math.pow(1 + r, n) - 1) / (r * Math.pow(1 + r, n)))
      : 0;

    const loanRate = interestRate / 12 / 100;
    const monthlyRepayment = loanRate > 0
      ? maxLoan * (loanRate * Math.pow(1 + loanRate, n)) / (Math.pow(1 + loanRate, n) - 1)
      : 0;

    setResults({ maxLoan, monthlyRepayment, monthlyNetIncome, monthlySurplus, maxRepayment });
  }

  const isCouple = form.applicantType === "couple";

  return (
    <div className="grid lg:grid-cols-2 gap-0">
      {/* Form */}
      <div className="p-8 border-b lg:border-b-0 lg:border-r border-line space-y-8">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-widest text-ink/40 mb-3 pb-2 border-b border-line">
            Applicant
          </p>
          <div className="flex gap-6 mb-5">
            {(["single", "couple"] as const).map((val) => (
              <label key={val} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="applicantType"
                  checked={form.applicantType === val}
                  onChange={() => setForm({ ...form, applicantType: val })}
                  className="accent-orange"
                />
                <span className="font-sans text-[14px] capitalize">{val}</span>
              </label>
            ))}
          </div>

          <div className="space-y-4">
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-widest text-ink/60 mb-1">
                Gross Income p.a. ($)
              </label>
              <input
                type="number"
                value={form.grossIncome}
                onChange={(e) => setForm({ ...form, grossIncome: e.target.value })}
                placeholder="100000"
                className="w-full border border-line bg-white font-sans text-[14px] px-3 py-2.5 outline-none focus:border-orange/60"
              />
            </div>

            {isCouple && (
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-widest text-ink/60 mb-1">
                  Partner Income p.a. ($)
                </label>
                <input
                  type="number"
                  value={form.partnerIncome}
                  onChange={(e) => setForm({ ...form, partnerIncome: e.target.value })}
                  placeholder="80000"
                  className="w-full border border-line bg-white font-sans text-[14px] px-3 py-2.5 outline-none focus:border-orange/60"
                />
              </div>
            )}

            <div>
              <label className="block font-mono text-[10px] uppercase tracking-widest text-ink/60 mb-1">
                Other Income p.a. ($)
              </label>
              <input
                type="number"
                value={form.otherIncome}
                onChange={(e) => setForm({ ...form, otherIncome: e.target.value })}
                placeholder="0"
                className="w-full border border-line bg-white font-sans text-[14px] px-3 py-2.5 outline-none focus:border-orange/60"
              />
            </div>
          </div>
        </div>

        <div>
          <p className="font-mono text-[11px] uppercase tracking-widest text-ink/40 mb-3 pb-2 border-b border-line">
            Expenses &amp; Liabilities
          </p>
          <div className="space-y-4">
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-widest text-ink/60 mb-1">
                Monthly Living Expenses ($)
              </label>
              <input
                type="number"
                value={form.monthlyLiving}
                onChange={(e) => setForm({ ...form, monthlyLiving: e.target.value })}
                placeholder="3000"
                className="w-full border border-line bg-white font-sans text-[14px] px-3 py-2.5 outline-none focus:border-orange/60"
              />
            </div>
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-widest text-ink/60 mb-1">
                Other Loan Repayments / month ($)
              </label>
              <input
                type="number"
                value={form.otherRepayments}
                onChange={(e) => setForm({ ...form, otherRepayments: e.target.value })}
                placeholder="0"
                className="w-full border border-line bg-white font-sans text-[14px] px-3 py-2.5 outline-none focus:border-orange/60"
              />
            </div>
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-widest text-ink/60 mb-1">
                Total Credit Card Limits ($)
              </label>
              <input
                type="number"
                value={form.creditCardLimits}
                onChange={(e) => setForm({ ...form, creditCardLimits: e.target.value })}
                placeholder="0"
                className="w-full border border-line bg-white font-sans text-[14px] px-3 py-2.5 outline-none focus:border-orange/60"
              />
            </div>
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-widest text-ink/60 mb-1">
                Number of Dependants
              </label>
              <select
                value={form.dependants}
                onChange={(e) => setForm({ ...form, dependants: parseInt(e.target.value) })}
                className="w-full border border-line bg-white font-sans text-[14px] px-3 py-2.5 outline-none focus:border-orange/60"
              >
                {[0, 1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>{n === 5 ? "5+" : n}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div>
          <p className="font-mono text-[11px] uppercase tracking-widest text-ink/40 mb-3 pb-2 border-b border-line">
            Loan Parameters
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-widest text-ink/60 mb-1">
                Interest Rate (%)
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
          </div>
        </div>

        <button
          onClick={calculate}
          className="bg-orange text-white font-mono text-[11px] uppercase tracking-widest px-8 py-3 hover:bg-orange/90 transition-colors"
        >
          Calculate
        </button>
      </div>

      {/* Results */}
      <div className="p-8 bg-navy flex flex-col justify-center min-h-[400px]">
        {results ? (
          <div className="space-y-6">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-white/50 mb-2">
                You may be able to borrow up to
              </p>
              <p className="font-mono text-[2.6rem] leading-none text-orange font-medium">
                {fmt(Math.max(0, results.maxLoan))}
              </p>
            </div>

            <div className="border-t border-white/10 pt-5 space-y-3">
              <div className="flex justify-between">
                <span className="font-sans text-[13px] text-white/60">Monthly repayment at that loan amount</span>
                <span className="font-mono text-[13px] text-white">{fmt(results.monthlyRepayment)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-sans text-[13px] text-white/60">Monthly net income (est.)</span>
                <span className="font-mono text-[13px] text-white">{fmt(results.monthlyNetIncome)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-sans text-[13px] text-white/60">Monthly surplus available</span>
                <span className="font-mono text-[13px] text-white">{fmt(results.monthlySurplus)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-sans text-[13px] text-white/60">Max monthly repayment capacity</span>
                <span className="font-mono text-[13px] text-white">{fmt(results.maxRepayment)}</span>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 px-4 py-3">
              <p className="font-sans text-[11px] text-white/40 leading-relaxed">
                Assessment rate includes 3% APRA buffer. Credit card commitments assessed at 3.8% of limit per month.
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <p className="font-mono text-[11px] uppercase tracking-widest text-white/30">
              Enter your details to calculate
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
