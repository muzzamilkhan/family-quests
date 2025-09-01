import { z } from "zod";
import { observable } from "@trpc/server/observable";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { globalEvents, type FamilyEvent, EVENT_TYPES } from "~/lib/events";
import { TRPCError } from "@trpc/server";

export const realtimeRouter = createTRPCRouter({
  // Subscribe to family events for real-time updates
  subscribeFamilyEvents: protectedProcedure.subscription(async ({ ctx }) => {
    // Get user's family info
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

    return observable<FamilyEvent>((emit) => {
      // Listen for events specific to this user's family
      const familyEventListener = (event: FamilyEvent) => {
        emit.next(event);
      };

      // Subscribe to family-specific events
      globalEvents.on(`family:${user.familyId}`, familyEventListener);

      // Cleanup function
      return () => {
        globalEvents.off(`family:${user.familyId}`, familyEventListener);
      };
    });
  }),

  // Subscribe to specific event types
  subscribeEventType: protectedProcedure
    .input(z.object({
      eventType: z.enum([
        EVENT_TYPES.QUEST_COMPLETED,
        EVENT_TYPES.QUEST_APPROVED,
        EVENT_TYPES.QUEST_REJECTED,
        EVENT_TYPES.TREASURE_COLLECTED,
        EVENT_TYPES.FAMILY_MEMBER_ADDED,
        EVENT_TYPES.FAMILY_MEMBER_UPDATED,
        EVENT_TYPES.POINTS_UPDATED,
      ])
    }))
    .subscription(async ({ ctx, input }) => {
      // Get user's family info
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

      return observable<FamilyEvent>((emit) => {
        const eventListener = (event: FamilyEvent) => {
          // Only emit events for the user's family and matching event type
          if (event.familyId === user.familyId && event.type === input.eventType) {
            emit.next(event);
          }
        };

        globalEvents.on(input.eventType, eventListener);

        return () => {
          globalEvents.off(input.eventType, eventListener);
        };
      });
    }),
});