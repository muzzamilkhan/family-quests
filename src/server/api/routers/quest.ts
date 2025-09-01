import { z } from "zod";
import { put } from "@vercel/blob";
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
        image: z.string().optional(),
        frequency: z.enum(["daily", "weekly", "monthly", "once"]).default("daily"),
        weeklyDays: z.array(z.number().min(0).max(6)).optional(),
        monthlyDate: z.number().min(1).max(31).optional(),
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
          image: input.image,
          frequency: input.frequency,
          weeklyDays: input.weeklyDays ? JSON.stringify(input.weeklyDays) : null,
          monthlyDate: input.monthlyDate,
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
    
    const currentDayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const currentDayOfMonth = today.getDate(); // 1-31

    // Get user's family info
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: { familyId: true, role: true },
    });

    if (!user?.familyId || user.role !== "CHILD") {
      return [];
    }

    // Get all quests for this family that the child can access
    const allQuests = await ctx.db.quest.findMany({
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
          },
          orderBy: { completedAt: "desc" },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // Filter quests based on frequency and availability
    const availableQuests = allQuests.filter(quest => {
      switch (quest.frequency) {
        case 'daily':
          // Daily quests: available every day, check for today's completion
          const todayCompletion = quest.completions.find(completion => 
            completion.completedAt >= today && completion.completedAt < tomorrow
          );
          return !todayCompletion || todayCompletion.status !== 'collected';

        case 'weekly':
          // Weekly quests: only available on specified days
          if (!quest.weeklyDays) return false;
          const weeklyDays = JSON.parse(quest.weeklyDays) as number[];
          if (!weeklyDays.includes(currentDayOfWeek)) return false;
          
          // Check if completed today
          const weeklyTodayCompletion = quest.completions.find(completion => 
            completion.completedAt >= today && completion.completedAt < tomorrow
          );
          return !weeklyTodayCompletion || weeklyTodayCompletion.status !== 'collected';

        case 'monthly':
          // Monthly quests: only available on specified day of month
          if (quest.monthlyDate !== currentDayOfMonth) return false;
          
          // Check if completed this month
          const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
          const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
          const monthlyCompletion = quest.completions.find(completion => 
            completion.completedAt >= startOfMonth && 
            completion.completedAt < endOfMonth &&
            completion.status === 'collected'
          );
          return !monthlyCompletion;

        case 'once':
          // One-time quests: available until completed
          const onceCompletion = quest.completions.find(completion => 
            completion.status === 'collected'
          );
          return !onceCompletion;

        default:
          return false;
      }
    });

    // Transform to include only today's completion for daily/weekly quests
    return availableQuests.map(quest => ({
      ...quest,
      completions: quest.frequency === 'daily' || quest.frequency === 'weekly' 
        ? quest.completions.filter(completion => 
            completion.completedAt >= today && completion.completedAt < tomorrow
          ).slice(0, 1)
        : quest.completions.slice(0, 1) // For monthly/once, show latest completion
    }));
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

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).optional(),
        points: z.number().min(1).optional(),
        icon: z.string().optional(),
        image: z.string().optional(),
        frequency: z.enum(["daily", "weekly", "monthly", "once"]).optional(),
        weeklyDays: z.array(z.number().min(0).max(6)).optional(),
        monthlyDate: z.number().min(1).max(31).optional(),
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
          message: "Only parents can update quests",
        });
      }

      // Check if quest exists and belongs to user's family
      const existingQuest = await ctx.db.quest.findFirst({
        where: {
          id: input.id,
          familyId: user.familyId,
        },
        include: {
          assignments: true,
        },
      });

      if (!existingQuest) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Quest not found or not owned by family",
        });
      }

      // If assignedUserIds is provided, update assignments
      let assignmentUpdate = undefined;
      if (input.assignedUserIds !== undefined) {
        // Delete existing assignments and create new ones
        assignmentUpdate = {
          assignments: {
            deleteMany: {},
            ...(input.assignedUserIds.length > 0 ? {
              create: input.assignedUserIds.map((userId) => ({
                userId,
              })),
            } : {}),
          },
        };
      }

      const quest = await ctx.db.quest.update({
        where: { id: input.id },
        data: {
          ...(input.title !== undefined && { title: input.title }),
          ...(input.points !== undefined && { points: input.points }),
          ...(input.icon !== undefined && { icon: input.icon }),
          ...(input.image !== undefined && { image: input.image }),
          ...(input.frequency !== undefined && { frequency: input.frequency }),
          ...(input.weeklyDays !== undefined && { weeklyDays: input.weeklyDays ? JSON.stringify(input.weeklyDays) : null }),
          ...(input.monthlyDate !== undefined && { monthlyDate: input.monthlyDate }),
          ...assignmentUpdate,
        },
        include: {
          assignments: {
            include: {
              user: {
                select: { id: true, name: true, image: true },
              },
            },
          },
        },
      });

      return quest;
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

  uploadImage: protectedProcedure
    .input(
      z.object({
        questId: z.string(),
        filename: z.string(),
        contentType: z.string(),
        file: z.string(), // base64 encoded file data
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
          message: "Only parents can upload quest images",
        });
      }

      // Check if quest exists and belongs to user's family
      const quest = await ctx.db.quest.findFirst({
        where: {
          id: input.questId,
          familyId: user.familyId,
        },
      });

      if (!quest) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Quest not found or not owned by family",
        });
      }

      // Convert base64 to buffer
      const buffer = Buffer.from(input.file, 'base64');

      // Upload to Vercel Blob
      const blob = await put(input.filename, buffer, {
        access: 'public',
        contentType: input.contentType,
      });

      // Update quest's image URL in database
      const updatedQuest = await ctx.db.quest.update({
        where: { id: input.questId },
        data: { image: blob.url },
        include: {
          assignments: {
            include: {
              user: {
                select: { id: true, name: true, image: true },
              },
            },
          },
        },
      });

      return { url: blob.url, quest: updatedQuest };
    }),
});