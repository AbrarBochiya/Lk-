"use client";

import { useActionState } from "react";
import { ArrowRight, LockKeyhole, Mail } from "lucide-react";
import { loginAction, type LoginState } from "@/app/actions/auth";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, initialState);
  return <form action={action} className="mt-8 space-y-5">
    <div><label className="mb-2 block text-sm font-semibold" htmlFor="email">Email address</label>
      <div className="relative"><Mail aria-hidden className="absolute left-4 top-3.5 size-5 text-[#758179]" />
        <input className="input pl-12" id="email" name="email" type="email" autoComplete="email" inputMode="email" required placeholder="owner@business.com" /></div></div>
    <div><div className="mb-2 flex items-center justify-between"><label className="text-sm font-semibold" htmlFor="password">Password</label><span className="text-xs text-[#69756e]">Secure account access</span></div>
      <div className="relative"><LockKeyhole aria-hidden className="absolute left-4 top-3.5 size-5 text-[#758179]" />
        <input className="input pl-12" id="password" name="password" type="password" autoComplete="current-password" required minLength={8} placeholder="Enter your password" /></div></div>
    {state.error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">{state.error}</p>}
    <button disabled={pending} className="button-primary flex w-full items-center justify-center gap-2 disabled:opacity-60" type="submit">
      {pending ? "Signing in…" : "Sign in securely"}<ArrowRight aria-hidden className="size-4" />
    </button>
  </form>;
}
