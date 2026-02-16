import { GearApi, GearKeyring } from "@gear-js/api";
import { HexString } from "@gear-js/api";
import { KeyringPair } from '@polkadot/keyring/types';
import { Sails } from "sails-js";
import { SailsIdlParser } from "sails-js-parser";

export const createGearApi = async (network: string): Promise<GearApi> => {
    try {
        const api = await GearApi.create({
            providerAddress: network
        });
        return api;
    } catch (error) {
        throw new Error(`Failed to create GearApi: ${error}`);
    }
};

export const gearKeyringByWalletData = async (
    walletName: string, 
    walletMnemonic: string
): Promise<KeyringPair> => {
    try {
        const signer = await GearKeyring.fromMnemonic(walletMnemonic, walletName);
        return signer;
    } catch (error) {
        throw new Error(`Failed to create signer: ${error}`);
    }
};

export const sailsInstance = async (
    api: GearApi,
    contractId: HexString,
    idl: string
): Promise<Sails> => {
    try {
        const parser = await SailsIdlParser.new();
        const sails = new Sails(parser);

        sails.setApi(api);
        sails.setProgramId(contractId);
        sails.parseIdl(idl);

        return sails;
    } catch (error) {
        throw new Error(`Failed to create Sails instance: ${error}`);
    }
};


export interface VftInitConfig {
    name: string;
    symbol: string;
    decimals: number;
    admins: string[];
    mint_amount: BigInt;  
    mint_to: string;      
}

export interface ProgramCreatedResponse {
    ProgramCreated: {
        id: number;
        address: string;
        init_config: VftInitConfig;
    };
}

export interface CreatePoolInput {
    token_a: string;
    token_b: string;
}

export interface CreatePoolWithRegisteredTokenInput {
    token: string;
    registered_token?: string | null;
}

export interface CreateProgramAndPoolInput {
    name: string;
    symbol: string;
    decimals: number;
    admins: string[];
    mint_amount: string;
    mint_to: string;
    registered_token?: string | null;
}
