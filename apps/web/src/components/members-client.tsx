"use client";

import * as React from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ORG_ROLES } from "@supaforge/constants";
import { OrgMemberWithUser, OrgRole } from "@supaforge/types";
import { membersAction } from "@/features/members/actions";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { inviteSchema } from "@/features/members/client.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { MEMBERS_INTENT } from "@/features/members/constants";
import { Badge } from "./ui/badge";

interface MembersClientProps {
  slug: string;
  members: OrgMemberWithUser[];
  currentUserRole: OrgRole;
}

export function MembersClient({
  slug,
  members,
  currentUserRole,
}: MembersClientProps) {
  const isAdmin = currentUserRole === ORG_ROLES.ADMIN;
  const boundAction = membersAction.bind(null, { slug });
  const [state, formAction, isPending] = React.useActionState(boundAction, {});

  const form = useForm<z.infer<typeof inviteSchema>>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: "" },
  });

  return (
    <div className="space-y-6">
      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Invite a member</CardTitle>
          </CardHeader>
          <CardContent>
            {state.error && (
              <p className="text-sm text-destructive mb-3">{state.error}</p>
            )}
            {state.success && (
              <p className="text-sm text-green-600 mb-3">{state.success}</p>
            )}
            <form
              action={formAction}
              noValidate
              onSubmitCapture={async (e) => {
                const ok = await form.trigger(undefined, { shouldFocus: true });
                if (!ok) e.preventDefault();
              }}
              className="flex gap-2"
            >
              <FieldGroup className="flex-1">
                <Controller
                  name="email"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <Input
                        {...field}
                        type="email"
                        placeholder="colleague@example.com"
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </FieldGroup>
              <Button
                type="submit"
                name="intent"
                value={MEMBERS_INTENT.INVITE}
                disabled={isPending}
              >
                Send invite
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {members.length} {members.length === 1 ? "member" : "members"}
          </CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-border">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
            >
              <div className="flex items-center gap-3">
                <Avatar className="size-8">
                  <AvatarFallback>
                    {(member.user?.name ?? member.user.email)
                      .charAt(0)
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">
                    {member.user?.name ?? "-"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {member.user?.email ?? "-"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isAdmin ? (
                  <form action={formAction}>
                    <Input type="hidden" name="memberId" value={member.id} />
                    <Select
                      name="role"
                      defaultValue={member.role}
                      onValueChange={(value) => {
                        const form = document.createElement("form");
                        //
                      }}
                    >
                      <SelectTrigger className="h-7 text-xs w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ORG_ROLES.ADMIN}>Admin</SelectItem>
                        <SelectItem value={ORG_ROLES.DEVELOPER}>
                          Developer
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      type="submit"
                      name="intent"
                      value={MEMBERS_INTENT.UPDATE_ROLE}
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs"
                      disabled={isPending}
                    >
                      Save
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs text-destructive hover:text-destructive"
                    >
                      Remove
                    </Button>
                  </form>
                ) : (
                  <Badge variant="secondary" className="capitalize">
                    {member.role}
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
