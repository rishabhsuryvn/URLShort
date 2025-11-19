// routes/web.js
const express = require("express");
const router = express.Router();
const db = require("../db");

// Dashboard: /
router.get("/", async (req, res) => {
  try {
    const { rows } = await db.query(
      "SELECT code, target_url, clicks, last_clicked, created_at FROM links ORDER BY created_at DESC"
    );
    res.render("index", { links: rows, baseUrl: process.env.BASE_URL || "" });
  } catch (err) {
    console.error("GET / error", err);
    res.status(500).send("Server error");
  }
});

// Stats page: /code/:code
router.get("/code/:code", async (req, res) => {
  const { code } = req.params;
  try {
    const { rows } = await db.query(
      "SELECT code, target_url, clicks, last_clicked, created_at FROM links WHERE code=$1",
      [code]
    );
    if (rows.length === 0)
      return res.status(404).render("404", { message: "Code not found" });
    res.render("code", { link: rows[0], baseUrl: process.env.BASE_URL || "" });
  } catch (err) {
    console.error("GET /code/:code", err);
    res.status(500).send("Server error");
  }
});

// Redirect: /:code  (must be below explicit routes)
router.get("/:code", async (req, res) => {
  const { code } = req.params;
  try {
    const { rows } = await db.query(
      "SELECT target_url FROM links WHERE code=$1",
      [code]
    );
    if (rows.length === 0) {
      return res.status(404).render("404", { message: "Link not found" });
    }
    const target = rows[0].target_url;
    // increment clicks and update last_clicked
    await db.query(
      "UPDATE links SET clicks = clicks + 1, last_clicked = now() WHERE code=$1",
      [code]
    );
    return res.redirect(302, target);
  } catch (err) {
    console.error("GET /:code redirect error", err);
    return res.status(500).send("Server error");
  }
});

module.exports = router;
