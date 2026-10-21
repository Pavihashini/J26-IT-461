import json
from datetime import timedelta

import numpy as np
import pandas as pd
from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import require_admin

from app.ml import consumption_model as model
from app.schemas.forecast import (
    ConsumptionForecastRequest,
    ConsumptionForecastResponse,
    ForecastOptions,
    IngredientForecast,
    IngredientOption,
    PurchaseItem,
    StockPlanRequest,
    StockPlanResponse,
    DayForecast,
    RangeForecast,
    WeeklyForecastRequest,
    WeeklyForecastResponse,
)
from app.services import menu_planner

router = APIRouter(prefix="/api/forecast", tags=["forecast"], dependencies=[Depends(require_admin)])


def _load_model() -> None:
    try:
        model.get_model()
    except FileNotFoundError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error
    except Exception as error:  # unreadable or incompatible model file
        raise HTTPException(status_code=503, detail="The forecasting model could not be loaded.") from error


@router.get("/options", response_model=ForecastOptions)
def forecast_options() -> ForecastOptions:
    """Restaurants, weather values, and ingredients the model was trained on."""
    _load_model()
    metrics = None
    if model.METRICS_PATH.exists():
        metrics = json.loads(model.METRICS_PATH.read_text(encoding="utf-8"))
    return ForecastOptions(
        restaurants=list(model.RESTAURANT_DISTRICTS),
        weather=model.WEATHER_OPTIONS,
        ingredients=[IngredientOption(name=name, unit=model.unit_for(name)) for name in model.ingredient_names()],
        metrics=metrics,
    )


@router.post("/consumption", response_model=ConsumptionForecastResponse)
def forecast_consumption(request: ConsumptionForecastRequest) -> ConsumptionForecastResponse:
    """Predict next-day consumption per ingredient for one restaurant."""
    _load_model()
    if request.restaurant_name not in model.RESTAURANT_DISTRICTS:
        raise HTTPException(status_code=422, detail="Unknown restaurant.")
    if request.weather not in model.WEATHER_OPTIONS:
        raise HTTPException(status_code=422, detail="Unknown weather value.")

    known = model.ingredient_names()
    names = request.ingredients if request.ingredients is not None else known
    unknown = [name for name in names if name not in known]
    if unknown:
        raise HTTPException(status_code=422, detail=f"Unknown ingredients: {', '.join(unknown)}")
    if not names:
        raise HTTPException(status_code=422, detail="Select at least one ingredient.")

    features = model.build_features(
        restaurant=request.restaurant_name,
        forecast_date=request.forecast_date,
        customers=request.estimated_customers,
        weather=request.weather,
        is_holiday=request.is_holiday,
        ingredients=names,
        previous_day={k: v.previous_day_qty for k, v in request.history.items() if v.previous_day_qty is not None},
        avg_7day={k: v.avg_7day_qty for k, v in request.history.items() if v.avg_7day_qty is not None},
    )
    predictions = model.predict_consumption(features)

    return ConsumptionForecastResponse(
        restaurant_name=request.restaurant_name,
        district=model.RESTAURANT_DISTRICTS[request.restaurant_name],
        forecast_date=request.forecast_date,
        day_of_week=request.forecast_date.strftime("%A"),
        forecasts=[
            IngredientForecast(ingredient=name, unit=model.unit_for(name), predicted_qty=round(value, 2))
            for name, value in zip(names, predictions)
        ],
    )


@router.post("/stock-plan", response_model=StockPlanResponse)
def stock_plan(request: StockPlanRequest) -> StockPlanResponse:
    """Dishes the remaining stock can make, and the stock to buy for the forecast day."""
    _load_model()
    if request.restaurant_name not in model.RESTAURANT_DISTRICTS:
        raise HTTPException(status_code=422, detail="Unknown restaurant.")
    if request.weather not in model.WEATHER_OPTIONS:
        raise HTTPException(status_code=422, detail="Unknown weather value.")

    names = model.ingredient_names()
    unknown = [name for name in request.stock if name not in names]
    if unknown:
        raise HTTPException(status_code=422, detail=f"Unknown ingredients: {', '.join(unknown)}")
    if any(quantity < 0 for quantity in request.stock.values()):
        raise HTTPException(status_code=422, detail="Stock quantities cannot be negative.")

    features = model.build_features(
        restaurant=request.restaurant_name,
        forecast_date=request.forecast_date,
        customers=request.estimated_customers,
        weather=request.weather,
        is_holiday=request.is_holiday,
        ingredients=names,
        previous_day={},
        avg_7day={},
    )
    needed = dict(zip(names, model.predict_consumption(features)))

    purchases = [
        PurchaseItem(
            ingredient=name,
            unit=model.unit_for(name),
            in_stock=request.stock.get(name, 0.0),
            to_purchase=menu_planner.purchase_quantity(needed[name], request.stock.get(name, 0.0), model.unit_for(name)),
        )
        for name in names
    ]
    return StockPlanResponse(
        restaurant_name=request.restaurant_name,
        forecast_date=request.forecast_date,
        purchases=[item for item in purchases if item.to_purchase > 0],
        dishes=menu_planner.dish_availability(request.stock, {name: model.unit_for(name) for name in names}),
    )


RANGE_LOW_PERCENTILE = 10
RANGE_HIGH_PERCENTILE = 90


def _range_rows(names: list[str], tree_matrix) -> list[RangeForecast]:
    """Mean and 10th-90th percentile across the forest's trees, one row per ingredient."""
    mean = tree_matrix.mean(axis=0)
    low = np.percentile(tree_matrix, RANGE_LOW_PERCENTILE, axis=0)
    high = np.percentile(tree_matrix, RANGE_HIGH_PERCENTILE, axis=0)
    return [
        RangeForecast(
            ingredient=name,
            unit=model.unit_for(name),
            predicted_qty=round(float(mean[i]), 2),
            low_qty=round(float(min(low[i], mean[i])), 2),
            high_qty=round(float(max(high[i], mean[i])), 2),
        )
        for i, name in enumerate(names)
    ]


@router.post("/weekly", response_model=WeeklyForecastResponse)
def forecast_weekly(request: WeeklyForecastRequest) -> WeeklyForecastResponse:
    """Per-day consumption for the next few days, each with a range from the forest's trees."""
    _load_model()
    if request.restaurant_name not in model.RESTAURANT_DISTRICTS:
        raise HTTPException(status_code=422, detail="Unknown restaurant.")
    if request.weather not in model.WEATHER_OPTIONS:
        raise HTTPException(status_code=422, detail="Unknown weather value.")

    known = model.ingredient_names()
    names = request.ingredients if request.ingredients is not None else known
    unknown = [name for name in names if name not in known]
    if unknown:
        raise HTTPException(status_code=422, detail=f"Unknown ingredients: {', '.join(unknown)}")
    if not names:
        raise HTTPException(status_code=422, detail="Select at least one ingredient.")

    dates = [request.start_date + timedelta(days=offset) for offset in range(request.days)]
    holidays = set(request.holidays)
    # Lag usage is not known for future days, so the pipeline's median imputer fills it.
    frames = [
        model.build_features(
            restaurant=request.restaurant_name,
            forecast_date=day,
            customers=request.estimated_customers,
            weather=request.weather,
            is_holiday=day in holidays,
            ingredients=names,
            previous_day={},
            avg_7day={},
        )
        for day in dates
    ]
    trees = model.tree_predictions(pd.concat(frames, ignore_index=True))

    width = len(names)
    per_day = [trees[:, index * width:(index + 1) * width] for index in range(len(dates))]
    return WeeklyForecastResponse(
        restaurant_name=request.restaurant_name,
        district=model.RESTAURANT_DISTRICTS[request.restaurant_name],
        start_date=request.start_date,
        days=[
            DayForecast(date=day, day_of_week=day.strftime("%A"), is_holiday=day in holidays, forecasts=_range_rows(names, matrix))
            for day, matrix in zip(dates, per_day)
        ],
        # Summing each tree across the days keeps the weekly range honest, rather than adding percentiles.
        totals=_range_rows(names, sum(per_day)),
    )
