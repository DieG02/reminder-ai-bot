/**
 * Generates a random 6-character uppercase alphanumeric string.
 */
export function generateShortCode(): string {
  const characters = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const length = 6;
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

/**
 * Helper function to escape MarkdownV2 special characters.
 */
export const escapeMarkdownV2 = (text: string): string => {
  return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, "\\$&");
};
