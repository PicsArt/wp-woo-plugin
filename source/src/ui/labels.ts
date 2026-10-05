import type { JobStatus } from "../../shared/types";
export function friendlyModel(value: string) {
  return value
    .replace(/^.*\//, "")
    .replace(/[_-]+/g, " ")
    .replace(/\b(image to video|i2v)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
const statuses: Record<JobStatus, string> = {
  QUEUED: "Queued",
  SUBMITTING: "Starting generation",
  GENERATING: "Generating video",
  PERSISTING: "Saving result",
  REVIEW: "Ready",
  ACCEPTED: "Accepted",
  REJECTED: "Discarded",
  IMPORTING: "Copying to WordPress",
  SAVED: "Saved in WordPress",
  ATTACHING: "Adding to product",
  ATTACHED: "Added to product",
  STOPPED: "Stopped",
  UNKNOWN_SUBMISSION: "Submission needs checking",
  RECONCILIATION_REQUIRED: "Needs attention",
  ORPHANED_SPEND: "Charge needs checking",
  IMPORT_UNKNOWN: "WordPress copy needs checking",
};
export const statusLabel = (status: JobStatus) => statuses[status];
