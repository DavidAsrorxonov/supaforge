import { MembersClient } from "@/components/members-client";
import { retrieveMembersFromApi } from "@/features/members/members-helpers.server";
import { retrieveOrgBySlugFromApi } from "@/features/orgs/org-helpers.server";

export default async function MembersSettingsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [org, members] = await Promise.all([
    retrieveOrgBySlugFromApi(slug),
    retrieveMembersFromApi(slug),
  ]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-medium">Members</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage who has access to {org.name}
        </p>
      </div>
      <MembersClient slug={slug} members={members} currentUserRole={org.role} />
    </div>
  );
}
