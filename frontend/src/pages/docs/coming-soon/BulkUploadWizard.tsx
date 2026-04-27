import { Upload } from "lucide-react";

import { CodeBlock } from "../_shared";
import { useDocsContent } from "../content";
import ComingSoon from "./_ComingSoon";

const BulkUploadWizard = () => {
  const page = useDocsContent().pages.comingSoon.bulkUploadWizard;

  return (
    <ComingSoon
      title={page.title}
      tagline={page.tagline}
      intro={page.intro}
      Icon={Upload}
      features={[...page.features]}
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
  "batch_id": "01HN...",
  "rows_total": 812,
  "rows_valid": 807,
  "rows_errored": 5,
  "errors": [
    { "row": 42, "code": "DUPLICATE_PRN", "prn": "BT21CSE042" },
    ...
  ],
  "next": "POST /api/v1/degrees/bulk/{batch_id}/commit"
}`}
        />
      }
    />
  );
};

export default BulkUploadWizard;
