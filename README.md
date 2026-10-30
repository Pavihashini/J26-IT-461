# J26-IT-461

# A Proactive AI-Based Food Waste Prevention System for Restaurants

## Project overview

This repository contains the implementation and documentation for the final-year research project titled: **A Proactive AI-Based Food Waste Prevention System for Restaurants**.

The project is built to reduce food waste in restaurants by combining predictive intelligence, expiry-aware inventory monitoring, and value recovery from unavoidable surplus. It follows a three-component architecture that helps restaurants make smarter operational decisions before food is wasted.

The three research components are:

1. Component 01 – Demand Forecasting & Quantity Recommendation
2. Component 02 – Expiry-Aware Inventory & Waste Risk Detection
3. Component 03 – Real-Time Surplus Pricing & Bidding

The system is implemented using a React frontend prototype and a FastAPI backend. The frontend demonstrates the user experience and research flow, while the backend provides forecasting, stock-planning, health-check, and API support.

### Repository structure

- `frontend/` – interactive prototype for the system
- `backend/` – FastAPI application and model integration
- `docs/` – database and project design documentation
- `model/` – trained model and performance metrics

---

# Component 02 — Expiry-Aware Inventory & Waste Risk Detection

## Overview of Component 02

Component 02 is the operational risk-monitoring layer of the system. It evaluates current stock levels, expiry time, predicted consumption, and historical waste to identify ingredients that are likely to become waste or cause financial loss.

The system assigns each ingredient a risk score from 0 to 100, which is then classified into:

- Low risk
- Medium risk
- High risk

This component helps a restaurant intervene early by highlighting ingredients that require attention before spoilage occurs.

### Frontend details of Component 02

The frontend implementation for Component 02 is in:

- `frontend/src/pages/InventoryRiskPage.jsx`
- `frontend/src/components/StockPlannerPanel.jsx`
- `frontend/src/data/mockData.js`
- `frontend/src/components/Shared.jsx`

Key front-end features include:

- Inventory overview dashboard
- Search, filter, and sorting by risk level
- Add, edit, and delete inventory items
- Quick stock update inputs
- Simulated risk calculation for stock, expiry, expected usage, and historical waste
- Detailed ingredient risk explanation panel
- Waste recording form with reasons such as expired stock, spoilage, overstocking, and excess preparation
- Cost & Savings section for waste cost analysis, near-expiry exposure, and potential savings

The frontend risk logic combines multiple factors:

- expiry urgency
- stock surplus relative to expected usage
- understock warnings
- historical waste exposure

The result is a visual risk score and recommendations that help staff decide if an item must be consumed, reordered differently, or monitored closely.

### Backend details of Component 02

The backend logic supporting Component 02 is in:

- `backend/app/main.py`
- `backend/app/api/routes/forecast.py`
- `backend/app/ml/consumption_model.py`
- `backend/app/services/menu_planner.py`

Key backend aspects:

- FastAPI service for health check and forecasting endpoints
- `GET /api/forecast/options` for available restaurants, weather values, and ingredients
- `POST /api/forecast/consumption` for ingredient consumption prediction
- `POST /api/forecast/stock-plan` for inventory-to-purchase planning
- Random Forest model integration to estimate ingredient consumption
- Stock planning logic that calculates how much stock remains, what dishes can be produced, and what quantity should be bought

This backend intelligence feeds the inventory risk and stock-planning decisions shown in the frontend.

---

# Component 03 — Real-Time Surplus Pricing & Bidding

## Overview of Component 03

Component 03 focuses on the recovery stage of the food waste prevention system. After demand has been forecast and inventory risk has been assessed, unavoidable surplus stock can still remain. Instead of allowing that excess stock to be wasted, this component demonstrates a dynamic pricing and bidding process that helps recover some value.

This component models a timed auction for surplus food. Listings are created for surplus items, and customers or users can place bids before a closing window ends. The highest valid bid wins, allowing the restaurant to recover value before the item spoils.

This stage completes the project’s full loop:

- Prevent waste through forecasting
- Detect risk through expiry-aware inventory analysis
- Recover value from unavoidable surplus through bidding

### Frontend details of Component 03

The frontend for Component 03 is implemented in:

- `frontend/src/pages/SurplusBiddingPage.jsx`
- `frontend/src/data/mockData.js`
- `frontend/src/utils.js`
- `frontend/src/App.jsx`
- `frontend/src/components/Shared.jsx`

Key frontend features include:

- surplus listing cards for individual food items
- inventory-linked surplus context
- time-limited bidding window
- live countdown timer
- bid range control and validation
- automatic winner determination for the highest valid bid
- recent bid activity feed
- demo-mode toggle for presentations
- local auction closing action for demonstration purposes

#### Frontend business logic

The front-end demo follows a simplified auction model:

- a surplus item is listed with a reference price
- a valid bid must be above the current highest bid
- bids are accepted only while the listing is open
- the bid range is bounded by a starting bid and a maximum bid
- when the maximum bid is reached, the auction closes immediately
- the highest valid bid wins the item and is displayed in the result panel

#### Frontend pricing rules

The prototype applies a practical pricing strategy:

- starting bid is set at approximately 20% of the meal/reference price
- maximum bid is capped around 70% of the meal/reference price
- this creates a discounted but still value-recovering sale model for surplus food

#### Prototype boundaries for Component 03

This component is intentionally a frontend prototype and does not include:

- real customer authentication
- live multi-user auction concurrency
- WebSocket-based real-time bidding
- real payment processing
- persistence of bid data in a database

It demonstrates the concept clearly and effectively for research and presentation purposes.

### Backend details of Component 03

The backend does not currently implement the full live auction service, but the project architecture and database design plan support it. Relevant files include:

- `backend/app/main.py`
- `backend/app/api/routes/forecast.py`
- `docs/database-design.md`

The database schema defines the data model required for a real implementation, especially the following tables:

- `surplus_listings`
- `bids`

#### `surplus_listings`

This table stores each surplus listing and includes fields such as:

- restaurant ID
- optional dish reference
- item name snapshot
- available quantity
- unit
- reference price
- status (`draft`, `open`, `closed`, `cancelled`)
- opening and closing timestamps

It enforces constraints such as:

- available quantity > 0
- reference price >= 0
- close time must be after open time

#### `bids`

This table stores each bid submitted for a listing and includes:

- listing ID
- bid amount
- bidder reference
- bid timestamp
- bid status

The design requires transactional validation so that bids are only accepted while a listing is open and before closing time. The auction logic must lock the listing row and ensure that only valid bids are accepted.

### Full backend expectation for Component 03

In a production implementation, the backend would need to support:

- creation of surplus listings
- validation of listing status and timing
- securing bid submission against race conditions
- calculating the highest valid bid
- closing auctions and selecting the winner
- returning bid history and listing status to the frontend

This design is consistent with the project’s broader architecture, even though the current repository focuses primarily on the prototype experience.

---

## How the three components connect

The system creates a complete waste-prevention pipeline:

- Component 01 predicts demand and helps prepare the correct quantity
- Component 02 identifies stock that is likely to expire or become waste
- Component 03 recovers value from surplus items that still remain

Together, these three components form a practical and research-driven solution for reducing avoidable food waste in restaurant operations.

---

## Summary

The project demonstrates a complete and connected approach to restaurant food waste prevention. Component 02 provides the risk-detection mechanism, while Component 03 extends the system into value recovery by simulating a real-time surplus auction process. Together with Component 01, these parts form an integrated intelligent system aimed at reducing waste before it occurs and recovering value when surplus is unavoidable.
