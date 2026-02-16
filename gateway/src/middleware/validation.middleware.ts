import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

const createProgramSchema = z.object({
    admins: z.array(z.string()
        .regex(
            /^0x[a-fA-F0-9]{64}$/, 
            'Each admin address must be a valid hex string'
        )
    ).min(1, 'At least one admin address is required'),
    
    name: z.string()
        .min(1, 'Name must be at least 1 character long')
        .max(100, 'Name must not exceed 100 characters'),
    
    symbol: z.string()
        .min(1, 'Symbol must be at least 1 character long')
        .max(20, 'Symbol must not exceed 20 characters')
        .transform(val => val.toUpperCase()),
    
    decimals: z.number()
        .int('Decimals must be an integer')
        .min(0, 'Decimals must be at least 0')
        .max(255, 'Decimals must not exceed 255'),
    
    mint_amount: z.string()
        .regex(/^\d+$/, 'Mint amount must be a valid number string'),
    
    mint_to: z.string()
        .regex(/^0x[a-fA-F0-9]{64}$/, 'Mint to address must be a valid hex string')
});

const createPoolSchema = z.object({
    token_a: z.string()
        .regex(/^0x[a-fA-F0-9]{64}$/, 'Token A address must be a valid hex string'),
    
    token_b: z.string()
        .regex(/^0x[a-fA-F0-9]{64}$/, 'Token B address must be a valid hex string')
});

const createPoolWithRegisteredTokenSchema = z.object({
    token: z.string()
        .regex(/^0x[a-fA-F0-9]{64}$/, 'Token address must be a valid hex string'),
    
    registered_token: z.string()
        .regex(/^0x[a-fA-F0-9]{64}$/, 'Registered token address must be a valid hex string')
        .optional()
        .nullable()
});

const createProgramAndPoolSchema = z.object({
    admins: z.array(z.string()
        .regex(
            /^0x[a-fA-F0-9]{64}$/, 
            'Each admin address must be a valid hex string'
        )
    ).min(1, 'At least one admin address is required'),
    
    name: z.string()
        .min(1, 'Name must be at least 1 character long')
        .max(100, 'Name must not exceed 100 characters'),
    
    symbol: z.string()
        .min(1, 'Symbol must be at least 1 character long')
        .max(20, 'Symbol must not exceed 20 characters')
        .transform(val => val.toUpperCase()),
    
    decimals: z.number()
        .int('Decimals must be an integer')
        .min(0, 'Decimals must be at least 0')
        .max(255, 'Decimals must not exceed 255'),
    
    mint_amount: z.string()
        .regex(/^\d+$/, 'Mint amount must be a valid number string'),
    
    mint_to: z.string()
        .regex(/^0x[a-fA-F0-9]{64}$/, 'Mint to address must be a valid hex string'),
    
    registered_token: z.string()
        .regex(/^0x[a-fA-F0-9]{64}$/, 'Registered token address must be a valid hex string')
        .optional()
        .nullable()
});

export type CreateProgramInput = z.infer<typeof createProgramSchema>;
export type CreatePoolInput = z.infer<typeof createPoolSchema>;
export type CreatePoolWithRegisteredTokenInput = z.infer<typeof createPoolWithRegisteredTokenSchema>;
export type CreateProgramAndPoolInput = z.infer<typeof createProgramAndPoolSchema>;

export const validateCreateProgram = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    try {
        const validatedData = createProgramSchema.parse(req.body);
        req.body = validatedData;
        next();
    } catch (error) {
        if (error instanceof z.ZodError) {
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

export const validateCreatePool = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    try {
        const validatedData = createPoolSchema.parse(req.body);
        req.body = validatedData;
        next();
    } catch (error) {
        if (error instanceof z.ZodError) {
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

export const validateCreatePoolWithRegisteredToken = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    try {
        const validatedData = createPoolWithRegisteredTokenSchema.parse(req.body);
        req.body = validatedData;
        next();
    } catch (error) {
        if (error instanceof z.ZodError) {
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

export const validateCreateProgramAndPool = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    try {
        const validatedData = createProgramAndPoolSchema.parse(req.body);
        req.body = validatedData;
        next();
    } catch (error) {
        if (error instanceof z.ZodError) {
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

export const validate = <T extends z.ZodType>(schema: T) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        try {
            const validatedData = schema.parse(req.body);
            req.body = validatedData;
            next();
        } catch (error) {
            if (error instanceof z.ZodError) {
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