import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";

export const rewardRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        pointsCost: z.number().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { familyId: true, role: true },
      });

      if (!user?.familyId || user.role !== "PARENT") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only parents can create rewards",
        });
      }

      return await ctx.db.reward.create({
        data: {
          title: input.title,
          description: input.description,
          pointsCost: input.pointsCost,
          familyId: user.familyId,
        },
      });
    }),

  getAll: protectedProcedure.query(async ({ ctx }) => {
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

    return await ctx.db.reward.findMany({
      where: { familyId: user.familyId },
      include: {
        redemptions: {
          include: {
            user: {
              select: { id: true, name: true },
            },
          },
          orderBy: { redeemedAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }),

  redeem: protectedProcedure
    .input(z.object({ rewardId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { familyId: true, points: true, role: true },
      });

      if (!user?.familyId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User is not part of a family",
        });
      }

      const reward = await ctx.db.reward.findFirst({
        where: {
          id: input.rewardId,
          familyId: user.familyId,
        },
      });

      if (!reward) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Reward not found",
        });
      }

      if (user.points < reward.pointsCost) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Insufficient points",
        });
      }

      // Create redemption and deduct points
      const [redemption] = await Promise.all([
        ctx.db.rewardRedemption.create({
          data: {
            rewardId: input.rewardId,
            userId: ctx.session.user.id,
          },
          include: {
            reward: true,
            user: {
              select: { id: true, name: true },
            },
          },
        }),
        ctx.db.user.update({
          where: { id: ctx.session.user.id },
          data: {
            points: {
              decrement: reward.pointsCost,
            },
          },
        }),
      ]);

      return redemption;
    }),

  fulfill: protectedProcedure
    .input(z.object({ redemptionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { familyId: true, role: true },
      });

      if (!user?.familyId || user.role !== "PARENT") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only parents can fulfill rewards",
        });
      }

      const redemption = await ctx.db.rewardRedemption.findFirst({
        where: {
          id: input.redemptionId,
          reward: {
            familyId: user.familyId,
          },
        },
        include: {
          reward: true,
          user: true,
        },
      });

      if (!redemption) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Redemption not found",
        });
      }

      if (redemption.fulfilledAt) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Reward already fulfilled",
        });
      }

      return await ctx.db.rewardRedemption.update({
        where: { id: input.redemptionId },
        data: {
          fulfilledAt: new Date(),
        },
        include: {
          reward: true,
          user: {
            select: { id: true, name: true },
          },
        },
      });
    }),

  getPendingRedemptions: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: { familyId: true, role: true },
    });

    if (!user?.familyId || user.role !== "PARENT") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only parents can view pending redemptions",
      });
    }

    return await ctx.db.rewardRedemption.findMany({
      where: {
        fulfilledAt: null,
        reward: {
          familyId: user.familyId,
        },
      },
      include: {
        reward: true,
        user: {
          select: { id: true, name: true, image: true },
        },
      },
      orderBy: { redeemedAt: "desc" },
    });
  }),

  getMyRedemptions: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.rewardRedemption.findMany({
      where: {
        userId: ctx.session.user.id,
      },
      include: {
        reward: true,
      },
      orderBy: { redeemedAt: "desc" },
    });
  }),
});