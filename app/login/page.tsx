import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LoginForm } from "@/components/LoginForm";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900/60 p-8 shadow-xl shadow-black/40">
        <h1 className="text-center text-xl font-semibold text-white">
          RBAC Console
        </h1>
        <p className="mt-2 text-center text-sm text-zinc-500">
          Sign in with your local database account.
        </p>
        <div className="mt-8">
          <LoginForm />
        </div>
        <p className="mt-4 text-center text-xs">
          <Link href="/" className="text-amber-500/80 hover:text-amber-400">
            Home
          </Link>
        </p>
      </div>
    </div>
  );
}
