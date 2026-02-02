const express = require("express");
const multer = require("multer");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const app = express();
const PORT = 3000;

// Static
app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));
app.use(express.urlencoded({ extended: true }));

// Database
const db = new sqlite3.Database("database.db");

db.run(`
  CREATE TABLE IF NOT EXISTS archivio (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT,
    nome TEXT,
    cognome TEXT,
    email TEXT,
    luogo TEXT,
    descrizione TEXT
  )
`);

// Multer
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// Upload
app.post("/upload", upload.single("immagine"), (req, res) => {
  const { nome, cognome, email, luogo, descrizione } = req.body;
  const filename = req.file.filename;

  db.run(
    `INSERT INTO archivio (filename, nome, cognome, email, luogo, descrizione)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [filename, nome, cognome, email, luogo, descrizione],
    () => res.redirect("/")
  );
});

// API archivio
app.get("/archivio", (req, res) => {
  db.all("SELECT * FROM archivio ORDER BY id DESC", (err, rows) => {
    res.json(rows);
  });
});

// Start
app.listen(PORT, () => {
  console.log("Server avviato su http://localhost:" + PORT);
});
