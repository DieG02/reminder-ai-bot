import axios from "axios";

async function generateText(prompt: string) {
  try {
    const response = await axios.post("http://localhost:11434/api/generate", {
      prompt: prompt,
      model: "llama3.2", // Specify the model you downloaded
      stream: false, // Set to true for streaming responses
    });
    return response.data.response;
  } catch (error) {
    console.error("Error generating text with Ollama:", error);
    throw error;
  }
}

async function main() {
  const userPrompt = "Write a short story about a cat in Milan.";
  try {
    const generatedStory = await generateText(userPrompt);
    console.log("Generated Story:\n", generatedStory);
  } catch (error) {
    console.error("Failed to generate text:", error);
  }
}

main();
