import { isAuthenticated } from "@/lib/auth";
import { SiteHeader } from "@/components/SiteHeader";
import { AdminLogin } from "@/components/AdminLogin";
import { AdminDashboard } from "@/components/AdminDashboard";

export const dynamic = "force-dynamic";

export const metadata = { title: "Gestion" };

export default async function AdminPage() {
  const authed = await isAuthenticated();

  return (
    <div className="min-h-screen">
      <SiteHeader subtitle="Espace de gestion" />
      <main className="mx-auto max-w-5xl px-5 py-8">
        {authed ? <AdminDashboard /> : <AdminLogin />}
      </main>
    </div>
  );
}
