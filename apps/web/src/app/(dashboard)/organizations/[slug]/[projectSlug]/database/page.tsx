import { TableEditorClient } from "@/components/table-editor-client";
import {
  retrieveProjectDbSchema,
  retrieveTablesFromApi,
} from "@/features/table-editor/table-editor-helpers.server";

export default async function DatabasePage({
  params,
}: {
  params: Promise<{ slug: string; projectSlug: string }>;
}) {
  const { slug, projectSlug } = await params;

  const [tables, dbSchema] = await Promise.all([
    retrieveTablesFromApi(slug, projectSlug),
    retrieveProjectDbSchema(slug, projectSlug),
  ]);

  return (
    <div className="-mx-6 -mt-6 pmb-6 flex h-[calc(100svh-3rem)] min-h-0 flex-col overflow-hidden">
      <TableEditorClient
        orgSlug={slug}
        projectSlug={projectSlug}
        initialTables={tables}
        dbSchema={dbSchema}
      />
    </div>
  );
}
