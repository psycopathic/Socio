"use server";

import prisma from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";
import { get } from "http";
import { revalidatePath } from "next/cache";

export async function syncUser() {
  try {
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user) return;

    const existingUser = await prisma.user.findUnique({
      where: {
        clerkId: userId,
      },
    });
    if (existingUser) return existingUser;
    // console.log("hi")
    const dbUser = await prisma.user.create({
      data: {
        clerkId: userId,
        name: `${user.firstName || ""} ${user.lastName || ""}`,
        username:
          user.username ?? user.emailAddresses[0].emailAddress.split("@")[0], //nullable
        email: user.emailAddresses[0].emailAddress,
        image: user.imageUrl,
      },
    });
    return dbUser;
  } catch (error) {
    console.log("Error in syncUser", error);
  }
}

export async function getUserById(clerkId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: {
        clerkId,
      },
      include: {
        _count: {
          select: {
            following: true,
            followers: true,
            post: true,
          },
        },
      },
    });
    return user;
  } catch (error) {
    console.log("Error in getUserById", error);
  }
}

export async function getDbUserId() {
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error("UnAuthenticated");
  const user = await getUserById(clerkId);
  if (!user) throw new Error("User not found");
  return user.id;
}

export async function getRandomUser() {
  try {
    const userId = await getDbUserId();
    if (!userId) return [];
    const randomUsers = await prisma.user.findMany({
      where: {
        AND: [
          { NOT: { id: userId } },
          {
            NOT: {
              followers: {
                some: {
                  followerId: userId,
                },
              },
            },
          },
        ],
      },
      select: {
        id: true,
        name: true,
        username: true,
        image: true,
        _count: {
          select: {
            followers: true,
          },
        },
      },
      take: 3,
    });
    return randomUsers;
  } catch (error) {
    console.log("Error fetching random users", error);
    return [];
  }
}

export async function ToggleFollow(TargetId: string) {
  try {
    const userId = await getDbUserId();
    console.log(userId);
    if (!userId) return { success: false, error: "User not found" };
    if (userId === TargetId) throw new Error("You can't follow yourself");

    const existingFollower = await prisma.follows.findUnique({
      where: {
        followerId_followingId: {
          //this is the composite key of follower and following
          followerId: userId,
          followingId: TargetId,
        },
      },
    });
    if (existingFollower) {
      //unfollow
      await prisma.follows.delete({
        where: {
          followerId_followingId: {
            followerId: userId,
            followingId: TargetId,
          },
        },
      });
    } else {
      //followe
      await prisma.$transaction([
        prisma.follows.create({
          data: {
            followerId: userId,
            followingId: TargetId,
          },
        }),
        prisma.notification.create({
          data: {
            type: "FOLLOW",
            userId: TargetId,
            creatorId: userId,
          },
        }),
      ]);
    }
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.log(`Error in ToggleFollow: ${error}`);
    return { success: false, error: "Error in ToggleFollow" };
  }
}
