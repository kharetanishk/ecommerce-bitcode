"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { toast } from "@/store/toast.store";

const REASONS = [
  { value: "WRONG_ITEM", label: "Wrong item received" },
  { value: "DAMAGED", label: "Item arrived damaged" },
  { value: "NOT_AS_DESCRIBED", label: "Not as described" },
  { value: "QUALITY_ISSUE", label: "Quality issue" },
  { value: "CHANGED_MIND", label: "Changed my mind" },
  { value: "OTHER", label: "Other reason" },
];

export function ReturnRequestSection({ orderId }: { orderId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [comments, setComments] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason) return;
    setLoading(true);

    try {
      await api.post("/api/returns", { orderId, reason, comments });
      setSubmitted(true);
      toast.success("Return request submitted successfully");
    } catch (err: any) {
      toast.error(err.message ?? "Failed to submit return request");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
        <p className="text-green-700 font-medium text-sm">
          Return request submitted
        </p>
        <p className="text-green-600 text-xs mt-1">
          Our team will review and get back to you within 24 hours.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="w-full text-sm text-gray-500 hover:text-gray-700 underline transition-colors"
        >
          Request a return or exchange
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <h3 className="font-semibold text-gray-900">Return Request</h3>
          <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            Returns accepted within 7 days of delivery
          </p>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Reason</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-black"
            >
              <option value="">Select a reason</option>
              {REASONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">
              Additional comments{" "}
              <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="Describe the issue..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex-1 border border-gray-300 text-gray-700 rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!reason || loading}
              className="flex-1 bg-black text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {loading ? "Submitting..." : "Submit Request"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
