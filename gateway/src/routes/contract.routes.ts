import { Router, type Router as ExpressRouter } from 'express';
import { ContractController } from '../controllers/contract.controller';
import { authenticateApiKey } from '../middleware/auth.middleware';
import { 
    validateCreateProgram,
    validateCreatePool,
    validateCreatePoolWithRegisteredToken,
    validateCreateProgramAndPool
} from '../middleware/validation.middleware';

const router: ExpressRouter = Router();

router.get('/health', ContractController.healthCheck);

router.post(
    '/create-program',
    authenticateApiKey,
    validateCreateProgram,
    ContractController.createProgram
);

router.post(
    '/create-pool',
    authenticateApiKey,
    validateCreatePool,
    ContractController.createPool
);

router.post(
    '/create-pool-with-registered-token',
    authenticateApiKey,
    validateCreatePoolWithRegisteredToken,
    ContractController.createPoolWithRegisteredToken
);

router.post(
    '/create-program-and-pool',
    authenticateApiKey,
    validateCreateProgramAndPool,
    ContractController.createProgramAndPool
);

router.get(
    '/admins',
    authenticateApiKey,
    ContractController.getAdmins
);

router.get(
    '/id-to-address',
    authenticateApiKey,
    ContractController.getIdToAddress
);

router.get(
    '/number',
    authenticateApiKey,
    ContractController.getNumber
);

router.get(
    '/registry',
    authenticateApiKey,
    ContractController.getRegistry
);

router.get(
    '/pool-factory-address',
    authenticateApiKey,
    ContractController.getPoolFactoryAddress
);

router.get(
    '/pair-address',
    authenticateApiKey,
    ContractController.getPairAddress
);

router.get(
    '/all-pairs',
    authenticateApiKey,
    ContractController.getAllPairs
);

router.get(
    '/fee-to',
    authenticateApiKey,
    ContractController.getFeeTo
);

router.get(
    '/treasury-id',
    authenticateApiKey,
    ContractController.getTreasuryId
);

export default router;
