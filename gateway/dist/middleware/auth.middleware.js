"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateApiKey = void 0;
const constants_1 = require("../config/constants");
const authenticateApiKey = (req, res, next) => {
    next();
    return;
    try {
        const apiKey = req.headers['api-key'];
        if (!apiKey) {
            res.status(401).json({
                success: false,
                error: 'API Key is required',
                message: 'Provide an API Key in the api-key header'
            });
            return;
        }
        if (apiKey !== constants_1.API_KEY) {
            res.status(403).json({
                success: false,
                error: 'Invalid API Key',
                message: 'The provided API Key is not valid'
            });
            return;
        }
        next();
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: 'Authentication error',
            message: 'An error occurred during authentication'
        });
    }
};
exports.authenticateApiKey = authenticateApiKey;
//# sourceMappingURL=auth.middleware.js.map