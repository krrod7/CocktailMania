const express = require('express');
const router = express.Router();
const redis = require('redis');
const fetch = require('node-fetch');

let client;
try {
    client = redis.createClient(process.env.REDISCLOUD_URL);
    console.log('Redis client created successfully');
} catch (error) {
    console.error('Error creating Redis client:', error);
}

client.on('error', (err) => {
    console.error('Error connecting to Redis:', err);
});

router.get('/', async (req, res) => {
    const searchTerm = req.query.search;
    const cocktailConfig = {
        url: 'https://www.thecocktaildb.com/api/json/v1/1/search.php',
        queryString: `?s=${searchTerm}`
    };

    try {
        client.get("drinkInfo", async (err, cachedData) => {
            if (err) {
                console.error('Error getting data from Redis:', err);
                return res.status(500).json({ error: 'Internal Server Error' });
            }
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

module.exports = router;