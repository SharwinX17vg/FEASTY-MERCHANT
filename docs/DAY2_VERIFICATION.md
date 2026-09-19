# Day 2 verification and onboarding

Onboarding is resumable across the business type, business details, branch,
and verification screens. Business and branch records are written through
authenticated route handlers and are scoped to the signed-in user's active
organization membership.

Verification document storage uses the private `verification-documents`
bucket and is capped at 10 MB by the database model, bucket configuration, and
server-side validation. Accepted files are PDF, JPG/JPEG, PNG, and WEBP.
Uploads are written under an organization/business/request/generated-object
path; original filenames are metadata only.

The upload route verifies the authenticated user's organization membership and
the business/request relationship server-side. It validates the filename,
extension, MIME type, size, and file signature before upload. If the database
record cannot be written after storage succeeds, it removes the storage object.
The browser receives no public URL.

## Validation status

**Local code validation:** pure file/path tests and the application build,
lint, typecheck, and deterministic tests can be run locally.

**Real Supabase verification:** this workspace is not connected to a Supabase
project, so live private-bucket access, Storage RLS, signed URLs, and cleanup
behavior have not been executed against Supabase.

If migrations are not applied, create a bucket named `verification-documents`
in the Supabase Dashboard with Public bucket disabled, a 10 MB file limit, and
the allowed MIME types listed above. Prefer applying the migration so the
bucket and policies remain reproducible.
