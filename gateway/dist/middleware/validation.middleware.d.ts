import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
declare const createProgramSchema: z.ZodObject<{
    admins: z.ZodArray<z.ZodString, "many">;
    name: z.ZodString;
    symbol: z.ZodEffects<z.ZodString, string, string>;
    decimals: z.ZodNumber;
    mint_amount: z.ZodString;
    mint_to: z.ZodString;
}, "strip", z.ZodTypeAny, {
    symbol: string;
    admins: string[];
    name: string;
    decimals: number;
    mint_amount: string;
    mint_to: string;
}, {
    symbol: string;
    admins: string[];
    name: string;
    decimals: number;
    mint_amount: string;
    mint_to: string;
}>;
declare const createPoolSchema: z.ZodObject<{
    token_a: z.ZodString;
    token_b: z.ZodString;
}, "strip", z.ZodTypeAny, {
    token_a: string;
    token_b: string;
}, {
    token_a: string;
    token_b: string;
}>;
declare const createPoolWithRegisteredTokenSchema: z.ZodObject<{
    token: z.ZodString;
    registered_token: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    token: string;
    registered_token?: string | null | undefined;
}, {
    token: string;
    registered_token?: string | null | undefined;
}>;
declare const createProgramAndPoolSchema: z.ZodObject<{
    admins: z.ZodArray<z.ZodString, "many">;
    name: z.ZodString;
    symbol: z.ZodEffects<z.ZodString, string, string>;
    decimals: z.ZodNumber;
    mint_amount: z.ZodString;
    mint_to: z.ZodString;
    registered_token: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    symbol: string;
    admins: string[];
    name: string;
    decimals: number;
    mint_amount: string;
    mint_to: string;
    registered_token?: string | null | undefined;
}, {
    symbol: string;
    admins: string[];
    name: string;
    decimals: number;
    mint_amount: string;
    mint_to: string;
    registered_token?: string | null | undefined;
}>;
export type CreateProgramInput = z.infer<typeof createProgramSchema>;
export type CreatePoolInput = z.infer<typeof createPoolSchema>;
export type CreatePoolWithRegisteredTokenInput = z.infer<typeof createPoolWithRegisteredTokenSchema>;
export type CreateProgramAndPoolInput = z.infer<typeof createProgramAndPoolSchema>;
export declare const validateCreateProgram: (req: Request, res: Response, next: NextFunction) => void;
export declare const validateCreatePool: (req: Request, res: Response, next: NextFunction) => void;
export declare const validateCreatePoolWithRegisteredToken: (req: Request, res: Response, next: NextFunction) => void;
export declare const validateCreateProgramAndPool: (req: Request, res: Response, next: NextFunction) => void;
export declare const validate: <T extends z.ZodType>(schema: T) => (req: Request, res: Response, next: NextFunction) => void;
export {};
//# sourceMappingURL=validation.middleware.d.ts.map