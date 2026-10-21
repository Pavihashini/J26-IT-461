import json

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
