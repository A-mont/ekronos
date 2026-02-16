"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const constants_1 = require("./config/constants");
const vara_utils_1 = require("./utils/vara.utils");
const contract_routes_1 = __importDefault(require("./routes/contract.routes"));
class Server {
    constructor() {
        this.app = (0, express_1.default)();
        this.setupMiddleware();
        this.setupRoutes();
        this.setupErrorHandling();
    }
    setupMiddleware() {
        this.app.use((0, helmet_1.default)());
        this.app.use((0, cors_1.default)({
            origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
            credentials: true
        }));
        this.app.use(express_1.default.json());
        this.app.use(express_1.default.urlencoded({ extended: true }));
        this.app.use((req, _res, next) => {
            const timestamp = new Date().toISOString();
            console.log(`[${timestamp}] ${req.method} ${req.path}`);
            next();
        });
    }
    setupRoutes() {
        this.app.get('/', (_req, res) => {
            res.json({
                success: true,
                message: 'Vara Network API Gateway',
                version: '2.0.0',
                endpoints: {
                    health: 'GET /api/health',
                    createProgram: 'POST /api/create-program',
                    createPool: 'POST /api/create-pool',
                    createPoolWithRegisteredToken: 'POST /api/create-pool-with-registered-token',
                    createProgramAndPool: 'POST /api/create-program-and-pool',
                    admins: 'GET /api/admins',
                    idToAddress: 'GET /api/id-to-address',
                    number: 'GET /api/number',
                    registry: 'GET /api/registry',
                    poolFactoryAddress: 'GET /api/pool-factory-address',
                    pairAddress: 'GET /api/pair-address?token_a=<address>&token_b=<address>'
                }
            });
        });
        this.app.use('/api', contract_routes_1.default);
        this.app.use((req, res) => {
            res.status(404).json({
                success: false,
                error: 'Not Found',
                message: `Route ${req.method} ${req.path} not found`
            });
        });
    }
    setupErrorHandling() {
        this.app.use((err, _req, res, _next) => {
            console.error('Global error handler:', err);
            res.status(500).json({
                success: false,
                error: 'Internal Server Error',
                message: constants_1.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred',
                ...(constants_1.NODE_ENV === 'development' && { stack: err.stack })
            });
        });
    }
    async initializeVaraNetwork() {
        try {
            console.log('Initializing connection with Vara Network...');
            console.log(`Connecting to: ${constants_1.NETWORK}`);
            const api = await (0, vara_utils_1.createGearApi)(constants_1.NETWORK);
            console.log('✓ Connected to Vara Network');
            console.log('Setting up wallet...');
            const signer = await (0, vara_utils_1.gearKeyringByWalletData)(constants_1.WALLET_NAME, constants_1.WALLET_MNEMONIC);
            console.log(`✓ Signer configured: ${signer.address}`);
            console.log(`Setting up Factory Sails with contract: ${constants_1.FACTORY_CONTRACT_ID}`);
            const factorySails = await (0, vara_utils_1.sailsInstance)(api, constants_1.FACTORY_CONTRACT_ID, constants_1.FACTORY_IDL);
            console.log('✓ Factory Sails setup complete');
            console.log(`Setting up Pool Factory Sails with contract: ${constants_1.POOL_FACTORY_CONTRACT_ID}`);
            const poolFactorySails = await (0, vara_utils_1.sailsInstance)(api, constants_1.POOL_FACTORY_CONTRACT_ID, constants_1.POOL_FACTORY_IDL);
            console.log('✓ Pool Factory Sails setup complete');
            this.app.locals.api = api;
            this.app.locals.factorySails = factorySails;
            this.app.locals.poolFactorySails = poolFactorySails;
            this.app.locals.signer = signer;
        }
        catch (error) {
            console.error('Error initializing Vara Network:', error);
            throw error;
        }
    }
    async start() {
        try {
            await this.initializeVaraNetwork();
            this.app.listen(constants_1.PORT, () => {
                console.log('\n' + '='.repeat(60));
                console.log(`- Server running on port ${constants_1.PORT}`);
                console.log(`- Environment: ${constants_1.NODE_ENV}`);
                console.log(`- Vara Network: ${constants_1.NETWORK}`);
                console.log(`- Factory Contract: ${constants_1.FACTORY_CONTRACT_ID}`);
                console.log(`- Pool Factory Contract: ${constants_1.POOL_FACTORY_CONTRACT_ID}`);
                console.log('='.repeat(60));
                console.log('\nAvailable Endpoints:');
                console.log('  Root:');
                console.log(`     GET  http://localhost:${constants_1.PORT}/`);
                console.log(`     GET  http://localhost:${constants_1.PORT}/api/health`);
                console.log('\n  Program Endpoints:');
                console.log(`     POST http://localhost:${constants_1.PORT}/api/create-program`);
                console.log('\n  Pool Endpoints:');
                console.log(`     POST http://localhost:${constants_1.PORT}/api/create-pool`);
                console.log(`     POST http://localhost:${constants_1.PORT}/api/create-pool-with-registered-token`);
                console.log(`     POST http://localhost:${constants_1.PORT}/api/create-program-and-pool`);
                console.log('\n  Query Endpoints:');
                console.log(`     GET  http://localhost:${constants_1.PORT}/api/admins`);
                console.log(`     GET  http://localhost:${constants_1.PORT}/api/id-to-address`);
                console.log(`     GET  http://localhost:${constants_1.PORT}/api/number`);
                console.log(`     GET  http://localhost:${constants_1.PORT}/api/registry`);
                console.log(`     GET  http://localhost:${constants_1.PORT}/api/pool-factory-address`);
                console.log(`     GET  http://localhost:${constants_1.PORT}/api/pair-address`);
                console.log('='.repeat(60) + '\n');
            });
        }
        catch (error) {
            console.error('Error starting server:', error);
            process.exit(1);
        }
    }
    async shutdown() {
        console.log('\nClosing server...');
        if (this.app.locals.api) {
            await this.app.locals.api.provider.disconnect();
            console.log('✓ Disconnected from Vara Network');
        }
        console.log('✓ Server closed successfully');
        process.exit(0);
    }
}
const server = new Server();
server.start();
process.on('SIGINT', () => server.shutdown());
process.on('SIGTERM', () => server.shutdown());
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});
exports.default = server;
//# sourceMappingURL=index.js.map