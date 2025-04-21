import { Request, Response, NextFunction } from "express";
import { ERROR } from "./httpStatus";

const asyncHandler = (fn: Function) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch((error: Error) => {
      next(error);
    });
  };
};

const handleNotFoundResourceError = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    res.status(404).json({
      status: ERROR,
      message: "this Route is not found",
    });
  }
);

const globalErrorHandler = (
  error: AppError,
  req: Request,
  res: Response,
  next: Function
) => {
  res.status(error.statusCode || 500).json({
    status: error.statusText || ERROR,
    message:error.message,
    // message: error.statusText === undefined ? "some thing went wrong (SERVER Error)" : error.message,
    data: null,
  });
};

class AppError extends Error {
  constructor() {
    super();
  }
  public statusCode: number = 500;
  public statusText: string = "error";
  createError(message: string, statusCode: number, statusText: string) {
    this.message = message;
    this.statusCode = statusCode;
    this.statusText = statusText;
    return this;
  }
}

const appError = new AppError();
export { asyncHandler, globalErrorHandler, handleNotFoundResourceError, appError };
