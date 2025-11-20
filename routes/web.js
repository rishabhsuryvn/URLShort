const express = require("express");
const router = express.Router();
const db = require("../db");
const { isValidCode, isValidURL } = require("../utils/validators");

// Dashboard (GET /)
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

// FORM handler: POST
router.post("/links", async (req, res) => {
  const target = req.body.target;
  const code =
    req.body.code && req.body.code.trim() ? req.body.code.trim() : undefined;

  if (!target || !isValidURL(target)) {
    return res.redirect("/?error=invalid_url");
  }
  if (code && !isValidCode(code)) {
    return res.redirect("/?error=invalid_code");
  }

  try {
    if (code) {
      const { rows } = await db.query("SELECT code FROM links WHERE code=$1", [
        code,
      ]);
      if (rows.length) return res.redirect("/?error=duplicate_code");
    }

    const generateCode = () => {
      const chars =
        "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      let out = "";
      for (let i = 0; i < 7; i++)
        out += chars[Math.floor(Math.random() * chars.length)];
      return out;
    };

    let chosen = code;
    if (!chosen) {
      let attempts = 0;
      do {
        chosen = generateCode();
        const r = await db.query("SELECT code FROM links WHERE code=$1", [
          chosen,
        ]);
        if (r.rows.length === 0) break;
        attempts++;
      } while (attempts < 5);
      if (attempts >= 5)
        chosen = (
          generateCode() + Math.floor(Math.random() * 90 + 10)
        ).substring(0, 8);
    }

    await db.query("INSERT INTO links(code, target_url) VALUES($1, $2)", [
      chosen,
      target,
    ]);
    return res.redirect("/");
  } catch (err) {
    console.error("POST /links error", err);
    return res.redirect("/?error=server");
  }
});

// FORM handler: POST
router.post("/links/:code/delete", async (req, res) => {
  const { code } = req.params;
  try {
    await db.query("DELETE FROM links WHERE code=$1", [code]);
    return res.redirect("/");
  } catch (err) {
    console.error("POST /links/:code/delete error", err);
    return res.redirect("/?error=server");
  }
});

// Stats page:
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

// Redirect
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
