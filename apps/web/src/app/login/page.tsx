"use client";

import * as React from "react";
import { z } from "zod";
import { loginSchema } from "@/features/auth/client.schema";
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

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [state, formAction, isPending] = React.useActionState(authAction, {});

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 px-4 py-12">
      <Card className="w-full max-w-md shadow-sm">
        <CardHeader>
          <CardTitle>Welcome back</CardTitle>
          <CardDescription>Sign in to your Supaforge account</CardDescription>
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
                name="email"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="login-email">Email</FieldLabel>
                    <Input
                      {...field}
                      id="login-email"
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
                    <FieldLabel htmlFor="login-password">Password</FieldLabel>
                    <Input
                      {...field}
                      id="login-password"
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
              value={AUTH_INTENT.LOGIN}
              disabled={isPending}
              size="lg"
              className="w-full"
            >
              {isPending ? "Signing in..." : "Sign in"}
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
            New to <span className="font-bold text-primary">Supaforge</span>?{" "}
            <Link
              href="/register"
              className="font-medium text-muted-foreground hover:underline"
            >
              Sign up
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
