// --- Constants ---

export const REMINDER_COLLECTION = "reminders";
export const PROFILE_COLLECTION = "profile";

// --- Wizard Constants ---

export enum Wizard {
  CREATE = "CREATE_WIZARD",
  UPDATE = "UPDATE_WIZARD",
  USERNAME = "USERNAME_WIZARD",
  TIMEZONE = "TIMEZONE_WIZARD",
  DELETE = "DELETE_WIZARD",
  CLEAR = "CLEAR_WIZARD",
}

export enum ErrorCode {
  PROFILE_NOT_FOUND = "PROFILE_NOT_FOUND",
}
