"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { projectsAction } from "@/features/projects/actions";
import { Controller, useForm } from "react-hook-form";
import { createProjectSchema } from "@/features/projects/client.schema";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { PROJECT_INTENT } from "@/features/projects/constants";

interface CreateProjectModalProps {
  slug: string;
}

type CreateProjectValues = z.infer<typeof createProjectSchema>;

export function CreateProjectModal({ slug }: CreateProjectModalProps) {
  const [open, setOpen] = React.useState(false);
  const boundAction = projectsAction.bind(null, { slug });
  const [state, formAction, isPending] = React.useActionState(boundAction, {});

  const form = useForm<CreateProjectValues>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: { name: "" },
  });

  if (state.success && open) {
    setOpen(false);
    form.reset();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus size={14} className="mr-1.5" />
          New project
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a new project</DialogTitle>
          <DialogDescription>
            Each project gets its own database schema, URL, and API keys.
          </DialogDescription>
        </DialogHeader>

        <form
          action={formAction}
          noValidate
          onSubmitCapture={async (e) => {
            const ok = await form.trigger(undefined, { shouldFocus: true });
            if (!ok) e.preventDefault();
          }}
          className="space-y-4"
        >
          <FieldGroup>
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="project-name">Project name</FieldLabel>
                  <Input
                    {...field}
                    id="project-name"
                    placeholder="my-project"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              name="intent"
              value={PROJECT_INTENT.CREATE}
              disabled={isPending}
            >
              {isPending ? "Creating..." : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
