import axios from "axios";
import { getContext } from "./utils";

export const getReminder = async (user_input: string) => {
  const res = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      model: "gpt-4.1-mini",
      messages: [
        { role: "system", content: getContext() },
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
