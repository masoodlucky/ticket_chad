import { Actor, HttpAgent } from "@dfinity/agent";
import { idlFactory } from "../declarations/ticket_chad_backend/ticket_chad_backend.did.js";
import { canisterId } from "../declarations/ticket_chad_backend/index.js";

// Create an agent and configure it with identity
const agent = new HttpAgent({
    host: process.env.DFX_NETWORK === "ic" ? "https://icp0.io" : "http://127.0.0.1:4943",
});

// Create a new actor with the agent
const backend = Actor.createActor(idlFactory, {
    agent,
    canisterId: canisterId,
});

// Function to get the ticket ID from input
function getTicketId() {
    const input = document.getElementById('ticketId');
    return BigInt(Math.max(0, parseInt(input.value) || 0));
}

// Function to display messages in the result div
function displayResult(message, type = "") {
    const resultDiv = document.getElementById("result");
    // Reset background color to white for regular messages
    resultDiv.style.backgroundColor = "white";
    resultDiv.innerHTML = `<p class="${type}">${message}</p>`;
    console.log("Display message:", message); // Add logging for debugging
}

// Function to display ticket information
function displayTicketInfo(id, ticket) {
    if (!ticket) {
        displayResult("Ticket not found", "error");
        return;
    }
    
    const status = ticket.is_sold ? "sold" : "available";
    const resultDiv = document.getElementById("result");
    
    // Set the background color based on status
    resultDiv.style.backgroundColor = ticket.is_sold ? 'var(--sold-bg)' : 'var(--available-bg)';
    
    resultDiv.innerHTML = `
        <div class="ticket-info">
            <h3>Ticket ID: ${id}</h3>
            <p><strong>Event:</strong> ${ticket.event_name}</p>
            <p><strong>Owner:</strong> ${ticket.owner}</p>
            <p><strong>Price:</strong> ${ticket.price} ICP</p>
            <p><strong>Seat:</strong> ${ticket.seat_number}</p>
            <p><strong>Status:</strong> ${ticket.is_sold ? "Sold" : "Available"}</p>
        </div>
    `;
}

// Create a new ticket with predefined values
async function createTicket() {
    try {
        displayResult("Minting ticket...");
        console.log("Starting ticket creation..."); // Add logging
        
        // Predefined values as specified
        const eventName = "Hackathon Gala";
        const owner = "organizer";
        const price = BigInt(50); // Using BigInt for u64
        const seatNumber = "A1";
        
        console.log("Calling backend.create_ticket..."); // Add logging
        const ticketId = await backend.create_ticket(
            eventName,
            owner,
            price,
            seatNumber
        );
        
        console.log("Ticket created with ID:", ticketId); // Add logging
        
        // Update the ticket ID input with the new ticket's ID
        document.getElementById('ticketId').value = ticketId.toString();
        
        displayResult(`Ticket minted successfully! Ticket ID: ${ticketId}`, "success");
        
        // Get and display the created ticket details
        const ticket = await backend.get_ticket(ticketId);
        if (ticket.length > 0) {
            displayTicketInfo(ticketId, ticket[0]);
        }
    } catch (error) {
        console.error("Error details:", error);
        displayResult(`Error minting ticket: ${error.message}`, "error");
    }
}

// Buy ticket using input ticket ID
async function buyTicket() {
    try {
        const ticketId = getTicketId();
        displayResult(`Buying ticket ${ticketId}...`);
        
        // First check if ticket exists
        const ticketCheck = await backend.get_ticket(ticketId);
        if (ticketCheck.length === 0) {
            displayResult("Error: Ticket ID does not exist", "error");
            return;
        }
        
        const success = await backend.buy_ticket(
            ticketId,
            "alice"
        );
        
        if (success) {
            displayResult(`Ticket ${ticketId} bought successfully by alice!`, "success");
            
            // Get and display the updated ticket details
            const ticket = await backend.get_ticket(ticketId);
            if (ticket.length > 0) {
                displayTicketInfo(ticketId, ticket[0]);
            }
        } else {
            displayResult(`Error: Ticket ${ticketId} is not available for purchase`, "error");
        }
    } catch (error) {
        console.error("Error details:", error);
        displayResult(`Error: ${error.message}`, "error");
    }
}

// Resell ticket using input ticket ID
async function resellTicket() {
    try {
        const ticketId = getTicketId();
        displayResult(`Reselling ticket ${ticketId}...`);
        
        // First check if ticket exists
        const ticketCheck = await backend.get_ticket(ticketId);
        if (ticketCheck.length === 0) {
            displayResult("Error: Ticket ID does not exist", "error");
            return;
        }
        
        const success = await backend.resell_ticket(
            ticketId,
            "bob",
            BigInt(60)
        );
        
        if (success) {
            displayResult(`Ticket ${ticketId} resold successfully to bob!`, "success");
            
            // Get and display the updated ticket details
            const ticket = await backend.get_ticket(ticketId);
            if (ticket.length > 0) {
                displayTicketInfo(ticketId, ticket[0]);
            }
        } else {
            displayResult(`Error: Ticket ${ticketId} cannot be resold. It may not be owned by you or the price exceeds the cap.`, "error");
        }
    } catch (error) {
        console.error("Error details:", error);
        displayResult(`Error: ${error.message}`, "error");
    }
}

// Get ticket info using input ticket ID
async function getTicket() {
    try {
        const ticketId = getTicketId();
        displayResult(`Retrieving ticket ${ticketId} information...`);
        
        const ticket = await backend.get_ticket(ticketId);
        if (ticket.length > 0) {
            displayTicketInfo(ticketId, ticket[0]);
        } else {
            displayResult("Error: Ticket ID does not exist", "error");
        }
    } catch (error) {
        console.error("Error details:", error);
        displayResult(`Error: ${error.message}`, "error");
    }
}

// Function to clear the result display
function clearResult() {
    const resultDiv = document.getElementById("result");
    resultDiv.style.backgroundColor = "white";
    resultDiv.innerHTML = "<p>Results will be displayed here...</p>";
}

// Initialize the application
async function init() {
    try {
        // Initialize agent and fetch root key during local development
        const isLocalDevelopment = window.location.hostname.includes('localhost') || 
                                 window.location.hostname.includes('127.0.0.1');
        
        if (isLocalDevelopment) {
            console.log("Fetching root key for local development..."); // Add logging
            await agent.fetchRootKey().catch(err => {
                console.warn("Unable to fetch root key. Check if your local replica is running");
                console.error(err);
            });
        }
        
        // Add event listeners
        document.getElementById('createTicketBtn').addEventListener('click', createTicket);
        document.getElementById('buyTicketBtn').addEventListener('click', buyTicket);
        document.getElementById('resellTicketBtn').addEventListener('click', resellTicket);
        document.getElementById('getTicketBtn').addEventListener('click', getTicket);
        document.getElementById('clearResultBtn').addEventListener('click', clearResult);
        
        // Initial display
        console.log("Application initialized successfully"); // Add logging
        displayResult("Application initialized successfully. Ready to process tickets.");
    } catch (error) {
        console.error("Initialization error:", error);
        displayResult("Failed to initialize the application. Please check the console for details.", "error");
    }
}

// Wait for the DOM to load, then initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM loaded, initializing application..."); // Add logging
    init().catch(error => {
        console.error("Failed to initialize:", error);
        displayResult("Failed to initialize the application. Please check the console for details.", "error");
    });
}); 