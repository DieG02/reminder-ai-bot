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
  private _profile: UserProfile;

  constructor(profile: UserProfile) {
    this.userId = profile.id;
    this._profile = profile;
  }

  get profile(): UserProfile {
    return this._profile;
  }

  set profile(profile: UserProfile) {
    this._profile = profile;
  }

  get features(): PlanFeatures {
    return PlanManager.getFeatures(this.profile);
  }

  static getPlanDetails(planId: Subscription): PlanDetails | undefined {
    return SUBSCRIPTION_CONFIG.find((plan) => plan.id === planId);
  }

  static getFeatures(profile: UserProfile): PlanFeatures {
    const plan = this.getPlanDetails(profile.plan);
    if (!plan) return this.getPlanDetails(Subscription.FREE)!.features;
    return plan.features;
  }

  async syncProfile(date: Partial<UserProfile>): Promise<UserProfile> {
    const newProfile: UserProfile = {
      ...this._profile,
      ...date,
      updatedAt: Timestamp.now(),
    };

    this.profile = newProfile;
    await store.saveUserProfile(this.userId, newProfile);
    return newProfile;
  }

  async upgrade(plan: Subscription, expiresAt: Timestamp): Promise<void> {
    this.profile = {
      ...this._profile,
      plan: plan,
      planExpiresAt: expiresAt,
      updatedAt: Timestamp.now(),
    };

    await store.saveUserProfile(this.userId, this._profile);
  }

  async downgrade(userId: string): Promise<void> {
    this.profile = {
      ...this._profile,
      plan: Subscription.FREE,
      planExpiresAt: null,
      updatedAt: Timestamp.now(),
    };

    await store.saveUserProfile(userId, this._profile);
  }

  hasFeature(key: keyof PlanFeatures): boolean {
    return !!this.features[key];
  }

  hasExceededReminderLimit(): boolean {
    const reminders = local
      .toArray()
      .filter((r) => r.chatId === this.profile.id);
    return reminders.length >= this.features.maxReminders;
  }
}
