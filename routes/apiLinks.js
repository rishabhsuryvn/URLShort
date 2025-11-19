// routes/apiLinks.js
const express = require("express");
const router = express.Router();
const db = require("../db");
const { isValidCode, isValidURL } = require("../utils/validators");

// POST /api/links  -> create link (409 if code exists)
router.post("/", async (req, res) => {
  const { target, code } = req.body;
  if (!target || !isValidURL(target)) {
    return res.status(400).json({ error: "Invalid target URL" });
  }
  if (code && !isValidCode(code)) {
    return res
      .status(400)
      .json({ error: "Invalid code format (A-Za-z0-9, 6-8 chars)" });
  }

  // if no code provided, generate a random 7-char code
  const generateCode = () => {
    const chars =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let out = "";
    for (let i = 0; i < 7; i++)
      out += chars[Math.floor(Math.random() * chars.length)];
    return out;
  };

  try {
    let chosen = code;
    if (!chosen) {
      // generate until unique (few attempts)
      let attempts = 0;
      do {
        chosen = generateCode();
        const { rows } = await db.query(
          "SELECT code FROM links WHERE code=$1",
          [chosen]
        );
        if (rows.length === 0) break;
        attempts++;
      } while (attempts < 5);
      // if still colliding, try longer
      if (attempts >= 5) {
        chosen =
          generateCode() + Math.floor(Math.random() * 90 + 10).toString();
        chosen = chosen.substring(0, 8);
      }
    } else {
      // ensure code not taken
      const { rows } = await db.query("SELECT code FROM links WHERE code=$1", [
        chosen,
      ]);
      if (rows.length)
        return res.status(409).json({ error: "Code already exists" });
    }

    const insert = await db.query(
      "INSERT INTO links(code, target_url) VALUES($1, $2) RETURNING code, target_url, clicks, last_clicked, created_at",
      [chosen, target]
    );

    return res.status(201).json(insert.rows[0]);
  } catch (err) {
    console.error("POST /api/links error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// GET /api/links -> list all links
router.get("/", async (req, res) => {
  try {
    const result = await db.query(
      "SELECT code, target_url, clicks, last_clicked, created_at FROM links ORDER BY created_at DESC"
    );
    return res.json(result.rows);
  } catch (err) {
    console.error("GET /api/links error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// GET /api/links/:code -> stats for single code
router.get("/:code", async (req, res) => {
  const { code } = req.params;
  try {
    const result = await db.query(
      "SELECT code, target_url, clicks, last_clicked, created_at FROM links WHERE code=$1",
      [code]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: "Not found" });
    return res.json(result.rows[0]);
  } catch (err) {
    console.error("GET /api/links/:code error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// DELETE /api/links/:code -> delete link
router.delete("/:code", async (req, res) => {
  const { code } = req.params;
  try {
    const del = await db.query(
      "DELETE FROM links WHERE code=$1 RETURNING code",
      [code]
    );
    if (del.rows.length === 0)
      return res.status(404).json({ error: "Not found" });
    return res.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/links/:code error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
