# J26-IT-461

# Proactive Food Waste Prevention System

This project is a final-year research and implementation project titled: **“A Proactive AI-Based Food Waste Prevention System for Restaurants.”** The system is designed to help restaurant managers reduce food waste by forecasting ingredient demand, planning food preparation more accurately, tracking stock risk, and supporting data-driven purchasing decisions.

The solution follows a three-component architecture:

- Component 01: Demand Forecasting and Preparation Planning
- Component 02: Inventory Risk and Waste Intelligence
- Component 03: Surplus Bidding and Demand Fulfillment

This repository includes both the frontend and backend implementations for the system, with Component 01 fully represented in the application flow.

## Project Overview

Food waste is a major operational issue in the restaurant industry. Restaurants often overproduce dishes because demand can vary due to seasonality, customer counts, weather, holidays, and daily sales patterns. This project introduces a proactive approach that combines:

- demand prediction,
- ingredient-level planning,
- stock optimization,
- expiry and risk monitoring,
- waste reduction suggestions.

The goal is not only to reduce waste but also to improve financial efficiency by preparing the right quantity of food at the right time.

## System Architecture

### Frontend
- React + Vite
- User-facing dashboard for restaurant planning
- Interactive pages for demand forecasting, inventory risk, and bidding for surplus stock

### Backend
- FastAPI application
- Python services and ML forecasting logic
- SQLAlchemy database support
- Forecast APIs for ingredient prediction and purchase planning
- Security and admin access protection

## Component 01: Demand Forecasting and Preparation Planning

### Overview of Component 01
Component 01 focuses on the first stage of the system: converting restaurant demand signals into practical cooking and preparation recommendations.

It works as a pipeline:

1. Demand-related data is collected (historical sales, estimated customer counts, weather conditions, holidays, and date-based patterns).
2. Dish-level predictions are generated for the selected day.
3. Ingredient totals are calculated from the recipe mix for each predicted dish.
4. A preparation recommendation is generated for the kitchen team.
5. The system shows whether the planned production is above, within, or below forecast demand.

This component is aligned with the project objective of reducing unnecessary overproduction before food is prepared.

## Frontend Details for Component 01

The frontend provides an interactive user interface for Component 01 through the Demand Forecast page.

### Main frontend features
- Forecast date selection
- Dish-by-dish demand comparison using historical vs predicted values
- Preparation quantity controls per dish
- Ingredient requirement calculation based on recipe mix
- Shared ingredient aggregation
- Weekly demand outlook panel
- Buffer and planning summary dashboard

### Frontend files related to Component 01
- `frontend/src/pages/DemandForecastPage.jsx`
- `frontend/src/components/IngredientForecastPanel.jsx`
- `frontend/src/components/WeeklyOutlookPanel.jsx`
- `frontend/src/data/mockData.js`
- `frontend/src/components/Shared.jsx`

### What the Component 01 frontend does
The frontend allows the restaurant manager to:

- choose a forecast date,
- view predicted portions for each dish,
- adjust kitchen preparation quantities,
- compare predicted demand with planned prep,
- see combined ingredient requirements,
- understand how demand signals influence the forecast.

The user interface presents the forecast as an operational planning tool rather than a raw data screen, making it practical for kitchen decision-making.

## Backend Details for Component 01

The backend implements the intelligence behind the Component 01 workflow.

### Backend components used by Component 01
- `backend/app/api/routes/forecast.py`
- `backend/app/ml/consumption_model.py`
- `backend/app/services/menu_planner.py`
- `backend/app/schemas/forecast.py`

### Forecast API endpoints
The backend exposes several API routes for forecasting and planning:

- `GET /api/forecast/options`  
  Returns available restaurants, weather options, ingredients, and forecasting metadata.

- `POST /api/forecast/consumption`  
  Predicts ingredient consumption for a selected restaurant and date.

- `POST /api/forecast/stock-plan`  
  Calculates the ingredient stock required and shows how much should be purchased to meet expected demand.

- `POST /api/forecast/weekly`  
  Generates a multi-day weekly forecast range for ingredient demand.

### ML and planning logic
The backend uses a machine learning-based consumption model to estimate ingredient demand. The forecasting flow includes:

- restaurant and weather context,
- estimated customer numbers,
- holiday and day-of-week conditions,
- ingredient names and quantities,
- historical consumption inputs such as previous-day and 7-day averages.

The `menu_planner.py` logic then converts predicted ingredient demand into dish-level stock planning by calculating:

- dish availability from existing inventory,
- ingredient shortfall,
- purchase quantities needed to satisfy target portion counts,
- how many portions each dish can be fully prepared from current stock.

This connects the prediction model to actionable operational decisions.

## Component 01 Workflow Summary

The complete flow of Component 01 is:

Demand signals → dish prediction → ingredient totals → preparation recommendation → stock planning and purchasing guidance

This makes the component a core decision-support engine for reducing waste before ingredients are prepared and consumed.

## Repository Structure

```text
J26-IT-461/
├── README.md
├── backend/
│   ├── app/
│   ├── model/
│   ├── tests/
│   └── requirements.txt
├── docs/
│   └── database-design.md
├── frontend/
│   ├── src/
│   ├── package.json
│   ├── index.html
│   └── README.md
└── .gitignore
```

## Local Setup

### Frontend setup
```bash
cd frontend
npm install
npm run dev
```

The frontend is usually available at `http://localhost:5173`.

### Backend setup
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The backend API will be available at `http://localhost:8000`.

## Notes

- This project uses illustrative or simulated data in the frontend for demo purposes.
- Component 01 is the planning layer that helps restaurants move from raw demand signals to a practical kitchen plan.
- The backend and frontend work together to deliver a complete forecasting and decision-support experience.

## Conclusion

Component 01 is the foundation of the food waste prevention system. It demonstrates how AI-assisted forecasting can transform restaurant demand data into actionable preparation and purchasing decisions. By combining frontend usability with backend intelligence, the project supports smarter planning and helps reduce food waste at the source.
