use core::fmt::Debug;
use sails_rs::{
    cell::{
        RefCell,
        Ref,
        RefMut
    },
    prelude::*,
    gstd::msg,
    collections::{
        HashMap,
        HashSet
    }
};
use gstd::ext;

pub type AllowancesMap = HashMap<(ActorId, ActorId), U256>;
pub type BalancesMap = HashMap<ActorId, U256>;
pub type Result<T, E = Error> = core::result::Result<T, E>;

#[derive(Clone, Copy, Debug, PartialEq, Eq, PartialOrd, Ord, Encode, Decode, TypeInfo)]
#[codec(crate = sails_rs::scale_codec)]
#[scale_info(crate = sails_rs::scale_info)]
pub enum Error {
    InsufficientAllowance,
    InsufficientBalance,
    NumericOverflow,
    Underflow,
}

#[derive(Debug, Default, Clone)]
pub struct State {
    balances: HashMap<ActorId, U256>,
    allowances: HashMap<(ActorId, ActorId), U256>,
    meta: Metadata,
    total_supply: U256,

    minters: HashSet<ActorId>,
    burners: HashSet<ActorId>,
    admins: HashSet<ActorId>,
}

impl State {
    pub fn new(name: String, symbol: String, decimals: u8, admins: Vec<ActorId>) -> Self {
        let meta = Metadata {
            name,
            symbol,
            decimals
        };

        let mut state = Self::default();
        state.meta = meta;
        state.admins = admins.clone().into_iter().collect();
        state.minters = admins.clone().into_iter().collect();
        state.burners = admins.into_iter().collect();

        state
    }
}

#[derive(Encode, Decode, TypeInfo, Debug, Default, Clone, PartialEq, Eq)]
#[codec(crate = sails_rs::scale_codec)]
#[scale_info(crate = sails_rs::scale_info)]
pub struct Metadata {
    pub name: String,
    pub symbol: String,
    pub decimals: u8,
}

#[derive(Debug, Encode, Decode, TypeInfo, Clone, PartialEq, Eq)]
#[codec(crate = sails_rs::scale_codec)]
#[scale_info(crate = sails_rs::scale_info)]
pub struct IoState {
    balances: Vec<(ActorId, U256)>,
    allowances: Vec<((ActorId, ActorId), U256)>,
    meta: Metadata,
    total_supply: U256,

    minters: Vec<ActorId>,
    burners: Vec<ActorId>,
    admins: Vec<ActorId>,
}

impl From<State> for IoState {
    fn from(state: State) -> Self {
        let balances = state
            .balances
            .iter()
            .map(|(key, value)| (*key, value.clone()))
            .collect();
        let allowances = state
            .allowances
            .iter()
            .map(|(key, value)| (key.clone(), value.clone()))
            .collect();

        let meta = state.meta;
        let total_supply = state.total_supply;

        let minters = state
            .minters
            .iter()
            .map(|addr| *addr)
            .collect();
        let burners = state
            .burners
            .iter()
            .map(|addr| *addr)
            .collect();
        let admins = state
            .admins 
            .iter()
            .map(|addr| *addr)
            .collect();

        Self { 
            balances,
            allowances,
            meta,
            total_supply,

            minters,
            burners,
            admins
        }
    }
}

#[event]
#[derive(Debug, Encode, Decode, TypeInfo, Clone, PartialEq, Eq)]
#[codec(crate = sails_rs::scale_codec)]
#[scale_info(crate = sails_rs::scale_info)]
pub enum ContractEvent {
    Approval {
        owner: ActorId,
        spender: ActorId,
        value: U256,
    },
    Transfer {
        from: ActorId,
        to: ActorId,
        value: U256,
    },
    Minted { to: ActorId, value: U256 },
    Burned { from: ActorId, value: U256 },
}

pub struct Service<'a> {
    state: &'a RefCell<State>,
}

impl<'a> Service<'a> {
    pub fn new(state: &'a RefCell<State>) -> Self {
        Self { state }
    }

    fn get(&self) -> Ref<'a, State> {
        self.state.borrow()
    }

    fn get_mut(&self) -> RefMut<'a, State> {
        self.state.borrow_mut()
    }

    fn ensure_is_admin(&self) {
        if !self.get().admins.contains(&msg::source()) {
            panic!("Not admin")
        };
    }
}

#[service(events = ContractEvent)]
impl<'a> Service<'a> {
    #[export]
    pub fn approve(&mut self, spender: ActorId, value: U256) -> bool {
        let owner = msg::source();
        let mut storage = self.get_mut();
        let mutated = approve(&mut storage.allowances, owner, spender, value);

        if mutated {
            self.emit_event(ContractEvent::Approval {
                owner,
                spender,
                value,
            })
            .expect("Notification Error");
        }

        mutated
    }

    #[export]
    pub fn transfer(&mut self, to: ActorId, value: U256) -> bool {
        let from = msg::source();
        let mut storage = self.get_mut();
        let mutated =
            panicking(move || transfer(&mut storage.balances, from, to, value));

        if mutated {
            self.emit_event(ContractEvent::Transfer { from, to, value })
                .expect("Notification Error");
        }

        mutated
    }

    #[export]
    pub fn transfer_from(&mut self, from: ActorId, to: ActorId, value: U256) -> bool {
        let spender = msg::source();
        let mut storage = self.get_mut();
        let mutated = panicking(move || {
            transfer_from(
                &mut storage,
                spender,
                from,
                to,
                value,
            )
        });

        if mutated {
            self.emit_event(ContractEvent::Transfer { from, to, value })
                .expect("Notification Error");
        }

        mutated
    }

    #[export]
    pub fn mint(&mut self, to: ActorId, value: U256) -> bool {
        if !self.get().minters.contains(&msg::source()) {
            panic!("Not allowed to mint")
        };

        let mut state = self.get_mut();

        let mutated = panicking(|| {
            // mint(Storage::balances(), Storage::total_supply(), to, value)
            mint(&mut state, to, value)
        });
        if mutated {
            self.emit_event(ContractEvent::Minted { to, value })
                .expect("Notification Error");
        }
        mutated
    }

    #[export]
    pub fn burn(&mut self, from: ActorId, value: U256) -> bool {
        if !self.get().burners.contains(&msg::source()) {
            panic!("Not allowed to burn")
        };

        let mut state = self.get_mut();

        let mutated = panicking(|| {
            // burn(Storage::balances(), Storage::total_supply(), from, value)
            burn(&mut state, from, value)
        });
        if mutated {
            self.emit_event(ContractEvent::Burned { from, value })
                .expect("Notification Error");
        }
        mutated
    }

    #[export]
    pub fn grant_admin_role(&mut self, to: ActorId) {
        self.ensure_is_admin();
        self.get_mut().admins.insert(to);
    }

    #[export]
    pub fn grant_minter_role(&mut self, to: ActorId) {
        self.ensure_is_admin();
        self.get_mut().minters.insert(to);
    }

    #[export]
    pub fn grant_burner_role(&mut self, to: ActorId) {
        self.ensure_is_admin();
        self.get_mut().burners.insert(to);
    }

    #[export]
    pub fn revoke_admin_role(&mut self, from: ActorId) {
        self.ensure_is_admin();
        self.get_mut().admins.remove(&from);
    }

    #[export]
    pub fn revoke_minter_role(&mut self, from: ActorId) {
        self.ensure_is_admin();
        self.get_mut().minters.remove(&from);
    }

    #[export]
    pub fn revoke_burner_role(&mut self, from: ActorId) {
        self.ensure_is_admin();
        self.get_mut().burners.remove(&from);
    }



    #[export]
    pub fn allowance(&self, owner: ActorId, spender: ActorId) -> U256 {
        let storage = self.get();
        allowance(&storage.allowances, owner, spender)
    }

    #[export]
    pub fn balance_of(&self, account: ActorId) -> U256 {
        let storage = self.get();
        balance_of(&storage.balances, account)
    }

    #[export]
    pub fn decimals(&self) -> u8 {
        let storage = self.get();
        // &storage.meta.decimals
        storage.meta.decimals
    }

    #[export]
    pub fn name(&self) -> String {
        let storage = self.get();
        storage.meta.name.clone()
    }

    #[export]
    pub fn symbol(&self) -> String {
        let storage = self.get();
        storage.meta.symbol.clone()
    }

    #[export]
    pub fn total_supply(&self) -> U256 {
        let storage = self.get();
        storage.total_supply
    }



    #[export]
    pub fn minters(&self) -> Vec<ActorId> {
        self.get().minters.clone().into_iter().collect()
    }

    #[export]
    pub fn burners(&self) -> Vec<ActorId> {
        self.get().burners.clone().into_iter().collect()
    }

    #[export]
    pub fn admins(&self) -> Vec<ActorId> {
        self.get().admins.clone().into_iter().collect()
    }

    #[export]
    pub fn query_state(&self) -> IoState {
        self.get().clone().into()
    }
}

pub fn mint(
    state: &mut RefMut<'_, State>,
    to: ActorId,
    value: U256,
) -> Result<bool> {
    if value.is_zero() {
        return Ok(false);
    }

    let new_total_supply = state
        .total_supply
        .checked_add(value)
        .ok_or(Error::NumericOverflow)?;

    let new_to = balance_of(&state.balances, to)
        .checked_add(value)
        .ok_or(Error::NumericOverflow)?;

    state.balances.insert(to, new_to);
    state.total_supply = new_total_supply;

    Ok(true)
}

pub fn burn(
    state: &mut  RefMut<'_, State>,
    from: ActorId,
    value: U256,
) -> Result<bool> {
    if value.is_zero() {
        return Ok(false);
    }
    let new_total_supply = state.total_supply.checked_sub(value).ok_or(Error::Underflow)?;

    let new_from = balance_of(&state.balances, from)
        .checked_sub(value)
        .ok_or(Error::InsufficientBalance)?;

    if !new_from.is_zero() {
        state.balances.insert(from, new_from);
    } else {
        state.balances.remove(&from);
    }

    state.total_supply = new_total_supply;
    Ok(true)
}


pub fn allowance(allowances: &AllowancesMap, owner: ActorId, spender: ActorId) -> U256 {
    allowances
        .get(&(owner, spender))
        .cloned()
        .unwrap_or_default()
}

pub fn approve(
    allowances: &mut AllowancesMap,
    owner: ActorId,
    spender: ActorId,
    value: U256,
) -> bool {
    if owner == spender {
        return false;
    }

    let key = (owner, spender);

    if value.is_zero() {
        return allowances.remove(&key).is_some();
    }

    let prev = allowances.insert(key, value);

    prev.map(|v| v != value).unwrap_or(true)
}

pub fn balance_of(balances: &BalancesMap, owner: ActorId) -> U256 {
    balances.get(&owner).cloned().unwrap_or_default()
}

pub fn transfer(
    balances: &mut BalancesMap,
    from: ActorId,
    to: ActorId,
    value: U256,
) -> Result<bool> {
    if from == to || value.is_zero() {
        return Ok(false);
    }

    let new_from = balance_of(balances, from)
        .checked_sub(value)
        .ok_or(Error::InsufficientBalance)?;

    let new_to = balance_of(balances, to)
        .checked_add(value)
        .ok_or(Error::NumericOverflow)?;

    if !new_from.is_zero() {
        balances.insert(from, new_from);
    } else {
        balances.remove(&from);
    }

    balances.insert(to, new_to);

    Ok(true)
}

pub fn transfer_from(
    // allowances: &mut AllowancesMap,
    // balances: &mut BalancesMap,
    state: &mut RefMut<'_, State>,
    spender: ActorId,
    from: ActorId,
    to: ActorId,
    value: U256,
) -> Result<bool> {
    if spender == from {
        return transfer(&mut state.balances, from, to, value);
    }

    if from == to || value.is_zero() {
        return Ok(false);
    };

    let new_allowance = allowance(&state.allowances, from, spender)
        .checked_sub(value)
        .ok_or(Error::InsufficientAllowance)?;

    let _res = transfer(&mut state.balances, from, to, value)?;
    debug_assert!(_res);

    let key = (from, spender);

    if !new_allowance.is_zero() {
        state.allowances.insert(key, new_allowance);
    } else {
        state.allowances.remove(&key);
    }

    Ok(true)
}


pub fn panicking<T, E: Debug, F: FnOnce() -> Result<T, E>>(f: F) -> T {
    match f() {
        Ok(v) => v,
        Err(e) => panic(e),
    }
}

pub fn panic(err: impl Debug) -> ! {
    ext::panic(format!("{err:?}"))
}