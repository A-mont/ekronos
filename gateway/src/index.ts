import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { 
    NETWORK, 
    FACTORY_CONTRACT_ID,
    POOL_FACTORY_CONTRACT_ID,
    FACTORY_IDL,
    POOL_FACTORY_IDL,
    WALLET_NAME, 
    WALLET_MNEMONIC,
    PORT,
    NODE_ENV,
} from './config/constants';
import { 
    createGearApi, 
    gearKeyringByWalletData, 
    sailsInstance 
} from './utils/vara.utils';
import contractRoutes from './routes/contract.routes';


class Server {
    private app: Express;
    
    constructor() {
        this.app = express();
        this.setupMiddleware();
        this.setupRoutes();
        this.setupErrorHandling();
    }

    private setupMiddleware(): void {
        this.app.use(helmet());

        this.app.use(cors({
            origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
            credentials: true
        }));

        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));

        this.app.use((req: Request, _res: Response, next: NextFunction) => {
            const timestamp = new Date().toISOString();
            console.log(`[${timestamp}] ${req.method} ${req.path}`);
            next();
        });
    }

    private setupRoutes(): void {
        this.app.get('/', (_req: Request, res: Response) => {
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

        this.app.use('/api', contractRoutes);

        this.app.use((req: Request, res: Response) => {
            res.status(404).json({
                success: false,
                error: 'Not Found',
                message: `Route ${req.method} ${req.path} not found`
            });
        });
    }

    private setupErrorHandling(): void {
        this.app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
            console.error('Global error handler:', err);
            
            res.status(500).json({
                success: false,
                error: 'Internal Server Error',
                message: NODE_ENV === 'development' ? err.message : 'An unexpected error occurred',
                ...(NODE_ENV === 'development' && { stack: err.stack })
            });
        });
    }

    private async initializeVaraNetwork(): Promise<void> {
        try {
            console.log('Initializing connection with Vara Network...');
            
            console.log(`Connecting to: ${NETWORK}`);
            const api = await createGearApi(NETWORK);
            console.log('✓ Connected to Vara Network');

            console.log('Setting up wallet...');
            const signer = await gearKeyringByWalletData(WALLET_NAME, WALLET_MNEMONIC);
            console.log(`✓ Signer configured: ${signer.address}`);

            console.log(`Setting up Factory Sails with contract: ${FACTORY_CONTRACT_ID}`);
            const factorySails = await sailsInstance(api, FACTORY_CONTRACT_ID, FACTORY_IDL);
            console.log('✓ Factory Sails setup complete');

            console.log(`Setting up Pool Factory Sails with contract: ${POOL_FACTORY_CONTRACT_ID}`);
            const poolFactorySails = await sailsInstance(api, POOL_FACTORY_CONTRACT_ID, POOL_FACTORY_IDL);
            console.log('✓ Pool Factory Sails setup complete');

            this.app.locals.api = api;
            this.app.locals.factorySails = factorySails;
            this.app.locals.poolFactorySails = poolFactorySails;
            this.app.locals.signer = signer;

        } catch (error) {
            console.error('Error initializing Vara Network:', error);
            throw error;
        }
    }

    public async start(): Promise<void> {
        try {
            await this.initializeVaraNetwork();

            this.app.listen(PORT, () => {
                console.log('\n' + '='.repeat(60));
                console.log(`- Server running on port ${PORT}`);
                console.log(`- Environment: ${NODE_ENV}`);
                console.log(`- Vara Network: ${NETWORK}`);
                console.log(`- Factory Contract: ${FACTORY_CONTRACT_ID}`);
                console.log(`- Pool Factory Contract: ${POOL_FACTORY_CONTRACT_ID}`);
                console.log('='.repeat(60));
                console.log('\nAvailable Endpoints:');
                console.log('  Root:');
                console.log(`     GET  http://localhost:${PORT}/`);
                console.log(`     GET  http://localhost:${PORT}/api/health`);
                console.log('\n  Program Endpoints:');
                console.log(`     POST http://localhost:${PORT}/api/create-program`);
                console.log('\n  Pool Endpoints:');
                console.log(`     POST http://localhost:${PORT}/api/create-pool`);
                console.log(`     POST http://localhost:${PORT}/api/create-pool-with-registered-token`);
                console.log(`     POST http://localhost:${PORT}/api/create-program-and-pool`);
                console.log('\n  Query Endpoints:');
                console.log(`     GET  http://localhost:${PORT}/api/admins`);
                console.log(`     GET  http://localhost:${PORT}/api/id-to-address`);
                console.log(`     GET  http://localhost:${PORT}/api/number`);
                console.log(`     GET  http://localhost:${PORT}/api/registry`);
                console.log(`     GET  http://localhost:${PORT}/api/pool-factory-address`);
                console.log(`     GET  http://localhost:${PORT}/api/pair-address`);
                console.log('='.repeat(60) + '\n');
            });

        } catch (error) {
            console.error('Error starting server:', error);
            process.exit(1);
        }
    }

    public async shutdown(): Promise<void> {
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

export default server;
