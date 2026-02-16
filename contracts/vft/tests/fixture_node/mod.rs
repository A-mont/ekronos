#![allow(unused)]
#[warn(dead_code)]
use contract_client::{ContractClientCtors, ContractClientProgram};
use gear_core::{ids::prelude::CodeIdExt};
use sails_rs::{
    ActorId,
    CodeId,
    Encode,
    client::{
        Actor,
        GclientEnv, GearEnv,
    },
};

use gclient::{GearApi, Result};
use crate::utils;
use contract::WASM_BINARY;

pub trait ApiUtils {
    fn get_actor_id(&self) -> ActorId;
    fn get_specific_actor_id(&self, value: impl AsRef<str>) -> ActorId;
    async fn total_balance_of(&self, address: ActorId) -> u128;
}

pub(crate) struct FixtureNode {
    program_space: GclientEnv, //GClientRemoting,
    contract_code_id: Option<CodeId>,
    api: GearApi,
}

impl FixtureNode {
    pub(crate) async  fn new() -> Result<Self> {
        // Connect to testnet instead of create a local node
        // you can test your contract in a local node followint the next steps:
        // - Download the binary in https://get.gear.rs
        // - Set in your code: let api = GearApi::dev_from_path("../target/tmp/gear").await?;
        //   where the path is where your binary is located
        let api = GearApi::vara_testnet().await?;
        let mut listener = api.subscribe().await?;

        assert!(listener.blocks_running().await?);

        let program_space = GclientEnv::new(api.clone());

        Ok(Self {
            program_space,
            contract_code_id: None,
            api
        })
    }

    pub(crate) async fn new_client_with_tokens(&self, name: &str, tokens: u128) -> Self {
        let new_api = self.get_new_client_with_tokens(name, tokens).await;

        let program_space = GclientEnv::new(self.api.clone()); // GClientRemoting::new(new_api.clone());

        Self {
            program_space,
            contract_code_id: self.contract_code_id,
            api: new_api
        }
    }

    pub(crate) async fn balance_of(&self, address: ActorId) -> u128 {
        self.api.total_balance_of(address).await
    }

    pub(crate) fn api_signer(&self) -> ActorId {
        self.api.get_actor_id()
    }

    pub(crate) fn contract_code_id(&self) -> Option<CodeId> {
        self.contract_code_id
    }

    // Function to create contract on Vara Network Testnet
    // Notes:
    // - In your application constructor, it is recommended that you use names
    //   that you can easily identify (but, you can still use 'new')
    pub(crate) async fn create_contract(&self) -> Actor<ContractClientProgram, GclientEnv> {
        // Assert if the contract was uploaded
        debug_assert!(self.contract_code_id.is_some(), "The contract was not uploaded to the network, call 'upload_contract_to_testnet'");

        // Get the contract code id to create your contract
        let code_id = *self.contract_code_id.as_ref().unwrap();

        // NOTE: You must change salt each time you run your tests, if you run
        // your tests with same salt, you will get an error of "ProgramAlreadyExists"
        self.program_space
            .deploy::<ContractClientProgram>(code_id, utils::rand_salt())
            // If you set params in your applications constructors, you must set your arguments.
            // Use generated client code for activating Contract program using
            // the `new` constructor
            .new()
            .await
            .unwrap()
    }

    pub(crate) async fn upload_contract_to_testnet(&mut self) -> CodeId {
        let code_id = self.api.upload_code(WASM_BINARY)
            .await
            .map(|(code_id, _)| code_id)
            .unwrap_or(CodeId::generate(WASM_BINARY));

        self.contract_code_id = Some(code_id);

        code_id
    }

    pub(crate) async fn get_new_client_with_tokens(&self, name: &str, tokens_amount: u128) -> GearApi {
        let api = &self.api;
        let alice_balance = api.total_balance_of(api.get_actor_id()).await;

        if alice_balance <= tokens_amount {
            panic!("Alice balance is not enough: {} < {}", alice_balance, tokens_amount);
        }

        api.transfer_keep_alive(
            api.get_specific_actor_id(name)
                .encode()
                .as_slice()
                .try_into()
                .expect("Unexpected invalid `ActorId`."),
            tokens_amount,
        )
        .await
        .expect("Error transfer");

        api.clone().with(name).expect("Unable to change signer")
    }
}

impl ApiUtils for GearApi {
    fn get_actor_id(&self) -> ActorId {
        ActorId::new(
            self.account_id()
                .encode()
                .try_into()
                .expect("Unexpected invalid account id length."),
        )
    }
    fn get_specific_actor_id(&self, value: impl AsRef<str>) -> ActorId {
        let api_temp = self
            .clone()
            .with(value)
            .expect("Unable to build `GearApi` instance with provided signer.");
        api_temp.get_actor_id()
    }
    async fn total_balance_of(&self, address: ActorId) -> u128 {
        let balance = self.total_balance(address)
            .await
            .expect("Error total balance");

        balance
    }
}

// te amo mucho <3