import { z } from "zod";
import { put } from "@vercel/blob";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";

export const userRouter = createTRPCRouter({
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      include: {
        family: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    return user;
  }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).optional(),
        image: z.string().url().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: {
          ...(input.name && { name: input.name }),
          ...(input.image && { image: input.image }),
        },
      });
    }),

  updateUserName: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        name: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const currentUser = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { familyId: true, role: true },
      });

      if (!currentUser?.familyId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User is not part of a family",
        });
      }

      const targetUser = await ctx.db.user.findUnique({
        where: { id: input.userId },
        select: { familyId: true, role: true },
      });

      if (!targetUser || targetUser.familyId !== currentUser.familyId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Target user not found in your family",
        });
      }

      // Parents can update anyone's name, kids can only update their own
      if (currentUser.role !== "PARENT" && input.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Children can only update their own name",
        });
      }

      return await ctx.db.user.update({
        where: { id: input.userId },
        data: { name: input.name },
      });
    }),

  uploadProfileImage: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        filename: z.string(),
        contentType: z.string(),
        file: z.string(), // base64 encoded file data
      })
    )
    .mutation(async ({ ctx, input }) => {
      const currentUser = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { familyId: true, role: true },
      });

      if (!currentUser?.familyId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User is not part of a family",
        });
      }

      const targetUser = await ctx.db.user.findUnique({
        where: { id: input.userId },
        select: { familyId: true, role: true },
      });

      if (!targetUser || targetUser.familyId !== currentUser.familyId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Target user not found in your family",
        });
      }

      // Parents can update anyone's profile image, kids can only update their own
      if (currentUser.role !== "PARENT" && input.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Children can only update their own profile image",
        });
      }

      // Convert base64 to buffer
      const buffer = Buffer.from(input.file, 'base64');

      // Upload to Vercel Blob
      const blob = await put(input.filename, buffer, {
        access: 'public',
        contentType: input.contentType,
      });

      // Update user's image URL in database
      const updatedUser = await ctx.db.user.update({
        where: { id: input.userId },
        data: { image: blob.url },
      });

      return { url: blob.url, user: updatedUser };
    }),

  loginWithPermalink: publicProcedure
    .input(z.object({ permalink: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { permalink: input.permalink },
        include: {
          family: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!user || user.role !== "CHILD") {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invalid permalink",
        });
      }

      return user;
    }),

  getPointsLeaderboard: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: { familyId: true },
    });

    if (!user?.familyId) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User is not part of a family",
      });
    }

    return await ctx.db.user.findMany({
      where: {
        familyId: user.familyId,
        role: "CHILD",
      },
      select: {
        id: true,
        name: true,
        image: true,
        points: true,
        totalPoints: true,
      },
      orderBy: {
        totalPoints: "desc",
      },
    });
  }),
});