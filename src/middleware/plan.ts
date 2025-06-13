import { PlanManager } from "../services/plan";
import { ErrorCode } from "../types/constants";

export const subscription = async (ctx: any, next: () => void) => {
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

    await manager.createProfile({
      id: userId,
      username: ctx.from?.username ?? "",
      timezone: "Europe/Rome",
      planExpiresAt: null,
    });
  }

  ctx.state.manager = manager;
  next();
};
