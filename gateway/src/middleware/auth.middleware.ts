import { Request, Response, NextFunction } from 'express';
import { API_KEY } from '../config/constants';

export const authenticateApiKey = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    next();
    return;
    
    try {
        const apiKey = req.headers['api-key'] as string;

        if (!apiKey) {
            res.status(401).json({
                success: false,
                error: 'API Key is required',
                message: 'Provide an API Key in the api-key header'
            });
            return;
        }

        if (apiKey !== API_KEY) {
            res.status(403).json({
                success: false,
                error: 'Invalid API Key',
                message: 'The provided API Key is not valid'
            });
            return;
        }

        next();
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Authentication error',
            message: 'An error occurred during authentication'
        });
    }
};