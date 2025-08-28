import reminder from "./reminder";
import task from "./task";

export enum ContentType {
  REMINDER = "REMINDER",
  TASK = "TASK",
}

export const context: Record<ContentType, () => string> = {
  [ContentType.REMINDER]: reminder,
  [ContentType.TASK]: task,
};
