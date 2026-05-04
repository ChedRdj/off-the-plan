"use client";

import { useState } from "react";

interface CurrentLoan {
  balance: string;
  interestRate: string;
  remainingTerm: string;
  monthlyFee: string;
}

interface NewLoan {
  interestRate: string;
  loanTerm: string;
  monthlyFee: string;
}

interface SwitchingCosts {
  dischargeFee: string;
  applicationFee: string;
  otherCosts: string;
}

interface Results {
  currentRepayment: number;
  newRepayment: number;
  monthlySaving: number;
  monthsToBreakEven: number;
  totalInterestCurrent: number;
  totalInterestNew: number;
  totalSwitchingCosts: number;
  netSaving: number;
}

function calcMonthlyRepayment(principal: number, annualRate: number, years: number): number {
  const r = annualRate / 12 / 100;
  const n = years * 12;
  if (r === 0) return principal / n;
  return principal * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

function calcTotalInterest(principal: number, monthlyRepayment: number, years: number): number {
  return monthlyRepayment * years * 12 - principal;
}

function fmt(n: number): string {
  return "$" + Math.round(Math.abs(n)).toLocaleString("en-AU");
}

function fmtDec(n: number): string {
  return "$" + Math.abs(n).toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function MortgageSwitchingCalculator() {
  const [current, setCurrent] = useState<CurrentLoan>({
    balance: "",
    interestRate: "",
    remainingTerm: "",
    monthlyFee: "0",
  });
  const [newLoan, setNewLoan] = useState<NewLoan>({
    interestRate: "",
    loanTerm: "",
    monthlyFee: "0",
  });
  const [switching, setSwitching] = useState<SwitchingCosts>({
    dischargeFee: "350",
    applicationFee: "0",
    otherCosts: "0",
  });
  const [results, setResults] = useState<Results | null>(null);

  function num(s: string): number {
    return parseFloat(s.replace(/,/g, "")) || 0;
  }

  function calculate() {
    const balance = num(current.balance);
    const currentRate = num(current.interestRate);
    const remainingTerm = num(current.remainingTerm);
    const currentMonthlyFee = num(current.monthlyFee);

    const newRate = num(newLoan.interestRate);
    const newTerm = num(newLoan.loanTerm) || remainingTerm;
    const newMonthlyFee = num(newLoan.monthlyFee);

    if (!balance || !currentRate || !remainingTerm || !newRate) return;

    const currentBaseRepayment = calcMonthlyRepayment(balance, currentRate, remainingTerm);
    const newBaseRepayment = calcMonthlyRepayment(balance, newRate, newTerm);

    const currentRepayment = currentBaseRepayment + currentMonthlyFee;
    const newRepayment = newBaseRepayment + newMonthlyFee;

    const monthlySaving = currentRepayment - newRepayment;

    const totalInterestCurrent = calcTotalInterest(balance, currentBaseRepayment, remainingTerm);
    const totalInterestNew = calcTotalInterest(balance, newBaseRepayment, newTerm);

    const totalSwitchingCosts =
      num(switching.dischargeFee) +
      num(switching.applicationFee) +
      num(switching.otherCosts);

    const monthsToBreakEven = monthlySaving > 0 ? totalSwitchingCosts / monthlySaving : Infinity;
    const netSaving = totalInterestCurrent - totalInterestNew - totalSwitchingCosts;

    setResults({
      currentRepayment,
      newRepayment,
      monthlySaving,
      monthsToBreakEven,
      totalInterestCurrent,
      totalInterestNew,
      totalSwitchingCosts,
      netSaving,
    });
  }

  return (
    <div className="grid lg:grid-cols-2 gap-0">
      {/* Form */}
      <div className="p-8 border-b lg:border-b-0 lg:border-r border-line space-y-8">
        {/* Current Loan */}
        <div>
          <p className="font-mono text-[11px] uppercase tracking-widest text-ink/40 mb-3 pb-2 border-b border-line">
            Current Loan
          </p>
          <div className="space-y-4">
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-widest text-ink/60 mb-1">
                Remaining Balance ($)
              </label>
              <input
                type="number"
                value={current.balance}
                onChange={(e) => setCurrent({ ...current, balance: e.target.value })}
                placeholder="400000"
                className="w-full border border-line bg-white font-sans text-[14px] px-3 py-2.5 outline-none focus:border-orange/60"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-widest text-ink/60 mb-1">
                  Interest Rate (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={current.interestRate}
                  onChange={(e) => setCurrent({ ...current, interestRate: e.target.value })}
                  placeholder="7.20"
                  className="w-full border border-line bg-white font-sans text-[14px] px-3 py-2.5 outline-none focus:border-orange/60"
                />
              </div>
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-widest text-ink/60 mb-1">
                  Remaining Term (yrs)
                </label>
                <input
                  type="number"
                  value={current.remainingTerm}
                  onChange={(e) => setCurrent({ ...current, remainingTerm: e.target.value })}
                  placeholder="25"
                  className="w-full border border-line bg-white font-sans text-[14px] px-3 py-2.5 outline-none focus:border-orange/60"
                />
              </div>
            </div>
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-widest text-ink/60 mb-1">
                Monthly Fee ($)
              </label>
              <input
                type="number"
                value={current.monthlyFee}
                onChange={(e) => setCurrent({ ...current, monthlyFee: e.target.value })}
                className="w-full border border-line bg-white font-sans text-[14px] px-3 py-2.5 outline-none focus:border-orange/60"
              />
            </div>
          </div>
        </div>

        {/* New Loan */}
        <div>
          <p className="font-mono text-[11px] uppercase tracking-widest text-ink/40 mb-3 pb-2 border-b border-line">
            New Loan
          </p>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-widest text-ink/60 mb-1">
                  Interest Rate (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newLoan.interestRate}
                  onChange={(e) => setNewLoan({ ...newLoan, interestRate: e.target.value })}
                  placeholder="6.20"
                  className="w-full border border-line bg-white font-sans text-[14px] px-3 py-2.5 outline-none focus:border-orange/60"
                />
              </div>
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-widest text-ink/60 mb-1">
                  Loan Term (years)
                </label>
                <input
                  type="number"
                  value={newLoan.loanTerm}
                  onChange={(e) => setNewLoan({ ...newLoan, loanTerm: e.target.value })}
                  placeholder="25"
                  className="w-full border border-line bg-white font-sans text-[14px] px-3 py-2.5 outline-none focus:border-orange/60"
                />
              </div>
            </div>
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-widest text-ink/60 mb-1">
                Monthly Fee ($)
              </label>
              <input
                type="number"
                value={newLoan.monthlyFee}
                onChange={(e) => setNewLoan({ ...newLoan, monthlyFee: e.target.value })}
                className="w-full border border-line bg-white font-sans text-[14px] px-3 py-2.5 outline-none focus:border-orange/60"
              />
            </div>
          </div>
        </div>

        {/* Switching Costs */}
        <div>
          <p className="font-mono text-[11px] uppercase tracking-widest text-ink/40 mb-3 pb-2 border-b border-line">
            Switching Costs
          </p>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-widest text-ink/60 mb-1">
                  Discharge Fee
                </label>
                <input
                  type="number"
                  value={switching.dischargeFee}
                  onChange={(e) => setSwitching({ ...switching, dischargeFee: e.target.value })}
                  className="w-full border border-line bg-white font-sans text-[14px] px-3 py-2.5 outline-none focus:border-orange/60"
                />
              </div>
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-widest text-ink/60 mb-1">
                  Application Fee
                </label>
                <input
                  type="number"
                  value={switching.applicationFee}
                  onChange={(e) => setSwitching({ ...switching, applicationFee: e.target.value })}
                  className="w-full border border-line bg-white font-sans text-[14px] px-3 py-2.5 outline-none focus:border-orange/60"
                />
              </div>
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-widest text-ink/60 mb-1">
                  Other Costs
                </label>
                <input
                  type="number"
                  value={switching.otherCosts}
                  onChange={(e) => setSwitching({ ...switching, otherCosts: e.target.value })}
                  className="w-full border border-line bg-white font-sans text-[14px] px-3 py-2.5 outline-none focus:border-orange/60"
                />
              </div>
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
              <p className="font-mono text-[10px] uppercase tracking-widest text-white/50 mb-1">Monthly Saving</p>
              <p className={`font-mono text-[2.4rem] leading-none font-medium ${results.monthlySaving > 0 ? "text-orange" : "text-red-400"}`}>
                {results.monthlySaving > 0 ? "+" : "-"}{fmtDec(results.monthlySaving)}
              </p>
            </div>

            <div className="border-t border-white/10 pt-5 space-y-3">
              <div className="flex justify-between">
                <span className="font-sans text-[13px] text-white/60">Current monthly repayment</span>
                <span className="font-mono text-[13px] text-white">{fmtDec(results.currentRepayment)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-sans text-[13px] text-white/60">New monthly repayment</span>
                <span className="font-mono text-[13px] text-white">{fmtDec(results.newRepayment)}</span>
              </div>
            </div>

            <div className="border-t border-white/10 pt-5 space-y-3">
              <div className="flex justify-between">
                <span className="font-sans text-[13px] text-white/60">Months to break even</span>
                <span className="font-mono text-[13px] text-white">
                  {isFinite(results.monthsToBreakEven)
                    ? `${Math.ceil(results.monthsToBreakEven)} months`
                    : "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-sans text-[13px] text-white/60">Total interest (current)</span>
                <span className="font-mono text-[13px] text-white">{fmt(results.totalInterestCurrent)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-sans text-[13px] text-white/60">Total interest (new)</span>
                <span className="font-mono text-[13px] text-white">{fmt(results.totalInterestNew)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-sans text-[13px] text-white/60">Total switching costs</span>
                <span className="font-mono text-[13px] text-white">{fmt(results.totalSwitchingCosts)}</span>
              </div>
            </div>

            <div className="border-t border-white/10 pt-5">
              <div className="flex justify-between items-end">
                <span className="font-mono text-[10px] uppercase tracking-widest text-white/50">Net Saving Over Loan Life</span>
                <span className={`font-mono text-[1.4rem] font-medium ${results.netSaving >= 0 ? "text-white" : "text-red-400"}`}>
                  {results.netSaving >= 0 ? "" : "-"}{fmt(results.netSaving)}
                </span>
              </div>
            </div>

            {results.monthlySaving <= 0 && (
              <div className="bg-red-500/10 border border-red-500/20 px-4 py-3">
                <p className="font-sans text-[12px] text-red-300/80 leading-relaxed">
                  The new loan has higher monthly repayments. Switching may not be beneficial.
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
