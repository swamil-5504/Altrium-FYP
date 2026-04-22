import { Upload } from "lucide-react";

import { CodeBlock } from "../_shared";
import ComingSoon from "./_ComingSoon";

const BulkUploadWizard = () => (
  <ComingSoon
    title="Bulk Upload Wizard"
    tagline="Issue an entire graduating cohort in one guided import — CSV or XLSX in, queued submissions out."
    intro="Today, admins create submissions one at a time. The Bulk Upload Wizard will let a university upload a roster file, preview the parse with inline validation, fix any row-level errors in place, and kick off a queued batch that feeds the normal mint flow. Students still each get their own credential and SBT — just without the per-row grind."
    Icon={Upload}
    features={[
      "Drop-in support for XLSX, CSV, and Google Sheets exports.",
      "Live row-level validation: PRN format, duplicate detection, missing fields.",
      "Dry-run preview that renders a diff against existing students before anything is written.",
      "Idempotent batches — re-uploading the same file never double-creates a student.",
      "Progress dashboard with retry controls for rows that fail verification.",
      "Optional auto-approve to skip the review step for trusted, pre-verified rosters.",
    ]}
    plannedApi={
      <CodeBlock
        lang="http"
        code={`POST /api/v1/degrees/bulk
Authorization: Bearer <admin-jwt>
Content-Type: multipart/form-data

file=@cohort-2025.xlsx
dry_run=true

# Response
{
  "batch_id": "01HN…",
  "rows_total": 812,
  "rows_valid": 807,
  "rows_errored": 5,
  "errors": [
    { "row": 42, "code": "DUPLICATE_PRN", "prn": "BT21CSE042" },
    …
  ],
  "next": "POST /api/v1/degrees/bulk/{batch_id}/commit"
}`}
      />
    }
  />
);

export default BulkUploadWizard;
