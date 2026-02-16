# Vft

Vara Fungible token for DEX usage.

## ⚙️ Settings

### Rust: You need to have rust 1.91 to be able to compile your contract:

- Install necessary rust version and components:

```bash
rustup install 1.91.0
rustup default 1.91.0
rustup target add wasm32v1-none
```

- Install the wasm-opt for contract compilations:

```bash       
sudo apt install binaryen
```

## 📁 Smart Contract Architecture

The contract works under a workspace which helps with the management of crate versions.

Contract crates:

- `client`: This crate generates the contract client and incorporates it in its code, it can be used in tests.
- `app`: Here goes all the business logic of the smart contract.

    > **Note:**
    > To avoid conflicts, it is recommended that you keep the "program" name (ContractProgram), everything else, such as services, state, etc. can change.

## 💻 Usage

- 🏗️ `Compilation`: To build the contract execute:

    ```sh
    cargo b -r
    ```

## ⚙️ initialization

When you are about to upload the contract in Gear Idea, you must assign the following data:

- name: Name of your vara fungible token
- symbol: Symbol of your vara fungible token
- decimals: Decimals that the VFT will use
- admins: a list of address that can mint and burn tokens

## Deploy the Contract on the IDEA Platform and Interact with Your Contract

### Step 1: Compile and Deploy the Smart Contract (On gitpod or local environment)

#### Compile the smart contract by running the following command:

```bash
cargo b -r
```

Once the compilation is complete, locate the `contract.opt.wasm` and `contract.idl` file in the `target/wasm32-gear/release` directory.

### Step 2: Download Your Substrate Wallet.

1. To interact with the Gear IDEA and deploy your contract, you will need to download a wallet extension such as [Polkadot-JS](https://polkadot.js.org/extension/), [Talisman](https://talisman.xyz/), or [Subwallet](https://subwallet.app/) to interact with Substrate-based chains.

<div align="center">
  <img src="https://polkadot.js.org/extension/extension-overview.png" alt="Polkadot-JS Extension">
</div>

### Step 3: Deploy Your Contract on Vara Network

1. Access [Gear IDE](https://idea.gear-tech.io/programs?node=wss%3A%2F%2Frpc.vara.network) using your web browser.
2. Connect your Substrate wallet to Gear IDEA.
3. Upload the `contract.opt.wasm` and `contract.idl` files by clicking the "Upload Program" button.

## Standards: [Standards](https://github.com/gear-foundation/standards.git)