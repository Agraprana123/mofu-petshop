"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "@/server/actions/auth.action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PawPrint, Loader2 } from "lucide-react";

export function LoginForm() {
  const [state, formAction, isPending] = useActionState<LoginState, FormData>(
    loginAction,
    {}
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA] px-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#87482D]/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#87482D]/5 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-md relative z-10 border-zinc-200/80 bg-white shadow-xl shadow-zinc-900/5 rounded-2xl">
        <CardHeader className="text-center pb-2 pt-8">
          {/* Logo */}
          <div className="mx-auto mb-4 w-16 h-16 bg-[#87482D] rounded-2xl flex items-center justify-center shadow-lg shadow-[#87482D]/25">
            <PawPrint className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-zinc-900 tracking-tight">
            MOFU Petshop & Care
          </CardTitle>
          <CardDescription className="text-zinc-500 mt-1">
            Masuk ke sistem untuk melanjutkan
          </CardDescription>
        </CardHeader>

        <CardContent className="p-8 pt-4">
          {/* Error message */}
          {state.error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm text-center font-medium">
              {state.error}
            </div>
          )}

          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-zinc-700 font-medium">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="admin@mofu.com"
                required
                autoComplete="email"
                className="bg-white border-zinc-300 text-zinc-900 placeholder:text-zinc-400 focus:ring-[#87482D]/20 focus:border-[#87482D] h-11 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-zinc-700 font-medium">
                Password
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="bg-white border-zinc-300 text-zinc-900 placeholder:text-zinc-400 focus:ring-[#87482D]/20 focus:border-[#87482D] h-11 rounded-xl"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-11 text-base bg-[#87482D] hover:bg-[#6d3a24] text-white shadow-sm shadow-[#87482D]/25 rounded-xl font-semibold mt-2"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Masuk...
                </>
              ) : (
                "Masuk"
              )}
            </Button>
          </form>

          <p className="text-center text-xs text-zinc-400 mt-6">
            © 2024 MOFU Petshop & Care. All rights reserved.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
