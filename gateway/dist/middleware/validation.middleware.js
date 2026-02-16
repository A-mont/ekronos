"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = exports.validateCreateProgramAndPool = exports.validateCreatePoolWithRegisteredToken = exports.validateCreatePool = exports.validateCreateProgram = void 0;
const zod_1 = require("zod");
const createProgramSchema = zod_1.z.object({
    admins: zod_1.z.array(zod_1.z.string()
        .regex(/^0x[a-fA-F0-9]{64}$/, 'Each admin address must be a valid hex string')).min(1, 'At least one admin address is required'),
    name: zod_1.z.string()
        .min(1, 'Name must be at least 1 character long')
        .max(100, 'Name must not exceed 100 characters'),
    symbol: zod_1.z.string()
        .min(1, 'Symbol must be at least 1 character long')
        .max(20, 'Symbol must not exceed 20 characters')
        .transform(val => val.toUpperCase()),
    decimals: zod_1.z.number()
        .int('Decimals must be an integer')
        .min(0, 'Decimals must be at least 0')
        .max(255, 'Decimals must not exceed 255'),
    mint_amount: zod_1.z.string()
        .regex(/^\d+$/, 'Mint amount must be a valid number string'),
    mint_to: zod_1.z.string()
        .regex(/^0x[a-fA-F0-9]{64}$/, 'Mint to address must be a valid hex string')
});
const createPoolSchema = zod_1.z.object({
    token_a: zod_1.z.string()
        .regex(/^0x[a-fA-F0-9]{64}$/, 'Token A address must be a valid hex string'),
    token_b: zod_1.z.string()
        .regex(/^0x[a-fA-F0-9]{64}$/, 'Token B address must be a valid hex string')
});
const createPoolWithRegisteredTokenSchema = zod_1.z.object({
    token: zod_1.z.string()
        .regex(/^0x[a-fA-F0-9]{64}$/, 'Token address must be a valid hex string'),
    registered_token: zod_1.z.string()
        .regex(/^0x[a-fA-F0-9]{64}$/, 'Registered token address must be a valid hex string')
        .optional()
        .nullable()
});
const createProgramAndPoolSchema = zod_1.z.object({
    admins: zod_1.z.array(zod_1.z.string()
        .regex(/^0x[a-fA-F0-9]{64}$/, 'Each admin address must be a valid hex string')).min(1, 'At least one admin address is required'),
    name: zod_1.z.string()
        .min(1, 'Name must be at least 1 character long')
        .max(100, 'Name must not exceed 100 characters'),
    symbol: zod_1.z.string()
        .min(1, 'Symbol must be at least 1 character long')
        .max(20, 'Symbol must not exceed 20 characters')
        .transform(val => val.toUpperCase()),
    decimals: zod_1.z.number()
        .int('Decimals must be an integer')
        .min(0, 'Decimals must be at least 0')
        .max(255, 'Decimals must not exceed 255'),
    mint_amount: zod_1.z.string()
        .regex(/^\d+$/, 'Mint amount must be a valid number string'),
    mint_to: zod_1.z.string()
        .regex(/^0x[a-fA-F0-9]{64}$/, 'Mint to address must be a valid hex string'),
    registered_token: zod_1.z.string()
        .regex(/^0x[a-fA-F0-9]{64}$/, 'Registered token address must be a valid hex string')
        .optional()
        .nullable()
});
const validateCreateProgram = (req, res, next) => {
    try {
        const validatedData = createProgramSchema.parse(req.body);
        req.body = validatedData;
        next();
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            const errors = error.errors.map(err => ({
                field: err.path.join('.'),
                message: err.message
            }));
            res.status(400).json({
                success: false,
                error: 'Validation error',
                details: errors
            });
            return;
        }
        res.status(500).json({
            success: false,
            error: 'Validation failed',
            message: 'An unexpected error occurred during validation'
        });
    }
};
exports.validateCreateProgram = validateCreateProgram;
const validateCreatePool = (req, res, next) => {
    try {
        const validatedData = createPoolSchema.parse(req.body);
        req.body = validatedData;
        next();
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            const errors = error.errors.map(err => ({
                field: err.path.join('.'),
                message: err.message
            }));
            res.status(400).json({
                success: false,
                error: 'Validation error',
                details: errors
            });
            return;
        }
        res.status(500).json({
            success: false,
            error: 'Validation failed',
            message: 'An unexpected error occurred during validation'
        });
    }
};
exports.validateCreatePool = validateCreatePool;
const validateCreatePoolWithRegisteredToken = (req, res, next) => {
    try {
        const validatedData = createPoolWithRegisteredTokenSchema.parse(req.body);
        req.body = validatedData;
        next();
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            const errors = error.errors.map(err => ({
                field: err.path.join('.'),
                message: err.message
            }));
            res.status(400).json({
                success: false,
                error: 'Validation error',
                details: errors
            });
            return;
        }
        res.status(500).json({
            success: false,
            error: 'Validation failed',
            message: 'An unexpected error occurred during validation'
        });
    }
};
exports.validateCreatePoolWithRegisteredToken = validateCreatePoolWithRegisteredToken;
const validateCreateProgramAndPool = (req, res, next) => {
    try {
        const validatedData = createProgramAndPoolSchema.parse(req.body);
        req.body = validatedData;
        next();
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            const errors = error.errors.map(err => ({
                field: err.path.join('.'),
                message: err.message
            }));
            res.status(400).json({
                success: false,
                error: 'Validation error',
                details: errors
            });
            return;
        }
        res.status(500).json({
            success: false,
            error: 'Validation failed',
            message: 'An unexpected error occurred during validation'
        });
    }
};
exports.validateCreateProgramAndPool = validateCreateProgramAndPool;
const validate = (schema) => {
    return (req, res, next) => {
        try {
            const validatedData = schema.parse(req.body);
            req.body = validatedData;
            next();
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                const errors = error.errors.map(err => ({
                    field: err.path.join('.'),
                    message: err.message
                }));
                res.status(400).json({
                    success: false,
                    error: 'Validation error',
                    details: errors
                });
                return;
            }
            res.status(500).json({
                success: false,
                error: 'Validation failed',
                message: 'An unexpected error occurred during validation'
            });
        }
    };
};
exports.validate = validate;
//# sourceMappingURL=validation.middleware.js.map