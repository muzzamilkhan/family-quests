import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { emitFamilyEvent, EVENT_TYPES } from "~/lib/events";

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

    // Get user's family info
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: { familyId: true, role: true },
    });

    if (!user?.familyId || user.role !== "CHILD") {
      return [];
    }

    return await ctx.db.quest.findMany({
      where: {
        familyId: user.familyId,
        OR: [
          // Specifically assigned to this child
          {
            assignments: {
              some: {
                userId: ctx.session.user.id,
              },
            },
          },
          // No assignments (available to all children in family)
          {
            assignments: {
              none: {},
            },
          },
        ],
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
      // Get user's family info
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { familyId: true, role: true },
      });

      if (!user?.familyId || user.role !== "CHILD") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only children can complete quests",
        });
      }

      // Check if quest exists and user can complete it (assigned OR unassigned family quest)
      const quest = await ctx.db.quest.findFirst({
        where: {
          id: input.questId,
          familyId: user.familyId,
          OR: [
            // Specifically assigned to this child
            {
              assignments: {
                some: {
                  userId: ctx.session.user.id,
                },
              },
            },
            // No assignments (available to all children in family)
            {
              assignments: {
                none: {},
              },
            },
          ],
        },
      });

      if (!quest) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Quest not found or not available to user",
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

      const completion = await ctx.db.questCompletion.create({
        data: {
          questId: input.questId,
          userId: ctx.session.user.id,
          status: "pending",
        },
        include: {
          quest: {
            include: {
              family: true,
            },
          },
          user: {
            select: { id: true, name: true, familyId: true },
          },
        },
      });

      // Emit real-time event for quest completion
      emitFamilyEvent({
        type: EVENT_TYPES.QUEST_COMPLETED,
        familyId: completion.quest.family.id,
        questId: completion.quest.id,
        userId: completion.user.id,
        userName: completion.user.name || "Unknown",
        questTitle: completion.quest.title,
        completionId: completion.id,
      });

      return completion;
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

      // Update completion status (points awarded when child collects treasure)
      const updatedCompletion = await ctx.db.questCompletion.update({
        where: { id: input.completionId },
        data: {
          status: "approved",
          approvedAt: new Date(),
        },
        include: {
          quest: {
            include: {
              family: true,
            },
          },
          user: true,
        },
      });

      // Emit real-time event for quest approval
      emitFamilyEvent({
        type: EVENT_TYPES.QUEST_APPROVED,
        familyId: updatedCompletion.quest.family.id,
        questId: updatedCompletion.quest.id,
        userId: updatedCompletion.user.id,
        userName: updatedCompletion.user.name || "Unknown",
        questTitle: updatedCompletion.quest.title,
        points: updatedCompletion.quest.points,
        completionId: updatedCompletion.id,
      });

      return updatedCompletion;
    }),

  collectTreasure: protectedProcedure
    .input(z.object({ completionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const completion = await ctx.db.questCompletion.findFirst({
        where: {
          id: input.completionId,
          userId: ctx.session.user.id,
          status: "approved",
        },
        include: {
          quest: true,
          user: true,
        },
      });

      if (!completion) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Approved quest completion not found",
        });
      }

      // Award points and mark as collected
      const [updatedCompletion] = await Promise.all([
        ctx.db.questCompletion.update({
          where: { id: input.completionId },
          data: {
            status: "collected",
            collectedAt: new Date(),
          },
          include: {
            quest: {
              include: {
                family: true,
              },
            },
            user: true,
          },
        }),
        ctx.db.user.update({
          where: { id: ctx.session.user.id },
          data: {
            points: {
              increment: completion.quest.points,
            },
          },
        }),
      ]);

      // Emit real-time event for treasure collection
      emitFamilyEvent({
        type: EVENT_TYPES.TREASURE_COLLECTED,
        familyId: updatedCompletion.quest.family.id,
        questId: updatedCompletion.quest.id,
        userId: updatedCompletion.user.id,
        userName: updatedCompletion.user.name || "Unknown",
        questTitle: updatedCompletion.quest.title,
        points: updatedCompletion.quest.points,
        completionId: updatedCompletion.id,
      });

      // Emit points update event
      const updatedUser = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { points: true, name: true, familyId: true },
      });

      if (updatedUser?.familyId) {
        emitFamilyEvent({
          type: EVENT_TYPES.POINTS_UPDATED,
          familyId: updatedUser.familyId,
          userId: ctx.session.user.id,
          userName: updatedUser.name || "Unknown",
          newPoints: updatedUser.points,
          pointsChange: completion.quest.points,
        });
      }

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

      const rejectedCompletion = await ctx.db.questCompletion.update({
        where: { id: input.completionId },
        data: {
          status: "rejected",
        },
        include: {
          quest: {
            include: {
              family: true,
            },
          },
          user: true,
        },
      });

      // Emit real-time event for quest rejection
      emitFamilyEvent({
        type: EVENT_TYPES.QUEST_REJECTED,
        familyId: rejectedCompletion.quest.family.id,
        questId: rejectedCompletion.quest.id,
        userId: rejectedCompletion.user.id,
        userName: rejectedCompletion.user.name || "Unknown",
        questTitle: rejectedCompletion.quest.title,
        completionId: rejectedCompletion.id,
      });

      return rejectedCompletion;
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