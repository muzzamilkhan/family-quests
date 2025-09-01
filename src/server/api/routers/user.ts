import { z } from "zod";
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
      },
      orderBy: {
        points: "desc",
      },
    });
  }),
});