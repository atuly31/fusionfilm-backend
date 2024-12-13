import express from "express";
import bodyParser from "body-parser";
import db from "./ConfigDB/ConnectDB.js";
import session from "express-session";
import cors from "cors";
import bcrypt from 'bcryptjs';
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import dotenv from "dotenv";
import pgSession from "connect-pg-simple";

dotenv.config();
const app = express();
const PORT = 4000;
app.use(express.json());

app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  cors({
    origin: "https://film-fusion-teal.vercel.app",
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

app.options("*", cors());

// Routes


app.post("/loginSignup", async (req, res) => {
  const { action } = req.body;
  console.log(action);
  if (action === "register") {
    const { name, password, email } = req.body;
    console.log("Register", name, password, email);
    try {
      console.log("Checking if user already exists...");
      const CheckUser = await db`SELECT * FROM user_details WHERE email = ${email}`;
      console.log("User check result:", CheckUser);

      if (CheckUser.length > 0) {
        return res.status(409).send("User Already Exists");
      }

      console.log("Hashing password...");
      const hash = await bcrypt.hash(password, 10);
      console.log("Password hashed:", hash);

      console.log("Inserting new user...");
      const newUser = await db`
        INSERT INTO user_details (password, email, name) 
        VALUES (${hash}, ${email}, ${name}) 
        RETURNING *`;
      console.log("New user inserted:", newUser);
      res.status(201).send(newUser[0]);
    } catch (error) {
      console.log("Inside catch");
      console.error(
        "Registration Error you are in catch block now :",
        error.message
      );
      res.status(500).send("Error registering user");
    }
  }

  if (action === "login") {
    const { password, email } = req.body;
    console.log("login", password, email);
    try {
      const data = await db`SELECT * FROM user_details WHERE email = ${email}`;
      console.log("Data from DB:", data);

      if (data.length === 0) {
        return res.status(401).send("No user found");
      }

      const storedPassword = data[0].password;
      console.log("Password from DB:", storedPassword);

      const isMatch = await bcrypt.compare(password, storedPassword);
      if (!isMatch) {
        return res.status(401).send("Invalid password");
      }
      return res.status(200).send(data[0]);
    } catch (error) {
      console.error("Error during login:", error);
      return res.status(500).send("Error during login");
    }
  }
});

app.post("/", async (req, res) => {
  const { title, year, poster, runtime, imdbRating, userRating, imdbID } =
    req.body;
  const { currentUser } = req.body;
  console.log("Cuurent user Id in post", currentUser);
  try {
    await db`
      INSERT INTO LikedMovies (user_id, title, year, poster, runtime, imdbRating, userRating, imdbID) 
      VALUES (${currentUser}, ${title}, ${year}, ${poster}, ${runtime}, ${imdbRating}, ${userRating}, ${imdbID})`;

    const response = await db`
      SELECT * FROM user_details u1 
      INNER JOIN LikedMovies l1 ON u1.id = l1.user_id 
      WHERE user_id = ${currentUser}`;

    res.status(201).send(response);
  } catch (error) {
    console.error("Error inserting user:", error.message);
    res.status(500).send("Error inserting user");
  }
});

app.get("/", async (req, res) => {
  const { currentUser } = req.query;
  try {
    const data = await db`
      SELECT * FROM user_details u1 
      INNER JOIN likedmovies l1 ON u1.id = l1.user_id 
      WHERE user_id = ${currentUser}`;
    res.status(200).send(data);
  } catch (error) {
    console.error("Profile Fetch Error:", error.message);
    res.status(500).send("Error fetching profile data");
  }
});

app.get("/dashboard", async (req, res) => {
  const { currentUser } = req.query;
  console.log("in the dashboard", currentUser);
  try {
    const data = await db`
      SELECT u1.id, u1.email, u1.name, l1.title 
      FROM user_details u1 
      INNER JOIN likedmovies l1 ON u1.id = l1.user_id 
      WHERE user_id = ${currentUser}`;
    console.log(data);
    res.status(200).send(data);
  } catch (error) {
    console.error("Profile Fetch Error:", error.message);
    res.status(500).send("Error fetching profile data");
  }
});

app.delete("/", async (req, res) => {
  const { movieID } = req.body;
  console.log(movieID);
  try {
    const response = await db`
      DELETE FROM likedmovies 
      WHERE imdbid = ${movieID}`;
    console.log(response);
    res.status(200).send("Deleted Successfully");
  } catch (error) {
    console.error("Profile Fetch Error:", error.message);
    res.status(500).send("Error fetching profile data");
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
export default app;
