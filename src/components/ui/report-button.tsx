"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { useAuthStore } from "@/store/auth-store";
import { submitReport } from "@/lib/supabase/queries";
import { Flag, CheckCircle } from "lucide-react";

interface ReportButtonProps {
  targetType: "story" | "comment" | "profile";
  targetId: string;
}

const REPORT_REASONS = [
  { value: "inappropriate", label: "Inappropriate content" },
  { value: "copyright", label: "Copyright infringement" },
  { value: "spam", label: "Spam or misleading" },
  { value: "harassment", label: "Harassment or bullying" },
  { value: "underage", label: "Depicts minors" },
  { value: "nonconsent", label: "Non-consensual real-person content" },
  { value: "other", label: "Other" },
];

export function ReportButton({ targetType, targetId }: ReportButtonProps) {
  const { user, isAuthenticated } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("inappropriate");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!user || !reason) return;
    setSubmitting(true);
    setError("");
    try {
      const fullReason = details ? `${reason}: ${details}` : reason;
      await submitReport({
        reporter_id: user.id,
        target_type: targetType,
        target_id: targetId,
        reason: fullReason,
      });
      setSubmitted(true);
      setTimeout(() => {
        setOpen(false);
        setSubmitted(false);
        setDetails("");
        setReason("inappropriate");
      }, 2000);
    } catch {
      setError("Failed to submit report. Please try again.");
    }
    setSubmitting(false);
  }

  if (!isAuthenticated) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-muted hover:text-danger transition-colors cursor-pointer p-1"
        title="Report"
      >
        <Flag size={14} />
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title={`Report ${targetType}`} size="sm">
        {submitted ? (
          <div className="text-center py-8 space-y-2">
            <CheckCircle size={32} className="text-success mx-auto" />
            <p className="font-medium">Report submitted</p>
            <p className="text-sm text-muted">Thank you. We will review this content.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <Select
              id="report-reason"
              label="Reason"
              options={REPORT_REASONS}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <Textarea
              id="report-details"
              label="Additional details (optional)"
              placeholder="Provide any additional context..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={3}
            />
            {error && <p className="text-sm text-danger">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleSubmit}
                loading={submitting}
                disabled={!reason}
              >
                Submit Report
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
