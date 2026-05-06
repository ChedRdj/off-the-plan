"use client";

interface Lead {
  id: string;
  full_name: string | null;
  email: string | null;
  mobile: string | null;
  buyer_type: string | null;
  notes: string | null;
  created_at: string | null;
  development_name: string;
}

interface Props { leads: Lead[] }

export default function LeadsTable({ leads }: Props) {
  function downloadCSV() {
    const headers = ["Name", "Email", "Mobile", "Buyer Type", "Notes", "Listing", "Date"];
    const rows = leads.map((l) => [
      l.full_name ?? "",
      l.email ?? "",
      l.mobile ?? "",
      l.buyer_type ?? "",
      l.notes ?? "",
      l.development_name,
      l.created_at ? new Date(l.created_at).toLocaleDateString("en-AU") : "",
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="bg-white">
      <div className="flex items-center justify-between px-5 py-4 border-b border-line">
        <p className="font-mono text-[11px] uppercase tracking-widest text-ink font-bold">
          {leads.length} lead{leads.length !== 1 ? "s" : ""}
        </p>
        {leads.length > 0 && (
          <button
            onClick={downloadCSV}
            className="font-mono text-[10px] uppercase tracking-widest px-4 py-2 border border-ink text-ink hover:bg-ink hover:text-white transition-colors"
          >
            ↓ Export CSV
          </button>
        )}
      </div>

      {leads.length === 0 ? (
        <p className="px-5 py-10 font-sans text-sm text-ink/40 text-center">No leads yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-line">
                {["Name", "Email", "Mobile", "Buyer Type", "Listing", "Notes", "Date"].map((h) => (
                  <th key={h} className="px-5 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-ink/50 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {leads.map((l) => (
                <tr key={l.id} className="border-b border-line last:border-0 hover:bg-cream/30 transition-colors">
                  <td className="px-5 py-3 font-sans text-sm text-ink">{l.full_name ?? "—"}</td>
                  <td className="px-5 py-3 font-sans text-sm text-ink/60">{l.email ?? "—"}</td>
                  <td className="px-5 py-3 font-sans text-sm text-ink/60">{l.mobile ?? "—"}</td>
                  <td className="px-5 py-3 font-sans text-sm text-ink/60">{l.buyer_type ?? "—"}</td>
                  <td className="px-5 py-3 font-sans text-sm text-ink/60">{l.development_name}</td>
                  <td className="px-5 py-3 font-sans text-sm text-ink/60 max-w-xs truncate">{l.notes ?? "—"}</td>
                  <td className="px-5 py-3 font-sans text-sm text-ink/60 whitespace-nowrap">
                    {l.created_at ? new Date(l.created_at).toLocaleDateString("en-AU") : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
