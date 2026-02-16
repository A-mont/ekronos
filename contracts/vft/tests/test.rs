use contract_client::{
    ContractClient, 
    contract_service::{
        ContractService, 
        events::ContractServiceEvents
    }
};
use sails_rs::{
    ActorId,
    futures::StreamExt as _
};
use fixture::{
    ADMIN_ID,
    Fixture
};


mod fixture;
mod utils;

#[tokio::test]
async fn hello_world() {
    // Create fixture and get your contract
    let fixture = Fixture::new();
    let contract_program = fixture
        .create_contract(vec![1])
        .await;

    // get contract service client  
    let service_client = contract_program.contract_service();
    
    // Listen to Service events
    let service_listener = service_client.listener();
    let mut service_events = service_listener
        .listen()
        .await
        .unwrap();

    // Act

    // Use generated client code for calling ContractService service.
    // To send a message, you must specify:
    // - Service to send the message
    // - Service method to call
    // Or use the client that you get before.
    let response = contract_program
        .contract_service() // Service
        .hello() // Service method
        .await
        .unwrap(); 

    //  Get event 
    let event = service_events
        .next()
        .await
        .unwrap();

    // Assert
    assert_eq!(format!("Hello {:?}", ActorId::from(ADMIN_ID)), response);
    assert_eq!((contract_program.id(), ContractServiceEvents::Hello(ActorId::from(ADMIN_ID))), event)

}

#[tokio::test]
async fn increment_and_decrement() {
    // Create fixture and get your contract
    let fixture = Fixture::new();
    let contract_program = fixture
        .create_contract(vec![1])
        .await;

    // get contract service client  
    let mut service_client = contract_program.contract_service();
    
    // Listen to Service events
    let service_listener = service_client.listener();
    let mut service_events = service_listener
        .listen()
        .await
        .unwrap();

    // Assert increment

    let response = service_client // Service
        .increment() // Service method
        .await
        .unwrap(); 

    assert_eq!(response, 1);

    let event = service_events
        .next()
        .await
        .unwrap();
    
    assert_eq!((contract_program.id(), ContractServiceEvents::Incremented), event);

    // Assert value

    let response = contract_program
        .contract_service()
        .counter_value()
        .await
        .unwrap();

    assert_eq!(response, 1);

    // Assert decrement

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

    // Assert error - decrement value

    let response = contract_program
        .contract_service()
        .decrement()
        .await;

    assert!(response.is_err());
}


#[tokio::test]
async fn send_and_get_value() {
     // Create fixture and get your contract
    let fixture = Fixture::new();
    let contract_program = fixture
        .create_contract(vec![1])
        .await;

    // get contract service client  
    let service_client = contract_program.contract_service();
    
    // Listen to Service events
    let service_listener = service_client.listener();
    let mut service_events = service_listener
        .listen()
        .await
        .unwrap();

    // Assert send value

    let response = contract_program
        .contract_service()
        .send_value()
        .with_value(utils::ONE_VARA)
        .await
        .unwrap();

    assert_eq!(response, format!("Value get: {}", utils::ONE_VARA));

    let contract_balance = fixture.balance_of(contract_program.id());

    assert_eq!(contract_balance, utils::ONE_VARA * 2);

    let event = service_events
        .next()
        .await
        .unwrap();

    assert_eq!((contract_program.id(), ContractServiceEvents::ValueReceived(utils::ONE_VARA)), event);

    // Assert get value

    let response = contract_program
        .contract_service()
        .get_value(utils::ONE_VARA)
        .await
        .unwrap();

    assert_eq!(response, format!("Value returned: {}", utils::ONE_VARA));

    let contract_balance = fixture.balance_of(contract_program.id());

    assert_eq!(contract_balance, utils::ONE_VARA);

    let event = service_events
        .next()
        .await
        .unwrap();

    assert_eq!((contract_program.id(), ContractServiceEvents::ValueSent(utils::ONE_VARA)), event);

    // Assert error - Get balance
    
    let result = contract_program
        .contract_service()
        .get_value(utils::ONE_VARA)
        .await;

    assert!(result.is_err());

}