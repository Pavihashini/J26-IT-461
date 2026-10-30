# J26-IT-461

# A Proactive AI-Based Food Waste Prevention System for Restaurants

## Project overview

This repository contains the implementation and supporting documentation for the final-year research project titled: **A Proactive AI-Based Food Waste Prevention System for Restaurants**.

The system is designed to help restaurants reduce food waste by combining three connected decision layers:

1. Demand forecasting and preparation planning
2. Expiry-aware inventory and waste risk detection
3. Surplus recovery through bidding and resale

The project follows a practical, prototype-first approach: a React frontend demonstrates the workflow and user experience, while the backend provides a FastAPI-based service layer for AI forecasting, health checks, and planning logic.

The repository is organized into:

- `frontend/` — interactive prototype for the research components
- `backend/` — FastAPI application, forecasting model integration, stock planning logic, authentication route setup, and database scaffolding
- `docs/` — database design and project specification documents
- `model/` — trained model artifacts and performance metrics

## System architecture

The solution is structured into three research components:

### Component 01 — Demand Forecasting & Quantity Recommendation
This component focuses on predicting ingredient demand for upcoming service periods using restaurant location, weather conditions, customer counts, holiday effects, and item-specific historical usage patterns. It helps kitchen teams prepare the right quantities instead of overproducing stock.

### Component 02 — Expiry-Aware Inventory & Waste Risk Detection
This is the core operational component for reducing waste before it occurs. It evaluates ingredient stock levels, expiry timing, predicted consumption, and historical waste patterns to calculate a risk score and classify stock as low, medium, or high risk.

The project includes an approved internal extension within this component: the **AI Cost & Savings Calculator**, which shows the financial impact of waste, near-expiry exposure, and potential savings from better stock control.

### Component 03 — Real-Time Surplus Pricing & Bidding
This component models how restaurants can recover value from unavoidable surplus items by listing excess stock for short auctions and allowing customers to bid before expiry. It demonstrates a structured surplus-recovery workflow.

---

# Component 02 — Expiry-Aware Inventory & Waste Risk Detection

## Component 02 overview

**Component 02** is designed to protect stock value and prevent avoidable waste by identifying which ingredients are most likely to become problematic due to expiration, overstock, understock, or poor demand alignment.

It combines the following inputs:

- current inventory stock
- days remaining until expiry
- projected demand or expected usage
- historical waste records
- item unit cost
- estimated exposure/value at risk

The logic converts these factors into a risk score from 0 to 100. Items are then classified as:

- High risk
- Medium risk
- Low risk

Each item also receives actionable guidance such as prioritizing consumption, reducing orders, or maintaining the current stock plan.

This component is not just about inventory tracking; it represents the operational “early warning system” of the project, allowing restaurant staff to intervene before food is lost.

## Frontend details of Component 02

The frontend implementation for Component 02 is located in:

- `frontend/src/pages/InventoryRiskPage.jsx`
- `frontend/src/components/StockPlannerPanel.jsx`
- `frontend/src/data/mockData.js`
- `frontend/src/components/Shared.jsx`

### Key frontend features

- Inventory overview dashboard with high-, medium-, and low-risk ingredient tracking
- Search and filtering by risk level, inventory name, and sorting preference
- Add, edit, and delete inventory items
- Quick stock update input directly from the table
- Simulated expiry-aware risk model based on:
  - stock level
  - expiry window
  - expected usage over the next 7 days
  - historical waste
- Detailed explanation panel for each selected ingredient
- Waste recording form that links wasted quantity to a reason such as expiration, spoilage, overstocking, or excess preparation
- Cost & Savings view that includes:
  - waste cost analysis
  - category loss breakdown
  - daily waste trends
  - near-expiry stock exposure
  - estimated savings from waste reduction

### Frontend risk calculation logic

The demo risk score is derived using a formula that balances expiry urgency and surplus exposure. In the interface, the score is visually represented with a risk meter and status badge. The intended logic is:

- items with very short expiry time receive stronger penalty points
- high surplus relative to expected consumption increases risk
- understocking and future demand gaps are also surfaced as warnings
- the resulting score helps decide whether the ingredient needs urgent action

### Frontend user flow

The Component 02 workflow in the UI is:

1. Select an ingredient from the inventory list
2. Review its risk score and contributing factors
3. Inspect reason-based recommendations
4. Record waste if needed
5. Open the Cost & Savings calculator to quantify loss and savings potential

This makes the component suitable for showcasing how a restaurant manager could react before waste occurs.

### Frontend prototype boundaries

The UI is a demo interface using mock data rather than live production data. It is intended to demonstrate the concept and workflows rather than represent a fully deployed enterprise stock system.

---

## Backend details of Component 02

The backend implementation related to Component 02 is located in the `backend/` directory, especially:

- `backend/app/main.py`
- `backend/app/api/routes/forecast.py`
- `backend/app/ml/consumption_model.py`
- `backend/app/services/menu_planner.py`
- `docs/database-design.md` (design specification)

### Backend purpose

The backend supports the intelligence behind the risk detection and stock planning process by exposing API endpoints and forecasting logic. In the project, this is connected to the demand-forecasting and inventory-planning flow that strengthens the decisions visible in Component 02.

### Forecasting and stock planning backend

The backend includes a FastAPI application with routes such as:

- `GET /api/health` — checks service availability
- `GET /api/health/db` — checks database connectivity
- `GET /api/health/storage` — confirms storage readiness
- `GET /api/forecast/options` — returns supported restaurants, weather values, and trained ingredients
- `POST /api/forecast/consumption` — predicts ingredient consumption
- `POST /api/forecast/stock-plan` — calculates stock quantities to purchase and dish availability from current inventory

### Machine learning model integration

The model layer in `backend/app/ml/consumption_model.py` loads a trained Random Forest pipeline and generates ingredient consumption predictions based on:

- restaurant name
- district
- ingredient name
- unit
- day of week
- weather simulation
- estimated customers
- holiday/festival proxy
- month/day information
- previous-day consumption
- previous 7-day average consumption

This forecasting layer feeds the stock-planning logic used to estimate how much of a product should be ordered or consumed in time.

### Stock planning logic

`backend/app/services/menu_planner.py` calculates:

- which dishes can be produced from current remaining stock
- the shortage of ingredients for a recommended production level
- the required purchase quantity to satisfy target servings

This is directly relevant to Component 02 because it helps determine whether a stock position is safe, risky, or already overcommitted.

### Database design alignment

The project includes a database design specification in `docs/database-design.md`, which defines the schema needed to support the restaurant intelligence system. It includes tables for:

- restaurants
- dishes
- ingredients
- recipe ingredients
- sales history
- demand context
- inventory batches
- waste records
- surplus listings and bids

This design supports future implementation of fully database-backed inventory tracking and waste-risk monitoring for Component 02.

---

## How Component 02 fits into the overall project

Component 02 sits between demand forecasting and surplus recovery:

- Component 01 predicts how much should be prepared or ordered
- Component 02 checks whether current stock is safe, near expiry, or likely to become waste
- Component 03 handles the recovery of any unavoidable surplus value

Together, the three components create a complete decision pipeline for restaurant waste prevention:

- forecast early
- detect risk early
- recover value from surplus

---

## Run the project locally

### Frontend

From the project root:

```bash
cd frontend
npm install
npm run dev
```

Then open the local Vite URL shown in the terminal (commonly `http://localhost:5173`).

### Backend

From the project root:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Linux/macOS
# or .venv\Scripts\activate  # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload
```

The API will then be available at:

- `http://localhost:8000/docs` for FastAPI Swagger UI
- `http://localhost:8000/api/health` for health checks

---

## Repository highlights

- `frontend/` contains the end-user prototype and research presentation workflow
- `backend/` contains the service layer, model integration, and API endpoints
- `docs/database-design.md` formally defines the database structure for the full system
- `model/EXPIRY AWARE/` contains forecasting artifacts used by the backend

## Summary

**Component 02** is the operational core of the project. It gives the restaurant a practical way to monitor inventory health, anticipate waste before it occurs, and quantify the cost of avoidable spoilage. By combining frontend interaction with backend forecasting and stock planning logic, it demonstrates the core value proposition of the project: turning data, inventory awareness, and predictive analytics into real food waste reduction.
