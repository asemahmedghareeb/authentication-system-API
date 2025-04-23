import { NextFunction, Request, Response } from "express";
import { appError, asyncHandler } from "../utils/errorHandling.ts";
import { FAILED, SUCCESS } from "../utils/httpStatus.ts";
import { v4 as uuidv4 } from 'uuid';
import { IUser, User } from "../models/user.ts";
import getNewOauthAccessToken from "../utils/getNewOauthAccessToken.ts";
import dotenv from 'dotenv';
import { OAuth2Client } from "google-auth-library";
dotenv.config();


const authorizationCodeStore = new Map<string, { accessToken: string, refreshToken?: string, tokenExpiry?: Date, expiry: Date; }>();
const CODE_EXPIRATION_TIME = 60 * 1000; // 1 minute
const oAuth2Client = new OAuth2Client(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.CALLBACK_URL
);

const signup = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const code:any = req.query.code;
    const error:any = req.query.error;
    if (error) {
        console.error('Google OAuth login failed:', error);
        return res.redirect(303, `${process.env.CLIENT_URL}/auth-callback?error=google_login_failed`);
    }
    const result = await oAuth2Client.getToken(code);
    if (!result) {
        return res.redirect(303, `${process.env.CLIENT_URL}/auth-callback?error=true`);
    }
    await oAuth2Client.setCredentials(result.tokens);
    const user = oAuth2Client.credentials;
    const userData: any = await getUserData(user.access_token!);
    const userExists: IUser | null = await User.findOne({ email: userData.email });
    if (userExists) {
        userExists.accessToken = user.access_token!;
        userExists.accessTokenExpires = new Date(result.tokens.expiry_date! * 1000);
        userExists.refreshToken = user.refresh_token!;
        await userExists.save();

    } else {
        const newUser: IUser | null = new User({
            name: userData.name,
            email: userData.email,
            accessToken: user.access_token,
            refreshToken: user.refresh_token,
            accessTokenExpires: new Date(result.tokens.expiry_date! * 1000)
        });
        await newUser.save();

    }

    const authorizationCode = uuidv4();
    const redirectUrl = `${process.env.CLIENT_URL}/auth-callback?code=${authorizationCode}`;
    authorizationCodeStore.set(authorizationCode, {
        accessToken: user.access_token!,
        refreshToken: user.refresh_token!,
        tokenExpiry: new Date(result.tokens.expiry_date! * 1000),
        expiry: new Date(Date.now() + CODE_EXPIRATION_TIME),
    });

    return res.redirect(303, redirectUrl);
});

const OauthRedirectCallback = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<any> => {

    res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
    res.header('Referrer-Policy', 'no-referrer-when-downgrade');
    const oAuthClient = new OAuth2Client(process.env.CLIENT_ID, process.env.CLIENT_SECRET, process.env.CALLBACK_URL);
    const authorizeUrl = oAuthClient.generateAuthUrl({
        access_type: 'offline',
        scope: ['https://www.googleapis.com/auth/userinfo.profile openid', "email"],
        prompt: "consent",
    });
    console.log(authorizeUrl);
    res.status(200).json({ status: SUCCESS, data: { url: authorizeUrl } });
});

const getAccessAndRefreshToken = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<any> => {

    const code = req.body.code;
    if (!code) {
        return next(appError.createError('Code is required', 400, FAILED));
    }

    const storedCode = authorizationCodeStore.get(code);
    if (!storedCode) {
        return next(appError.createError('Invalid code', 400, FAILED));
    }

    if (storedCode.expiry < new Date()) {
        return next(appError.createError('Code has expired', 400, FAILED));
    }

    res.status(200).json({
        status: SUCCESS,
        data: {
            accessToken: storedCode.accessToken,
            refreshToken: storedCode.refreshToken,
            accessTokenExpiry: storedCode.tokenExpiry,
        }

    });
});




const getNewAccessToken = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    const token: string = req.body.refreshToken;
    if (!token) {
        return next(appError.createError('Token is required', 400, FAILED));
    }

    const { accessToken, refreshToken, accessTokenExpiry } = await getNewOauthAccessToken(token!);
    res.status(200).json({ status: SUCCESS, data: { accessToken, refreshToken, accessTokenExpiry } });

});

async function getUserData(accessToken: string) {
    const response = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${accessToken}`);
    const data = await response.json();
    return data;
}

export { signup, getAccessAndRefreshToken, OauthRedirectCallback, getNewAccessToken };