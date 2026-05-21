import Link from 'next/link';

export default function AccessDeniedPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-6">🔒</div>
        <h1 className="text-2xl font-bold text-white mb-3">Access Denied</h1>
        <p className="text-zinc-400 mb-8 leading-relaxed">
          This Dropify instance is private. Your account is not on the allowlist.
          Contact the administrator if you believe this is a mistake.
        </p>
        <Link
          href="/login"
          className="btn-secondary inline-flex items-center gap-2"
        >
          ← Try a different account
        </Link>
      </div>
    </div>
  );
}
