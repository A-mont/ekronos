import { Request, Response } from 'express';
import { HexString } from '@gear-js/api';
import { Sails } from 'sails-js';
import { KeyringPair } from '@polkadot/keyring/types';
import { ContractService } from '../services/contract.service';
import { VftInitConfig } from '../utils/vara.utils';
import { NETWORK } from '../config/constants';

export class ContractController {
    static async createProgram(req: Request, res: Response): Promise<void> {
        try {
            const { admins, name, symbol, decimals, mint_amount, mint_to } = req.body;

            const sails = req.app.locals.factorySails as Sails;
            const signer = req.app.locals.signer as KeyringPair;

            const initConfig: VftInitConfig = {
                admins,
                name,
                symbol,
                decimals,
                mint_amount: BigInt(mint_amount),
                mint_to
            };

            const response = await ContractService.createProgram(
                sails,
                signer,
                initConfig
            );

            res.status(200).json({
                success: true,
                message: 'Program created successfully',
                data: response
            });

        } catch (error: any) {
            console.error('Error creating program:', error);
            
            res.status(500).json({
                success: false,
                error: 'Failed to create program',
                message: error.message || 'An unknown error occurred',
                details: error.toString()
            });
        }
    }

    static async createPool(req: Request, res: Response): Promise<void> {
        try {
            const { token_a, token_b } = req.body;

            const factorySails = req.app.locals.factorySails as Sails;
            const poolFactorySails = req.app.locals.poolFactorySails as Sails;
            const signer = req.app.locals.signer as KeyringPair;

            const existingPair = await ContractService.getPairAddress(
                poolFactorySails,
                token_a as HexString,
                token_b as HexString
            );

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

            const pairAddress = await ContractService.createPool(
                factorySails,
                poolFactorySails,
                signer,
                token_a as HexString,
                token_b as HexString
            );

            res.status(200).json({
                success: true,
                message: 'Pool created successfully',
                data: {
                    pairAddress,
                    tokenA: token_a,
                    tokenB: token_b
                }
            });

        } catch (error: any) {
            console.error('Error creating pool:', error);
            
            res.status(500).json({
                success: false,
                error: 'Failed to create pool',
                message: error.message || 'An unknown error occurred',
                details: error.toString()
            });
        }
    }

    static async createPoolWithRegisteredToken(req: Request, res: Response): Promise<void> {
        try {
            const { token, registered_token } = req.body;

            const factorySails = req.app.locals.factorySails as Sails;
            const poolFactorySails = req.app.locals.poolFactorySails as Sails;
            const signer = req.app.locals.signer as KeyringPair;

            let registeredTokenAddress: HexString | null = registered_token || null;

            if (registeredTokenAddress) {
                const existingPair = await ContractService.getPairAddress(
                    poolFactorySails,
                    token as HexString,
                    registeredTokenAddress
                );

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

            const pairAddress = await ContractService.createPoolWithRegisteredToken(
                factorySails,
                poolFactorySails,
                signer,
                token as HexString,
                registeredTokenAddress
            );

            res.status(200).json({
                success: true,
                message: 'Pool created successfully',
                data: {
                    pairAddress,
                    token,
                    registeredToken: registeredTokenAddress
                }
            });

        } catch (error: any) {
            console.error('Error creating pool with registered token:', error);
            
            res.status(500).json({
                success: false,
                error: 'Failed to create pool with registered token',
                message: error.message || 'An unknown error occurred',
                details: error.toString()
            });
        }
    }

    static async createProgramAndPool(req: Request, res: Response): Promise<void> {
        try {
            const { admins, name, symbol, decimals, mint_amount, mint_to, registered_token } = req.body;

            const factorySails = req.app.locals.factorySails as Sails;
            const poolFactorySails = req.app.locals.poolFactorySails as Sails;
            const signer = req.app.locals.signer as KeyringPair;

            const initConfig: VftInitConfig = {
                admins,
                name,
                symbol,
                decimals,
                mint_amount: BigInt(mint_amount),
                mint_to
            };

            const registeredTokenAddress: HexString = registered_token || "0xd0f89cfd994c92bb743a5a69049609b796e2026e05318f7eef621a5e31df3d4b";

            const result = await ContractService.createProgramAndPool(
                factorySails,
                poolFactorySails,
                signer,
                initConfig,
                registeredTokenAddress
            );

            res.status(200).json({
                success: true,
                message: 'Program and pool created successfully',
                data: {
                    program: result.programResponse,
                    pairAddress: result.pairAddress,
                    registeredToken: registeredTokenAddress
                }
            });

        } catch (error: any) {
            console.error('Error creating program and pool:', error);
            
            res.status(500).json({
                success: false,
                error: 'Failed to create program and pool',
                message: error.message || 'An unknown error occurred',
                details: error.toString()
            });
        }
    }

    static async getAdmins(req: Request, res: Response): Promise<void> {
        try {
            const sails = req.app.locals.factorySails as Sails;
            const admins = await ContractService.getAdmins(sails);

            res.status(200).json({
                success: true,
                data: { admins }
            });
        } catch (error: any) {
            console.error('Error getting admins:', error);
            
            res.status(500).json({
                success: false,
                error: 'Failed to get admins',
                message: error.message || 'An unknown error occurred'
            });
        }
    }

    static async getIdToAddress(req: Request, res: Response): Promise<void> {
        try {
            const sails = req.app.locals.factorySails as Sails;
            const mapping = await ContractService.getIdToAddress(sails);

            res.status(200).json({
                success: true,
                data: { idToAddress: mapping }
            });
        } catch (error: any) {
            console.error('Error getIdToAddress:', error);
            
            res.status(500).json({
                success: false,
                error: 'Failed to get ID to address mapping',
                message: error.message || 'An unknown error occurred'
            });
        }
    }

    static async getNumber(req: Request, res: Response): Promise<void> {
        try {
            const sails = req.app.locals.factorySails as Sails;
            const number = await ContractService.getNumber(sails);

            res.status(200).json({
                success: true,
                data: { totalPrograms: number }
            });
        } catch (error: any) {
            console.error('Error getNumber:', error);
            
            res.status(500).json({
                success: false,
                error: 'Failed to get number',
                message: error.message || 'An unknown error occurred'
            });
        }
    }

    static async getRegistry(req: Request, res: Response): Promise<void> {
        try {
            const sails = req.app.locals.factorySails as Sails;
            const registry = await ContractService.getRegistry(sails);

            res.status(200).json({
                success: true,
                data: { registry }
            });
        } catch (error: any) {
            console.error('Error getRegistry:', error);
            
            res.status(500).json({
                success: false,
                error: 'Failed to get registry',
                message: error.message || 'An unknown error occurred'
            });
        }
    }

    static async getPoolFactoryAddress(req: Request, res: Response): Promise<void> {
        try {
            const sails = req.app.locals.factorySails as Sails;
            const address = await ContractService.getPoolFactoryAddress(sails);

            res.status(200).json({
                success: true,
                data: { poolFactoryAddress: address }
            });
        } catch (error: any) {
            console.error('Error getting pool factory address:', error);
            
            res.status(500).json({
                success: false,
                error: 'Failed to get pool factory address',
                message: error.message || 'An unknown error occurred'
            });
        }
    }

    static async getPairAddress(req: Request, res: Response): Promise<void> {
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

            const poolFactorySails = req.app.locals.poolFactorySails as Sails;
            const pairAddress = await ContractService.getPairAddress(
                poolFactorySails,
                token_a as HexString,
                token_b as HexString
            );

            res.status(200).json({
                success: true,
                data: {
                    pairAddress: pairAddress || null,
                    exists: !!pairAddress
                }
            });
        } catch (error: any) {
            console.error('Error getting pair address:', error);
            
            res.status(500).json({
                success: false,
                error: 'Failed to get pair address',
                message: error.message || 'An unknown error occurred'
            });
        }
    }

    static async getAllPairs(req: Request, res: Response): Promise<void> {
        try {
            const poolFactorySails = req.app.locals.poolFactorySails as Sails;
            const pairs = await ContractService.getAllPairs(poolFactorySails);

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
        } catch (error: any) {
            console.error('Error getting all pairs:', error);
            
            res.status(500).json({
                success: false,
                error: 'Failed to get all pairs',
                message: error.message || 'An unknown error occurred'
            });
        }
    }

    static async getFeeTo(req: Request, res: Response): Promise<void> {
        try {
            const poolFactorySails = req.app.locals.poolFactorySails as Sails;
            const feeTo = await ContractService.getFeeTo(poolFactorySails);

            res.status(200).json({
                success: true,
                data: { feeTo }
            });
        } catch (error: any) {
            console.error('Error getting fee to:', error);
            
            res.status(500).json({
                success: false,
                error: 'Failed to get fee to',
                message: error.message || 'An unknown error occurred'
            });
        }
    }

    static async getTreasuryId(req: Request, res: Response): Promise<void> {
        try {
            const poolFactorySails = req.app.locals.poolFactorySails as Sails;
            const treasuryId = await ContractService.getTreasuryId(poolFactorySails);

            res.status(200).json({
                success: true,
                data: { treasuryId }
            });
        } catch (error: any) {
            console.error('Error getting treasury id:', error);
            
            res.status(500).json({
                success: false,
                error: 'Failed to get treasury id',
                message: error.message || 'An unknown error occurred'
            });
        }
    }

    static async healthCheck(_req: Request, res: Response): Promise<void> {
        try {
            res.status(200).json({
                success: true,
                message: 'Server running',
                data: {
                    status: 'healthy',
                    network: NETWORK,
                    timestamp: new Date().toISOString()
                }
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                error: 'Health check failed',
                message: error.message || 'An unknown error occurred'
            });
        }
    }
}
