import { NextResponse } from "next/server";

import { getCurrentOnboarding } from "@/lib/onboarding/server";

export async function GET() {
  try {
    const onboarding = await getCurrentOnboarding();
    if (!onboarding) return NextResponse.json({ message: "Sign in required." }, { status: 401 });
    return NextResponse.json(onboarding);
  } catch {
    return NextResponse.json({ message: "Unable to load onboarding progress." }, { status: 503 });
  }
}
