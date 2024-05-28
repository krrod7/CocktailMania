const express = require('express');
const router = express.Router();
const cocktailConfig = require('../config/cocktailConfig');
const app = express();
const client = redis.createClient(process.env.REDISCLOUD_URL);
const cors = require('cors');

client.on('error', (err) => {
    console.error('Error connecting to Redis:', err);
});

// Use CORS middleware
app.use(cors({
    origin: 'https://cocktail-mania2.vercel.app', // Update this to your Vercel app's URL
    optionsSuccessStatus: 200
}));

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



        console.table(`drinks: ${parsedData}`);
        let response = await redis.set("drinkInfo", parsedData, "EX", 15);
        parsedData.cached = false;
        res.json(parsedData);
    } catch (err) {
        console.log(`Error: ${err}`);
    }
})
module.exports = router; //the export makes router visible to any file that require()s it