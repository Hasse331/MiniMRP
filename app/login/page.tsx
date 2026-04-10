"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getPostLoginRedirectPath } from "@/lib/auth/redirects";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser-client";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="page" style={{ maxWidth: 420, margin: "6rem auto" }}>
      <header className="page-header">
        <h1>MiniMRP Login</h1>
        <p>Sign in with your admin account to access the internal MRP workspace.</p>
      </header>

      <form
        className="panel"
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          const email = String(formData.get("email") ?? "").trim();
          const password = String(formData.get("password") ?? "");

          setError(null);

          startTransition(async () => {
            const supabase = createSupabaseBrowserClient();
            const { error: signInError } = await supabase.auth.signInWithPassword({
              email,
              password
            });

            if (signInError) {
              setError(signInError.message);
              return;
            }

            router.replace(getPostLoginRedirectPath(searchParams.get("next")));
            router.refresh();
          });
        }}
      >
        <label style={{ display: "grid", gap: 6, marginBottom: 16 }}>
          <span>Email</span>
          <input name="email" type="email" autoComplete="email" required />
        </label>

        <label style={{ display: "grid", gap: 6, marginBottom: 16 }}>
          <span>Password</span>
          <input name="password" type="password" autoComplete="current-password" required />
        </label>

        {error ? (
          <p style={{ color: "#b42318", marginBottom: 16 }}>{error}</p>
        ) : null}

        <button type="submit" disabled={isPending}>
          {isPending ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}
