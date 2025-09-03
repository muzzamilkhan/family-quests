import { z } from "zod";
import { put } from "@vercel/blob";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";

export const rewardRouter = createTRPCRouter({
  getTemplates: protectedProcedure.query(async () => {
    const fs = require('fs');
    const path = require('path');
    
    try {
      const templatesPath = path.join(process.cwd(), 'public', 'reward-templates.json');
      const templatesData = fs.readFileSync(templatesPath, 'utf8');
      return JSON.parse(templatesData);
    } catch (error) {
      return [];
    }
  }),

  createBatch: protectedProcedure
    .input(
      z.object({
        templates: z.array(
          z.object({
            title: z.string().min(1),
            description: z.string().nullable().optional(),
            image: z.string().nullable().optional(),
            pointsCost: z.number().min(1),
          })
        ),
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
          message: "Only parents can create rewards",
        });
      }

      const createdRewards = [];
      
      for (const template of input.templates) {
        const reward = await ctx.db.reward.create({
          data: {
            title: template.title,
            description: template.description || null,
            image: template.image || null,
            pointsCost: template.pointsCost,
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
                  select: { id: true, name: true, image: true },
                },
              },
            },
          },
        });
        createdRewards.push(reward);
      }

      return createdRewards;
    }),

  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        image: z.string().optional(),
        pointsCost: z.number().min(1),
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
          message: "Only parents can create rewards",
        });
      }

      return await ctx.db.reward.create({
        data: {
          title: input.title,
          description: input.description,
          image: input.image,
          pointsCost: input.pointsCost,
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
                select: { id: true, name: true, image: true },
              },
            },
          },
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
        assignments: {
          include: {
            user: {
              select: { id: true, name: true, image: true },
            },
          },
        },
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

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).optional(),
        description: z.string().optional(),
        image: z.string().optional(),
        pointsCost: z.number().min(1).optional(),
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
          message: "Only parents can update rewards",
        });
      }

      // Check if reward exists and belongs to user's family
      const existingReward = await ctx.db.reward.findFirst({
        where: {
          id: input.id,
          familyId: user.familyId,
        },
        include: {
          assignments: true,
        },
      });

      if (!existingReward) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Reward not found or not owned by family",
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

      const reward = await ctx.db.reward.update({
        where: { id: input.id },
        data: {
          ...(input.title !== undefined && { title: input.title }),
          ...(input.description !== undefined && { description: input.description }),
          ...(input.image !== undefined && { image: input.image }),
          ...(input.pointsCost !== undefined && { pointsCost: input.pointsCost }),
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

      return reward;
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

  uploadImage: protectedProcedure
    .input(
      z.object({
        rewardId: z.string(),
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
          message: "Only parents can upload reward images",
        });
      }

      // Check if reward exists and belongs to user's family
      const reward = await ctx.db.reward.findFirst({
        where: {
          id: input.rewardId,
          familyId: user.familyId,
        },
      });

      if (!reward) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Reward not found or not owned by family",
        });
      }

      // Convert base64 to buffer
      const buffer = Buffer.from(input.file, 'base64');

      // Upload to Vercel Blob
      const blob = await put(input.filename, buffer, {
        access: 'public',
        contentType: input.contentType,
      });

      // Update reward's image URL in database
      const updatedReward = await ctx.db.reward.update({
        where: { id: input.rewardId },
        data: { image: blob.url },
      });

      return { url: blob.url, reward: updatedReward };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { familyId: true, role: true },
      });

      if (!user?.familyId || user.role !== "PARENT") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only parents can delete rewards",
        });
      }

      // Check if reward exists and belongs to user's family
      const reward = await ctx.db.reward.findFirst({
        where: {
          id: input.id,
          familyId: user.familyId,
        },
      });

      if (!reward) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Reward not found or not owned by family",
        });
      }

      // Delete the reward (cascade will handle assignments and redemptions)
      await ctx.db.reward.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),
});