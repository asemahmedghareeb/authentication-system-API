import express, { Application, NextFunction, Request, Response } from 'express';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cors from 'cors';
import { connectDB } from './config/db';
import "./utils/extendExpressRequest";
import addingRedisToResObject from './middlewares/addingRedisToResObject';
import authRoutes from './routes/auth-routes';
import { globalErrorHandler, handleNotFoundResourceError } from "./utils/errorHandling";
import oauth from "./routes/oauth2";
import protectedRoute from './middlewares/protectedRoute';
dotenv.config();
const app: Application = express();
const PORT: string | undefined = process.env.PORT;
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());
app.use(addingRedisToResObject);
//email and password routes
app.use("/api/v1/auth", authRoutes);

// OAuth routes
app.use("/api/v1/oauth", oauth);


app.get("/protected", protectedRoute, (req: Request, res: Response, next: NextFunction) => {
    res.json({ msg: "welcome to protected route" });
});


app.use(globalErrorHandler);
app.use(handleNotFoundResourceError);
app.listen(PORT, async () => {
    await connectDB();
    console.log(`Server is running on port ${PORT}`);
});      