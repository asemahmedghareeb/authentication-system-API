import Redis from "ioredis";

declare module 'express' {
    interface Request {
        userId?: string;
        role?: string;
        redisClient?: Redis;
    }
}


