"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { OnboardingProgress } from "@/components/onboarding/OnboardingProgress";
import { Card, SecondaryButton } from "@/components/ui";
import { PrimaryButton } from "@/components/ui";

export default function VerificationPage() {
  const router = useRouter();
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [requestId, setRequestId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState("");
  const [uploadOperationId, setUploadOperationId] = useState("");

  useEffect(() => {
    fetch("/api/onboarding/state")
      .then(async (response) => {
        if (!response.ok) return;
        const result = (await response.json()) as { state?: string; verification?: { id?: string; status: string } };
        if (result.state === "NOT_STARTED" || result.state === "BUSINESS_TYPE_SELECTED") router.push("/register/business");
        else if (result.state === "BUSINESS_CREATED") router.push("/register/branch");
        else if (result.state === "COMPLETED") router.push("/dashboard");
        else if (result.verification) {
          setStatus(result.verification.status);
          setRequestId(result.verification.id ?? "");
        }
      })
      .catch(() => setError("Unable to load saved onboarding progress."));
  }, [router]);

  async function submitVerification() {
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/onboarding/verification", { method: "POST" });
      const result = (await response.json()) as { id?: string; status?: string; message?: string };
      if (!response.ok) setError(result.message ?? "Unable to submit verification.");
      else {
        setStatus(result.status ?? "submitted");
        setRequestId(result.id ?? "");
      }
    } catch {
      setError("Unable to reach the verification service.");
    } finally {
      setPending(false);
    }

  }

  async function uploadDocument() {
    if (!file || !requestId) return;
    setUploading(true);
    setError("");
    setUploaded("");
    try {
      const formData = new FormData();
      formData.set("verificationRequestId", requestId);
      formData.set("file", file);
      const response = await fetch("/api/onboarding/verification/documents", {
        method: "POST",
        body: formData,
        headers: { "Idempotency-Key": uploadOperationId },
      });
      const result = (await response.json()) as { original_filename?: string; message?: string };
      if (!response.ok) setError(result.message ?? "Unable to upload the document.");
      else {
        setUploaded(result.original_filename ?? file.name);
        setFile(null);
      }
    } catch {
      setError("Unable to reach the document upload service.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-16">
      <Card className="w-full max-w-xl p-6 text-center sm:p-9">
        <OnboardingProgress currentStep={4} />
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">Verification</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">
          {status ? "Verification is in progress" : "Your profile is ready for verification"}
        </h1>
        <p className="mt-4 text-sm leading-6 text-muted">
          {status
            ? "Your verification request has been submitted and will be reviewed."
            : "Submit your business for verification. You can attach a PDF, JPG, PNG, or WEBP document up to 10 MB."}
        </p>
        {error ? <p className="mt-5 text-sm text-red-300" role="alert">{error}</p> : null}
        {!status ? <PrimaryButton className="mt-8" disabled={pending} onClick={submitVerification} type="button">{pending ? "Submitting…" : "Submit for verification"}</PrimaryButton> : null}
        {status && requestId ? (
          <div className="mt-8 text-left">
            <label className="text-sm font-medium text-white" htmlFor="verification-document">Verification document</label>
            <input
              accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
              className="mt-2 block w-full rounded-xl border border-white/15 bg-white/5 px-3 py-3 text-sm text-muted outline-none focus:border-accent focus:ring-2 focus:ring-accent/40"
              id="verification-document"
              onChange={(event) => {
                const selectedFile = event.target.files?.[0] ?? null;
                setFile(selectedFile);
                setUploadOperationId(selectedFile ? crypto.randomUUID() : "");
              }}
              type="file"
            />
            <p className="mt-2 text-xs text-muted">PDF, JPG, PNG, or WEBP. Maximum 10 MB.</p>
            {uploaded ? <p className="mt-3 text-sm text-emerald-300" role="status">Uploaded: {uploaded}</p> : null}
            <PrimaryButton className="mt-4" disabled={!file || uploading} onClick={uploadDocument} type="button">
              {uploading ? "Uploading…" : "Upload document"}
            </PrimaryButton>
          </div>
        ) : null}
        <Link className="mt-8 inline-flex" href="/dashboard">
          <SecondaryButton>Go to dashboard</SecondaryButton>
        </Link>
      </Card>
    </main>
  );
}
