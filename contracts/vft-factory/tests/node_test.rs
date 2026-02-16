use sails_rs::{
    futures::StreamExt as _,
    gclient::Result
};
use contract_client::{ContractClient, contract_service::{ContractService, events::ContractServiceEvents}};
use fixture_node::*;

mod fixture_node;
mod utils;

#[tokio::test]
#[ignore]
async fn test_contract() -> Result<()> {
    let mut fixture_node = FixtureNode::new().await?;
    let _code_id = fixture_node
        .upload_contract_to_testnet()
        .await;
    let contract_program = fixture_node
        .create_contract()
        .await;

    let mut service_client = contract_program.contract_service();

    let service_listener = service_client.listener();
    let mut service_events = service_listener   
        .listen()
        .await
        .unwrap();

    // Act - Hello

    // Use generated client code for calling ContractService service.
    // To send a message, you must specify:
    // - Service to send the message
    // - Service method to call
    // Or use the client that you get before.

    let response = service_client
        .hello()
        .await
        .unwrap();

    assert_eq!(response, format!("Hello {:?}", fixture_node.api_signer()));

    // Get event
    let event = service_events
        .next()
        .await
        .unwrap();

    assert_eq!((contract_program.id(), ContractServiceEvents::Hello(fixture_node.api_signer())), event);

    // Act - Send value

    let response = contract_program
        .contract_service()
        .send_value()
        .with_value(utils::ONE_VARA)
        .await
        .unwrap();

    assert_eq!(response, "Value get: 1000000000000");

    let event = service_events
        .next()
        .await
        .unwrap();

    assert_eq!((contract_program.id(), ContractServiceEvents::ValueReceived(utils::ONE_VARA)), event);

    let contract_balance = fixture_node.balance_of(contract_program.id()).await;

    assert_eq!(utils::ONE_VARA * 2, contract_balance);

    // Act - Get value

    let response = contract_program
        .contract_service()
        .get_value(utils::ONE_VARA)
        .await
        .unwrap();

    assert_eq!(response, format!("Value returned: {}", utils::ONE_VARA));

    let event = service_events
        .next()
        .await
        .unwrap();

    assert_eq!((contract_program.id(), ContractServiceEvents::ValueSent(utils::ONE_VARA)), event);

    let contract_balance = fixture_node.balance_of(contract_program.id()).await;

    assert_eq!(contract_balance, utils::ONE_VARA);

    // Act - Increment value

    let response = contract_program
        .contract_service()
        .increment()
        .await
        .unwrap();

    assert_eq!(response, 1);

    let event = service_events
        .next()
        .await
        .unwrap();

    assert_eq!((contract_program.id(), ContractServiceEvents::Incremented), event);

    // Act - Get current counter value

    let counter_value = contract_program    
        .contract_service()
        .counter_value()
        .await
        .unwrap();

    assert_eq!(counter_value, 1);

    // Act - Decrement value

    let response = contract_program
        .contract_service()
        .decrement()
        .await
        .unwrap();

    assert_eq!(response, 0);

    let event = service_events
        .next()
        .await
        .unwrap();

    assert_eq!((contract_program.id(), ContractServiceEvents::Decremented), event);

    // Act error - Decrement value

    let response = contract_program
        .contract_service()
        .decrement()
        .await;

    assert!(response.is_err());

    // Act error - Get value error

    let response = contract_program
        .contract_service()
        .get_value(utils::ONE_VARA)
        .await;

    assert!(response.is_err());

    Ok(())
}