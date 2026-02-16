#![no_std]

use sails_rs::{cell::RefCell, prelude::*};

pub mod services;

use services::service::{Service, State};

pub struct Program {
    state: RefCell<State>,
}

#[program]
impl Program {
    pub fn new(name: String, symbol: String, decimals: u8, admins: Vec<ActorId>) -> Self {
        let state = State::new(name, symbol, decimals, admins);

        Self {
            state: RefCell::new(state), 
        }
    }

    #[export(route = "Vft")]
    pub fn service(&self) -> Service<'_> {
        Service::new(&self.state)
    }
}