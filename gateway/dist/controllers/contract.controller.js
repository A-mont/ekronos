"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContractController = void 0;
const contract_service_1 = require("../services/contract.service");
const constants_1 = require("../config/constants");
class ContractController {
    static async createProgram(req, res) {
        try {
            const { admins, name, symbol, decimals, mint_amount, mint_to } = req.body;
            const sails = req.app.locals.factorySails;
            const signer = req.app.locals.signer;
            const initConfig = {
                admins,
                name,
                symbol,
                decimals,
                mint_amount: BigInt(mint_amount),
                mint_to
            };
            const response = await contract_service_1.ContractService.createProgram(sails, signer, initConfig);
            res.status(200).json({
                success: true,
                message: 'Program created successfully',
                data: response
            });
        }
        catch (error) {
            console.error('Error creating program:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to create program',
                message: error.message || 'An unknown error occurred',
                details: error.toString()
            });
        }
    }
    static async createPool(req, res) {
        try {
            const { token_a, token_b } = req.body;
            const factorySails = req.app.locals.factorySails;
            const poolFactorySails = req.app.locals.poolFactorySails;
            const signer = req.app.locals.signer;
            const existingPair = await contract_service_1.ContractService.getPairAddress(poolFactorySails, token_a, token_b);
            if (existingPair) {
                res.status(200).json({
                    success: true,
                    message: 'Pool already exists',
                    data: {
                        pairAddress: existingPair,
                        alreadyExists: true
                    }
                });
                return;
            }
            const pairAddress = await contract_service_1.ContractService.createPool(factorySails, poolFactorySails, signer, token_a, token_b);
            res.status(200).json({
                success: true,
                message: 'Pool created successfully',
                data: {
                    pairAddress,
                    tokenA: token_a,
                    tokenB: token_b
                }
            });
        }
        catch (error) {
            console.error('Error creating pool:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to create pool',
                message: error.message || 'An unknown error occurred',
                details: error.toString()
            });
        }
    }
    static async createPoolWithRegisteredToken(req, res) {
        try {
            const { token, registered_token } = req.body;
            const factorySails = req.app.locals.factorySails;
            const poolFactorySails = req.app.locals.poolFactorySails;
            const signer = req.app.locals.signer;
            let registeredTokenAddress = registered_token || null;
            if (registeredTokenAddress) {
                const existingPair = await contract_service_1.ContractService.getPairAddress(poolFactorySails, token, registeredTokenAddress);
                if (existingPair) {
                    res.status(200).json({
                        success: true,
                        message: 'Pool already exists',
                        data: {
                            pairAddress: existingPair,
                            token,
                            registeredToken: registeredTokenAddress,
                            alreadyExists: true
                        }
                    });
                    return;
                }
            }
            const pairAddress = await contract_service_1.ContractService.createPoolWithRegisteredToken(factorySails, poolFactorySails, signer, token, registeredTokenAddress);
            res.status(200).json({
                success: true,
                message: 'Pool created successfully',
                data: {
                    pairAddress,
                    token,
                    registeredToken: registeredTokenAddress
                }
            });
        }
        catch (error) {
            console.error('Error creating pool with registered token:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to create pool with registered token',
                message: error.message || 'An unknown error occurred',
                details: error.toString()
            });
        }
    }
    static async createProgramAndPool(req, res) {
        try {
            const { admins, name, symbol, decimals, mint_amount, mint_to, registered_token } = req.body;
            const factorySails = req.app.locals.factorySails;
            const poolFactorySails = req.app.locals.poolFactorySails;
            const signer = req.app.locals.signer;
            const initConfig = {
                admins,
                name,
                symbol,
                decimals,
                mint_amount: BigInt(mint_amount),
                mint_to
            };
            const registeredTokenAddress = registered_token || "0xd0f89cfd994c92bb743a5a69049609b796e2026e05318f7eef621a5e31df3d4b";
            const result = await contract_service_1.ContractService.createProgramAndPool(factorySails, poolFactorySails, signer, initConfig, registeredTokenAddress);
            res.status(200).json({
                success: true,
                message: 'Program and pool created successfully',
                data: {
                    program: result.programResponse,
                    pairAddress: result.pairAddress,
                    registeredToken: registeredTokenAddress
                }
            });
        }
        catch (error) {
            console.error('Error creating program and pool:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to create program and pool',
                message: error.message || 'An unknown error occurred',
                details: error.toString()
            });
        }
    }
    static async getAdmins(req, res) {
        try {
            const sails = req.app.locals.factorySails;
            const admins = await contract_service_1.ContractService.getAdmins(sails);
            res.status(200).json({
                success: true,
                data: { admins }
            });
        }
        catch (error) {
            console.error('Error getting admins:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get admins',
                message: error.message || 'An unknown error occurred'
            });
        }
    }
    static async getIdToAddress(req, res) {
        try {
            const sails = req.app.locals.factorySails;
            const mapping = await contract_service_1.ContractService.getIdToAddress(sails);
            res.status(200).json({
                success: true,
                data: { idToAddress: mapping }
            });
        }
        catch (error) {
            console.error('Error getIdToAddress:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get ID to address mapping',
                message: error.message || 'An unknown error occurred'
            });
        }
    }
    static async getNumber(req, res) {
        try {
            const sails = req.app.locals.factorySails;
            const number = await contract_service_1.ContractService.getNumber(sails);
            res.status(200).json({
                success: true,
                data: { totalPrograms: number }
            });
        }
        catch (error) {
            console.error('Error getNumber:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get number',
                message: error.message || 'An unknown error occurred'
            });
        }
    }
    static async getRegistry(req, res) {
        try {
            const sails = req.app.locals.factorySails;
            const registry = await contract_service_1.ContractService.getRegistry(sails);
            res.status(200).json({
                success: true,
                data: { registry }
            });
        }
        catch (error) {
            console.error('Error getRegistry:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get registry',
                message: error.message || 'An unknown error occurred'
            });
        }
    }
    static async getPoolFactoryAddress(req, res) {
        try {
            const sails = req.app.locals.factorySails;
            const address = await contract_service_1.ContractService.getPoolFactoryAddress(sails);
            res.status(200).json({
                success: true,
                data: { poolFactoryAddress: address }
            });
        }
        catch (error) {
            console.error('Error getting pool factory address:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get pool factory address',
                message: error.message || 'An unknown error occurred'
            });
        }
    }
    static async getPairAddress(req, res) {
        try {
            const { token_a, token_b } = req.query;
            if (!token_a || !token_b) {
                res.status(400).json({
                    success: false,
                    error: 'Missing required parameters',
                    message: 'token_a and token_b are required'
                });
                return;
            }
            const poolFactorySails = req.app.locals.poolFactorySails;
            const pairAddress = await contract_service_1.ContractService.getPairAddress(poolFactorySails, token_a, token_b);
            res.status(200).json({
                success: true,
                data: {
                    pairAddress: pairAddress || null,
                    exists: !!pairAddress
                }
            });
        }
        catch (error) {
            console.error('Error getting pair address:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get pair address',
                message: error.message || 'An unknown error occurred'
            });
        }
    }
    static async getAllPairs(req, res) {
        try {
            const poolFactorySails = req.app.locals.poolFactorySails;
            const pairs = await contract_service_1.ContractService.getAllPairs(poolFactorySails);
            res.status(200).json({
                success: true,
                data: {
                    pairs: pairs.map(([[tokenA, tokenB], pairAddress]) => ({
                        tokenA,
                        tokenB,
                        pairAddress
                    })),
                    total: pairs.length
                }
            });
        }
        catch (error) {
            console.error('Error getting all pairs:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get all pairs',
                message: error.message || 'An unknown error occurred'
            });
        }
    }
    static async getFeeTo(req, res) {
        try {
            const poolFactorySails = req.app.locals.poolFactorySails;
            const feeTo = await contract_service_1.ContractService.getFeeTo(poolFactorySails);
            res.status(200).json({
                success: true,
                data: { feeTo }
            });
        }
        catch (error) {
            console.error('Error getting fee to:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get fee to',
                message: error.message || 'An unknown error occurred'
            });
        }
    }
    static async getTreasuryId(req, res) {
        try {
            const poolFactorySails = req.app.locals.poolFactorySails;
            const treasuryId = await contract_service_1.ContractService.getTreasuryId(poolFactorySails);
            res.status(200).json({
                success: true,
                data: { treasuryId }
            });
        }
        catch (error) {
            console.error('Error getting treasury id:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get treasury id',
                message: error.message || 'An unknown error occurred'
            });
        }
    }
    static async healthCheck(_req, res) {
        try {
            res.status(200).json({
                success: true,
                message: 'Server running',
                data: {
                    status: 'healthy',
                    network: constants_1.NETWORK,
                    timestamp: new Date().toISOString()
                }
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: 'Health check failed',
                message: error.message || 'An unknown error occurred'
            });
        }
    }
}
exports.ContractController = ContractController;
//# sourceMappingURL=contract.controller.js.map