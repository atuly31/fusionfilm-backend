import express from "express";
import bodyParser from "body-parser";
import db from "./ConfigDB/ConnectDB.js";
import session from "express-session";
import cors from "cors";
import bcrypt from 'bcryptjs'; // Instead of 'bcrypt'
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import dotenv from "dotenv";
import pgSession from "connect-pg-simple";
// import { verify } from "crypto";
dotenv.config();
const app = express();
const PORT = 4000;
app.use(express.json());

app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// Routes
app.post("/loginSignup", async (req, res) => {
  const {action} = req.body
  console.log(action)
  if (action === "register") {
    const { name, password, email } = req.body;
    console.log("Register",name, password, email);
    try {
      console.log("Checking if user already exists...");
      const CheckUser = await db.query(
        "SELECT * FROM user_details WHERE email = $1",
        [email]
      );
      console.log("User check result:", CheckUser);

      if (CheckUser.rowCount > 0) {
        return res.status(409).send("User Already Exists");
      }

      console.log("Hashing password...");
      const hash = await bcrypt.hash(password, 10);
      console.log("Password hashed:", hash);

      console.log("Inserting new user...");
      const newUser = await db.query(
        "INSERT INTO user_details (password, email, name) VALUES ($1, $2, $3) RETURNING *",
        [hash, email, name]
      );
      console.log("New user inserted:", newUser);
    //  const{id,email,name} = newUser.rows[0]
       // Current_user_id = newUser.rows[0].id;
      res.status(201).send(newUser.rows[0]);
    } catch (error) {
      console.log("Inside catch")
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
      const data = await db.query(
        "SELECT * FROM user_details WHERE email = ($1)",
        [email]
      );
  
      console.log("Data from DB:", data.rowCount);
  
      if (data.rowCount === 0) {
        return res.status(401).send("No user found");
      }
  
      const storedPassword = data.rows[0].password;
      console.log("Password from DB:", storedPassword);
  
      const isMatch = await bcrypt.compare(password, storedPassword);
      if (!isMatch) {
        return res.status(401).send("Invalid password");
      }
      return res.status(200).send(data.rows[0])
      console.log("User authenticated", data.rows[0])
    } catch (error) {
      console.error("Error during login:", error);
      return res.status(500).send("Error during login");
    }
  }
  
});

app.post("/", async (req, res) => {
  const { title, year, poster, runtime, imdbRating, userRating, imdbID } =
    req.body;
   const {currentUser} = req.body
  console.log("Cuurent user Id in post", currentUser);
  try {
    await db.query(
      "INSERT INTO LikedMovies (user_id, title, year, poster, runtime, imdbRating, userRating, imdbID) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
      [
        currentUser,
        title,
        year,
        poster,
        runtime,
        imdbRating,
        userRating,
        imdbID,
      ]
    );

    const response = await db.query(
      "SELECT * FROM user_details u1 INNER JOIN LikedMovies l1 ON u1.id = l1.user_id WHERE user_id = $1",
      [Current_user_id]
    );

    res.status(201).send(response.rows);
  } catch (error) {
    console.error("Error inserting user:", error.message);
    res.status(500).send("Error inserting user");
  }
});

app.get("/", async (req, res) => {
    const { currentUser} = req.query
  try {
    // Current_user_id = data[0].id;
    const data = await db.query(
      "SELECT * FROM user_details u1 INNER JOIN likedmovies l1 ON u1.id = l1.user_id WHERE user_id = $1",
      [currentUser]
    );
    res.status(200).send(data.rows);
  } catch (error) {
    console.error("Profile Fetch Error:", error.message);
    res.status(500).send("Error fetching profile data");
  }
});

app.get("/dashboard", async (req, res) => {
    const {currentUser} = req.query
    console.log("in the dashboard",currentUser)
  try {
    const data = await db.query(
      "SELECT u1.id, u1.email,u1.name,l1.title FROM user_details u1 inner JOIN likedmovies l1 ON u1.id = l1.user_id WHERE user_id = $1",
      [currentUser]
    );
    console.log(data.rows)
    res.status(200).send(data.rows);
  } catch (error) {
    console.error("Profile Fetch Error:", error.message);
    res.status(500).send("Error fetching profile data");
  }
});

app.delete("/", async (req, res) => {
  const { movieID } = req.body;
  console.log(movieID)
  try {
    const response = await db.query("DELETE FROM likedmovies WHERE imdbid =($1)",[movieID])
    console.log(response)
    res.status(200).send("Deleted Successfully");
  } catch (error) {
    console.error("Profile Fetch Error:", error.message);
    res.status(500).send("Error fetching profile data");
   }
 

 });

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
export default app;
