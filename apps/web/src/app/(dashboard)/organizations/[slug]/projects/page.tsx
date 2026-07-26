import { Database, Plus } from "lucide-react";
// import { Button } from "@/components/ui/button";
import { retrieveOrgBySlugFromApi } from "@/features/orgs/org-helpers.server";
import { retrieveProjectsFromApi } from "@/features/projects/project-helpers.server";
import { ORG_ROLES } from "@supaforge/constants";
import { CreateProjectModal } from "@/components/create-project-modal";
import Link from "next/link";

export default async function ProjectsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const [org, projects] = await Promise.all([
    retrieveOrgBySlugFromApi(slug),
    retrieveProjectsFromApi(slug),
  ]);

  const isAdmin = org.role === ORG_ROLES.ADMIN;
  // const org = await retrieveOrgBySlugFromApi(slug);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-medium">Projects</h1>
        {isAdmin && <CreateProjectModal slug={slug} />}
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-border rounded-xl">
          <p className="text-muted-foreground text-sm">
            No projects yet in {org.name}
          </p>
          <p className="text-muted-foreground text-xs mt-1">
            Create your first project to get started
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((pr) => (
            <Link
              key={pr.id}
              href={`/organizations/${slug}/${pr.slug}/database`}
              className="flex items-center gap-4 p-5 border border-border bg-background hover:bg-accent transition-colors"
            >
              <div className="w-10 bg-muted flex items-center justify-center shrink-0">
                <Database size={18} className="text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">{pr.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  {pr.projectUrl}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
