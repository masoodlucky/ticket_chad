import { ticket_chad_backend } from "declarations/ticket_chad_backend";

// Form fields
let eventName = "";
let ownerName = "";
let price = 0;
let seatNumber = "";
let ticketId = 0;
let eventDate = "";
let resaleCap = 150; // Default 50% markup

// Initialize the UI with form inputs
window.onload = function() {
  const body = document.querySelector('body');
  
  // Add event form
  const form = document.createElement('div');
  form.innerHTML = `
    <div class="form-container">
      <h2>Ticket Details</h2>
      <div>
        <label for="eventName">Event Name:</label>
        <input type="text" id="eventName">
      </div>
      <div>
        <label for="ownerName">Owner Name:</label>
        <input type="text" id="ownerName">
      </div>
      <div>
        <label for="price">Price (ICP):</label>
        <input type="number" id="price" min="1">
      </div>
      <div>
        <label for="seatNumber">Seat Number:</label>
        <input type="text" id="seatNumber">
      </div>
      <div>
        <label for="ticketId">Ticket ID (for buying/reselling):</label>
        <input type="number" id="ticketId" min="0">
      </div>
      <div>
        <label for="eventDate">Event Date:</label>
        <input type="date" id="eventDate">
      </div>
      <div>
        <label for="resaleCap">Resale Price Cap (%):</label>
        <input type="number" id="resaleCap" min="100" value="150">
      </div>
    </div>

    <div class="additional-actions">
      <h3>Advanced Actions</h3>
      <button onclick="getAllTickets()">List All Tickets</button>
      <button onclick="getTicketsByOwner()">Find My Tickets</button>
      <button onclick="getTicketsByEvent()">Find Event Tickets</button>
      <button onclick="setResaleCap()">Update Resale Cap</button>
      <button onclick="setEventDate()">Update Event Date</button>
    </div>
  `;
  
  body.insertBefore(form, document.getElementById('result'));
  
  // Add styles
  const style = document.createElement('style');
  style.textContent = `
    body {
      font-family: Arial, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    .subtitle {
      font-style: italic;
      color: #666;
      margin-bottom: 20px;
    }
    .form-container {
      margin: 20px 0;
      padding: 15px;
      border: 1px solid #ccc;
      border-radius: 5px;
      background-color: #f9f9f9;
    }
    .form-container div {
      margin-bottom: 10px;
    }
    label {
      display: inline-block;
      width: 180px;
      font-weight: bold;
    }
    input {
      padding: 5px;
      border: 1px solid #ddd;
      border-radius: 3px;
      width: 200px;
    }
    .actions, .additional-actions {
      margin: 20px 0;
    }
    .actions button {
      padding: 10px 18px;
      margin-right: 10px;
      margin-bottom: 10px;
      background-color: #4CAF50;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: bold;
    }
    .additional-actions button {
      padding: 8px 16px;
      margin-right: 10px;
      margin-bottom: 10px;
      background-color: #2196F3;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    button:hover {
      opacity: 0.9;
    }
    #result {
      margin-top: 20px;
      padding: 15px;
      border: 1px solid #ddd;
      border-radius: 4px;
      min-height: 50px;
      background-color: #fff;
    }
    .ticket-card {
      border: 1px solid #ccc;
      border-radius: 5px;
      padding: 10px;
      margin-bottom: 10px;
      background-color: #fff;
    }
    .ticket-card h4 {
      margin-top: 0;
      border-bottom: 1px solid #eee;
      padding-bottom: 5px;
    }
    .error {
      color: red;
      font-weight: bold;
    }
    .success {
      color: green;
      font-weight: bold;
    }
  `;
  document.head.appendChild(style);
}

// Get values from form
function getFormValues() {
  eventName = document.getElementById('eventName').value;
  ownerName = document.getElementById('ownerName').value;
  price = parseInt(document.getElementById('price').value) || 0;
  seatNumber = document.getElementById('seatNumber').value;
  ticketId = parseInt(document.getElementById('ticketId').value) || 0;
  
  const dateInput = document.getElementById('eventDate');
  eventDate = dateInput.value ? new Date(dateInput.value).toISOString() : '';
  
  resaleCap = parseInt(document.getElementById('resaleCap').value) || 150;
}

// Create new ticket
window.createTicket = async function() {
  getFormValues();
  
  if (!eventName || !ownerName || !price || !seatNumber) {
    showMessage("Please fill all required fields for minting a ticket", "error");
    return;
  }
  
  try {
    const id = await ticket_chad_backend.create_ticket(eventName, ownerName, BigInt(price), seatNumber);
    
    if (id === BigInt(2**64 - 1)) {
      showMessage("Failed to create ticket: validation error", "error");
      return;
    }
    
    showMessage(`Ticket minted successfully! Ticket ID: ${id}`, "success");
    
    // Set event date if provided
    if (eventDate) {
      await ticket_chad_backend.set_event_date(id, eventDate);
    }
    
    // Set resale cap if changed from default
    if (resaleCap !== 150) {
      await ticket_chad_backend.set_resale_price_cap(id, resaleCap);
    }
    
    // Display the created ticket
    await getTicketInfo(id);
  } catch (error) {
    showMessage(`Error: ${error.message}`, "error");
  }
}

// Buy ticket
window.buyTicket = async function() {
  getFormValues();
  
  if (!ownerName || !ticketId && ticketId !== 0) {
    showMessage("Please provide Ticket ID and new Owner Name", "error");
    return;
  }
  
  try {
    const success = await ticket_chad_backend.buy_ticket(BigInt(ticketId), ownerName);
    if (success) {
      showMessage("Ticket purchased successfully!", "success");
      await getTicketInfo(BigInt(ticketId));
    } else {
      showMessage("Failed to purchase ticket. It may be already sold.", "error");
    }
  } catch (error) {
    showMessage(`Error: ${error.message}`, "error");
  }
}

// Resell ticket
window.resellTicket = async function() {
  getFormValues();
  
  if (!ownerName || (!ticketId && ticketId !== 0) || !price) {
    showMessage("Please provide Ticket ID, new Owner Name, and Price", "error");
    return;
  }
  
  try {
    const success = await ticket_chad_backend.resell_ticket(BigInt(ticketId), ownerName, BigInt(price));
    if (success) {
      showMessage("Ticket resold successfully!", "success");
      await getTicketInfo(BigInt(ticketId));
    } else {
      showMessage("Failed to resell ticket. Price may exceed cap or the ticket doesn't exist.", "error");
    }
  } catch (error) {
    showMessage(`Error: ${error.message}`, "error");
  }
}

// Query ticket info
window.getTicketInfo = async function(specificId) {
  const id = specificId || (getFormValues(), BigInt(ticketId));
  
  if (!id && id !== BigInt(0)) {
    showMessage("Please provide a Ticket ID", "error");
    return;
  }
  
  try {
    const ticket = await ticket_chad_backend.get_ticket(id);
    if (ticket && ticket.length > 0) {
      const ticketData = ticket[0];
      displayTicket(id, ticketData);
    } else {
      showMessage("Ticket not found", "error");
    }
  } catch (error) {
    showMessage(`Error: ${error.message}`, "error");
  }
}

// Get all tickets
window.getAllTickets = async function() {
  try {
    const tickets = await ticket_chad_backend.get_all_tickets();
    if (tickets && tickets.length > 0) {
      displayTicketList(tickets, "All Tickets");
    } else {
      showMessage("No tickets found", "info");
    }
  } catch (error) {
    showMessage(`Error: ${error.message}`, "error");
  }
}

// Get tickets by owner
window.getTicketsByOwner = async function() {
  getFormValues();
  
  if (!ownerName) {
    showMessage("Please provide an Owner Name", "error");
    return;
  }
  
  try {
    const tickets = await ticket_chad_backend.get_tickets_by_owner(ownerName);
    if (tickets && tickets.length > 0) {
      displayTicketList(tickets, `Tickets owned by ${ownerName}`);
    } else {
      showMessage(`No tickets found for owner: ${ownerName}`, "info");
    }
  } catch (error) {
    showMessage(`Error: ${error.message}`, "error");
  }
}

// Get tickets by event
window.getTicketsByEvent = async function() {
  getFormValues();
  
  if (!eventName) {
    showMessage("Please provide an Event Name", "error");
    return;
  }
  
  try {
    const tickets = await ticket_chad_backend.get_tickets_by_event(eventName);
    if (tickets && tickets.length > 0) {
      displayTicketList(tickets, `Tickets for event: ${eventName}`);
    } else {
      showMessage(`No tickets found for event: ${eventName}`, "info");
    }
  } catch (error) {
    showMessage(`Error: ${error.message}`, "error");
  }
}

// Set resale cap
window.setResaleCap = async function() {
  getFormValues();
  
  if ((!ticketId && ticketId !== 0) || !resaleCap) {
    showMessage("Please provide Ticket ID and Resale Cap", "error");
    return;
  }
  
  try {
    const success = await ticket_chad_backend.set_resale_price_cap(BigInt(ticketId), resaleCap);
    if (success) {
      showMessage(`Resale price cap updated to ${resaleCap}%`, "success");
      await getTicketInfo(BigInt(ticketId));
    } else {
      showMessage("Failed to update resale cap", "error");
    }
  } catch (error) {
    showMessage(`Error: ${error.message}`, "error");
  }
}

// Set event date
window.setEventDate = async function() {
  getFormValues();
  
  if ((!ticketId && ticketId !== 0) || !eventDate) {
    showMessage("Please provide Ticket ID and Event Date", "error");
    return;
  }
  
  try {
    const success = await ticket_chad_backend.set_event_date(BigInt(ticketId), eventDate);
    if (success) {
      showMessage("Event date updated successfully", "success");
      await getTicketInfo(BigInt(ticketId));
    } else {
      showMessage("Failed to update event date", "error");
    }
  } catch (error) {
    showMessage(`Error: ${error.message}`, "error");
  }
}

// Helper function to show messages
function showMessage(message, type = "info") {
  const resultDiv = document.getElementById('result');
  resultDiv.innerHTML = `<p class="${type}">${message}</p>`;
}

// Helper function to display a ticket
function displayTicket(id, ticket) {
  // Format date from timestamp
  const eventDate = new Date(Number(ticket.event_date) * 1000).toLocaleDateString();
  const creationDate = new Date(Number(ticket.creation_time) * 1000).toLocaleDateString();
  
  const resultDiv = document.getElementById('result');
  resultDiv.innerHTML = `
    <div class="ticket-card">
      <h3>Ticket #${id}</h3>
      <p><strong>Event:</strong> ${ticket.event_name}</p>
      <p><strong>Owner:</strong> ${ticket.owner}</p>
      <p><strong>Original Price:</strong> ${ticket.original_price} ICP</p>
      <p><strong>Current Price:</strong> ${ticket.current_price} ICP</p>
      <p><strong>Status:</strong> ${ticket.is_sold ? 'Sold' : 'Available'}</p>
      <p><strong>Seat:</strong> ${ticket.seat_number}</p>
      <p><strong>Event Date:</strong> ${eventDate}</p>
      <p><strong>Created:</strong> ${creationDate}</p>
      <p><strong>Transfer Count:</strong> ${ticket.transfer_count}</p>
      <p><strong>Resale Cap:</strong> ${ticket.resale_price_cap_percent}% of original price</p>
    </div>
  `;
}

// Helper function to display a list of tickets
function displayTicketList(tickets, title) {
  const resultDiv = document.getElementById('result');
  
  let html = `<h3>${title} (${tickets.length})</h3>`;
  
  tickets.forEach(([id, ticket]) => {
    // Format date from timestamp strings
    const eventDate = new Date(Number(ticket.event_date) * 1000).toLocaleDateString();
    
    html += `
      <div class="ticket-card">
        <h4>Ticket #${id} - ${ticket.event_name}</h4>
        <p><strong>Owner:</strong> ${ticket.owner}</p>
        <p><strong>Price:</strong> ${ticket.current_price} ICP</p>
        <p><strong>Status:</strong> ${ticket.is_sold ? 'Sold' : 'Available'}</p>
        <p><strong>Seat:</strong> ${ticket.seat_number}</p>
        <p><strong>Event Date:</strong> ${eventDate}</p>
      </div>
    `;
  });
  
  resultDiv.innerHTML = html;
} 