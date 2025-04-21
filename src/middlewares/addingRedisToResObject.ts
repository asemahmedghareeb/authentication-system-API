import { NextFunction, Request, Response } from 'express';
import redisClient from '../config/redis';
const addingRedisToResObject = (req: Request, res: Response, next: NextFunction)  => {
    req.redisClient = redisClient;
    next(); 
}
export default addingRedisToResObject;