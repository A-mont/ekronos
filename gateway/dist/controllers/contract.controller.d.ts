import { Request, Response } from 'express';
export declare class ContractController {
    static createProgram(req: Request, res: Response): Promise<void>;
    static createPool(req: Request, res: Response): Promise<void>;
    static createPoolWithRegisteredToken(req: Request, res: Response): Promise<void>;
    static createProgramAndPool(req: Request, res: Response): Promise<void>;
    static getAdmins(req: Request, res: Response): Promise<void>;
    static getIdToAddress(req: Request, res: Response): Promise<void>;
    static getNumber(req: Request, res: Response): Promise<void>;
    static getRegistry(req: Request, res: Response): Promise<void>;
    static getPoolFactoryAddress(req: Request, res: Response): Promise<void>;
    static getPairAddress(req: Request, res: Response): Promise<void>;
    static getAllPairs(req: Request, res: Response): Promise<void>;
    static getFeeTo(req: Request, res: Response): Promise<void>;
    static getTreasuryId(req: Request, res: Response): Promise<void>;
    static healthCheck(_req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=contract.controller.d.ts.map