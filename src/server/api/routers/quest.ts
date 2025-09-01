import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";

export const questRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1),
        points: z.number().min(1),
        icon: z.string().optional(),
        frequency: z.enum(["daily", "weekly", "once"]).default("daily"),
        assignedUserIds: z.array(z.string()).optional(),
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
          message: "Only parents can create quests",
        });
      }

      const quest = await ctx.db.quest.create({
        data: {
          title: input.title,
          points: input.points,
          icon: input.icon,
          frequency: input.frequency,
          familyId: user.familyId,
          assignments: input.assignedUserIds?.length
            ? {
                create: input.assignedUserIds.map((userId) => ({
                  userId,
                })),
              }
            : undefined,
        },
        include: {
          assignments: {
            include: {
              user: {
                select: { id: true, name: true },
              },
            },
          },
        },
      });

      return quest;
    }),

  getAll: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: { familyId: true, role: true },
    });

    if (!user?.familyId) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User is not part of a family",
      });
    }

    return await ctx.db.quest.findMany({
      where: { familyId: user.familyId },
      include: {
        assignments: {
          include: {
            user: {
              select: { id: true, name: true, image: true },
            },
          },
        },
        completions: {
          include: {
            user: {
              select: { id: true, name: true },
            },
          },
          orderBy: { completedAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }),

  getMyQuests: protectedProcedure.query(async ({ ctx }) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return await ctx.db.quest.findMany({
      where: {
        assignments: {
          some: {
            userId: ctx.session.user.id,
          },
        },
      },
      include: {
        completions: {
          where: {
            userId: ctx.session.user.id,
            completedAt: {
              gte: today,
              lt: tomorrow,
            },
          },
          orderBy: { completedAt: "desc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "asc" },
    });
  }),

  complete: protectedProcedure
    .input(z.object({ questId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Check if quest exists and user is assigned
      const quest = await ctx.db.quest.findFirst({
        where: {
          id: input.questId,
          assignments: {
            some: {
              userId: ctx.session.user.id,
            },
          },
        },
      });

      if (!quest) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Quest not found or not assigned to user",
        });
      }

      // Check if already completed today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const existingCompletion = await ctx.db.questCompletion.findFirst({
        where: {
          questId: input.questId,
          userId: ctx.session.user.id,
          completedAt: {
            gte: today,
            lt: tomorrow,
          },
        },
      });

      if (existingCompletion) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Quest already completed today",
        });
      }

      return await ctx.db.questCompletion.create({
        data: {
          questId: input.questId,
          userId: ctx.session.user.id,
          status: "pending",
        },
        include: {
          quest: true,
          user: {
            select: { id: true, name: true },
          },
        },
      });
    }),

  approve: protectedProcedure
    .input(z.object({ completionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { familyId: true, role: true },
      });

      if (!user?.familyId || user.role !== "PARENT") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only parents can approve quests",
        });
      }

      const completion = await ctx.db.questCompletion.findFirst({
        where: {
          id: input.completionId,
          quest: {
            familyId: user.familyId,
          },
        },
        include: {
          quest: true,
          user: true,
        },
      });

      if (!completion) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Quest completion not found",
        });
      }

      if (completion.status !== "pending") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Quest completion already processed",
        });
      }

      // Update completion status and award points
      const [updatedCompletion] = await Promise.all([
        ctx.db.questCompletion.update({
          where: { id: input.completionId },
          data: {
            status: "approved",
            approvedAt: new Date(),
          },
          include: {
            quest: true,
            user: true,
          },
        }),
        ctx.db.user.update({
          where: { id: completion.userId },
          data: {
            points: {
              increment: completion.quest.points,
            },
          },
        }),
      ]);

      return updatedCompletion;
    }),

  reject: protectedProcedure
    .input(z.object({ completionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { familyId: true, role: true },
      });

      if (!user?.familyId || user.role !== "PARENT") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only parents can reject quests",
        });
      }

      const completion = await ctx.db.questCompletion.findFirst({
        where: {
          id: input.completionId,
          quest: {
            familyId: user.familyId,
          },
        },
        include: {
          quest: true,
          user: true,
        },
      });

      if (!completion) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Quest completion not found",
        });
      }

      if (completion.status !== "pending") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Quest completion already processed",
        });
      }

      return await ctx.db.questCompletion.update({
        where: { id: input.completionId },
        data: {
          status: "rejected",
        },
        include: {
          quest: true,
          user: true,
        },
      });
    }),

  getPendingCompletions: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: { familyId: true, role: true },
    });

    if (!user?.familyId || user.role !== "PARENT") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only parents can view pending completions",
      });
    }

    return await ctx.db.questCompletion.findMany({
      where: {
        status: "pending",
        quest: {
          familyId: user.familyId,
        },
      },
      include: {
        quest: true,
        user: {
          select: { id: true, name: true, image: true },
        },
      },
      orderBy: { completedAt: "desc" },
    });
  }),
});