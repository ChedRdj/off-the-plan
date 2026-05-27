import { supabaseAdmin } from "@/lib/supabase/admin";
import { formatDate } from "@/lib/utils";
import { PeriodFilter } from "@/components/admin/period-filter";
import { ExportButtons, type ExportColumn } from "@/components/admin/export-buttons";

export const dynamic = "force-dynamic";

type Enquiry = {
  id: string;
  full_name: string | null;
  email: string | null;
  mobile: string | null;
  status: string | null;
  created_at: string;
  development: { name: string | null } | null;
};

interface SearchParams { months?: string }

function cutoffISO(months: number): string | null {
  if (!Number.isFinite(months) || months <= 0) return null;
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  return d.toISOString();
}

export default async function AdminEnquiriesPage({ searchParams }: { searchParams: SearchParams }) {
  const months = Math.max(0, parseInt(searchParams.months ?? "0", 10) || 0);
  const cutoff = cutoffISO(months);

  let query = supabaseAdmin
    .from("enquiries")
    .select("*, development:developments(name)")
    .order("created_at", { ascending: false });
  if (cutoff) query = query.gte("created_at", cutoff);

  const { data } = await query;
  const enquiries = (data ?? []) as unknown as Enquiry[];

  const columns: ExportColumn<Enquiry>[] = [
    { header: "Development", value: (e) => e.development?.name ?? "" },
    { header: "Name",        value: (e) => e.full_name ?? "" },
    { header: "Email",       value: (e) => e.email ?? "" },
    { header: "Mobile",      value: (e) => e.mobile ?? "" },
    { header: "Status",      value: (e) => e.status ?? "New" },
    { header: "Date",        value: (e) => formatDate(e.created_at) },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <h1 className="font-display font-light text-navy text-section-lg">Enquiries</h1>
        <div className="flex items-center gap-3">
          <PeriodFilter />
          <ExportButtons rows={enquiries} columns={columns} filename="enquiries" pdfTitle="Buyer Enquiries" />
        </div>
      </div>

      {enquiries.length > 0 ? (
        <div className="bg-white border border-line overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-line">
                {["Development", "Name", "Email", "Mobile", "Date", "Status"].map((h) => (
                  <th key={h} className="font-sans text-sm font-semibold text-ink/60 px-4 py-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {enquiries.map((e) => (
                <tr key={e.id} className="border-b border-line last:border-0 hover:bg-cream-alt transition-colors">
                  <td className="px-4 py-4 font-sans text-sm text-navy">{e.development?.name ?? "—"}</td>
                  <td className="px-4 py-4 font-sans text-sm">{e.full_name}</td>
                  <td className="px-4 py-3 font-sans text-sm text-ink/60">{e.email}</td>
                  <td className="px-4 py-3 font-sans text-sm text-ink/60">{e.mobile ?? "—"}</td>
                  <td className="px-4 py-3 font-sans text-sm text-ink/60">{formatDate(e.created_at)}</td>
                  <td className="px-4 py-3 font-sans text-sm text-orange capitalize">{e.status ?? "New"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="font-sans text-body-md text-ink/40">
          No enquiries in this period. {months > 0 ? "Try a wider time range or " : ""}They&apos;ll appear here when buyers submit the form.
        </p>
      )}
    </div>
  );
}
