import { createTRPCRouter } from "~/server/api/trpc";
import { questRouter } from "./routers/quest";
import { familyRouter } from "./routers/family";
import { rewardRouter } from "./routers/reward";
import { userRouter } from "./routers/user";
import { realtimeRouter } from "./routers/realtime";
import { templateRequestRouter } from "./routers/templateRequest";
import { questTemplateRouter } from "./routers/questTemplate";
import { rewardTemplateRouter } from "./routers/rewardTemplate";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  quest: questRouter,
  family: familyRouter,
  reward: rewardRouter,
  user: userRouter,
  realtime: realtimeRouter,
  templateRequest: templateRequestRouter,
  questTemplate: questTemplateRouter,
  rewardTemplate: rewardTemplateRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;