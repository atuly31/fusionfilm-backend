// import pg from 'pg';
// import 'dotenv/config'

// const DB_Connection_String  = process.env.DB_Connection
// console.log(DB_Connection_String)
// const db = new pg.Client({
//   // user: process.env.DB_USER,
//   // password: passwordDB, 
//   // database: process.env.DB_DATABASE,
//   // port: parseInt(process.env.DB_PORT, 10), 
//   DB_Connection_String
// });

// async function connectDB() {
//   try {
//     await db.connect();
//     console.log("Connected to the database successfully!");
//   } catch (err) {
//     console.error("Error connecting to the database:", err.stack);
//   }
// }

// connectDB();

// export default db;
import postgres from 'postgres';

const connectionString = 'postgresql://postgres.nzgixvazibqokxzincbm:Atulyadav31@@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres';
console.log("Connection String:", connectionString);

const db = postgres(connectionString);

async function testConnection() {
  try {
    await db`SELECT 1`; // Simple query to test the connection
    console.log("Connected to the database successfully!");
  } catch (err) {
    console.error("Error connecting to the database:", err.message);
  }
}

testConnection();

export default db;

