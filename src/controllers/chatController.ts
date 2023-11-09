import { NextFunction, Request, Response } from "express";
import User from "../models/User.js";
import { configureOpenAi } from "../config/openAiConfig.js";
import { OpenAIApi, ChatCompletionRequestMessage } from "openai/dist/api.js";
import { IncomingMessage } from "http";
import { io } from "../index.js";

export const generateChatCompletion = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { message } = req.body;

  try {
    const user = await User.findById(res.locals.jwtData.id);
    if (!user) {
      return res
        .status(401)
        .json({ message: "User not registered or there is not active token." });
    }
    const chats = user.chats.map(({ role, content }) => ({
      role,
      content,
    })) as ChatCompletionRequestMessage[];
    chats.push({ content: message, role: "user" });
    user.chats.push({ content: message, role: "user" });

    const config = configureOpenAi();
    const openai = new OpenAIApi(config);
    const chatResponse = await openai.createChatCompletion(
      {
        model: "gpt-3.5-turbo",
        // model: "gpt-4",
        messages: chats,
        stream: true,
      },
      { responseType: "stream" }
    );

    const stream = chatResponse.data as unknown as IncomingMessage;

    let buffer = "";
    let chatAnswer: { role: "assistant"; content: string } = {
      role: "assistant",
      content: "",
    };
    stream.on("data", (chunk: Buffer) => {
      // Append the chunk to the buffer
      buffer += chunk.toString();

      // Attempt to find complete JSON objects
      let boundary = buffer.lastIndexOf("\n\n"); // Using '\n\n' as the boundary
      if (boundary !== -1) {
        let completeData = buffer.substring(0, boundary); // Get complete data
        buffer = buffer.substring(boundary + 2); // Reset buffer to the remaining part

        const payloads = completeData.split("\n\n").filter((payload) => payload.trim());
        for (const payload of payloads) {
          if (payload.includes("[DONE]")) return;
          if (payload.startsWith("data:")) {
            const data = JSON.parse(payload.replace("data: ", ""));
            try {
              const chunk: undefined | string = data.choices[0].delta?.content;
              if (chunk) {
                console.log(chunk);
                chatAnswer.content += chunk;
                io.emit("chunks", { content: chunk });
              }
            } catch (error) {
              console.log(`Error with JSON.parse and ${payload}.\n${error}`);
            }
          }
        }
      }
    });

    stream.on("end", async () => {
      console.log("stop emmiting");

      io.emit("streamEnd", { content: chatAnswer });
      user.chats.push(chatAnswer);
      await user.save();
      res.status(200).json({ message: "Stream end" });
    });

    stream.on("error", (err: Error) => {
      console.log(err);
      io.emit("resError", { error: err });
    });
  } catch (error) {
    console.log(error);
    io.emit("resError", { error: error });
  }
};

export const sendChatsToUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await User.findById(res.locals.jwtData.id);
    if (!user) {
      return res.status(401).send("User not registered or there is not active token.");
    }
    if (user._id.toString() !== res.locals.jwtData.id) {
      return res.status(401).send("Permission did not match.");
    }
    return res.status(200).json({ message: "OK", chats: user.chats });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error", cause: error.message });
  }
};

export const deleteChats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(res.locals.jwtData.id);
    if (!user) {
      return res.status(401).send("User not registered or there is not active token.");
    }
    if (user._id.toString() !== res.locals.jwtData.id) {
      return res.status(401).send("Permission did not match.");
    }

    //@ts-ignore
    user.chats = [];
    await user.save();
    return res.status(200).json({ message: "Chat deleted." });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error", cause: error.message });
  }
};
