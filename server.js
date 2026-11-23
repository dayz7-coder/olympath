import express from "express";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { db } from "./db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(cors());
app.use(express.json());

const nextId = (arr) => (arr.length ? Math.max(...arr.map(x => Number(x.id) || 0)) + 1 : 1);

/* ---------- ПРОФИЛЬ ---------- */
app.get("/api/profile", (_req, res) => {
  res.json(db.get().profile);
});

app.put("/api/profile", (req, res) => {
  const { name = "", grade = "", region = "", goal = "Победа в олимпиаде",
          university = "", direction = "", subjects = [] } = req.body;
  db.update(d => { d.profile = { name, grade, region, goal, university, direction, subjects }; });
  res.json({ ok: true });
});

/* ---------- ЗАДАЧИ ---------- */
app.get("/api/tasks", (_req, res) => res.json(db.get().tasks));

app.post("/api/tasks", (req, res) => {
  const { title, stage } = req.body;
  const task = db.update(d => {
    const t = { id: nextId(d.tasks), title, stage, done: false };
    d.tasks.push(t);
    return t;
  });
  res.status(201).json(task);
});

app.patch("/api/tasks/:id", (req, res) => {
  const id = Number(req.params.id);
  const { done, title, stage } = req.body;
  db.update(d => {
    const t = d.tasks.find(x => x.id === id);
    if (!t) return;
    if (done !== undefined) t.done = !!done;
    if (title !== undefined) t.title = title;
    if (stage !== undefined) t.stage = stage;
  });
  res.json({ ok: true });
});

app.delete("/api/tasks/:id", (req, res) => {
  const id = Number(req.params.id);
  db.update(d => { d.tasks = d.tasks.filter(x => x.id !== id); });
  res.json({ ok: true });
});

app.delete("/api/tasks", (_req, res) => {
  db.update(d => { d.tasks = []; });
  res.json({ ok: true });
});

/* ---------- НАПОМИНАНИЯ ---------- */
app.get("/api/reminders", (_req, res) => res.json(db.get().reminders));

app.post("/api/reminders", (req, res) => {
  const { name, date, type } = req.body;
  const item = db.update(d => {
    const r = { id: nextId(d.reminders), name, date, type };
    d.reminders.push(r);
    return r;
  });
  res.status(201).json(item);
});

app.delete("/api/reminders/:id", (req, res) => {
  const id = Number(req.params.id);
  db.update(d => { d.reminders = d.reminders.filter(x => x.id !== id); });
  res.json({ ok: true });
});

/* ---------- ДОСТИЖЕНИЯ ---------- */
app.get("/api/achievements", (_req, res) => res.json(db.get().achievements));

app.post("/api/achievements", (req, res) => {
  const { name, result, subject, year } = req.body;
  const item = db.update(d => {
    const a = { id: nextId(d.achievements), name, result, subject, year: Number(year) };
    d.achievements.push(a);
    return a;
  });
  res.status(201).json(item);
});

app.delete("/api/achievements/:id", (req, res) => {
  const id = Number(req.params.id);
  db.update(d => { d.achievements = d.achievements.filter(x => x.id !== id); });
  res.json({ ok: true });
});

/* ---------- ВУЗЫ ---------- */
app.get("/api/universities", (_req, res) => res.json(db.get().universities));

app.post("/api/universities", (req, res) => {
  const { name, direction = "", benefit = "" } = req.body;
  const item = db.update(d => {
    const u = { id: nextId(d.universities), name, direction, benefit };
    d.universities.push(u);
    return u;
  });
  res.status(201).json(item);
});

app.delete("/api/universities/:id", (req, res) => {
  const id = Number(req.params.id);
  db.update(d => { d.universities = d.universities.filter(x => x.id !== id); });
  res.json({ ok: true });
});

/* ---------- ИЗБРАННОЕ ---------- */
app.get("/api/favorites", (_req, res) => res.json(db.get().favorites));

app.post("/api/favorites/:id", (req, res) => {
  const id = Number(req.params.id);
  db.update(d => { if (!d.favorites.includes(id)) d.favorites.push(id); });
  res.json({ ok: true });
});

app.delete("/api/favorites/:id", (req, res) => {
  const id = Number(req.params.id);
  db.update(d => { d.favorites = d.favorites.filter(x => x !== id); });
  res.json({ ok: true });
});

/* ---------- ФРОНТЕНД (index.html) ---------- */
app.use(express.static(__dirname));
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api")) return next();
  res.sendFile(path.join(__dirname, "index.html"));
});

const PORT = process.env.PORT||4000;
app.listen(PORT, () => console.log(`API: http://localhost:${PORT}`));