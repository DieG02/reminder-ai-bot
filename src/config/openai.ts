import axios from "axios";
import { examples } from "../utils/dumb";
import { ContentType, context } from "./context";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const HARDCODE = process.env.HARDCODE;

/**
 * Asynchronously extracts structured data from natural language input.
 *
 * @param input The raw text string to process (e.g., "remind me to call mom tomorrow").
 * @param key The context for extraction, guiding how the input is interpreted. Defaults to `ContentType.REMINDER`.
 * @returns A promise that resolves to a structured object containing the extracted data,
 * or a processed string, based on the `ContentType`.
 */
export const extract = async (
  input: string,
  key: ContentType = ContentType.REMINDER
): Promise<any> => {
  input = input.trim();

  if (HARDCODE == "TRUE") {
    const date = new Date();
    const index = date.getTime() % 10;
    return new Array(examples[0]);
  }

  const prompt: () => string = context[key];
  const res = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      model: "gpt-4.1-mini",
      messages: [
        { role: "system", content: prompt() },
        { role: "user", content: input },
      ],
    },
    {
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );
  return JSON.parse(res.data.choices[0].message.content);
};
