import type { PropsWithChildren } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSession, useSignOut } from "../../features/auth/hooks/useSession";
import { StatusToast } from "./StatusToast";

export function Shell({ children }: PropsWithChildren) {
  const { data } = useSession();
  const signOut = useSignOut();
  const navigate = useNavigate();
  const user = data?.user;
  const initials = user?.name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase() ?? "?";

  async function handleSignOut() {
    await signOut.mutateAsync();
    navigate("/", { replace: true });
  }

  return (
    <div className="min-h-screen bg-[#f8f8f8]">
      <header className="border-b border-[#e8e2e0] bg-white">
        <div className="mx-auto flex max-w-6xl items-center gap-8 px-6 py-4">
          <button className="text-left text-xl font-black tracking-wide text-grad-orange" onClick={() => navigate("/projects")}>
            GRADION
            <span className="block text-[9px] font-bold lowercase leading-none text-grad-orange">scaling business</span>
          </button>
          <Link className="text-sm font-semibold text-grad-ink" to="/projects">Projects</Link>
          {user && (
            <div className="ml-auto flex items-center gap-3 text-sm text-grad-body">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-grad-orange text-xs font-bold text-white">{initials}</span>
              <span>{user.name}</span>
              <button className="text-xs text-neutral-500 hover:text-grad-orange disabled:cursor-not-allowed disabled:opacity-60" disabled={signOut.isPending} onClick={handleSignOut}>
                {signOut.isPending ? "Signing out..." : "Sign out"}
              </button>
            </div>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-12">{children}</main>
      {signOut.isPending && <StatusToast title="Signing out" description="Clearing the session and returning to the identity screen." />}
    </div>
  );
}
