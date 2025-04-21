import {  NextFunction, Request, Response } from "express";
import { appError, asyncHandler } from "../utils/errorHandling.ts";
import { FAILED } from "../utils/httpStatus.ts";
import jwt from "jsonwebtoken";

import { OAuth2Client } from 'google-auth-library';
import dotenv from 'dotenv';
import { IUser, User } from "../models/user.ts";
dotenv.config();
const client = new OAuth2Client({ clientId: process.env.CLIENT_ID!, clientSecret: process.env.CLIENT_SECRET! });

const verifyGoogleAccessToken = async (accessToken: string) => {
    try {
        await client.getTokenInfo(accessToken);
        return 'valid';

    } catch (error: any) {
        console.error('Error verifying Google access token:', error.message);
        return null;
    }

};

const protectedRoute = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    let authHeader = req.headers.authorization;
    let accessToken: string | undefined;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        accessToken = authHeader.split(' ')[1] as string;
    }
    if (!accessToken) {
        return next(appError.createError("you are not logged in", 401, FAILED));
    }
    //oauth token verification
    const verificationResult = await verifyGoogleAccessToken(accessToken);
    if (verificationResult === "valid") {
        const res = await req.redisClient?.get(accessToken);
        if (!res) {
            const user: IUser | null = await User.findOne({ accessToken });
            if (!user) {
                return next(appError.createError("user not found", 404, FAILED));
            }
            const accessTokenExprires =user.accessTokenExpires!;
            await req.redisClient?.set(accessToken, JSON.stringify({ id: user?._id.toString()!, role: user?.role }), "EX", accessTokenExprires.getTime() - Date.now());
            req.userId = user?._id.toString()!;
            req.role = user?.role!;
            return next();
        }

        const { id, role } = JSON.parse(res);
        req.userId = id;
        req.role = role;
        return next();
    }


    //jwt token verification
    const decoded = jwt.verify(accessToken, process.env["ACCESS_TOKEN_SECRET"]!);
    if (decoded) {
        const { userId, role } = decoded as { userId: string; role: string; };
        req.userId = userId;
        req.role = role;
        return next();
    }

    return next(appError.createError("you are not logged in", 401, FAILED));

});



export default protectedRoute;