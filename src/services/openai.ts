import axios from "axios";
import context from "./prompt";
import { examples } from "../utils/dumb";

export const extractReminder = async (user_input: string, dumb?: boolean) => {
  if (dumb) {
    const date = new Date();
    const index = date.getTime() % 10;
    return new Array(examples[0]);
  }
  const res = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      model: "gpt-4.1-mini",
      messages: [
        { role: "system", content: context() },
        { role: "user", content: user_input },
      ],
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );
  return JSON.parse(res.data.choices[0].message.content);
};
