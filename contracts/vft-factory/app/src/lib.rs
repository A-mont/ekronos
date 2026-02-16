// Add your lib

#![no_std]

use sails_rs::{cell::RefCell, prelude::*};

pub mod services;

use services::service::{Service, State, InitConfigFactory};

pub struct Program {
    state: RefCell<State>,
}

#[program(payable)]
impl Program {
    pub fn new(config: InitConfigFactory) -> Self {
        let state = State::new(config);

        Self {
            state: RefCell::new(state),
        }
    }

    #[export(route = "service")]
    pub fn service(&self) -> Service<'_> {
        Service::new(&self.state)
    }
}
