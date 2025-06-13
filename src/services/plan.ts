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
import { ErrorCode } from "../types/constants";

export class PlanManager {
  private userId: string;
  private _profile?: UserProfile;

  constructor(userId: string) {
    this.userId = userId;
  }

  get profile(): UserProfile | undefined {
    return this._profile;
  }

  set profile(profile: UserProfile) {
    this._profile = profile;
  }

  async loadProfile(): Promise<UserProfile> {
    if (!this._profile) {
      const profile = await store.getUserProfile(this.userId);
      if (!profile) {
        const error = new Error(`Profile not found for ${this.userId}`);
        error.name = "ProfileNotFoundError";
        // @ts-expect-error: allow setting custom property
        error.code = ErrorCode.PROFILE_NOT_FOUND;
        throw error;
      }
      this._profile = profile;
    }
    return this._profile;
  }

  async createProfile(
    initialProfile: Omit<
      UserProfile,
      "plan" | "trialEndsAt" | "updatedAt" | "createdAt"
    >
  ): Promise<UserProfile> {
    const freePlan = PlanManager.getPlanDetails(Subscription.FREE);
    if (!freePlan) {
      throw new Error("Free plan configuration not found!");
    }

    const newUserProfile: UserProfile = {
      ...initialProfile,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      plan: Subscription.FREE,

      planExpiresAt: null,
      trialEndsAt: null,
    };

    await store.saveUserProfile(this.userId, newUserProfile);
    this.profile = newUserProfile;

    return newUserProfile;
  }

  static getPlanDetails(planId: Subscription): PlanDetails | undefined {
    return SUBSCRIPTION_CONFIG.find((plan) => plan.id === planId);
  }

  static async assignFreePlan(
    userId: string,
    initialProfile: Omit<UserProfile, "plan" | "updatedAt">
  ): Promise<UserProfile> {
    const freePlan = this.getPlanDetails(Subscription.FREE);
    if (!freePlan) {
      throw new Error("Free plan configuration not found!");
    }

    const newUserProfile: UserProfile = {
      ...initialProfile,
      plan: Subscription.FREE,
      updatedAt: Timestamp.now(),
    };

    await store.saveUserProfile(userId, newUserProfile);
    return newUserProfile;
  }

  async upgradePlan(
    plan: Subscription,
    expiresAt: Timestamp
  ): Promise<UserProfile> {
    await this.loadProfile();
    if (!this._profile) throw new Error("Profile not loaded");

    this.profile = {
      ...this._profile,
      plan: plan,
      planExpiresAt: expiresAt,
      updatedAt: Timestamp.now(),
    };

    await store.saveUserProfile(this.userId, this._profile);
    return this._profile;
  }

  async downgradePlan(userId: string): Promise<UserProfile> {
    await this.loadProfile();
    if (!this._profile) throw new Error("Profile not loaded");

    this.profile = {
      ...this._profile,
      plan: Subscription.FREE,
      planExpiresAt: null,
      updatedAt: Timestamp.now(),
    };

    await store.saveUserProfile(userId, this._profile);
    return this._profile;
  }

  static getFeatures(profile: UserProfile): PlanFeatures {
    const planDetails = this.getPlanDetails(profile.plan);
    if (!planDetails) {
      console.warn(`Unknown plan ID '${profile.plan}', falling back to Free.`);
      return this.getPlanDetails(Subscription.FREE)!.features;
    }

    return planDetails.features;
  }

  async hasExceededReminderLimit(userId: string): Promise<boolean> {
    const profile = await this.loadProfile();
    if (!profile) throw new Error("Profile not loaded");
    const features = PlanManager.getFeatures(profile);

    const reminders = local
      .toArray()
      .filter((r) => r.chatId === parseInt(userId));

    return reminders.length >= features.maxReminders;
  }

  async hasFeature(featureKey: keyof PlanFeatures): Promise<boolean> {
    const profile = await this.loadProfile();
    if (!profile) throw new Error("Profile not loaded");

    const features = PlanManager.getFeatures(profile);
    return features[featureKey] === true;
  }
}
