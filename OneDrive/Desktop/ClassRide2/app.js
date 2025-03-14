const express = require("express");
const path = require("path");
const busOwnerRoutes = require("./src/routes/busOwnerRoutes"); // Import bus owner routes
const client = require("./src/config/db");

const app = express();
const PORT = process.env.PORT || 5000;

// Set EJS as the template engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src/views')); // Set views directory

// Serve static assets (CSS, JS, images)
app.use(express.static(path.join(__dirname, 'frontend/public')));

// Use the bus owner routes
app.use("/owner", busOwnerRoutes); // Access the dashboard at /owner/dashboard

// Start the Express server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
