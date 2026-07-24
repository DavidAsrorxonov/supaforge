import { retrieveMyOrgFromApi } from "@/features/orgs/org-helpers.server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const orgs = await retrieveMyOrgFromApi();

  console.log("ORGANIZATIONS", orgs);

  if (orgs.length === 1) {
    redirect(`/organizations/${orgs[0].slug}/projects`);
  }

  redirect(`/organizations`);
}
