import Joi from "joi";
import { appError, asyncHandler } from "./errorHandling.ts";
import { NextFunction, Response, Request } from "express";
import { FAILED } from "./httpStatus.ts";


const signUpValidation = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const schema = Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().required().min(6).max(50),
        name: Joi.string().required()
    });

    const { error } = schema.validate(req.body);
    if (error) {

        return next(appError.createError(error.details[0]!.message, 400, FAILED));
    }
    next();
});

const loginValidation = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const schema = Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().required().min(6).max(50),
    });

    const { error } = schema.validate(req.body);
    if (error) {

        return next(appError.createError(error.details[0]!.message, 400, FAILED));
    }
    next();
});



export { signUpValidation, loginValidation };

