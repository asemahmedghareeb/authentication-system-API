import { OAuth2Client } from "google-auth-library";
import { IUser, User } from "../models/user";
import dotenv from 'dotenv';
dotenv.config();
async function getNewOauthAccessToken(refreshToken: string) {
    try {
        const oAuth2Client = new OAuth2Client(process.env.CLIENT_ID, process.env.CLIENT_SECRET);

        const user: IUser | null = await User.findOne({ refreshToken });
        if (!user) {
            throw new Error('User not found');
        }
        oAuth2Client.setCredentials({
            refresh_token: refreshToken,
        });
        const tokenResponse = await oAuth2Client.refreshAccessToken();
        const newAccessToken = tokenResponse.credentials.access_token;
        const newRefreshToken = tokenResponse.credentials.refresh_token;
        const accessTokenExpiry = tokenResponse.credentials.expiry_date;

        user.accessToken = newAccessToken!;
        user.accessTokenExpires = new Date(accessTokenExpiry! * 1000);
        await user.save();

        return {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
            accessTokenExpiry
        };

    } catch (error) {
        console.error('Error refreshing access token:', error);
        throw error;
    }

}

export default getNewOauthAccessToken