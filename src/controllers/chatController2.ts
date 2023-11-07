import { NextFunction, Request, Response } from "express";
import User from "../models/User.js";
import { configureOpenAi } from "../config/openAiConfig.js";
import { OpenAIApi, ChatCompletionRequestMessage } from "openai/dist/api.js";
import { IncomingMessage } from "http";

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
        messages: chats,
        stream: true,
      },
      { responseType: "stream" }
    );

    const stream = chatResponse.data as unknown as IncomingMessage;

    stream.on("data", (chunk: Buffer) => {
      const payloads = chunk.toString().split("\n\n");
      for (const payload of payloads) {
        if (payload.includes("[DONE]")) return;
        if (payload.startsWith("data:")) {
          const data = JSON.parse(payload.replace("data: ", ""));
          try {
            const chunk: undefined | string = data.choices[0].delta?.content;
            if (chunk) {
              console.log(chunk);
            }
          } catch (error) {
            console.log(`Error with JSON.parse and ${payload}.\n${error}`);
          }
        }
      }
    });

    stream.on("end", () => {
      setTimeout(() => {
        console.log("\nStream done");
        res.send({ message: "Stream done" });
      }, 10);
    });

    stream.on("error", (err: Error) => {
      console.log(err);
      res.send(err);
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Something went wrong." });
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
