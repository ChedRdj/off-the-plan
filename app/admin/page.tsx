import Link from "next/link";
import { Eye, Phone, Share2, MessageSquare } from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase/admin";
import DashboardTable from "@/components/admin/dashboard-table";
import ListingsTable from "@/components/admin/listings-table";

export default async function AdminDashboard() {
  const [
    { count: activeListings },
    { count: featuredListings },
    { count: enquiryCount },
  ] = await Promise.all([
    supabaseAdmin
      .from("developments")
      .select("*", { count: "exact", head: true })
      .eq("is_published", true),
    supabaseAdmin
      .from("developments")
      .select("*", { count: "exact", head: true })
      .eq("is_published", true)
      .eq("is_featured", true),
    supabaseAdmin.from("enquiries").select("*", { count: "exact", head: true }),
  ]);

  const topStats = [
    { label: "Total Views",     value: "—",                    icon: Eye },
    { label: "Total Enquiries", value: enquiryCount ?? 0,       icon: MessageSquare },
    { label: "Phone Clicks",    value: "—",                    icon: Phone },
    { label: "Total Share",     value: "—",                    icon: Share2 },
  ];

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";

  return (
    <div>
      {/* Greeting bar */}
      <div className="px-6 py-4 mb-6 rounded" style={{ background: "#1a2340" }}>
        <h1 className="text-white font-semibold text-lg">{greeting}, Admin</h1>
      </div>

      {/* Top stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {topStats.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="bg-white border border-gray-200 rounded px-5 py-4 flex items-center gap-4"
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: "#1a2340" }}
              >
                <Icon size={18} className="text-white" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-widest leading-tight">
                  {s.label}
                </p>
                <p className="text-xl font-bold text-gray-800">{s.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Active / Featured Listings */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-white border border-gray-200 rounded p-6 text-center">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">
            Active Listings
          </p>
          <p className="font-bold mb-3" style={{ fontSize: 48, color: "#e85d26" }}>
            {activeListings ?? 0}
          </p>
          <Link
            href="/admin/listings"
            className="text-xs font-bold uppercase tracking-widest text-orange-500 hover:underline"
          >
            VIEW LISTING »
          </Link>
        </div>
        <div className="bg-white border border-gray-200 rounded p-6 text-center">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">
            Featured Listings
          </p>
          <p className="font-bold mb-3" style={{ fontSize: 48, color: "#e85d26" }}>
            {featuredListings ?? 0}
          </p>
          <Link
            href="/admin/listings?filter=featured"
            className="text-xs font-bold uppercase tracking-widest text-orange-500 hover:underline"
          >
            VIEW LISTING »
          </Link>
        </div>
      </div>

      {/* Manage Your Listing */}
      <div className="bg-white border border-gray-200 rounded p-4 flex items-center justify-between mb-6">
        <p className="font-bold text-sm uppercase tracking-widest" style={{ color: "#1a2340" }}>
          Manage Your Listing
        </p>
        <Link
          href="/admin/listings"
          className="px-4 py-1.5 text-xs font-bold uppercase tracking-widest border border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white transition-colors"
        >
          VIEW
        </Link>
      </div>

      {/* Property Alert Sign Ups */}
      <DashboardTable
        title="Property Alert Sign Ups"
        pdfTitle="Property Alert Sign Ups"
        apiPath="/api/admin/property-alerts"
        columns={[
          { key: "full_name",     label: "Enquiry Name" },
          { key: "email",         label: "Email Address" },
          { key: "phone",         label: "Contact Number" },
          { key: "interest_type", label: "Category" },
          { key: "state",         label: "State" },
          { key: "occupation",    label: "Describe Yourself" },
          { key: "created_at",    label: "Date" },
        ]}
      />

      {/* Media Kit Enquiries */}
      <DashboardTable
        title="Media Kit Enquiries"
        pdfTitle="Media Kit Enquiries"
        apiPath="/api/admin/media-kit"
        columns={[
          { key: "full_name",  label: "Enquiry Name" },
          { key: "email",      label: "Email Address" },
          { key: "phone",      label: "Contact Number" },
          { key: "category",   label: "Category" },
          { key: "state",      label: "State" },
          { key: "created_at", label: "Date" },
        ]}
      />

      {/* Leads */}
      <DashboardTable
        title="Leads"
        pdfTitle="Leads"
        apiPath="/api/admin/leads"
        columns={[
          { key: "contact_name",    label: "Enquiry Name" },
          { key: "company",         label: "Agency" },
          { key: "phone",           label: "Contact Number" },
          { key: "development_name",label: "Project Name" },
          { key: "email",           label: "Email Address" },
          { key: "created_at",      label: "Date" },
        ]}
      />

      {/* Listings table */}
      <ListingsTable />
    </div>
  );
}
