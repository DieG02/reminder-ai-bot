import { PlanManager } from "../services/plan";
import { ErrorCode } from "../types/constants";
import { AIContext } from "../types/app";

export const subscription = async (
  ctx: AIContext,
  next: () => Promise<void>
) => {
  const userId = String(ctx.from?.id);
  const manager = new PlanManager(userId);

  try {
    const profile = await manager.loadProfile();
    manager.profile = profile;
  } catch (err: any) {
    if (err.code !== ErrorCode.PROFILE_NOT_FOUND) {
      console.error(err.message);
      return;
    }

    // Automatically create a new profile if not found
    await manager.createProfile({
      id: userId,
      username: ctx.from?.username ?? "",
      timezone: "Europe/Rome", // Default timezone
      planExpiresAt: null,
    });
  }

  ctx.state.manager = manager;

  await next();
};
