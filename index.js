// this is api/index.js
// this file run node-mon in local host
// This file sets up a simple Express server
// It listens on port 5000 and has a test route
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import User from "./models/user.js";
import bcrypt from "bcrypt";
// Assuming you have a User model defined in models/user.js
const app = express();

// const salt = bcrypt.genSaltSync(10);

// Connect to MongoDB
await mongoose.connect(
  "mongodb+srv://jaysawwalakhe1234:jay0504@cluster0.pivfgrh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
);

app.use(cors());
app.use(express.json()); // Middleware to parse JSON bodies
app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  // Check if username or password is empty
  //use bcrpt for hashing the password
const hashedPassword = bcrypt.hashSync(password, 10);

  const userDoc = await User.create({ username,
     password: hashedPassword
  });
  res.json({ user: userDoc });
  // res.json({ requestData: { username, password } });
});
app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});
