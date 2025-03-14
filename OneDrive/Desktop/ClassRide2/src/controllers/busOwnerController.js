const client = require('../config/db'); // Import the database client

const getDashboard = async (req, res) => {
    try {
        const ownerPhone = '1234567890';  // For now, use a static value for ownerPhone

        // Fetch the owner's name using owner_phone (from the 'users' table)
        const ownerResult = await client.query('SELECT * FROM users WHERE phone_number = $1', [ownerPhone]);

        if (ownerResult.rows.length === 0) {
            console.log("Owner not found");
            return res.status(404).send("Owner not found");
        }

        // Get the owner's full_name
        const ownerName = ownerResult.rows[0].full_name;  // Get the owner's full name

        // Log the name for debugging
        console.log("Owner Name: ", ownerName);

        // Fetch buses and drivers associated with the owner if needed
        const busesResult = await client.query('SELECT * FROM buses WHERE owner_phone = $1', [ownerPhone]);
        const driversResult = await client.query('SELECT * FROM drivers WHERE owner_phone = $1', [ownerPhone]);

        // Render the dashboard with the owner's name, buses, and drivers
        res.render('busOwnerDashboard', { 
            ownerName: ownerName, 
            buses: busesResult.rows,
            drivers: driversResult.rows
        });
    } catch (err) {
        console.error("Error fetching dashboard data", err.stack);
        res.status(500).send("Error loading dashboard");
    }
};

module.exports = { getDashboard };
