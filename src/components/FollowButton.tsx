"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Loader2Icon } from "lucide-react";
import { ToggleFollow } from "@/actions/user.action";
import toast from "react-hot-toast";
export default function followButton({ userId }: { userId: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const handleFollow = async () => {
    setIsLoading(true);
    try {
      await ToggleFollow(userId);
      toast.success("Followed successfully");
    } catch (error) {
      toast.error("Error following user");
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <>
      <Button
        size={"sm"}
        variant={"secondary"}
        onClick={handleFollow}
        disabled={isLoading}
        className="w-20"
      >
        {isLoading ? <Loader2Icon className="size-4 animate-spin" /> : "Follow"}
      </Button>
    </>
  );
}
