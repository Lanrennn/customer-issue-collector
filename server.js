const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, "issues.json");

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.static(__dirname));

function readIssues() {
  try {
    const raw = fs.readFileSync(DB_PATH, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    return [];
  }
}

function writeIssues(list) {
  fs.writeFileSync(DB_PATH, JSON.stringify(list, null, 2), "utf8");
}

app.get("/api/issues", (req, res) => {
  res.json(readIssues());
});

app.post("/api/issues", (req, res) => {
  if (!Array.isArray(req.body)) {
    return res.status(400).json({ error: "Body must be an array of issues" });
  }
  writeIssues(req.body);
  return res.json({ ok: true });
});

app.delete("/api/issues", (req, res) => {
  writeIssues([]);
  return res.json({ ok: true });
});

app.listen(PORT, "0.0.0.0", () => {
  // eslint-disable-next-line no-console
  console.log(`Server running at http://0.0.0.0:${PORT}`);
});


