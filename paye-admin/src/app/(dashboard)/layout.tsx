import { redirect } from "next/navigation";
import { getAdminToken } from "@/lib/auth";
import { Sidebar } from "@/components/features/dashboard/Sidebar";
import { ImpersonationBanner } from "@/components/features/impersonation/ImpersonationBanner";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = await getAdminToken();
  if (!token) redirect("/login");

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <ImpersonationBanner />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}