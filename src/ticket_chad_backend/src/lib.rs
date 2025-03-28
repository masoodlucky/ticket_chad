use ic_cdk_macros::{init, update, query};
use std::collections::HashMap;
use candid::CandidType;

type TicketId = u64;
static mut TICKETS: Option<HashMap<TicketId, Ticket>> = None;
static mut NEXT_ID: u64 = 0;

#[derive(Clone, CandidType)]
struct Ticket {
    event_name: String,
    owner: String,
    price: u64,
    is_sold: bool,
    seat_number: String,
}

#[init]
fn init() {
    unsafe {
        TICKETS = Some(HashMap::new());
        NEXT_ID = 0;
    }
}

#[update]
fn create_ticket(event_name: String, owner: String, price: u64, seat_number: String) -> TicketId {
    unsafe {
        let tickets = TICKETS.as_mut().unwrap();
        let id = NEXT_ID;
        NEXT_ID += 1;
        
        tickets.insert(id, Ticket {
            event_name,
            owner,
            price,
            is_sold: false,
            seat_number,
        });
        id
    }
}

#[update]
fn buy_ticket(id: TicketId, new_owner: String) -> bool {
    unsafe {
        let tickets = TICKETS.as_mut().unwrap();
        if let Some(ticket) = tickets.get_mut(&id) {
            if !ticket.is_sold {
                ticket.owner = new_owner;
                ticket.is_sold = true;
                return true;
            }
        }
        false
    }
}

#[update]
fn resell_ticket(id: TicketId, new_owner: String, max_price: u64) -> bool {
    unsafe {
        let tickets = TICKETS.as_mut().unwrap();
        if let Some(ticket) = tickets.get_mut(&id) {
            if ticket.is_sold && ticket.price <= max_price {
                ticket.owner = new_owner;
                return true;
            }
        }
        false
    }
}

#[query]
fn get_ticket(id: TicketId) -> Option<Ticket> {
    unsafe {
        TICKETS.as_ref().unwrap().get(&id).cloned()
    }
}