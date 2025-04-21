import { NextFunction, Request, Response } from "express";
import { appError, asyncHandler } from "../utils/errorHandling.ts";
import { FAILED, SUCCESS } from "../utils/httpStatus.ts";
import generateTokens from "../utils/generateTokens.ts";
import Jwt from "jsonwebtoken";
import { IUser, User } from "../models/user.ts";
import generateVerificationCode from "../utils/generateVerificationCode.ts";
import { sendPasswordResetEmail, sendResetSuccessEmail, sendVerificationEmail, sendWelcomeEmail } from "../config/mailtrap/email.ts";
import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();
const signup = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { name, email, password } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists) {
        return next(appError.createError("user already exists", 400, FAILED));
    }
    const verificationToken = generateVerificationCode();
    const user: IUser = await User.create({
        name,
        email,
        password,
        verificationToken: verificationToken,
        verificationTokenExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    await sendVerificationEmail(email, verificationToken);
    const { accessToken, refreshToken } = generateTokens(user._id.toString(), user.role);
    req.redisClient?.set(`refreshToken:${user._id.toString()}`, refreshToken, "EX", 7 * 24 * 60 * 60);
    res.status(200).json({
        message: "user signed up successfully",
        status: SUCCESS,
        data: { accessToken, refreshToken },
    });
});


const verifyEmail = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { verificationToken } = req.body;
    if (!verificationToken) {
        return next(appError.createError("verification token is required", 400, FAILED));
    }
    const user: IUser | null = await User.findOne({ verificationToken, verificationTokenExpiresAt: { $gt: new Date() } });
    if (!user) {
        return next(appError.createError("invalid verification token", 400, FAILED));
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpiresAt = undefined;
    await user.save();
    await sendWelcomeEmail(user.email, user.name);

    res.status(200).json({
        message: "user verified successfully",
        status: SUCCESS,
        data: null,
    });
});


const login = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { email, password } = req.body;
    const user: IUser | null = await User.findOne({ email });
    if (!user) {
        return next(appError.createError("user not found", 404, FAILED));
    }
    const isPasswordValid: boolean = await user.comparePassword(password);
    if (!isPasswordValid) {
        return next(appError.createError("invalid credentials", 400, FAILED));
    }
    const { accessToken, refreshToken } = generateTokens(user._id.toString(), user.role);
    user.lastLogin = new Date();
    await user.save();
    req.redisClient?.set(`refreshToken:${user._id.toString()}`, refreshToken, "EX", 7 * 24 * 60 * 60);
    res.status(200).json({
        message: "user logged in successfully",
        status: SUCCESS,
        data: { accessToken, refreshToken },
    });
});

const logout = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { userId } = req;
    await req.redisClient?.del(`refreshToken:${userId}`);
    res
        .status(200)
        .json({ message: "user logged out successfully", status: SUCCESS });
});


export const forgotPassword = async (req: Request, res: Response): Promise<any> => {
    const { email } = req.body;
    try {
        const user: IUser | null = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ success: false, message: "User not found" });
        }
        const resetToken = crypto.randomBytes(20).toString("hex");
        const resetTokenExpiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000);
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpiresAt = resetTokenExpiresAt;

        await user.save();


        await sendPasswordResetEmail(user.email, `${process.env.CLIENT_URL}/reset-password/${resetToken}`);
        console.log(`${process.env.CLIENT_URL}/reset-password/${resetToken}`);

        res.status(200).json({ success: true, message: "Password reset link sent to your email" });
    } catch (error: any) {
        console.log("Error in forgotPassword ", error);
        res.status(400).json({ success: false, message: error.message });
    }
};

export const resetPassword = async (req: Request, res: Response): Promise<any> => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        const user: IUser | null = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpiresAt: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({ success: false, message: "Invalid or expired reset token" });
        }

        user.password = password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpiresAt = undefined;
        await user.save();
        await sendResetSuccessEmail(user.email);

        res.status(200).json({ success: true, message: "Password reset successful" });
    } catch (error: any) {
        console.log("Error in resetPassword ", error);
        res.status(400).json({ success: false, message: error.message });
    }
};

const getNewAccessTokenUsingRefreshToken = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    let authHeader = req.headers.authorization;
    let refreshToken: string | undefined;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        refreshToken = authHeader.split(' ')[1] as string;
    }
    if (!refreshToken) {
        return next(appError.createError("you didn't provide the refresh token", 400, FAILED));
    }
    const decoded: any = Jwt.verify(refreshToken, process.env["REFRESH_TOKEN_SECRET"]!);
    const storedToken = await req.redisClient?.get(`refreshToken:${decoded.userId}`);

    if (!decoded || (storedToken !== refreshToken)) {
        return next(appError.createError("invalid refresh token", 400, FAILED));
    }
    const { userId, role } = decoded as { userId: string; role: string; };
    const accessToken = Jwt.sign({ userId, role }, process.env["ACCESS_TOKEN_SECRET"]!, { expiresIn: "15m", });
    res.status(200).json({ accessToken });

});

const userProfile = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const user: IUser = await User.findById(req.userId).select("-password");
    if (!user) {
        return next(appError.createError("user not found", 404, FAILED));
    }
    res.status(200).json({ status: SUCCESS, data: user });
});

export { signup, login, logout, getNewAccessTokenUsingRefreshToken, userProfile, verifyEmail };
