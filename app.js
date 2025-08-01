import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { getDashboardDB } from './config/ConnectMongoDB.js';
import Routes from './Routes/routes.js';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import webhookRoutes from './Routes/webhookRoutes.js'
import callback from './Routes/Callback_temp.js';

const app = express();
const PORT = process.env.PORT || 3000;
const DASHBOARD_DB_URI = process.env.DASHBOARD_DB_URI;

// Define __dirname for ES Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename)

// Connect to MongoDB
getDashboardDB(DASHBOARD_DB_URI)

app.use(cors()); // Enables CORS for all routes

// Add this line to parse JSON bodies
app.use(express.json()); 

//view engine 
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, "views"))

// Static files (optional, if you have CSS/JS/images in "public")
app.use(express.static(path.join(__dirname, 'public')));

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET_KEY,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // set to true if using HTTPS
}));

app.get('/', (req, res)=>{
    res.send("API is runnig")
})


// Routes
app.use('/', Routes);
app.use('/', webhookRoutes);
app.use('/', callback);

app.listen(PORT, () =>{
    console.log(`Server is listening on http://localhost:${PORT}`);
})