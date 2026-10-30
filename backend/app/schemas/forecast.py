from datetime import date

from pydantic import BaseModel, Field


class IngredientHistory(BaseModel):
    """Optional recent usage for one ingredient, in the ingredient's own unit."""

    previous_day_qty: float | None = Field(default=None, ge=0)
    avg_7day_qty: float | None = Field(default=None, ge=0)


class ConsumptionForecastRequest(BaseModel):
    restaurant_name: str
    forecast_date: date
    estimated_customers: int = Field(ge=0, le=100000)
    weather: str = "Sunny"
    is_holiday: bool = False
    ingredients: list[str] | None = Field(
        default=None, description="Ingredient names to forecast; all trained ingredients when omitted."
    )
    history: dict[str, IngredientHistory] = Field(default_factory=dict)


class IngredientForecast(BaseModel):
    ingredient: str
    unit: str
    predicted_qty: float


class ConsumptionForecastResponse(BaseModel):
    restaurant_name: str
    district: str
    forecast_date: date
    day_of_week: str
    forecasts: list[IngredientForecast]


class IngredientOption(BaseModel):
    name: str
    unit: str


class ForecastOptions(BaseModel):
    restaurants: list[str]
    weather: list[str]
    ingredients: list[IngredientOption]
    metrics: dict | None = None


class StockPlanRequest(BaseModel):
    restaurant_name: str
    forecast_date: date
    estimated_customers: int = Field(default=200, ge=0, le=100000)
    weather: str = "Sunny"
    is_holiday: bool = False
    stock: dict[str, float] = Field(default_factory=dict, description="Remaining stock per ingredient, in model units.")


class PurchaseItem(BaseModel):
    ingredient: str
    unit: str
    in_stock: float
    to_purchase: float


class DishPurchase(BaseModel):
    ingredient: str
    quantity: float


class DishAvailability(BaseModel):
    dish: str
    max_portions: int
    missing: list[str]
    to_buy: list[DishPurchase]


class StockPlanResponse(BaseModel):
    restaurant_name: str
    forecast_date: date
    purchases: list[PurchaseItem]
    dishes: list[DishAvailability]
