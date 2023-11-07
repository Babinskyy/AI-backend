import app from "./app.js";
import { connectToDatabase } from "./db/connection.js";

const PORT = process.env.PORT || 5000;

connectToDatabase()
  .then(() => {
    app.listen(PORT, () =>
      console.log("Server is Fire at http://localhost:5000/ & connected to MongoDB.")
    );
  })
  .catch((err) => console.log(err));
