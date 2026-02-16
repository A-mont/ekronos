"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.POOL_FACTORY_IDL = exports.FACTORY_IDL = exports.NODE_ENV = exports.API_KEY = exports.PORT = exports.POOL_FACTORY_CONTRACT_ID = exports.FACTORY_CONTRACT_ID = exports.WALLET_MNEMONIC = exports.WALLET_NAME = exports.NETWORK = exports.ONE_VARA = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const requiredEnvVars = ['VARA_NETWORK', 'FACTORY_CONTRACT_ID', 'POOL_FACTORY_CONTRACT_ID', 'WALLET_NAME', 'WALLET_MNEMONIC', 'API_KEY'];
for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        throw new Error(`Missing required environment variable: ${envVar}`);
    }
}
exports.ONE_VARA = 1000000000000;
exports.NETWORK = process.env.VARA_NETWORK;
exports.WALLET_NAME = process.env.WALLET_NAME;
exports.WALLET_MNEMONIC = process.env.WALLET_MNEMONIC;
exports.FACTORY_CONTRACT_ID = process.env.FACTORY_CONTRACT_ID;
exports.POOL_FACTORY_CONTRACT_ID = process.env.POOL_FACTORY_CONTRACT_ID;
exports.PORT = parseInt(process.env.PORT || '3000', 10);
exports.API_KEY = process.env.API_KEY;
exports.NODE_ENV = process.env.NODE_ENV || 'development';
exports.FACTORY_IDL = `
type InitConfigFactory = struct {
  code_id: code_id,
  factory_admin_account: vec actor_id,
  gas_for_program: u64,
  registered_tokens: vec DexToken,
  pool_factory_address: actor_id,
  default_registered_token: opt actor_id,
};

type DexToken = struct {
  name: str,
  symbol: str,
  address: actor_id,
};

type ContractResponse = enum {
  ProgramCreated: struct {
    id: u64,
    address: actor_id,
    init_config: VftInitConfig,
  },
  GasUpdatedSuccessfully: struct {
    updated_by: actor_id,
    new_gas_amount: u64,
  },
  CodeIdUpdatedSuccessfully: struct {
    updated_by: actor_id,
    new_code_id: code_id,
  },
  AdminAdded: struct {
    updated_by: actor_id,
    admin_actor_id: actor_id,
  },
  RegistryRemoved: struct {
    removed_by: actor_id,
    program_for_id: u64,
  },
};

type VftInitConfig = struct {
  name: str,
  symbol: str,
  decimals: u8,
  admins: vec actor_id,
  mint_amount: u128,
  mint_to: actor_id,
};

constructor {
  New : (config: InitConfigFactory);
};

service Service {
  AddAdminToFactory : (admin_actor_id: actor_id) -> ContractResponse;
  CreatePool : (token_a: actor_id, token_b: actor_id) -> actor_id;
  CreatePoolWithRegisteredToken : (token: actor_id, registered_token: opt actor_id) -> actor_id;
  CreateProgram : (init_config: VftInitConfig) -> ContractResponse;
  RegisterToken : (name: str, symbol: str, address: actor_id) -> null;
  RemoveRegistry : (program_for_id: u64) -> ContractResponse;
  SetPoolFactoryAddress : (pool_factory_address: actor_id) -> null;
  UpdateGasForProgram : (new_gas_amount: u64) -> ContractResponse;
  query Admins : () -> vec actor_id;
  query CodeId : () -> code_id;
  query GasForProgram : () -> u64;
  query IdToAddress : () -> vec struct { u64, actor_id };
  query Number : () -> u64;
  query PoolFactoryAddress : () -> actor_id;
  query Registry : () -> vec struct { actor_id, vec struct { u64, VftInitConfig } };

  events {
    ProgramCreated: struct {
      id: u64,
      address: actor_id,
      init_config: VftInitConfig,
    };
    GasUpdatedSuccessfully: struct {
      updated_by: actor_id,
      new_gas_amount: u64,
    };
    CodeIdUpdatedSuccessfully: struct {
      updated_by: actor_id,
      new_code_id: code_id,
    };
    AdminAdded: struct {
      updated_by: actor_id,
      admin_actor_id: actor_id,
    };
    RegistryRemoved: struct {
      removed_by: actor_id,
      program_for_id: u64,
    };
    PoolCreated: struct {
      token_a: actor_id,
      token_b: actor_id,
      pair: actor_id,
    };
  }
};
`;
exports.POOL_FACTORY_IDL = `
type Config = struct {
  gas_for_token_ops: u64,
  gas_for_reply_deposit: u64,
  reply_timeout: u32,
  gas_for_full_tx: u64,
  gas_for_pair_creation: u64,
  gas_to_change_fee_to: u64,
};

constructor {
  New : (pair_id: code_id, admin: actor_id, fee_to: actor_id, config: Config, treasury_id: actor_id);
};

service Factory {
  AddPair : (token0: actor_id, token1: actor_id, pair_address: actor_id) -> null;
  ChangeFeeTo : (fee_to: actor_id) -> null;
  ChangeTreasuryId : (new_treasury_id: actor_id) -> null;
  CreatePair : (token0: actor_id, token1: actor_id) -> null;
  query FeeTo : () -> actor_id;
  query GetPair : (token0: actor_id, token1: actor_id) -> actor_id;
  query Pairs : () -> vec struct { struct { actor_id, actor_id }, actor_id };
  query TreasuryId : () -> actor_id;

  events {
    PairCreated: struct {
      token0: actor_id,
      token1: actor_id,
      pair_address: actor_id,
    };
  }
};
`;
//# sourceMappingURL=constants.js.map