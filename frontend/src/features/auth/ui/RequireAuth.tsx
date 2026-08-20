import type { PropsWithChildren } from "react";
import { Navigate } from "react-router-dom";
import { useSession } from "../hooks/useSession";

export function RequireAuth({ children }: PropsWithChildren) {
  const { data, isLoading } = useSession();

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-[#f8f8f8] text-sm text-neutral-500">Loading...</div>;
  }

  if (!data?.user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
