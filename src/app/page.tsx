"use client"
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { ModeToggle } from "@/components/ui/ModeToggle";

export default function Home() {
  return (
    <>
      <div className="m-4">
        <SignedOut>
          <SignInButton>
            <Button>Sign in</Button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <UserButton />
        </SignedIn>
         <ModeToggle/>
        <Button variant={"secondary"}>Click me</Button>
      </div>
    </>
  );
}
