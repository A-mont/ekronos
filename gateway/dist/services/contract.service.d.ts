import { Sails } from "sails-js";
import { HexString } from "@gear-js/api";
import { KeyringPair } from '@polkadot/keyring/types';
import { VftInitConfig } from '../utils/vara.utils';
export declare class ContractService {
    static createProgram(sails: Sails, signer: KeyringPair, initConfig: VftInitConfig): Promise<any>;
    static createPool(factorySails: Sails, poolFactorySails: Sails, signer: KeyringPair, tokenA: HexString, tokenB: HexString): Promise<HexString>;
    static createPoolWithRegisteredToken(factorySails: Sails, poolFactorySails: Sails, signer: KeyringPair, token: HexString, registeredToken?: HexString | null): Promise<HexString>;
    static getPairAddress(poolFactorySails: Sails, tokenA: HexString, tokenB: HexString): Promise<HexString | null>;
    static createProgramAndPool(factorySails: Sails, poolFactorySails: Sails, signer: KeyringPair, initConfig: VftInitConfig, registeredToken?: HexString | null): Promise<{
        programResponse: any;
        pairAddress: HexString;
    }>;
    static getAdmins(sails: Sails): Promise<string[]>;
    static getIdToAddress(sails: Sails): Promise<Array<[number, string]>>;
    static getNumber(sails: Sails): Promise<number>;
    static getRegistry(sails: Sails): Promise<any>;
    static getPoolFactoryAddress(sails: Sails): Promise<HexString>;
    static getAllPairs(poolFactorySails: Sails): Promise<Array<[[HexString, HexString], HexString]>>;
    static getFeeTo(poolFactorySails: Sails): Promise<HexString>;
    static getTreasuryId(poolFactorySails: Sails): Promise<HexString>;
}
//# sourceMappingURL=contract.service.d.ts.map