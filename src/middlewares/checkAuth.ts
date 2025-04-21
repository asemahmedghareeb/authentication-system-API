import { Response, Request, NextFunction } from "express";
import { User, IUser } from "../models/user";
export const checkAuth = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const user: IUser = await User.findById(req.userId).select("-password");
        if (!user) {
            return res.status(400).json({ success: false, message: "User not found" });
        }

        res.status(200).json({ success: true, user });
    } catch (error: any) {
        console.log("Error in checkAuth ", error);
        res.status(400).json({ success: false, message: error.message });
    }
};