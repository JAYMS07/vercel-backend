////new file code

// api/index.js
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import User from "./models/user.js";
import bcrypt from "bcrypt";
import JWT from "jsonwebtoken";
import cookieParser from "cookie-parser";
import multer from "multer";
import fs from "fs";
import Post from "./models/post.js";
// import PostPage from "../client/src/Pages/postPage.jsx";  

// Configure multer for file uploads n its node.js middleware for used uploading files
//create upload middleware for uploading files
const uploadMiddleware = multer({ dest: "uploads/" });

const app = express();
const secret = "asfdgggdskkk";

// Middlewares
app.use(express.json());
app.use(cookieParser());
app.use("/uploads", express.static("uploads")); // Serve uploaded files
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
// Connect to MongoDB
async function startServer() {
  try {
    await mongoose.connect(
      "mongodb+srv://jaysawwalakhe1234:jay0504@cluster0.pivfgrh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
    );
    console.log("✅ Connected to MongoDB");

    // Ensure cookies are sent in CORS responses
    app.use((req, res, next) => {
      res.header("Access-Control-Allow-Credentials", "true");
      next();
    });
  } catch (err) {
    console.error("❌ Error connecting to MongoDB:", err);
    process.exit(1);
  }

  // REGISTER
  app.post("/register", async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Username and password are required" });
    }
    // Check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: "Username already exists" });
    }
    const hashedPassword = bcrypt.hashSync(password, 10);
    const userDoc = await User.create({ username, password: hashedPassword });
    res.json({ user: userDoc });
  });

  // LOGIN
  app.post("/login", async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Username and password are required" });
    }
    const userDoc = await User.findOne({ username });

    if (!userDoc)
      return res.status(400).json({ message: "Invalid credentials" });

    const isPasswordValid = bcrypt.compareSync(password, userDoc.password);
    if (!isPasswordValid)
      return res.status(400).json({ message: "Invalid credentials" });

    JWT.sign({ username, id: userDoc._id }, secret, {}, (err, token) => {
      if (err)
        return res.status(500).json({ message: "Token generation failed" });

      res
        .cookie("token", token, {
          httpOnly: true,
          secure: false, // for localhost
          sameSite: "lax",
        })
        .json({ id: userDoc._id, username });
    });
  });

  // PROFILE
  app.get("/profile", (req, res) => {
    const { token } = req.cookies;
    if (!token) return res.status(401).json({ message: "No token provided" });

    JWT.verify(token, secret, {}, (err, info) => {
      if (err)
        return res.status(401).json({ message: "Invalid or expired token" });
      res.json(info);
    });
  });
  // Make sure your frontend fetch includes credentials:
  // fetch("http://localhost:5000/profile", { credentials: "include" })

  // LOGOUT
  app.post("/logout", (req, res) => {
    res
      .cookie("token", "", {
        httpOnly: true,
        sameSite: "lax",
        secure: false,
        maxAge: 0,
      })
      .json({ message: "Logged out" });
  });

  //createpost
  app.post("/post", uploadMiddleware.single("file"), async (req, res) => {
    const { originalname, path } = req.file;
    const parts = originalname.split(".");
    const exp = parts[parts.length - 1];
    const newPath = path + "." + exp;
    fs.renameSync(path, newPath);

    const { token } = req.cookies;
    JWT.verify(token, secret, {}, async (err, info) => {
      if (err) throw err;

      const { title, summary, content } = req.body;
      const postDoc = await Post.create({
        title,
        summary,
        content,
        cover: newPath,
        author: info.id,
      });

      res.json({ postDoc });
    });
  });

  //display posts
  // app.get("/post", async (req, res) => {
  //   // const posts = await Post.find();
  //   res.json(await Post.find());
  // });
  app.get("/post", async (req, res) => {
    try {
      const posts = await Post.find()
        .populate("author", ["username"])
        .sort({ createdAt: -1 })
        .limit(20);
      res.json(posts);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch posts" });
    }
  });

  //for single post
  app.get("/post/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const postDoc = await Post.findById(id).populate("author", ["username"]);

      if (!postDoc) {
        return res.status(404).json({ error: "Post not found" });
      }

      res.json(postDoc);
    } catch (err) {
      res
        .status(500)
        .json({ error: "Invalid ID format", details: err.message });
    }
  });

  // Update post

  // app.put("/post", uploadMiddleware.single("file"), async (req, res) => {
  //   let newPath = null;
  //   if (req.file) {
  //     const { originalname, path } = req.file;
  //     const parts = originalname.split(".");
  //     const ext = parts[parts.length - 1];
  //     newPath = path + "." + ext;
  //     fs.renameSync(path, newPath);
  //   }
  //   const { token } = req.cookies;
  //   JWT.verify(token, secret, {}, async (err, info) => {
  //     if (err) throw err;
  //     const { id, title, summary, content } = req.body;
  //     const postDoc = await Post.findById(id);
  //     const isAuthor = JSON.stringify(postDoc.author) === JSON.stringify(info.id);
  //       if (!isAuthor) {
  //     return res.status(400).json('you are not the author');
  //   }
  //   await postDoc.update({
  //     title,
  //     summary,
  //     content,
  //     cover: newPath ? newPath : postDoc.cover,
  //   });
  //   res.json(postDoc);

  // });
  // });


  // another method for updating posts
 
  app.put("/post/:id", uploadMiddleware.single("file"), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, summary, content } = req.body;

    let coverPath = req.body.cover; // keep old cover if not updated

    if (req.file) {
      const { originalname, path } = req.file;
      const ext = originalname.split(".").pop();
      const newPath = path + "." + ext;
      fs.renameSync(path, newPath);
      coverPath = "/uploads/" + newPath.split("\\").pop(); // ensure clean URL
    }

    const updatedPost = await Post.findByIdAndUpdate(
      id,
      { title, summary, content, cover: coverPath },
      { new: true }
    );

    if (!updatedPost) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.json(updatedPost);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error updating post" });
  }
});



  // START

  app.listen(5000, () => {
    console.log("🚀 Server running on http://localhost:5000");
  });
}
startServer();
