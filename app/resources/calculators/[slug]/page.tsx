import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

import StampDutyCalculator from "@/components/calculators/stamp-duty-calculator";
import BorrowingPowerCalculator from "@/components/calculators/borrowing-power-calculator";
import LoanRepaymentCalculator from "@/components/calculators/loan-repayment-calculator";
import BudgetPlanner from "@/components/calculators/budget-planner";
import LoanComparisonCalculator from "@/components/calculators/loan-comparison-calculator";
import MortgageSwitchingCalculator from "@/components/calculators/mortgage-switching-calculator";

interface CalculatorMeta {
  title: string;
  description: string;
  component: React.ComponentType;
}

const CALCULATORS: Record<string, CalculatorMeta> = {
  "stamp-duty": {
    title: "Stamp Duty Calculator",
    description:
      "Estimate stamp duty and government charges for your property purchase across all Australian states and territories, including first home buyer concessions and foreign buyer surcharges.",
    component: StampDutyCalculator,
  },
  "borrowing-power": {
    title: "Borrowing Power Calculator",
    description:
      "Find out how much you may be able to borrow based on your income, expenses, and existing financial commitments — calculated using the APRA 3% serviceability buffer.",
    component: BorrowingPowerCalculator,
  },
  "loan-repayment": {
    title: "Loan Repayment Calculator",
    description:
      "Calculate your weekly, fortnightly, and monthly repayments for principal & interest or interest only loans, and see the total cost over the life of the loan.",
    component: LoanRepaymentCalculator,
  },
  "budget-planner": {
    title: "Budget Planner",
    description:
      "Plan your finances across income, housing, transport, living, and savings categories. See your monthly surplus or deficit at a glance.",
    component: BudgetPlanner,
  },
  "loan-comparison": {
    title: "Loan Comparison Calculator",
    description:
      "Compare two loan products side by side — including fees — to find which option costs less over the full loan term.",
    component: LoanComparisonCalculator,
  },
  "mortgage-switching": {
    title: "Mortgage Switching Calculator",
    description:
      "Calculate whether refinancing is worth it by comparing your current loan against a new one, factoring in all switching costs and your break-even point.",
    component: MortgageSwitchingCalculator,
  },
};

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const calc = CALCULATORS[slug];
  if (!calc) return { title: "Not Found" };
  return {
    title: `${calc.title} | Resources`,
    description: calc.description,
  };
}

export function generateStaticParams() {
  return Object.keys(CALCULATORS).map((slug) => ({ slug }));
}

export default async function CalculatorPage({ params }: PageProps) {
  const { slug } = await params;
  const calc = CALCULATORS[slug];

  if (!calc) {
    notFound();
  }

  const Calculator = calc.component;

  return (
    <div className="min-h-screen bg-cream pt-16">
      {/* Header */}
      <div className="bg-[#eeecea] border-b border-line py-14">
        <div className="container-padded">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink/40 mb-3">
            Resources
          </p>
          <h1 className="font-mono text-[2rem] uppercase tracking-[0.14em] text-navy font-medium leading-tight">
            {calc.title}
          </h1>
        </div>
      </div>

      {/* Intro strip */}
      <div className="bg-navy py-10">
        <div className="container-padded max-w-3xl">
          <p className="font-sans text-[16px] text-white/80 leading-relaxed">
            {calc.description}
          </p>
        </div>
      </div>

      {/* Calculator */}
      <div className="bg-white">
        <div className="container-padded py-0">
          <div className="border-x border-line">
            <Calculator />
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-white border-t border-line">
        <div className="container-padded py-8">
          <p className="font-sans text-[11px] text-ink/40 leading-relaxed max-w-3xl">
            <strong className="font-semibold text-ink/50">Disclaimer:</strong> This calculator provides estimates only and is intended as a guide. Results do not constitute financial, legal, or taxation advice. Stamp duty rates, concessions, and thresholds change regularly and may vary based on individual circumstances. Always consult a qualified professional before making financial decisions. Off The Plan accepts no liability for the accuracy or completeness of the results provided.
          </p>
        </div>
      </div>

      {/* Back link */}
      <div className="bg-[#f5f4f1] border-t border-line">
        <div className="container-padded py-8">
          <Link
            href="/resources/calculators"
            className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-ink/50 hover:text-orange transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to Calculators
          </Link>
        </div>
      </div>
    </div>
  );
}
