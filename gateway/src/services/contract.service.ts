import { Sails } from "sails-js";
import { HexString } from "@gear-js/api";
import { KeyringPair } from '@polkadot/keyring/types';
import { VftInitConfig } from '../utils/vara.utils';
import { ONE_VARA } from "../config/constants";

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000000000000000000000000000';

export class ContractService {
    static async createProgram(
        sails: Sails,
        signer: KeyringPair,
        initConfig: VftInitConfig
    ): Promise<any> {
        try {
            const transaction = await sails
                .services              
                .Service               
                .functions             
                .CreateProgram(        
                    initConfig         
                )
                .withAccount(signer)   
                .withValue(BigInt(ONE_VARA))
                .calculateGas();       

            const { response } = await transaction.signAndSend();
            const contractResponse = await response();

            return contractResponse;
        } catch (error) {
            console.error('Error while creating program:', error);
            throw new Error(`Failed to create program: ${error}`);
        }
    }

    static async createPool(
        factorySails: Sails,
        poolFactorySails: Sails,
        signer: KeyringPair,
        tokenA: HexString,
        tokenB: HexString
    ): Promise<HexString> {
        try {
            const transaction = await factorySails
                .services
                .Service
                .functions
                .CreatePool(tokenA, tokenB)
                .withAccount(signer)
                .withValue(BigInt(ONE_VARA))
                .calculateGas();

            const { response } = await transaction.signAndSend();
            await response(); 

            const pairAddress = await this.getPairAddress(
                poolFactorySails,
                tokenA,
                tokenB
            );

            if (!pairAddress || pairAddress === ZERO_ADDRESS) {
                throw new Error('Pool was created but pair address not found');
            }

            return pairAddress;
        } catch (error) {
            console.error('Error while creating pool:', error);
            throw new Error(`Failed to create pool: ${error}`);
        }
    }

    static async createPoolWithRegisteredToken(
        factorySails: Sails,
        poolFactorySails: Sails,
        signer: KeyringPair,
        token: HexString,
        registeredToken: HexString | null = null
    ): Promise<HexString> {
        try {
            const transaction = await factorySails
                .services
                .Service
                .functions
                .CreatePoolWithRegisteredToken(token, registeredToken)
                .withAccount(signer)
                .withValue(BigInt(ONE_VARA))
                .calculateGas();

            const {  response } = await transaction.signAndSend();
            await response(); 

            await new Promise(resolve => setTimeout(resolve, 3000));

            const allPairs = await this.getAllPairs(poolFactorySails);

            if (allPairs && allPairs.length > 0) {
                const lastPair = allPairs[allPairs.length - 1];
                const pairAddress = lastPair[1]; 
                
                console.log(`Pool created at: ${pairAddress}`);
                return pairAddress;
            }

            throw new Error('Pool was created but pair address not found');
        } catch (error) {
            console.error('Error while creating pool with registered token:', error);
            throw new Error(`Failed to create pool with registered token: ${error}`);
        }
    }

    static async getPairAddress(
        poolFactorySails: Sails,
        tokenA: HexString,
        tokenB: HexString
    ): Promise<HexString | null> {
        try {
            const response = await poolFactorySails
                .services
                .Factory  
                .queries
                .GetPair(tokenA, tokenB)
                .call();

            const pairAddress = response as HexString;
            
            if (pairAddress === ZERO_ADDRESS) {
                return null;
            }

            return pairAddress;
        } catch (error) {
            console.error('Error while getting pair address:', error);
            throw new Error(`Failed to get pair address: ${error}`);
        }
    }

    static async createProgramAndPool(
        factorySails: Sails,
        poolFactorySails: Sails,
        signer: KeyringPair,
        initConfig: VftInitConfig,
        registeredToken: HexString | null = null
    ): Promise<{ programResponse: any; pairAddress: HexString }> {
        try {
            const programResponse = await this.createProgram(factorySails, signer, initConfig);

            let tokenAddress: HexString;

            if (programResponse.programCreated) {
                tokenAddress = programResponse.programCreated.address as HexString;
            } else {
                throw new Error('Program creation did not return expected response');
            }

            console.log(`Program created at: ${tokenAddress}`);

            await new Promise(resolve => setTimeout(resolve, 2000));

            const pairAddress = await this.createPoolWithRegisteredToken(
                factorySails,
                poolFactorySails,
                signer,
                tokenAddress,
                registeredToken
            );

            return {
                programResponse,
                pairAddress
            };
        } catch (error) {
            console.error('Error while creating program and pool:', error);
            throw new Error(`Failed to create program and pool: ${error}`);
        }
    }

    static async getAdmins(sails: Sails): Promise<string[]> {
        try {
            const response: HexString[] = await sails
                .services
                .Service
                .queries
                .Admins()
                .call();

            return response;
        } catch (error) {
            throw new Error(`Failed to get admins: ${error}`);
        }
    }

    static async getIdToAddress(sails: Sails): Promise<Array<[number, string]>> {
        try {
            const response = await sails
                .services
                .Service
                .queries
                .IdToAddress()
                .call();

            return response;
        } catch (error) {
            throw new Error(`Failed to get ID to address mapping: ${error}`);
        }
    }

    static async getNumber(sails: Sails): Promise<number> {
        try {
            const response = await sails
                .services
                .Service
                .queries
                .Number()
                .call();

            return response;
        } catch (error) {
            throw new Error(`Failed to get number: ${error}`);
        }
    }

    static async getRegistry(sails: Sails): Promise<any> {
        try {
            const response = await sails
                .services
                .Service
                .queries
                .Registry();

            return response;
        } catch (error) {
            throw new Error(`Failed to get registry: ${error}`);
        }
    }

    static async getPoolFactoryAddress(sails: Sails): Promise<HexString> {
        try {
            const response = await sails
                .services
                .Service
                .queries
                .PoolFactoryAddress()
                .call();

            return response as HexString;
        } catch (error) {
            throw new Error(`Failed to get pool factory address: ${error}`);
        }
    }

    static async getAllPairs(poolFactorySails: Sails): Promise<Array<[[HexString, HexString], HexString]>> {
        try {
            const response = await poolFactorySails
                .services
                .Factory
                .queries
                .Pairs()
                .call();

            return response as Array<[[HexString, HexString], HexString]>;
        } catch (error) {
            throw new Error(`Failed to get all pairs: ${error}`);
        }
    }

    static async getFeeTo(poolFactorySails: Sails): Promise<HexString> {
        try {
            const response = await poolFactorySails
                .services
                .Factory
                .queries
                .FeeTo()
                .call();

            return response as HexString;
        } catch (error) {
            throw new Error(`Failed to get fee to: ${error}`);
        }
    }

    static async getTreasuryId(poolFactorySails: Sails): Promise<HexString> {
        try {
            const response = await poolFactorySails
                .services
                .Factory
                .queries
                .TreasuryId()
                .call();

            return response as HexString;
        } catch (error) {
            throw new Error(`Failed to get treasury id: ${error}`);
        }
    }
}
