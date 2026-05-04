"use client";

import { useState } from "react";

type Frequency = "weekly" | "fortnightly" | "monthly" | "yearly";
type TabKey = "income" | "housing" | "transport" | "living" | "savings";

interface BudgetField {
  label: string;
  key: string;
}

interface FieldState {
  amount: string;
  frequency: Frequency;
}

type BudgetData = Record<string, FieldState>;

const TABS: { key: TabKey; label: string }[] = [
  { key: "income", label: "Income" },
  { key: "housing", label: "Housing" },
  { key: "transport", label: "Transport" },
  { key: "living", label: "Living" },
  { key: "savings", label: "Savings" },
];

const FIELDS: Record<TabKey, BudgetField[]> = {
  income: [
    { key: "salary", label: "Salary (after tax)" },
    { key: "otherIncome", label: "Other Income" },
    { key: "partnerIncome", label: "Partner Income" },
    { key: "investmentIncome", label: "Investment Income" },
    { key: "govBenefits", label: "Government Benefits" },
  ],
  housing: [
    { key: "rentMortgage", label: "Rent / Mortgage" },
    { key: "councilRates", label: "Council Rates" },
    { key: "utilities", label: "Utilities" },
    { key: "homeInsurance", label: "Home Insurance" },
    { key: "bodyCorp", label: "Body Corp" },
  ],
  transport: [
    { key: "fuel", label: "Fuel" },
    { key: "carLoan", label: "Car Loan" },
    { key: "registration", label: "Registration" },
    { key: "carInsurance", label: "Car Insurance" },
    { key: "publicTransport", label: "Public Transport" },
  ],
  living: [
    { key: "groceries", label: "Groceries" },
    { key: "diningOut", label: "Dining Out" },
    { key: "health", label: "Health / Medical" },
    { key: "education", label: "Education" },
    { key: "entertainment", label: "Entertainment" },
    { key: "clothing", label: "Clothing" },
    { key: "personalCare", label: "Personal Care" },
    { key: "subscriptions", label: "Subscriptions" },
    { key: "petExpenses", label: "Pet Expenses" },
    { key: "childcare", label: "Childcare" },
  ],
  savings: [
    { key: "super", label: "Superannuation" },
    { key: "regularSavings", label: "Regular Savings" },
    { key: "otherSavings", label: "Other" },
  ],
};

function toMonthly(amount: string, frequency: Frequency): number {
  const v = parseFloat(amount.replace(/,/g, "")) || 0;
  switch (frequency) {
    case "weekly": return v * 52 / 12;
    case "fortnightly": return v * 26 / 12;
    case "monthly": return v;
    case "yearly": return v / 12;
  }
}

function fmt(n: number): string {
  return "$" + Math.abs(Math.round(n)).toLocaleString("en-AU");
}

const INCOME_FIELDS = new Set(FIELDS.income.map((f) => f.key));

function makeInitialState(): BudgetData {
  const data: BudgetData = {};
  Object.values(FIELDS).forEach((fields) => {
    fields.forEach((f) => {
      data[f.key] = { amount: "", frequency: "monthly" };
    });
  });
  return data;
}

const FREQ_OPTIONS: { value: Frequency; label: string }[] = [
  { value: "weekly", label: "Weekly" },
  { value: "fortnightly", label: "Fortnightly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

export default function BudgetPlanner() {
  const [activeTab, setActiveTab] = useState<TabKey>("income");
  const [data, setData] = useState<BudgetData>(makeInitialState);
  const [calculated, setCalculated] = useState(false);

  function updateField(key: string, field: "amount" | "frequency", value: string) {
    setData((prev) => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }));
  }

  let totalIncome = 0;
  let totalExpenses = 0;

  Object.entries(data).forEach(([key, val]) => {
    const monthly = toMonthly(val.amount, val.frequency);
    if (INCOME_FIELDS.has(key)) {
      totalIncome += monthly;
    } else {
      totalExpenses += monthly;
    }
  });

  const surplus = totalIncome - totalExpenses;
  const expenseRatio = totalIncome > 0 ? Math.min(1, totalExpenses / totalIncome) : 0;

  return (
    <div>
      {/* Tab Bar */}
      <div className="flex overflow-x-auto border-b border-line">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 min-w-[80px] font-mono text-[10px] uppercase tracking-widest py-3 px-4 whitespace-nowrap transition-colors border-b-2 ${
              activeTab === tab.key
                ? "border-orange text-orange"
                : "border-transparent text-ink/40 hover:text-ink/70"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-0">
        {/* Fields */}
        <div className="p-8 border-b lg:border-b-0 lg:border-r border-line">
          <p className="font-mono text-[11px] uppercase tracking-widest text-ink/40 mb-4 pb-2 border-b border-line">
            {TABS.find((t) => t.key === activeTab)?.label}
          </p>
          <div className="space-y-4">
            {FIELDS[activeTab].map((field) => (
              <div key={field.key}>
                <label className="block font-mono text-[10px] uppercase tracking-widest text-ink/60 mb-1">
                  {field.label}
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={data[field.key].amount}
                    onChange={(e) => updateField(field.key, "amount", e.target.value)}
                    placeholder="0"
                    className="flex-1 border border-line bg-white font-sans text-[14px] px-3 py-2.5 outline-none focus:border-orange/60 min-w-0"
                  />
                  <select
                    value={data[field.key].frequency}
                    onChange={(e) => updateField(field.key, "frequency", e.target.value as Frequency)}
                    className="border border-line bg-white font-sans text-[12px] px-2 py-2.5 outline-none focus:border-orange/60"
                  >
                    {FREQ_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => setCalculated(true)}
            className="mt-8 bg-orange text-white font-mono text-[11px] uppercase tracking-widest px-8 py-3 hover:bg-orange/90 transition-colors"
          >
            Calculate Budget
          </button>
        </div>

        {/* Results */}
        <div className="p-8 bg-navy flex flex-col justify-center min-h-[400px]">
          {calculated ? (
            <div className="space-y-6">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-white/50 mb-1">
                  {surplus >= 0 ? "Monthly Surplus" : "Monthly Deficit"}
                </p>
                <p className={`font-mono text-[2.4rem] leading-none font-medium ${surplus >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {surplus >= 0 ? "+" : "-"}{fmt(surplus)}
                </p>
                <p className="font-sans text-[13px] text-white/50 mt-2">
                  {surplus >= 0
                    ? `You have ${fmt(surplus)} surplus per month`
                    : `You are spending ${fmt(surplus)} more than you earn`}
                </p>
              </div>

              {/* Bar */}
              <div className="space-y-2">
                <div className="h-3 bg-white/10 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${surplus >= 0 ? "bg-green-400" : "bg-red-400"}`}
                    style={{ width: `${Math.round(expenseRatio * 100)}%` }}
                  />
                </div>
                <div className="flex justify-between">
                  <span className="font-mono text-[9px] uppercase tracking-widest text-white/30">Expenses</span>
                  <span className="font-mono text-[9px] uppercase tracking-widest text-white/30">
                    {Math.round(expenseRatio * 100)}% of income
                  </span>
                </div>
              </div>

              <div className="border-t border-white/10 pt-5 space-y-3">
                <div className="flex justify-between">
                  <span className="font-sans text-[13px] text-white/60">Total Monthly Income</span>
                  <span className="font-mono text-[13px] text-white">{fmt(totalIncome)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-sans text-[13px] text-white/60">Total Monthly Expenses</span>
                  <span className="font-mono text-[13px] text-white">{fmt(totalExpenses)}</span>
                </div>
              </div>

              <div className="border-t border-white/10 pt-5 space-y-2">
                {TABS.filter((t) => t.key !== "income").map((tab) => {
                  const tabTotal = FIELDS[tab.key].reduce(
                    (sum, f) => sum + toMonthly(data[f.key].amount, data[f.key].frequency),
                    0
                  );
                  if (tabTotal === 0) return null;
                  return (
                    <div key={tab.key} className="flex justify-between">
                      <span className="font-sans text-[12px] text-white/40">{tab.label}</span>
                      <span className="font-mono text-[12px] text-white/60">{fmt(tabTotal)}/mo</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center">
              <p className="font-mono text-[11px] uppercase tracking-widest text-white/30">
                Fill in your income and expenses, then calculate
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
