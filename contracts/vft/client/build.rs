fn main() {
    // Set builder with your contract program
    // - from_env: set the route where client will be generated (client/src)
    sails_rs::ClientBuilder::<contract_app::ContractProgram>::from_env()
        // build idl to create client
        .build_idl()
        // set mocks
        .with_mocks("with_mocks")
        // generate client
        .generate()
        .unwrap();
}
