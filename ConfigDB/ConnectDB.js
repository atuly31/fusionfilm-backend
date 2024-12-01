
import pg from 'pg';

const password = "Atulyadav31";
const db = new pg.Client({
  user: "postgres",
  password,
  database: "User",
  port: 5432,
});

async function connectDB() {
  try {
    await db.connect(); // Establish connection to the database
    console.log("Connected to the database successfully!");
    console.log(password);
  } catch (err) {
    console.error("Error connecting to the database:", err.stack);
  }
}

connectDB();

export default db;
