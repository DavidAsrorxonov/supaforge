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

  console.log("PROJECTS", projects);
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/organizations/${slug}/${project.slug}/database`}
              className="group flex min-w-0 items-center gap-4 border border-border bg-card p-5 transition-colors hover:bg-accent"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                <Database
                  size={18}
                  className="text-muted-foreground transition-colors group-hover:text-foreground"
                />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{project.name}</p>

                <p className="mt-1 truncate text-xs text-muted-foreground">
                  {project.slug || "No project slug"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
