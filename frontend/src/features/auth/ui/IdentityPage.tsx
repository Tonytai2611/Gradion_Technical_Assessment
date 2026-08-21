import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../../shared/ui/Button";
import { StatusToast } from "../../../shared/ui/StatusToast";
import { useSession, useSignIn } from "../hooks/useSession";

export function IdentityPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const { data: session, isLoading } = useSession();
  const signIn = useSignIn();
  const navigate = useNavigate();

  useEffect(() => {
    if (session?.user) navigate("/projects", { replace: true });
  }, [navigate, session?.user]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (!name.trim() || !email.includes("@")) {
      setError("Enter your name and a valid email to continue.");
      return;
    }
    try {
      await signIn.mutateAsync({ name, email });
      navigate("/projects");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not sign in.");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f8f8f8] px-6">
      <form className="w-full max-w-md rounded-lg bg-white p-8 shadow-sm" onSubmit={submit}>
        <div className="mb-8 text-center text-2xl font-black text-grad-orange">
          GRADION
          <span className="block text-[10px] lowercase leading-none">scaling business</span>
        </div>
        <h1 className="mb-2 text-center text-xl font-bold">Book Illustration Studio</h1>
        <p className="mb-6 text-center text-sm text-neutral-500">Enter your details to start or resume an illustration project.</p>
        <label className="mb-4 block">
          <span className="mb-1 block text-xs font-semibold">Full name *</span>
          <input className="gd-focus w-full rounded-md border border-grad-line bg-white px-3 py-3 text-sm" value={name} onChange={(event) => setName(event.target.value)} />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold">Email *</span>
          <input className="gd-focus w-full rounded-md border border-grad-line bg-white px-3 py-3 text-sm" value={email} onChange={(event) => setEmail(event.target.value)} type="email" />
        </label>
        {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
        <Button className="mt-6 w-full" disabled={signIn.isPending || isLoading}>
          {signIn.isPending ? "Signing in..." : "Continue ->"}
        </Button>
      </form>
      {(signIn.isPending || isLoading) && (
        <StatusToast
          title={signIn.isPending ? "Signing you in" : "Checking session"}
          description="Loading your workspace and projects."
        />
      )}
    </div>
  );
}
