import { auth } from "@clerk/nextjs/server";
import { SignInButton } from "@clerk/nextjs";
import Link from "next/link";

export default async function Home() {
  const { userId } = await auth();

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center bg-background px-4">
      {userId ? (
        /* ── Authenticated State ── */
        <div className="flex flex-col items-center gap-6 text-center animate-in fade-in zoom-in duration-500">
          <div className="flex h-38 w-38 items-center justify-center rounded-3xl bg-white p-4 shadow-sm border border-slate-100">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground">
              Welcome back!
            </h1>
            <p className="mt-2 text-muted-foreground">
              You&apos;re signed in. Ready to manage your tasks?
            </p>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl bg-[#1C3384] px-8 py-3 text-base font-semibold text-white shadow-md transition-all hover:bg-[#1A2E75] hover:shadow-lg hover:-translate-y-0.5 active:scale-95"
          >
            Enter Workspace
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </Link>
        </div>
      ) : (
        /* ── Guest State ── */
        <div className="flex flex-col items-center gap-8 text-center max-w-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex h-32 w-32 items-center justify-center rounded-3xl bg-white p-5 shadow-sm border border-slate-100">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <div className="space-y-3">
            <h1 className="text-5xl font-extrabold tracking-tight text-foreground">
              MNM<span className="text-primary">SOLAR</span>
            </h1>
            <p className="text-xl font-medium text-muted-foreground">
              Internal Task Management Platform
            </p>
            <p className="text-sm text-muted-foreground/80 leading-relaxed">
              This is a secure workspace for MNMSOLAR employees. Please sign in
              with your company credentials to access your projects and tasks.
            </p>
          </div>

          <div className="flex flex-col items-center gap-3 w-full">
            <SignInButton mode="modal">
              <button className="inline-flex w-full max-w-xs items-center justify-center gap-2 rounded-xl bg-primary px-8 py-3 text-base font-semibold text-primary-foreground shadow-md transition-all hover:bg-primary/90 hover:shadow-lg hover:-translate-y-0.5 active:scale-95">
                Sign In to Continue
              </button>
            </SignInButton>
            <p className="text-xs text-muted-foreground">
              Access restricted to authorized MNMSOLAR personnel only.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
