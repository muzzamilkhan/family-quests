import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";

export const templateRequestRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        type: z.enum(["QUEST", "REWARD"]),
        request: z.string().min(1),
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
          message: "Only parents can request templates",
        });
      }

      const templateRequest = await ctx.db.templateRequest.create({
        data: {
          type: input.type,
          request: input.request,
          familyId: user.familyId,
        },
      });

      return templateRequest;
    }),

  getAll: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: { isAdmin: true },
    });

    if (!user?.isAdmin) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only admins can view template requests",
      });
    }

    return await ctx.db.templateRequest.findMany({
      include: {
        family: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }),

  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(["PENDING", "DONE", "IGNORED"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { isAdmin: true },
      });

      if (!user?.isAdmin) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can update template request status",
        });
      }

      return await ctx.db.templateRequest.update({
        where: { id: input.id },
        data: { status: input.status },
      });
    }),
});