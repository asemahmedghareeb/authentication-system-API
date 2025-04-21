import Redis from "ioredis";
import dotenv from "dotenv";
dotenv.config();
const REDIS_URL = process.env.REDIS_URL;
const redisClient = new Redis(REDIS_URL!).on("connect", () => {
    console.log("Redis connection established");
}).on("error", (err:any) => {
    console.log(err);
});
export default redisClient;   