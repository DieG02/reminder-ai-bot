import { PlanManager } from "../services/plan";
import { ErrorCode } from "../types/constants";
import { AIContext } from "../types/app";
import { MiddlewareFn } from "telegraf";
import { store } from "../store";
import { UserProfile } from "../types/user";

export const subscription: MiddlewareFn<AIContext> = async (
  ctx: AIContext,
  next: () => Promise<void>
) => {
  const userId = String(ctx.from?.id);
  let profile: UserProfile;

  try {
    const result = await store.getUserProfile(userId);
    if (!result) {
      throw new Error("Profile not found");
    }
    profile = result;
  } catch {
    profile = await store.createUserProfile(userId, {
      id: userId,
      username: ctx.from?.username ?? "",
      timezone: "Europe/Rome",
      planExpiresAt: null,
    });
  }

  const manager = new PlanManager(profile);
  ctx.manager = manager;
  await next();
};
