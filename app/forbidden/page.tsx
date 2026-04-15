import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <main className="page">
      <section className="panel stack">
        <h1>Access denied</h1>
        <p className="muted">
          This workspace is restricted to admin users. Sign in with an admin account or return to login.
        </p>
        <div className="action-row">
          <Link className="button primary" href="/login">
            Go to login
          </Link>
        </div>
      </section>
    </main>
  );
}
