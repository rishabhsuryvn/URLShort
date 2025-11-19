// server.js
require("dotenv").config();
const express = require("express");
const path = require("path");
const helmet = require("helmet");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const apiLinks = require("./routes/apiLinks");
const webRoutes = require("./routes/web");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(morgan("dev"));
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Health endpoint
app.get("/healthz", (req, res) => {
  res.json({ ok: true, version: "1.0" });
});

// API mount
app.use("/api/links", apiLinks);

// Web pages
app.use("/", webRoutes);

// 404
app.use((req, res) => {
  res.status(404).render("404", { message: "Not found" });
});

app.listen(PORT, () => {
  console.log(`TinyLink listening on ${PORT}`);
});
