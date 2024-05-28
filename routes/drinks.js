const express = require('express');
const cors = require('cors');
const Redis = require('ioredis');
const fetch = require('node-fetch'); // Make sure to install node-fetch if you haven't already

const app = express();
const router = express.Router();
const redis = new Redis(process.env.REDISCLOUD_URL);

const allowedOrigins = ['https://cocktail-mania2.vercel.app'];

const corsOptions = {
    origin: function (origin, callback) {
        if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    }
};

app.use(cors(corsOptions));

router.get('/drinks', async (req, res, next) => {
    const searchTerm = req.query.search;
    const cocktailConfig = {
        url: 'https://www.thecocktaildb.com/api/json/v1/1/search.php',
        queryString: `?s=${searchTerm}`
    };

    try {
        let cachedData = await redis.get("drinkInfo");
        if (cachedData) {
            let parsedData = JSON.parse(cachedData);
            console.log(`Cached: ${parsedData}`);
            parsedData.cached = true;
            res.json(parsedData);
            return;
        }

        let rawDrinkInfo = await fetch(cocktailConfig.url + cocktailConfig.queryString);
        let parsedData = await rawDrinkInfo.json();

        console.table(parsedData);
        await redis.set("drinkInfo", JSON.stringify(parsedData), "EX", 15);
        parsedData.cached = false;
        res.json(parsedData);
    } catch (err) {
        console.log(`Error: ${err}`);
        res.status(500).send('Internal Server Error');
    }
})
module.exports = router; //the export makes router visible to any file that require()s it