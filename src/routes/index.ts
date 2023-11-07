import { Router } from "express";
import userRouter from "./userRouter.js";
import chatRouter from "./chatRouter.js";

const appRouter = Router();

appRouter.use("/user", userRouter);
appRouter.use("/chat", chatRouter);

export default appRouter;
