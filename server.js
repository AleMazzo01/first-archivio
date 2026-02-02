import express from "express";
import multer from "multer";
import dotenv from "dotenv";
import pkg from "pg";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";

dotenv.config();

const { Pool } = pkg;

const app = express();
const PORT = process.env.PORT || 3000;

/* ======================
   STATIC + BODY
====================== */
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

/* ======================
   DATABASE (PostgreSQL)
====================== */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// crea tabella se non esiste
await pool.query(`
  CREATE TABLE IF NOT EXISTS archivio (
    id SERIAL PRIMARY KEY,
    image_url TEXT,
    nome TEXT,
    cognome TEXT,
    email TEXT,
    luogo TEXT,
    descrizione TEXT
  );
`);

/* ======================
   CLOUDINARY
====================== */
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_KEY,
  api_secret: process.env.CLOUD_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "first-archivio",
    allowed_formats: ["jpg", "jpeg", "png"]
  }
});

const upload = multer({ storage });

/* ======================
   UPLOAD
====================== */
app.post("/upload", upload.single("immagine"), async (req, res) => {
  const { nome, cognome, email, luogo, descrizione } = req.body;

  await pool.query(
    `INSERT INTO archivio (image_url, nome, cognome, email, luogo, descrizione)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      req.file.path, // URL Cloudinary
      nome,
      cognome,
      email,
      luogo,
      descrizione
    ]
  );

  res.redirect("/");
});

/* ======================
   API ARCHIVIO
====================== */
app.get("/archivio", async (req, res) => {
  const result = await pool.query(
    "SELECT * FROM archivio ORDER BY id DESC"
  );
  res.json(result.rows);
});

/* ======================
   START
====================== */
app.listen(PORT, () => {
  console.log("Server avviato su porta " + PORT);
});
