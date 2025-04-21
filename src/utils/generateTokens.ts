import jwt from "jsonwebtoken";

const generateTokens = (userId: string, role: string) => {
    const accessToken = jwt.sign({ userId, role }, process.env.ACCESS_TOKEN_SECRET!, { expiresIn: "2h", });

    const refreshToken = jwt.sign({ userId, role }, process.env.REFRESH_TOKEN_SECRET!, { expiresIn: "7d", });

    return { accessToken, refreshToken };
};

export default generateTokens;