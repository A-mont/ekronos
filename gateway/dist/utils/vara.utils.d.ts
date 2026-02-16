import { GearApi } from "@gear-js/api";
import { HexString } from "@gear-js/api";
import { KeyringPair } from '@polkadot/keyring/types';
import { Sails } from "sails-js";
export declare const createGearApi: (network: string) => Promise<GearApi>;
export declare const gearKeyringByWalletData: (walletName: string, walletMnemonic: string) => Promise<KeyringPair>;
export declare const sailsInstance: (api: GearApi, contractId: HexString, idl: string) => Promise<Sails>;
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
//# sourceMappingURL=vara.utils.d.ts.map