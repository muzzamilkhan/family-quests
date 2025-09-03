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
});