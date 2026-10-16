# Implementation guide

## Component 1 — Smart Demand Forecasting & Quantity Recommendation

**Research purpose:** Demonstrate how historical POS demand and contextual factors can help kitchen managers estimate dish-level demand and plan ingredient quantities instead of relying only on guesswork.

**UI:** The page includes a forecast date picker, historical-vs-predicted bars, demand-signal cards, editable preparation quantities, and a consolidated ingredient requirement grid.

**Data and calculations:** Mock dish records live in `src/data/mockData.js`. The selected date applies a simple day-of-week multiplier to the illustrative prediction. Preparation quantities are manager-editable. Recipe lines are multiplied by each dish's preparation quantity and aggregated by ingredient ID + unit, so ingredients shared between dishes are consolidated. The initial preparation plan includes a visible buffer and is not forced to equal forecast demand.

**Interaction:** Changing the date updates demo predictions. Increasing or decreasing a dish's preparation count updates preparation totals and all combined ingredient quantities.

**Presentation mapping:** The workflow on presentation page 8 and Component 1 material on pages 9–13 describe demand data, dish-level forecasts, ingredient-level predictions, and actionable preparation recommendations. Weather, public holidays, events, customer counts, POS history, day of week, seasonality, and promotions are represented as mock context. Customer taste is not treated as an original required input.

## Component 2 — Expiry-Aware Inventory & Waste Risk Detection

**Research purpose:** Demonstrate proactive risk detection from current stock, expiry dates, expected use, and historical waste.

**UI:** The risk overview has a searchable-by-selection inventory table, a simulated 0–100 score and low/medium/high badge, item-specific risk factors, preventive recommendations, and alert rows for near expiry, overstock, understock, and high waste risk.

**Data and calculations:** Inventory records are illustrative and defined in `src/data/mockData.js`. For this frontend prototype, risk scores and factor explanations are seeded demonstration values, not trained model outputs. Inventory value at risk is estimated as `max(stock − expected use before expiry, 0) × unit purchase cost` for items expiring within seven days. This estimate is kept separate from recorded waste cost.

**Interaction:** Selecting a stock row or an alert updates the details panel. The Cost & Savings subview remains within Component 2.

**Presentation mapping:** Presentation pages 14–18 show stock + expiry + predicted demand + historical waste feeding a waste-risk score, followed by explainable risk alerts. The slides mention a rules + ML hybrid engine and SHAP/LIME for explanations; this prototype illustrates the UI and logic without running those services.

## Component 2 extension — AI Cost & Savings Calculator

**Food waste cost:** Each record's cost is calculated in JavaScript as `quantity wasted × purchase cost per unit`. Day, 7-day, and 30-day filters affect totals, ranking, reason/category breakdown, and daily trend. Waste quantity and unit cost can be edited; totals update immediately.

**Potential savings:** `recorded waste cost × assumed reduction percentage`. The percentage is a user-adjustable what-if assumption and the result is labelled *Estimated Potential Savings*. This is not a guaranteed or model-generated result. No intervention cost is supplied, so net savings are not fabricated.

**Observed savings:** The screen explicitly says this is unavailable because the demo data does not contain matching adjusted-baseline and after-intervention records.

**Financial priorities:** The component lists ingredients using selected-period recorded loss and separate near-expiry inventory exposure. Inventory at risk is never added to confirmed waste loss. These priorities are illustrative rule-based recommendations rather than validated AI recommendations.

## Component 3 — Real-Time Surplus Pricing & Bidding

**Research purpose:** Demonstrate the second prevention layer in the presentation: when surplus remains, expose a listing for a limited bidding window to recover value.

**UI:** The page contains selectable mock surplus listings, reference price, current highest bid, a timer, local bid history, an amount input, validation feedback, a close-demo action, and a winner/no-bids result.

**Interaction:** A submitted bid must be numeric and greater than the current highest bid. A valid bid updates the local highest bid and activity history. The countdown runs only while the Surplus Bidding view is active and closes an auction when it reaches zero. The “End this demo auction now” action can be used to demonstrate a result immediately.

**Presentation mapping:** Presentation pages 19–22 describe automatic surplus listing, time-limited customer bidding, and highest-valid-bid-wins. Listing source labels point to related inventory-risk scenarios from Component 2, but the listings are seeded mock examples, not generated by an automatic risk service.

## Scope and limitations

- React state only; no server, database, REST API, WebSockets, ML inference, external integrations, payments, or cross-customer synchronization.
- Changes are held in memory and are not persisted between browser sessions.
- Forecasts, risk classifications, ingredient records, waste logs, and auction bidders are demonstration values.
- The interface does not claim experimental validation or actual cost savings.
