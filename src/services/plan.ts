import { Timestamp } from "firebase-admin/firestore";
import {
  SUBSCRIPTION_CONFIG,
  Subscription,
  PlanDetails,
  PlanFeatures,
} from "../types/subscription";
import { UserProfile } from "../types/user";
import { store } from "../store";
import { local } from "../store";

export class PlanManager {
  private userId: string;
  private profile?: UserProfile;

  constructor(userId: string, profile?: UserProfile) {
    this.userId = userId;
    this.profile = profile;
  }

  private async ensureUserProfile(): Promise<UserProfile> {
    if (!this.profile) {
      const profile = await store.getUserProfile(this.userId);
      if (!profile) {
        throw new Error(`User profile not found for ID: ${this.userId}`);
      }
      this.profile = profile;
    }
    return this.profile!;
  }

  static getPlanDetails(planId: Subscription): PlanDetails | undefined {
    return SUBSCRIPTION_CONFIG.find((plan) => plan.id === planId);
  }

  async assignFreePlan(
    initialProfile: Omit<UserProfile, "plan" | "updatedAt">
  ): Promise<UserProfile> {
    const freePlan = PlanManager.getPlanDetails(Subscription.FREE);
    if (!freePlan) {
      throw new Error("Free plan configuration not found!");
    }

    const newUserProfile: UserProfile = {
      ...initialProfile,
      plan: Subscription.FREE,
      updatedAt: Timestamp.now(),
    };

    await store.saveUserProfile(this.userId, newUserProfile);
    this.profile = newUserProfile;
    return newUserProfile;
  }

  async upgradePlan(
    newPlanId: Subscription,
    planExpiresAt?: Timestamp
  ): Promise<UserProfile> {
    const profile = await this.ensureUserProfile();

    const newPlan = PlanManager.getPlanDetails(newPlanId);
    if (!newPlan) {
      throw new Error(`Plan with ID ${newPlanId} not found.`);
    }

    profile.plan = newPlanId;
    profile.planExpiresAt = planExpiresAt;
    profile.updatedAt = Timestamp.now();

    await store.saveUserProfile(this.userId, profile);
    return profile;
  }

  async downgradePlan(): Promise<UserProfile> {
    const profile = await this.ensureUserProfile();

    profile.plan = Subscription.FREE;
    profile.planExpiresAt = undefined;
    profile.updatedAt = Timestamp.now();

    await store.saveUserProfile(this.userId, profile);
    return profile;
  }

  getFeatures(profile?: UserProfile): PlanFeatures {
    const effectiveProfile = profile ?? this.profile;
    if (!effectiveProfile) {
      throw new Error("User profile is not loaded.");
    }

    const planDetails = PlanManager.getPlanDetails(effectiveProfile.plan);
    if (!planDetails) {
      console.warn(
        `Unknown plan ID '${effectiveProfile.plan}', falling back to Free.`
      );
      return PlanManager.getPlanDetails(Subscription.FREE)!.features;
    }

    return planDetails.features;
  }

  async hasExceededReminderLimit(): Promise<boolean> {
    const profile = await this.ensureUserProfile();
    const features = this.getFeatures(profile);

    const reminders = local
      .toArray()
      .filter((r) => r.chatId === parseInt(profile.userId));
    return reminders.length >= features.maxReminders;
  }

  hasFeature(featureKey: keyof PlanFeatures): boolean {
    if (!this.profile) {
      throw new Error("User profile is not loaded.");
    }
    const features = this.getFeatures(this.profile);
    return features[featureKey] === true;
  }

  getUserProfile(): UserProfile | undefined {
    return this.profile;
  }
}
