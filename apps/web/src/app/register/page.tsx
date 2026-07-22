"use client";

import * as React from "react";
import { z } from "zod";
import { registerSchema } from "@/features/auth/client.schema";
import { authAction } from "@/features/auth/actions";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AUTH_INTENT } from "@/features/auth/constants";
import { Google } from "@/components/icons/google";
import { GitHub } from "@/components/icons/github";
import Link from "next/link";

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [state, formAction, isPending] = React.useActionState(authAction, {});

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 px-4 py-12">
      <Card className="w-full max-w-md shadow-sm">
        <CardHeader>
          <CardTitle>Create an account</CardTitle>
          <CardDescription>
            Start building with{" "}
            <span className="font-bold text-primary">Supaforge</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {state.error && (
            <div className="bg-destructive/10 text-destructive text-sm px-4 py-3 mb-4"></div>
          )}

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
                    <FieldLabel htmlFor="register-name">Name</FieldLabel>
                    <Input
                      {...field}
                      id="register-name"
                      type="text"
                      autoComplete="name"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="email"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="register-email">Email</FieldLabel>
                    <Input
                      {...field}
                      id="register-email"
                      type="email"
                      autoComplete="email"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="password"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="register-password">
                      Password
                    </FieldLabel>
                    <Input
                      {...field}
                      id="register-password"
                      type="password"
                      autoComplete="current-password"
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
              value={AUTH_INTENT.REGISTER}
              disabled={isPending}
              size="lg"
              className="w-full"
            >
              {isPending ? "Setting up things for you..." : "Create Account"}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs text-muted-foreground bg-card px-2">
              or continue with
            </div>
          </div>

          <div className="space-y-3">
            <Button variant="outline" size="lg" className="w-full" asChild>
              <a
                href={`${process.env.NEXT_PUBLIC_API_URL}/auth/google`}
                className="inline-flex items-center justify-center gap-2"
              >
                <Google />
                Continue with Google
              </a>
            </Button>

            <Button variant="outline" size="lg" className="w-full" asChild>
              <a
                href={`${process.env.NEXT_PUBLIC_API_URL}/auth/github`}
                className="inline-flex items-center justify-center gap-2"
              >
                <GitHub />
                Continue with GitHub
              </a>
            </Button>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account for{" "}
            <span className="font-bold text-primary">Supaforge</span>?{" "}
            <Link
              href="/login"
              className="font-medium text-muted-foreground hover:underline"
            >
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
