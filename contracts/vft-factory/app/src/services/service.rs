
// Add your service

use sails_rs::{cell::RefCell, prelude::*};
use sails_rs::collections::HashMap;
use sails_rs::gstd::msg;
use gstd::prog::ProgramGenerator;

const REPLY_DEPOSIT: u64 = 10_000_000_000;
const ONE_VARA: u128 = 1_000_000_000_000;

#[derive(Encode, Decode, TypeInfo, Debug, Clone)]
#[codec(crate = sails_rs::scale_codec)]
#[scale_info(crate = sails_rs::scale_info)]
pub struct DexToken {
    name: String,
    symbol: String,
    address: ActorId,
}

#[derive(Encode, Decode, TypeInfo, Debug, Clone)]
#[codec(crate = sails_rs::scale_codec)]
#[scale_info(crate = sails_rs::scale_info)]
pub struct VftInitConfig {
    name: String, 
    symbol: String, 
    decimals: u8,
    admins: Vec<ActorId>,
    mint_amount: u128,
    mint_to: ActorId,
}

#[derive(Debug, Decode, Encode, TypeInfo)]
#[codec(crate = gstd::codec)]
#[scale_info(crate = gstd::scale_info)]
pub struct InitConfigFactory {
    pub code_id: CodeId,
    pub factory_admin_account: Vec<ActorId>,
    pub gas_for_program: u64,
    pub registered_tokens: Vec<DexToken>,
    pub pool_factory_address: ActorId,
    pub default_registered_token: Option<ActorId>,
}

#[derive(Default)]
pub struct State {
    pub number: u64,
    pub code_id: CodeId,
    pub factory_admin_account: Vec<ActorId>,
    pub gas_for_program: u64,
    pub id_to_address: HashMap<u64, ActorId>,
    pub registry: HashMap<ActorId, Vec<(u64, VftInitConfig)>>,
    pub pool_factory_address: ActorId,
    pub registered_tokens: HashMap<ActorId, DexToken>,
    pub registered_tokens_by_name_and_symbol: HashMap<(String, String), ActorId>,
    pub default_registered_token: Option<ActorId>,
}

impl State {
    pub fn new(config: InitConfigFactory) -> Self {
        let mut registered_tokens = HashMap::new();
        let mut registered_tokens_by_name_and_symbol = HashMap::new();

        for token in config.registered_tokens {
            registered_tokens.insert(token.address, token.clone());
            registered_tokens_by_name_and_symbol.insert((token.name.clone(), token.symbol.clone()), token.address);
        }

        Self {
            number: 0,
            code_id: config.code_id,
            factory_admin_account: config.factory_admin_account,
            gas_for_program: config.gas_for_program,
            pool_factory_address: config.pool_factory_address,
            default_registered_token: config.default_registered_token,
            registered_tokens,
            registered_tokens_by_name_and_symbol,
            ..Default::default()
        }
    }
}

#[derive(Encode, Decode, TypeInfo)]
#[codec(crate = sails_rs::scale_codec)]
#[scale_info(crate = sails_rs::scale_info)]
pub struct IoState {
    pub number: u64,
    pub code_id: CodeId,
    pub factory_admin_account: Vec<ActorId>,
    pub gas_for_program: u64,
    pub id_to_address: Vec<(u64, ActorId)>,
    pub registry: Vec<(ActorId, Vec<(u64, VftInitConfig)>)>,
}

impl From<State> for IoState {
    fn from(value: State) -> Self {
        let number = value.number;
        let code_id = value.code_id;
        let factory_admin_account = value.factory_admin_account;
        let id_to_address = value.id_to_address
            .iter()
            .map(|(key, addr)| (*key, *addr))
            .collect();
        let registry = value.registry
            .iter()
            .map(|(key, value)| (*key, value.clone()))
            .collect();
        let gas_for_program = value.gas_for_program;

        Self { 
            number, 
            code_id, 
            factory_admin_account, 
            gas_for_program, 
            id_to_address, 
            registry 
        }
    }
}

#[event]
#[derive(Debug, Encode, Decode, TypeInfo)]
#[codec(crate = sails_rs::scale_codec)]
#[scale_info(crate = sails_rs::scale_info)]
pub enum ContractEvent {
    ProgramCreated {
        id: u64,
        address: ActorId,
        init_config: VftInitConfig,
    },
    GasUpdatedSuccessfully {
        updated_by: ActorId,
        new_gas_amount: u64,
    },
    CodeIdUpdatedSuccessfully {
        updated_by: ActorId,
        new_code_id: CodeId,
    },
    AdminAdded {
        updated_by: ActorId,
        admin_actor_id: ActorId,
    },
    RegistryRemoved {
        removed_by: ActorId,
        program_for_id: u64,
    },
    PoolCreated {
        token_a: ActorId,
        token_b: ActorId,
        pair: ActorId
    },
}

#[derive(Debug, Encode, Decode, TypeInfo)]
#[codec(crate = sails_rs::scale_codec)]
#[scale_info(crate = sails_rs::scale_info)]
pub enum ContractResponse {
    ProgramCreated {
        id: u64,
        address: ActorId,
        init_config: VftInitConfig,
    },
    GasUpdatedSuccessfully {
        updated_by: ActorId,
        new_gas_amount: u64,
    },
    CodeIdUpdatedSuccessfully {
        updated_by: ActorId,
        new_code_id: CodeId,
    },
    AdminAdded {
        updated_by: ActorId,
        admin_actor_id: ActorId,
    },
    RegistryRemoved {
        removed_by: ActorId,
        program_for_id: u64,
    },
}

#[derive(Debug, Clone, Encode, Decode, TypeInfo)]
#[codec(crate = gstd::codec)]
#[scale_info(crate = gstd::scale_info)]
pub enum FactoryError {
    ProgramInitializationFailed,
    ProgramInitializationFailedWithContext(String),
    Unauthorized,
    UnexpectedFTEvent,
    MessageSendError,
    NotFound,
    IdNotFoundInAddress,
    IdNotFound,
    VftNotFound {
        error: String,
        vft_address: ActorId,
    },
    ErrorWhileCreatingMessageForVft(String),
    ErrorWhileCreatingPollMessage(String),
    ErrorWhileCreatingPool(String),
    ErrorWhileCreatingGetPairMessage(String),
    ErrorWhileGettingPair(String),
    TokensIsNotRegistered(ActorId),
    DefaultRegisteredTokenIsNotSet,
    MustAttachOneVara,

    ErrorWhileCreatingMintMessage(String),
    ErrorWhileMinting(String),
}

pub struct Service<'a> {
    state: &'a RefCell<State>,
}

impl<'a> Service<'a> {
    pub fn new(state: &'a RefCell<State>) -> Self {
        Self { state }
    }

    fn get(&self) -> core::cell::Ref<'_, State> {
        self.state.borrow()
    }

    fn get_mut(&self) -> core::cell::RefMut<'_, State> {
        self.state.borrow_mut()
    }
}

#[service(events = ContractEvent)]
impl Service<'_> {
    #[export(unwrap_result)]
    pub fn set_pool_factory_address(&mut self, pool_factory_address: ActorId) -> Result<(), FactoryError> {
        let mut state = self.get_mut();

        if !state.factory_admin_account.contains(&msg::source()) {
            return Err(FactoryError::Unauthorized);
        }

        state.pool_factory_address = pool_factory_address;
        Ok(())
    }

    #[export(unwrap_result)]
    pub fn register_token(&mut self, name: String, symbol: String, address: ActorId) -> Result<(), FactoryError> {
        let mut state = self.get_mut();

        if state.registered_tokens.contains_key(&address) {
            return Err(FactoryError::UnexpectedFTEvent);
        }

        let token = DexToken { name: name.clone(), symbol: symbol.clone(), address };
        state.registered_tokens.insert(address, token.clone());
        state.registered_tokens_by_name_and_symbol.insert((name, symbol), address);

        Ok(())
    }

    #[export(unwrap_result)]
    pub async fn create_pool_with_registered_token(&mut self, token: ActorId, registered_token: Option<ActorId>) -> Result<ActorId, FactoryError> {
        let value = msg::value();

        if value != ONE_VARA {
            return Err(FactoryError::MustAttachOneVara);
        }

        let state = self.get();

        let registered_token = match registered_token {
            None => {
                state.default_registered_token.ok_or(FactoryError::DefaultRegisteredTokenIsNotSet)?
            },
            Some(token) => token,
        };

        if !state.registered_tokens.contains_key(&registered_token) {
            return Err(FactoryError::TokensIsNotRegistered(registered_token));
        }

        let payload = [
            "Vft".encode(),
            "Name".encode(),
            ().encode()
        ].concat();

        // Check contract exists

        let _ = msg::send_bytes_for_reply(
            token, 
            payload.clone(), 
            0, 
            10_000_000_000
        )
        .map_err(|error| FactoryError::ErrorWhileCreatingMessageForVft(error.to_string()))?
        .await
        .map_err(|error| FactoryError::VftNotFound { error: error.to_string(), vft_address: token })?;

        let payload = [
            "Factory".encode(),
            "CreatePair".encode(),
            (registered_token, token).encode()
        ].concat();

        let _ = msg::send_bytes_for_reply(
            state.pool_factory_address, 
            payload, 
            ONE_VARA, 
            REPLY_DEPOSIT
        )
        .map_err(|error| FactoryError::ErrorWhileCreatingPollMessage(error.to_string()))?
        .await
        .map_err(|error| FactoryError::ErrorWhileCreatingPool(error.to_string()))?;

        let payload = [
            "Factory".encode(),
            "GetPair".encode(),
            (registered_token, token).encode()
        ].concat();

        let pair_address = msg::send_bytes_for_reply_as::<Vec<u8>, ActorId>(
            state.pool_factory_address, 
            payload, 
            0, 
            REPLY_DEPOSIT
        )
        .map_err(|error| FactoryError::ErrorWhileCreatingGetPairMessage(error.to_string()))?
        .await
        .map_err(|error| FactoryError::ErrorWhileGettingPair(error.to_string()))?;

        self.emit_event(ContractEvent::PoolCreated {
            token_a: registered_token,
            token_b: token,
            pair: pair_address
        }).unwrap();

        Ok(pair_address)
    }

    #[export(unwrap_result)]
    pub async fn create_pool(&mut self, token_a: ActorId, token_b: ActorId) -> Result<ActorId, FactoryError> {
        let value = msg::value();

        if value != ONE_VARA {
            return Err(FactoryError::MustAttachOneVara);
        }

        let state = self.get();

        let payload = [
            "Vft".encode(),
            "Name".encode(),
            ().encode()
        ].concat();

        // Check both contracts exists

        let _ = msg::send_bytes_for_reply(
            token_a, 
            payload.clone(), 
            0, 
            10_000_000_000
        )
        .map_err(|error| FactoryError::ErrorWhileCreatingMessageForVft(error.to_string()))?
        .await
        .map_err(|error| FactoryError::VftNotFound { error: error.to_string(), vft_address: token_a })?;

        let _ = msg::send_bytes_for_reply(
            token_b, 
            payload, 
            0, 
            REPLY_DEPOSIT
        )
        .map_err(|error| FactoryError::ErrorWhileCreatingMessageForVft(error.to_string()))?
        .await
        .map_err(|error| FactoryError::VftNotFound { error: error.to_string(), vft_address: token_b })?;

        let payload = [
            "Factory".encode(),
            "CreatePair".encode(),
            (token_a, token_b).encode()
        ].concat();

        let _ = msg::send_bytes_for_reply(
            state.pool_factory_address, 
            payload, 
            ONE_VARA, 
            REPLY_DEPOSIT
        )
        .map_err(|error| FactoryError::ErrorWhileCreatingPollMessage(error.to_string()))?
        .await
        .map_err(|error| FactoryError::ErrorWhileCreatingPool(error.to_string()))?;

        let payload = [
            "Factory".encode(),
            "GetPair".encode(),
            (token_a, token_b).encode()
        ].concat();

        let pair_address = msg::send_bytes_for_reply_as::<Vec<u8>, ActorId>(
            state.pool_factory_address, 
            payload, 
            0, 
            REPLY_DEPOSIT
        )
        .map_err(|error| FactoryError::ErrorWhileCreatingGetPairMessage(error.to_string()))?
        .await
        .map_err(|error| FactoryError::ErrorWhileGettingPair(error.to_string()))?;

        self.emit_event(ContractEvent::PoolCreated {
            token_a,
            token_b,
            pair: pair_address
        }).unwrap();

        Ok(pair_address)
    }

    #[export(unwrap_result)]
    pub async fn create_program(
        &mut self,
        init_config: VftInitConfig,
    ) -> Result<ContractResponse, FactoryError> {
        let mut state = self.get_mut();

        let name = init_config.name.clone();
        let symbol = init_config.symbol.clone();
        let decimals = init_config.decimals;
        let mut admins = init_config.admins.clone();
        admins.push(Syscall::program_id());

        let payload = [
            "New".encode(), 
            (name, symbol, decimals, admins).encode()
            ].concat();

        let create_program_future =
            ProgramGenerator::create_program_bytes_with_gas_for_reply(
                state.code_id,
                payload,
                state.gas_for_program,
                0,
                10_000_000_000,
            )
            .map_err(|e| FactoryError::ProgramInitializationFailedWithContext(e.to_string()))?;

        let (address, _) = create_program_future
            .await
            .map_err(|e| FactoryError::ProgramInitializationFailedWithContext(e.to_string()))?;

        let payload = [
            "Vft".encode(),
            "Mint".encode(),
            (init_config.mint_to, U256::from(init_config.mint_amount)).encode()
        ].concat();

        let _ = msg::send_bytes_for_reply(
            address, 
            payload, 
            0, 
            REPLY_DEPOSIT
        )
        .map_err(|error| FactoryError::ErrorWhileCreatingMintMessage(error.to_string()))?
        .await
        .map_err(|error| FactoryError::ErrorWhileMinting(error.to_string()))?;

        let number = state.number.saturating_add(1);
        state.number = number; 

        state.id_to_address.entry(number).or_insert(address);

        let programs_for_actor = state.registry.entry(msg::source()).or_default();
        programs_for_actor.push((number, init_config.clone()));

        self.emit_event(ContractEvent::ProgramCreated {
            id: number,
            address,
            init_config: init_config.clone(),
        }).unwrap();

        Ok(ContractResponse::ProgramCreated {
            id: number,
            address: address,
            init_config,
        })
    }

    #[export(unwrap_result)]
    pub fn update_gas_for_program(
        &mut self,
        new_gas_amount: u64,
    ) -> Result<ContractResponse, FactoryError> {
        let mut state = self.get_mut();

        if state.factory_admin_account.contains(&msg::source()) {
            state.gas_for_program = new_gas_amount;

            self.emit_event(ContractEvent::GasUpdatedSuccessfully {
                updated_by: msg::source(),
                new_gas_amount,
            }).unwrap();

            Ok(ContractResponse::GasUpdatedSuccessfully {
                updated_by: msg::source(),
                new_gas_amount,
            })
        } else {
            return Err(FactoryError::Unauthorized);
        }
    }

    pub fn update_code_id(&mut self, new_code_id: CodeId) -> Result<ContractResponse, FactoryError> {
        let mut state = self.get_mut();

        if state.factory_admin_account.contains(&msg::source()) {
            state.code_id = new_code_id;

            self.emit_event(ContractEvent::CodeIdUpdatedSuccessfully {
                updated_by: msg::source(),
                new_code_id,
            }).unwrap();

            Ok(ContractResponse::CodeIdUpdatedSuccessfully {
                updated_by: msg::source(),
                new_code_id,
            })
        } else {
            return Err(FactoryError::Unauthorized);
        }
    }

    #[export(unwrap_result)]
    pub fn add_admin_to_factory(
        &mut self,
        admin_actor_id: ActorId,
    ) -> Result<ContractResponse, FactoryError> {
        let mut state = self.get_mut();

        if state.factory_admin_account.contains(&msg::source()) {
            state.factory_admin_account.push(admin_actor_id);

            self.emit_event(ContractEvent::AdminAdded {
                updated_by: msg::source(),
                admin_actor_id,
            }).unwrap();

            Ok(ContractResponse::AdminAdded {
                updated_by: msg::source(),
                admin_actor_id,
            })
        } else {
            return Err(FactoryError::Unauthorized);
        }
    }

    #[export(unwrap_result)]
    pub fn remove_registry(&mut self, program_for_id: u64) -> Result<ContractResponse, FactoryError> {
        let mut state = self.get_mut();

        let source = msg::source();
        if state.factory_admin_account.contains(&source) {
            if state.id_to_address.remove(&program_for_id).is_none() {
                return Err(FactoryError::IdNotFoundInAddress);
            }

            let mut is_removed = false;

            for (_actor_id, info) in state.registry.iter_mut() {
                if let Some(pos) = info.iter().position(|(id, _)| *id == program_for_id) {
                    info.remove(pos);
                    is_removed = true;
                    break;
                }
            }

            if !is_removed {
                return Err(FactoryError::IdNotFound);
            }

            self.emit_event(ContractEvent::RegistryRemoved {
                removed_by: source,
                program_for_id,
            }).unwrap();

            Ok(ContractResponse::RegistryRemoved {
                removed_by: source,
                program_for_id,
            })
        } else {
            return Err(FactoryError::Unauthorized);
        }
    }

    #[export]
    pub fn pool_factory_address(&self) -> ActorId {
        self.get().pool_factory_address
    }

    #[export]
    pub fn number(&self) -> u64 {
        self.get().number
    }

    #[export]
    pub fn code_id(&self) -> CodeId {
        self.get().code_id
    }

    #[export]
    pub fn admins(&self) -> Vec<ActorId> {
        self.get().factory_admin_account.clone()
    }

    #[export] 
    pub fn gas_for_program(&self) -> u64 {
        self.get().gas_for_program
    }

    #[export]
    pub fn id_to_address(&self) -> Vec<(u64, ActorId)> {
        self.get()
            .id_to_address
            .iter()
            .map(|(&id, &actor_id)| (id, actor_id))
            .collect()
    }

    #[export]
    pub fn registry(&self) -> Vec<(ActorId, Vec<(u64, VftInitConfig)>)> {
        self.get()
            .registry
            .iter()
            .map(|(&actor_id, records)| (actor_id, records.clone()))
            .collect()
    }
}













