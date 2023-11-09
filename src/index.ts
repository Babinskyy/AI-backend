import app from "./app.js";
import { connectToDatabase } from "./db/connection.js";
import { Server } from "socket.io";
import http from "http";
import { Request, Response } from "express";

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

export const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log(`Client connected with id: ${socket.id}`);
});

app.get("/", (_req: Request, res: Response) => {
  res.send("Welcome to AI Assistant API");
});

connectToDatabase()
  .then(() => {
    server.listen(PORT, () =>
      console.log(`Server is firing up at port ${PORT} & connected to MongoDB.`)
    );
  })
  .catch((err) => console.log(err));
