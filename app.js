import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { getDashboardDB } from "./config/ConnectMongoDB.js";
import Routes from "./Routes/routes.js";
import session from "express-session";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import webhookRoutes from "./Routes/webhookRoutes.js";
import callback from "./Routes/CallbackRoute.js";
import bodyParser from "body-parser";
import googleRoutes from "./Routes/googleRoutes.js";
import calendarRoutes from "./Routes/CalenderRoutes.js";
import authRoutes from "./Routes/authRoutes.js";
import OrganisationRoutes from "./Routes/organisationRoutes.js";
const app = express();
const PORT = process.env.PORT || 3001;
const DASHBOARD_DB_URI = process.env.DASHBOARD_DB_URI;

// Define __dirname for ES Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Connect to MongoDB
getDashboardDB(DASHBOARD_DB_URI);

// ------------------ CORS CONFIG ------------------
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3001",
  "https://meta-testing-3.vercel.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (like mobile apps, Postman, curl)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS: " + origin));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // allow preflight
    allowedHeaders: ["Content-Type", "Authorization"], // allow custom headers
    credentials: true,
  })
);

// Parse request body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());

// View engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Static files (optional)
app.use(express.static(path.join(__dirname, "public")));

// Session middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET_KEY,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // set to true if using HTTPS
  })
);

// Health check route
app.get("/", (req, res) => {
  res.send("API is running...");
});

// ROUTES
app.use("/", OrganisationRoutes);
app.use("/", authRoutes);
app.use("/", Routes);
app.use("/", webhookRoutes);
app.use("/", callback);
app.use("/", googleRoutes);
app.use("/", calendarRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Server is listening on http://localhost:${PORT}`);
});

// import dotenv from "dotenv";
// dotenv.config();

// import express from "express";
// import { getDashboardDB } from "./config/ConnectMongoDB.js";
// // import session from "express-session";
// import path from "path";
// import { fileURLToPath } from "url";
// import cors from "cors";
// import bodyParser from "body-parser";
// import authRoutes from "./Routes/authRoutes.js";
// import Routes from "./Routes/routes.js";
// import webhookRoutes from "./Routes/webhookRoutes.js";
// import callback from "./Routes/CallbackRoute.js";
// import googleROutes from "./Routes/googleRoutes.js";

// const app = express();
// const PORT = process.env.PORT || 3001;
// const DASHBOARD_DB_URI = process.env.DASHBOARD_DB_URI;

// // Define __dirname for ES Module
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// // Connect DB
// getDashboardDB(DASHBOARD_DB_URI);

// // CORS CONFIG
// const allowedOrigins = [
//   "http://localhost:5173",
//   "http://localhost:5174",
//   "http://localhost:3001",
//   "https://meta-testing-3.vercel.app",
// ];

// app.use(
//   cors({
//     origin: function (origin, callback) {
//       // allow requests with no origin (like Postman, curl)
//       if (!origin || allowedOrigins.includes(origin)) {
//         callback(null, true);
//       } else {
//         callback(new Error("Not allowed by CORS: " + origin));
//       }
//     },
//     methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
//     allowedHeaders: ["Content-Type", "Authorization"],
//     credentials: true,
//   })
// );

// // Explicit preflight handling
// app.options("*", cors());

// // Manual fallback headers (important for browsers)
// app.use((req, res, next) => {
//   if (allowedOrigins.includes(req.headers.origin)) {
//     res.header("Access-Control-Allow-Origin", req.headers.origin);
//   }
//   res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
//   res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
//   res.header("Access-Control-Allow-Credentials", "true");

//   if (req.method === "OPTIONS") {
//     return res.sendStatus(200);
//   }
//   next();
// });

// // Add this line to parse JSON bodies
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
// app.use(bodyParser.json());

// // view engine
// app.set("view engine", "ejs");
// app.set("views", path.join(__dirname, "views"));

// // Static files
// app.use(express.static(path.join(__dirname, "public")));

// // Session middleware
// // app.use(
// //   session({
// //     secret: process.env.SESSION_SECRET_KEY,
// //     resave: false,
// //     saveUninitialized: true,
// //     cookie: { secure: false }, // change to true if using HTTPS + proxy
// //   })
// // );

// // Routes

// // Example safe routes
// app.get("/", (req, res) => {
//   res.send("API is working ");
// });

// app.use("/", authRoutes);
// app.use("/", Routes);
// app.use("/", webhookRoutes);
// app.use("/", callback);
// app.use("/", googleROutes);

// app.listen(PORT, () => {
//   console.log(`Server is listening on http://localhost:${PORT}`);
// });
