import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "../../../templates/app-sidebar";
import { TopNav } from "../../../templates/top-nav";
import { retrieveTokenFromCookie } from "@/server-utils/utils";
import { retrieveMyOrgFromApi } from "@/features/orgs/org-helpers.server";

async function getCurrentUser() {
  const token = await retrieveTokenFromCookie();

  const payload = JSON.parse(
    Buffer.from(token.split(".")[1], "base64").toString(),
  );
  return { email: payload.email as string, name: null };
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [orgs, user] = await Promise.all([
    retrieveMyOrgFromApi(),
    getCurrentUser(),
  ]);

  return (
    <SidebarProvider>
      <AppSidebar orgs={orgs} user={user} />
      <SidebarInset>
        <TopNav />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
