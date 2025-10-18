// src/app/(auth)/signup/page.tsx
"use client";
import SignupForm from "@/components/auth/SignupForm";

export default function SignupPage() {
  return (
    <main className="flex justify-center items-center h-screen">
      <SignupForm />
    </main>
  );
}
