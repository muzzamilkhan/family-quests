import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";

export const familyRouter = createTRPCRouter({
  create: protectedProcedure
    .input(z.object({ name: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const existingFamily = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { familyId: true },
      });

      if (existingFamily?.familyId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User already belongs to a family",
        });
      }

      const family = await ctx.db.family.create({
        data: {
          name: input.name,
          members: {
            connect: { id: ctx.session.user.id },
          },
        },
        include: {
          members: true,
        },
      });

      // Update user role to PARENT
      await ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: { role: "PARENT" },
      });

      return family;
    }),

  getMyFamily: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      include: {
        family: {
          include: {
            members: true,
          },
        },
      },
    });

    if (!user?.family) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Family not found",
      });
    }

    return user.family;
  }),

  addChild: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        email: z.string().optional().transform(email => 
          email && email.trim() !== "" ? email : undefined
        ).pipe(z.string().email().optional()),
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
          message: "Only parents can add children to the family",
        });
      }

      const permalink = nanoid(16); // Generate secure permalink

      const child = await ctx.db.user.create({
        data: {
          name: input.name,
          email: input.email,
          role: "CHILD",
          familyId: user.familyId,
          permalink,
        },
      });

      return { child, permalink };
    }),

  addParent: protectedProcedure
    .input(
      z.object({
        email: z.string().email(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const currentUser = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { familyId: true, role: true },
      });

      if (!currentUser?.familyId || currentUser.role !== "PARENT") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only parents can add other parents to the family",
        });
      }

      // Check if a user with this email already exists
      const existingUser = await ctx.db.user.findUnique({
        where: { email: input.email },
      });

      if (existingUser) {
        // If user exists, check if they're already in a family
        if (existingUser.familyId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "This user already belongs to a family",
          });
        }
        
        // Add existing user to the family as a parent
        const updatedUser = await ctx.db.user.update({
          where: { email: input.email },
          data: {
            familyId: currentUser.familyId,
            role: "PARENT",
          },
        });

        return { 
          parent: updatedUser,
          isExistingUser: true,
          loginUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}`
        };
      } else {
        // Create a placeholder user that will be activated when they sign in with Google
        const newParent = await ctx.db.user.create({
          data: {
            email: input.email,
            role: "PARENT",
            familyId: currentUser.familyId,
          },
        });

        return { 
          parent: newParent,
          isExistingUser: false,
          loginUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}`
        };
      }
    }),

  getChildren: protectedProcedure.query(async ({ ctx }) => {
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

    return await ctx.db.user.findMany({
      where: {
        familyId: user.familyId,
        role: "CHILD",
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        points: true,
        permalink: true,
      },
    });
  }),
});