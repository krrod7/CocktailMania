const express = require('express');
const redis = require('redis');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const router = express.Router();

// Use CORS middleware
app.use(cors({
    origin: 'https://cocktail-mania2.vercel.app', // Update this to your Vercel app's URL
    optionsSuccessStatus: 200
}));

// Create Redis client
let client;
try {
    client = redis.createClient(process.env.REDISCLOUD_URL);
} catch (error) {
    console.error('Error creating Redis client:', error);
}

client.on('error', (err) => {
    console.error('Error connecting to Redis:', err);
});

// Define the drinks route
router.get('/drinks', async (req, res) => {
    const searchTerm = req.query.search;
    const cocktailConfig = {
        url: 'https://www.thecocktaildb.com/api/json/v1/1/search.php',
        queryString: `?s=${searchTerm}`
    };

    try {
        client.get("drinkInfo", async (err, cachedData) => {
            if (cachedData) {
                let parsedData = JSON.parse(cachedData);
                console.log(`Cached: ${parsedData}`);
                parsedData.cached = true;
                return res.json(parsedData);
            }

            const rawDrinkInfo = await fetch(cocktailConfig.url + cocktailConfig.queryString);
            const parsedData = await rawDrinkInfo.json();
            console.table(parsedData.drinks);

            client.setex("drinkInfo", 15, JSON.stringify(parsedData));
            parsedData.cached = false;
            res.json(parsedData);
        });
    } catch (err) {
        console.log(`Error: ${err}`);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Use JSON middleware
app.use(express.json());

// Integrate the router into the app
app.use('/', router);

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});