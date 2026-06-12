import express from "express";
import path from "path";
import http from "http";
import fs from "fs";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  description: string;
  category: string;
  color: string;
}

const DB_PATH = path.join(process.cwd(), "events.json");

// Helper to get relative offset dates (YYYY-MM-DD format based on current local time)
function getOffsetDate(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function initializeDB() {
  if (!fs.existsSync(DB_PATH)) {
    const defaultEvents: Event[] = [
      {
        id: "event-1",
        title: "Sprint Planning Session",
        date: getOffsetDate(0), // today
        time: "10:00",
        description: "Review backlog and define goals for Sprint 14.",
        category: "Work",
        color: "#D77A61",
      },
      {
        id: "event-2",
        title: "Product Design Review",
        date: getOffsetDate(0), // today
        time: "14:30",
        description: "Sync with UX team regarding the new full-screen calendar look.",
        category: "Work",
        color: "#D77A61",
      },
      {
        id: "event-3",
        title: "Morning Yoga & Meditation",
        date: getOffsetDate(1), // tomorrow
        time: "08:15",
        description: "Re-center and stretch to prepare for a productive weekend.",
        category: "Health",
        color: "#223843",
      },
      {
        id: "event-4",
        title: "Doctor Checkup",
        date: getOffsetDate(-3), // 3 days ago
        time: "15:00",
        description: "Routine checkup and bloodwork.",
        category: "Personal",
        color: "#D77A61",
      },
      {
        id: "event-5",
        title: "Server Migration Deadline",
        date: getOffsetDate(3), // 3 days from now
        time: "23:59",
        description: "Complete Cloud migration of legacy user records. Highly critical!",
        category: "Urgent",
        color: "#D77A61",
      },
      {
        id: "event-6",
        title: "Fireside Happy Hour 🥂",
        date: getOffsetDate(5), // 5 days from now
        time: "17:30",
        description: "Relax, share drinks and play virtual board games with the crew.",
        category: "Leisure",
        color: "#223843",
      },
    ];
    fs.writeFileSync(DB_PATH, JSON.stringify(defaultEvents, null, 2), "utf-8");
  }
}

function readEvents(): Event[] {
  try {
    initializeDB();
    const data = fs.readFileSync(DB_PATH, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading database:", err);
    return [];
  }
}

function writeEvents(events: Event[]) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(events, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing to database:", err);
  }
}

async function startServer() {
  const app = express();
  app.use(express.json());

  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST", "PUT", "DELETE"],
    },
  });

  const PORT = 3000;
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

  // Init DB file
  initializeDB();

  // Socket.IO communication
  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);
    
    // Send full state to client on connect
    socket.emit("initial_sync", readEvents());

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  // Middleware to authorize admin actions
  const requireAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization;
    if (authHeader === "Bearer admin-session-token-active") {
      next();
    } else {
      res.status(401).json({ success: false, error: "Unauthorized access. Admin login required." });
    }
  };

  // API Endpoints
  app.post("/api/auth/login", (req, res) => {
    const { password } = req.body;
    if (password === adminPassword) {
      res.json({ success: true, token: "admin-session-token-active" });
    } else {
      res.status(401).json({ success: false, error: "Incorrect admin password" });
    }
  });

  app.get("/api/events", (req, res) => {
    res.json(readEvents());
  });

  app.post("/api/events", requireAdmin, (req, res) => {
    const { title, date, time, description, category, color } = req.body;
    if (!title || !date) {
      res.status(400).json({ success: false, error: "Title and date are required" });
      return;
    }
    const events = readEvents();
    const newEvent: Event = {
      id: "evt-" + Math.random().toString(36).substring(2, 11),
      title,
      date,
      time: time || "",
      description: description || "",
      category: category || "General",
      color: color || "#D77A61",
    };
    events.push(newEvent);
    writeEvents(events);

    // Broadcast update
    io.emit("events_updated", events);
    res.status(201).json({ success: true, event: newEvent });
  });

  app.put("/api/events/:id", requireAdmin, (req, res) => {
    const { id } = req.params;
    const { title, date, time, description, category, color } = req.body;
    
    const events = readEvents();
    const index = events.findIndex(e => e.id === id);
    if (index === -1) {
      res.status(404).json({ success: false, error: "Event not found" });
      return;
    }

    events[index] = {
      ...events[index],
      title: title ?? events[index].title,
      date: date ?? events[index].date,
      time: time ?? events[index].time,
      description: description ?? events[index].description,
      category: category ?? events[index].category,
      color: color ?? events[index].color,
    };

    writeEvents(events);

    // Broadcast update
    io.emit("events_updated", events);
    res.json({ success: true, event: events[index] });
  });

  app.delete("/api/events/:id", requireAdmin, (req, res) => {
    const { id } = req.params;
    const events = readEvents();
    const filtered = events.filter(e => e.id !== id);

    if (events.length === filtered.length) {
      res.status(404).json({ success: false, error: "Event not found" });
      return;
    }

    writeEvents(filtered);

    // Broadcast update
    io.emit("events_updated", filtered);
    res.json({ success: true, message: "Event deleted successfully" });
  });

  // Vite static vs dev middleware placement
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // Support single-page routing or static catch-all
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start full-stack server:", error);
});
