"use client";

import { useState } from "react";

interface LoanInput {
  amount: string;
  interestRate: string;
  loanTerm: string;
  upfrontFee: string;
  monthlyFee: string;
}

interface LoanResult {
  monthlyRepayment: number;
  totalInterest: number;
  totalFees: number;
  totalCost: number;
}

function calcLoan(input: LoanInput): LoanResult | null {
  const P = parseFloat(input.amount.replace(/,/g, ""));
  const annualRate = parseFloat(input.interestRate);
  const years = parseInt(input.loanTerm) || 30;
  const upfront = parseFloat(input.upfrontFee) || 0;
  const monthly = parseFloat(input.monthlyFee) || 0;

  if (!P || P <= 0 || !annualRate) return null;

  const r = annualRate / 12 / 100;
  const n = years * 12;
  const monthlyRepayment = P * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  const totalRepaid = monthlyRepayment * n;
  const totalInterest = totalRepaid - P;
  const totalFees = upfront + monthly * n;
  const totalCost = totalRepaid + totalFees;

  return { monthlyRepayment, totalInterest, totalFees, totalCost };
}

function fmt(n: number): string {
  return "$" + Math.round(n).toLocaleString("en-AU");
}

function fmtDec(n: number): string {
  return "$" + n.toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const DEFAULT_LOAN: LoanInput = {
  amount: "",
  interestRate: "",
  loanTerm: "30",
  upfrontFee: "0",
  monthlyFee: "0",
};

export default function LoanComparisonCalculator() {
  const [loan1, setLoan1] = useState<LoanInput>({ ...DEFAULT_LOAN });
  const [loan2, setLoan2] = useState<LoanInput>({ ...DEFAULT_LOAN });
  const [results, setResults] = useState<{ r1: LoanResult | null; r2: LoanResult | null } | null>(null);

  function calculate() {
    setResults({
      r1: calcLoan(loan1),
      r2: calcLoan(loan2),
    });
  }

  function LoanInputFields({
    label,
    value,
    onChange,
  }: {
    label: string;
    value: LoanInput;
    onChange: (v: LoanInput) => void;
  }) {
    return (
      <div>
        <p className="font-mono text-[11px] uppercase tracking-widest text-ink/40 mb-3 pb-2 border-b border-line">
          {label}
        </p>
        <div className="space-y-4">
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-widest text-ink/60 mb-1">
              Loan Amount ($)
            </label>
            <input
              type="number"
              value={value.amount}
              onChange={(e) => onChange({ ...value, amount: e.target.value })}
              placeholder="500000"
              className="w-full border border-line bg-white font-sans text-[14px] px-3 py-2.5 outline-none focus:border-orange/60"
            />
          </div>
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-widest text-ink/60 mb-1">
              Interest Rate (%)
            </label>
            <input
              type="number"
              step="0.01"
              value={value.interestRate}
              onChange={(e) => onChange({ ...value, interestRate: e.target.value })}
              placeholder="6.50"
              className="w-full border border-line bg-white font-sans text-[14px] px-3 py-2.5 outline-none focus:border-orange/60"
            />
          </div>
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-widest text-ink/60 mb-1">
              Loan Term (years)
            </label>
            <input
              type="number"
              value={value.loanTerm}
              onChange={(e) => onChange({ ...value, loanTerm: e.target.value })}
              className="w-full border border-line bg-white font-sans text-[14px] px-3 py-2.5 outline-none focus:border-orange/60"
            />
          </div>
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-widest text-ink/60 mb-1">
              Upfront Fee ($)
            </label>
            <input
              type="number"
              value={value.upfrontFee}
              onChange={(e) => onChange({ ...value, upfrontFee: e.target.value })}
              className="w-full border border-line bg-white font-sans text-[14px] px-3 py-2.5 outline-none focus:border-orange/60"
            />
          </div>
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-widest text-ink/60 mb-1">
              Monthly Fee ($)
            </label>
            <input
              type="number"
              value={value.monthlyFee}
              onChange={(e) => onChange({ ...value, monthlyFee: e.target.value })}
              className="w-full border border-line bg-white font-sans text-[14px] px-3 py-2.5 outline-none focus:border-orange/60"
            />
          </div>
        </div>
      </div>
    );
  }

  const r1 = results?.r1;
  const r2 = results?.r2;
  const saving = r1 && r2 ? r1.totalCost - r2.totalCost : null;

  return (
    <div>
      {/* Inputs */}
      <div className="grid md:grid-cols-2 gap-0 border-b border-line">
        <div className="p-8 border-b md:border-b-0 md:border-r border-line">
          <LoanInputFields label="Loan 1" value={loan1} onChange={setLoan1} />
        </div>
        <div className="p-8">
          <LoanInputFields label="Loan 2" value={loan2} onChange={setLoan2} />
        </div>
      </div>

      <div className="p-8 border-b border-line">
        <button
          onClick={calculate}
          className="bg-orange text-white font-mono text-[11px] uppercase tracking-widest px-8 py-3 hover:bg-orange/90 transition-colors"
        >
          Compare Loans
        </button>
      </div>

      {/* Results */}
      {results && (
        <div className="bg-navy">
          <div className="grid md:grid-cols-2 gap-0">
            {[{ label: "Loan 1", result: r1 }, { label: "Loan 2", result: r2 }].map(({ label, result }, i) => (
              <div
                key={label}
                className={`p-8 ${i === 0 ? "border-b md:border-b-0 md:border-r border-white/10" : ""}`}
              >
                <p className="font-mono text-[10px] uppercase tracking-widest text-white/50 mb-4">{label}</p>
                {result ? (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="font-sans text-[13px] text-white/60">Monthly Repayment</span>
                      <span className="font-mono text-[13px] text-orange">{fmtDec(result.monthlyRepayment)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-sans text-[13px] text-white/60">Total Interest</span>
                      <span className="font-mono text-[13px] text-white">{fmt(result.totalInterest)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-sans text-[13px] text-white/60">Total Fees</span>
                      <span className="font-mono text-[13px] text-white">{fmt(result.totalFees)}</span>
                    </div>
                    <div className="flex justify-between border-t border-white/10 pt-3 mt-3">
                      <span className="font-mono text-[10px] uppercase tracking-widest text-white/50">Total Cost</span>
                      <span className="font-mono text-[15px] text-white font-medium">{fmt(result.totalCost)}</span>
                    </div>
                  </div>
                ) : (
                  <p className="font-sans text-[13px] text-white/30">Enter loan details above</p>
                )}
              </div>
            ))}
          </div>

          {saving !== null && r1 && r2 && (
            <div className="border-t border-white/10 px-8 py-6 text-center">
              {saving > 0 ? (
                <p className="font-mono text-[14px] uppercase tracking-widest text-white">
                  Loan 2 saves you{" "}
                  <span className="text-orange">{fmt(Math.abs(saving))}</span>{" "}
                  total
                </p>
              ) : saving < 0 ? (
                <p className="font-mono text-[14px] uppercase tracking-widest text-white">
                  Loan 1 saves you{" "}
                  <span className="text-orange">{fmt(Math.abs(saving))}</span>{" "}
                  total
                </p>
              ) : (
                <p className="font-mono text-[14px] uppercase tracking-widest text-white/50">
                  Both loans have the same total cost
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
