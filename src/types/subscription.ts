// 1. Define Plan Identifiers
export enum Subscription {
  FREE = "FREE",
  BASIC = "BASIC",
  PRO = "PRO",
  DEV = "DEV",
}

export enum GoogleServices {
  MEET = "MEET",
  GMAIL = "GMAIL",
  DRIVE = "DRIVE",
  CALENDAR = "CALENDAR",
}

// 2. Define Features/Limits for each plan
// This interface describes what capabilities or limits a plan provides.
export interface PlanFeatures {
  maxReminders: number; // Max number of active reminders
  services: GoogleServices[] | [];
  ai_powered: boolean; // Access to AI features for suggestions
  maxRepeatCount?: number; // Optional: Max number of repeats for a reminder
}

// 3. Define the full Plan Details
export interface PlanDetails {
  id: Subscription;
  name: string;
  description: string;
  features: PlanFeatures;
  price?: number;
  currency?: string;
}

// 4. Centralized Plan Configuration (Immutable Data)
// This array serves as the single source of truth for all your plan details.
export const SUBSCRIPTION_CONFIG: PlanDetails[] = [
  {
    id: Subscription.FREE,
    name: "Free Plan",
    description: "Get started with essential reminder features.",
    features: {
      maxReminders: 5,
      services: [],
      ai_powered: false,
      maxRepeatCount: 10,
    },
  },
  {
    id: Subscription.BASIC,
    name: "Basic Plan",
    description: "More reminders and basic integrations.",
    features: {
      maxReminders: 50,
      services: [GoogleServices.CALENDAR],
      ai_powered: false,
      maxRepeatCount: 50,
    },
    price: 4.99,
    currency: "USD",
  },
  {
    id: Subscription.PRO,
    name: "Pro Plan",
    description: "Unlimited reminders and all advanced features.",
    features: {
      maxReminders: 9999,
      services: [
        GoogleServices.CALENDAR,
        GoogleServices.MEET,
        GoogleServices.GMAIL,
      ],
      ai_powered: true,
      maxRepeatCount: 500,
    },
    price: 9.99,
    currency: "USD",
  },
  {
    id: Subscription.DEV,
    name: "Dev Plan",
    description: "You are not admin! XD",
    features: {
      maxReminders: Infinity,
      services: Object.values(GoogleServices),
      ai_powered: true,
      maxRepeatCount: Infinity,
    },
    price: 0.01,
    currency: "USD",
  },
];
