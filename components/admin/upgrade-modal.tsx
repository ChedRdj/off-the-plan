"use client";

import { useState } from "react";
import { X } from "lucide-react";

interface Project {
  id: string;
  name: string;
}

interface UpgradeModalProps {
  upgradeType: string;
  projects: Project[];
  onClose: () => void;
}

export default function UpgradeModal({ upgradeType, projects, onClose }: UpgradeModalProps) {
  const today = new Date();
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1)
    .toISOString().split("T")[0].split("-").reverse().join("-");
  const lastOfMonth = new Date(today.getFullYear(), today.getMonth() + 2, 0)
    .toISOString().split("T")[0].split("-").reverse().join("-");

  const [projectId, setProjectId] = useState("");
  const [startDate, setStartDate] = useState(firstOfMonth);
  const [endDate, setEndDate] = useState(lastOfMonth);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/admin/upgrade-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, upgradeType, startDate, endDate }),
    });
    setLoading(false);
    setSubmitted(true);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg w-full max-w-sm shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-800">Request An Upgrade</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        {submitted ? (
          <div className="px-5 py-10 text-center">
            <p className="text-green-600 font-semibold text-sm mb-1">Request submitted!</p>
            <p className="text-gray-500 text-xs">We'll be in touch shortly.</p>
            <button
              onClick={onClose}
              className="mt-4 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white rounded"
              style={{ background: "#1a2340" }}
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-5 py-4 flex flex-col gap-4">
            {/* Project */}
            <div>
              <label className="block text-xs text-gray-600 mb-1">Project:</label>
              <select
                required
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-blue-400"
              >
                <option value="">— Select a project —</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* Upgrade Type — read only */}
            <div>
              <label className="block text-xs text-gray-600 mb-1">Upgrade Type:</label>
              <input
                type="text"
                readOnly
                value={upgradeType}
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm text-gray-500 bg-gray-50"
              />
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-xs text-gray-600 mb-1">Start Date:</label>
              <input
                type="text"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                placeholder="DD-MM-YYYY"
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm text-gray-700 bg-gray-50 focus:outline-none focus:border-blue-400"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-xs text-gray-600 mb-1">End Date:</label>
              <input
                type="text"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                placeholder="DD-MM-YYYY"
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm text-gray-700 bg-gray-50 focus:outline-none focus:border-blue-400"
              />
            </div>

            {/* Submit */}
            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 text-xs font-bold text-white rounded transition-opacity hover:opacity-80 disabled:opacity-50"
                style={{ background: "#4f6ef7" }}
              >
                {loading ? "Submitting…" : "Request An Upgrade"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
