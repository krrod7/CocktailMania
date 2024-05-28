const express = require('express');
const router = express.Router();
const cocktailConfig = require('../config/cocktailConfig');
const Redis = require('ioredis');
const redis = new Redis();
const cors = require('cors');

const app = express();
const client = redis.createClient(process.env.REDISCLOUD_URL);

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