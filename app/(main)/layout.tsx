import { requireUser } from "@/lib/auth";
import { AppNav } from "@/components/AppNav";

export const dynamic = "force-dynamic";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  return (
    <>
      <AppNav
        username={user.username}
        systemRoleKey={user.systemRoleKey}
        permissionKeys={Array.from(user.permissionKeys)}
      />
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </>
  );
}
