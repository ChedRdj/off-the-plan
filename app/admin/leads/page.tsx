import { supabaseAdmin } from "@/lib/supabase/admin";
import { formatDate } from "@/lib/utils";
import { PeriodFilter } from "@/components/admin/period-filter";
import { ExportButtons, type ExportColumn } from "@/components/admin/export-buttons";

export const dynamic = "force-dynamic";

type Lead = {
  id: string;
  full_name: string | null;
  email: string | null;
  company: string | null;
  message: string | null;
  created_at: string;
};

interface SearchParams { months?: string }

function cutoffISO(months: number): string | null {
  if (!Number.isFinite(months) || months <= 0) return null;
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  return d.toISOString();
}

export default async function AdminLeadsPage({ searchParams }: { searchParams: SearchParams }) {
  const months = Math.max(0, parseInt(searchParams.months ?? "0", 10) || 0);
  const cutoff = cutoffISO(months);

  let query = supabaseAdmin
    .from("developer_leads")
    .select("*")
    .order("created_at", { ascending: false });
  if (cutoff) query = query.gte("created_at", cutoff);

  const { data } = await query;
  const leads = (data ?? []) as Lead[];

  const columns: ExportColumn<Lead>[] = [
    { header: "Name",    value: (l) => l.full_name ?? "" },
    { header: "Email",   value: (l) => l.email ?? "" },
    { header: "Company", value: (l) => l.company ?? "" },
    { header: "Message", value: (l) => l.message ?? "" },
    { header: "Date",    value: (l) => formatDate(l.created_at) },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <h1 className="font-display font-light text-navy text-section-lg">Developer Leads</h1>
        <div className="flex items-center gap-3">
          <PeriodFilter />
          <ExportButtons rows={leads} columns={columns} filename="developer-leads" pdfTitle="Developer Leads" />
        </div>
      </div>

      {leads.length > 0 ? (
        <div className="bg-white border border-line overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-line">
                {["Name", "Email", "Company", "Message", "Date"].map((h) => (
                  <th key={h} className="font-sans text-sm font-semibold text-ink/60 px-4 py-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {leads.map((l) => (
                <tr key={l.id} className="border-b border-line last:border-0 hover:bg-cream-alt transition-colors">
                  <td className="px-4 py-4 font-sans text-sm">{l.full_name}</td>
                  <td className="px-4 py-3 font-sans text-sm text-ink/60">{l.email}</td>
                  <td className="px-4 py-4 font-sans text-sm text-ink/60">{l.company ?? "—"}</td>
                  <td className="px-4 py-4 font-sans text-sm text-ink/60 max-w-xs truncate">{l.message ?? "—"}</td>
                  <td className="px-4 py-3 font-sans text-sm text-ink/60">{formatDate(l.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="font-sans text-body-md text-ink/40">
          No developer leads in this period. {months > 0 ? "Try a wider time range or " : ""}They&apos;ll appear here when developers submit the form.
        </p>
      )}
    </div>
  );
}
