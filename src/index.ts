import app from "./app.js";
import { connectToDatabase } from "./db/connection.js";
import { Server } from "socket.io";
import http from "http";

// const PORT = process.env.PORT || 5000;

// const server = http.createServer(app);

// export const io = new Server(server, {
//   cors: {
//     origin: process.env.CLIENT_URL || "http://localhost:5173/",
//     methods: ["GET", "POST"],
//   },
// });

// connectToDatabase()
//   .then(() => {
//     app.listen(PORT, () =>
//       console.log("Server is Fire at http://localhost:5000/ & connected to MongoDB.")
//     );
//   })
//   .catch((err) => console.log(err));

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

  // Listen for the test event
  socket.on("test", (data) => {
    console.log("Received test event from client:", data);
  });

  // Add other event handlers and disconnection handler here...
});

// Rest of your socket.io setup...

connectToDatabase()
  .then(() => {
    // Start the server with the HTTP server instance, not the Express app
    server.listen(PORT, () =>
      console.log("Server is firing up at http://localhost:5000/ & connected to MongoDB.")
    );
  })
  .catch((err) => console.log(err));
