# Day 2 verification and onboarding

Onboarding is resumable across the business type, business details, branch,
and verification screens. Business and branch records are written through
authenticated route handlers and are scoped to the signed-in user's active
organization membership.

Verification document storage is private and capped at 10 MB by the database
model and storage policy. The current UI stops at the verification handoff;
reviewer tooling and document upload UI remain future work and are not
represented as completed functionality.

