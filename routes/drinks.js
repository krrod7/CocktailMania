const express = require('express');
const router = express.Router();
const cocktailConfig = require('../config/cocktailConfig');
const Redis = require('ioredis');

const redisUrl = process.env.REDISCLOUD_URL;
console.log('Redis URL:', redisUrl); // Log the Redis URL

const redis = new Redis(redisUrl);

redis.on('connect', () => {
    console.log('Connected to Redis');
});

redis.on('error', (err) => {
    console.error('Redis connection error:', err);
});

//matches http://localhost:3000/drinks
//
router.get('/', async (req, res, next) => {
    const searchTerm = req.query.search
    const cocktailConfig = {
        url: 'https://www.thecocktaildb.com/api/json/v1/1/search.php',
        queryString: `?s=${searchTerm}`
    }

    try {
        let cachedData = await redis.get("drinkInfo");
        if (cachedData) {
            let parsedData = await JSON.parse(cachedData);
            console.log(`Cached: ${parsedData}`);
            parsedData.cached = true;
            res.json(parsedData)
        }
        let rawDrinkInfo = await fetch(cocktailConfig.url + cocktailConfig.queryString)
        let parsedData = await rawDrinkInfo.json();



        console.log('Data to be cached:', JSON.stringify(parsedData));
        await redis.set("drinkInfo", JSON.stringify(parsedData), "EX", 15);
        parsedData.cached = false;
        res.json(parsedData);
    } catch (err) {
        console.log(`Error: ${err}`);
    }
})
module.exports = router; //the export makes router visible to any file that require()s it