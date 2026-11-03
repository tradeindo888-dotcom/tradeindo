"use client";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/Button";

export function LogoutButton() {
  return (
    <Button variant="ghost" size="sm" onClick={() => signOut({ callbackUrl: "/" })}>
      Keluar
    </Button>
  );
}