"use client";

import { useState } from "react";

type State = "NSW" | "VIC" | "QLD" | "WA" | "SA" | "TAS" | "ACT" | "NT";
type PropertyType = "established" | "new" | "off-the-plan" | "vacant-land";
type BuyerType = "first-home" | "owner-occupier" | "investor";

interface FormState {
  state: State;
  purchasePrice: string;
  propertyType: PropertyType;
  buyerType: BuyerType;
  foreignBuyer: boolean;
}

interface Results {
  stampDuty: number;
  transferFee: number;
  mortgageFee: number;
  total: number;
  concessionApplied: boolean;
  concessionNote: string;
}

function calcNSW(price: number): number {
  if (price <= 14000) return price * 0.0125;
  if (price <= 30000) return 175 + (price - 14000) * 0.015;
  if (price <= 80000) return 415 + (price - 30000) * 0.0175;
  if (price <= 300000) return 1290 + (price - 80000) * 0.035;
  if (price <= 1000000) return 8990 + (price - 300000) * 0.045;
  if (price <= 3000000) return 40490 + (price - 1000000) * 0.055;
  return 150490 + (price - 3000000) * 0.07;
}

function calcVIC(price: number): number {
  if (price > 960000) return price * 0.055;
  if (price <= 25000) return price * 0.014;
  if (price <= 130000) return 350 + (price - 25000) * 0.024;
  return 2870 + (price - 130000) * 0.06;
}

function calcQLD(price: number): number {
  if (price <= 5000) return 0;
  if (price <= 75000) return (price - 5000) * 0.015;
  if (price <= 540000) return 1050 + (price - 75000) * 0.035;
  if (price <= 1000000) return 17325 + (price - 540000) * 0.045;
  return 38025 + (price - 1000000) * 0.0575;
}

function calcWA(price: number): number {
  if (price <= 80000) return price * 0.019;
  if (price <= 100000) return 1520 + (price - 80000) * 0.0285;
  if (price <= 250000) return 2090 + (price - 100000) * 0.038;
  if (price <= 500000) return 7790 + (price - 250000) * 0.0475;
  return 19665 + (price - 500000) * 0.0515;
}

function calcSA(price: number): number {
  if (price <= 12000) return price * 0.01;
  if (price <= 30000) return 120 + (price - 12000) * 0.02;
  if (price <= 50000) return 480 + (price - 30000) * 0.03;
  if (price <= 100000) return 1080 + (price - 50000) * 0.035;
  if (price <= 200000) return 2830 + (price - 100000) * 0.04;
  if (price <= 250000) return 6830 + (price - 200000) * 0.0425;
  if (price <= 300000) return 8955 + (price - 250000) * 0.0475;
  if (price <= 500000) return 11330 + (price - 300000) * 0.05;
  return 21330 + (price - 500000) * 0.055;
}

function calcTAS(price: number): number {
  if (price <= 3000) return 50;
  if (price <= 25000) return 50 + (price - 3000) * 0.0175;
  if (price <= 75000) return 435 + (price - 25000) * 0.0225;
  if (price <= 200000) return 1560 + (price - 75000) * 0.035;
  if (price <= 375000) return 5935 + (price - 200000) * 0.04;
  if (price <= 725000) return 12935 + (price - 375000) * 0.0425;
  return 27810 + (price - 725000) * 0.045;
}

function calcACT(price: number): number {
  if (price <= 200000) return price * 0.006;
  if (price <= 300000) return 1200 + (price - 200000) * 0.022;
  if (price <= 500000) return 3400 + (price - 300000) * 0.034;
  if (price <= 750000) return 10200 + (price - 500000) * 0.0432;
  if (price <= 1000000) return 21000 + (price - 750000) * 0.059;
  return 35750 + (price - 1000000) * 0.064;
}

function calcNT(price: number): number {
  if (price <= 525000) {
    const v = price / 1000;
    return 0.06571441 * v * v + 15 * v;
  }
  return price * 0.0495;
}

function calcBaseStampDuty(state: State, price: number): number {
  switch (state) {
    case "NSW": return calcNSW(price);
    case "VIC": return calcVIC(price);
    case "QLD": return calcQLD(price);
    case "WA": return calcWA(price);
    case "SA": return calcSA(price);
    case "TAS": return calcTAS(price);
    case "ACT": return calcACT(price);
    case "NT": return calcNT(price);
  }
}

function applyFHBConcession(
  state: State,
  price: number,
  propertyType: PropertyType,
  base: number
): { duty: number; applied: boolean; note: string } {
  if (state === "NSW" && price <= 650000 && (propertyType === "new" || propertyType === "off-the-plan")) {
    return { duty: 0, applied: true, note: "NSW FHB exemption: no stamp duty on new homes up to $650k" };
  }
  if (state === "VIC" && price <= 600000) {
    return { duty: 0, applied: true, note: "VIC FHB exemption: no stamp duty on properties up to $600k" };
  }
  if (state === "QLD" && price <= 500000 && (propertyType === "new" || propertyType === "off-the-plan")) {
    return { duty: 0, applied: true, note: "QLD FHB exemption: no stamp duty on new homes up to $500k" };
  }
  if (state === "WA" && price <= 430000) {
    return { duty: 0, applied: true, note: "WA FHB exemption: no stamp duty on properties up to $430k" };
  }
  if (state === "SA" && price <= 400000 && (propertyType === "new" || propertyType === "off-the-plan")) {
    const rebate = Math.min(base, 15500);
    return { duty: Math.max(0, base - rebate), applied: true, note: "SA FHB partial rebate applied (up to $15,500)" };
  }
  return { duty: base, applied: false, note: "" };
}

function applyForeignSurcharge(state: State, price: number, duty: number): number {
  switch (state) {
    case "NSW": return duty + price * 0.08;
    case "VIC": return duty + price * 0.08;
    case "QLD": return duty + price * 0.07;
    case "SA": return duty + price * 0.07;
    case "ACT": return duty + price * 0.06;
    default: return duty;
  }
}

function fmt(n: number): string {
  return "$" + Math.round(n).toLocaleString("en-AU");
}

const STATES: State[] = ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"];

export default function StampDutyCalculator() {
  const [form, setForm] = useState<FormState>({
    state: "NSW",
    purchasePrice: "",
    propertyType: "established",
    buyerType: "owner-occupier",
    foreignBuyer: false,
  });
  const [results, setResults] = useState<Results | null>(null);

  function calculate() {
    const price = parseFloat(form.purchasePrice.replace(/,/g, ""));
    if (!price || price <= 0) return;

    let base = calcBaseStampDuty(form.state, price);
    let concessionApplied = false;
    let concessionNote = "";

    if (form.buyerType === "first-home") {
      const result = applyFHBConcession(form.state, price, form.propertyType, base);
      base = result.duty;
      concessionApplied = result.applied;
      concessionNote = result.note;
    }

    let stampDuty = base;
    if (form.foreignBuyer) {
      stampDuty = applyForeignSurcharge(form.state, price, base);
    }

    const transferFee = 143 + Math.floor(price / 10000) * 2.5;
    const mortgageFee = 143;

    setResults({
      stampDuty,
      transferFee,
      mortgageFee,
      total: stampDuty + transferFee + mortgageFee,
      concessionApplied,
      concessionNote,
    });
  }

  return (
    <div className="grid lg:grid-cols-2 gap-0">
      {/* Form */}
      <div className="p-8 border-b lg:border-b-0 lg:border-r border-line">
        <p className="font-mono text-[11px] uppercase tracking-widest text-ink/40 mb-3 pb-2 border-b border-line">
          Property Details
        </p>

        <div className="space-y-5">
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-widest text-ink/60 mb-1">
              State / Territory
            </label>
            <select
              value={form.state}
              onChange={(e) => setForm({ ...form, state: e.target.value as State })}
              className="w-full border border-line bg-white font-sans text-[14px] px-3 py-2.5 outline-none focus:border-orange/60"
            >
              {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label className="block font-mono text-[10px] uppercase tracking-widest text-ink/60 mb-1">
              Purchase Price ($)
            </label>
            <input
              type="number"
              value={form.purchasePrice}
              onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })}
              placeholder="750000"
              className="w-full border border-line bg-white font-sans text-[14px] px-3 py-2.5 outline-none focus:border-orange/60"
            />
          </div>

          <div>
            <label className="block font-mono text-[10px] uppercase tracking-widest text-ink/60 mb-1">
              Property Type
            </label>
            <select
              value={form.propertyType}
              onChange={(e) => setForm({ ...form, propertyType: e.target.value as PropertyType })}
              className="w-full border border-line bg-white font-sans text-[14px] px-3 py-2.5 outline-none focus:border-orange/60"
            >
              <option value="established">Established Home</option>
              <option value="new">New Home</option>
              <option value="off-the-plan">Off-the-Plan</option>
              <option value="vacant-land">Vacant Land</option>
            </select>
          </div>

          <div>
            <label className="block font-mono text-[10px] uppercase tracking-widest text-ink/60 mb-1">
              Buyer Type
            </label>
            <select
              value={form.buyerType}
              onChange={(e) => setForm({ ...form, buyerType: e.target.value as BuyerType })}
              className="w-full border border-line bg-white font-sans text-[14px] px-3 py-2.5 outline-none focus:border-orange/60"
            >
              <option value="first-home">First Home Buyer</option>
              <option value="owner-occupier">Owner Occupier</option>
              <option value="investor">Investor</option>
            </select>
          </div>

          <div>
            <label className="block font-mono text-[10px] uppercase tracking-widest text-ink/60 mb-2">
              Foreign Buyer
            </label>
            <div className="flex gap-6">
              {([false, true] as const).map((val) => (
                <label key={String(val)} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="foreignBuyer"
                    checked={form.foreignBuyer === val}
                    onChange={() => setForm({ ...form, foreignBuyer: val })}
                    className="accent-orange"
                  />
                  <span className="font-sans text-[14px]">{val ? "Yes" : "No"}</span>
                </label>
              ))}
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
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-white/50 mb-1">Stamp Duty</p>
              <p className="font-mono text-[2.2rem] text-orange font-medium">{fmt(results.stampDuty)}</p>
            </div>

            <div className="border-t border-white/10 pt-5 space-y-3">
              <div className="flex justify-between">
                <span className="font-sans text-[13px] text-white/60">Transfer Registration Fee</span>
                <span className="font-mono text-[13px] text-white">{fmt(results.transferFee)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-sans text-[13px] text-white/60">Mortgage Registration Fee</span>
                <span className="font-mono text-[13px] text-white">{fmt(results.mortgageFee)}</span>
              </div>
            </div>

            <div className="border-t border-white/10 pt-5">
              <div className="flex justify-between items-end">
                <span className="font-mono text-[10px] uppercase tracking-widest text-white/50">Total Government Charges</span>
                <span className="font-mono text-[1.4rem] text-white font-medium">{fmt(results.total)}</span>
              </div>
            </div>

            {results.concessionApplied && (
              <div className="bg-orange/10 border border-orange/30 px-4 py-3 mt-2">
                <p className="font-sans text-[12px] text-orange/90 leading-relaxed">{results.concessionNote}</p>
              </div>
            )}

            {form.foreignBuyer && (
              <div className="bg-white/5 border border-white/10 px-4 py-3">
                <p className="font-sans text-[12px] text-white/50 leading-relaxed">Foreign buyer surcharge applied for {form.state}.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center">
            <p className="font-mono text-[11px] uppercase tracking-widest text-white/30">
              Enter details and calculate
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
