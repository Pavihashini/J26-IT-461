"""Loads the ingredient consumption Random Forest and turns requests into predictions."""

from __future__ import annotations

import warnings
from datetime import date
from functools import lru_cache
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd

MODEL_PATH = (
    Path(__file__).resolve().parents[2]
    / "model"
    / "EXPIRY AWARE"
    / "ingredient_consumption_random_forest.joblib"
)
METRICS_PATH = MODEL_PATH.with_name("training_metrics.json")

WEATHER_OPTIONS = ["Sunny", "Cloudy", "Rainy"]

# Each restaurant in the training data sits in its own district.
RESTAURANT_DISTRICTS = {
    "Anuradhapura Rest House": "Anuradhapura",
    "Badulla Green Cafe": "Badulla",
    "Batticaloa Family Restaurant": "Batticaloa",
    "Colombo City Restaurant": "Colombo",
    "Galle Coast Kitchen": "Galle",
    "Hambantota Coastal Hotel": "Hambantota",
    "Jaffna Spice House": "Jaffna",
    "Kalpana's Hotel": "Kegalle",
    "Kandy Hill Foods": "Kandy",
    "Kurunegala Family Hotel": "Kurunegala",
    "Matara Southern Kitchen": "Matara",
    "Negombo Lagoon Restaurant": "Negombo",
    "Nuwara Eliya Hill Cafe": "Nuwara Eliya",
    "Ratnapura Food Corner": "Ratnapura",
    "Trincomalee Harbour Foods": "Trincomalee",
}

# The model was trained with one unit per ingredient; kg is the default.
INGREDIENT_UNITS = {
    "Bread": "loaf_450g",
    "Coconut": "piece",
    "Coconut milk": "litre",
    "Coconut oil": "litre",
    "Egg": "piece",
    "Fresh milk": "litre",
    "Lime": "piece",
}

FEATURE_COLUMNS = [
    "restaurant_name",
    "district",
    "ingredient_name",
    "unit",
    "day_of_week",
    "weather_simulated",
    "estimated_customers",
    "is_weekend",
    "holiday_or_festival_proxy",
    "month",
    "day_of_month",
    "day_of_year",
    "previous_day_consumed_qty",
    "previous_7day_avg_consumed_qty",
]


@lru_cache(maxsize=1)
def get_model() -> Any:
    """Load the pipeline once; the file is large, so it is read lazily."""
    import joblib

    if not MODEL_PATH.exists():
        raise FileNotFoundError(f"Model file not found: {MODEL_PATH}")
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        return joblib.load(MODEL_PATH)


def ingredient_names() -> list[str]:
    encoder = get_model().named_steps["preprocessor"].named_transformers_["categorical"].named_steps["encoder"]
    return [str(name) for name in encoder.categories_[2]]


def unit_for(ingredient: str) -> str:
    return INGREDIENT_UNITS.get(ingredient, "kg")


def build_features(
    *,
    restaurant: str,
    forecast_date: date,
    customers: int,
    weather: str,
    is_holiday: bool,
    ingredients: list[str],
    previous_day: dict[str, float],
    avg_7day: dict[str, float],
) -> pd.DataFrame:
    is_weekend = forecast_date.weekday() >= 5
    rows = [
        {
            "restaurant_name": restaurant,
            "district": RESTAURANT_DISTRICTS[restaurant],
            "ingredient_name": name,
            "unit": unit_for(name),
            "day_of_week": forecast_date.strftime("%A"),
            "weather_simulated": weather,
            "estimated_customers": customers,
            "is_weekend": int(is_weekend),
            "holiday_or_festival_proxy": int(is_holiday),
            "month": forecast_date.month,
            "day_of_month": forecast_date.day,
            "day_of_year": forecast_date.timetuple().tm_yday,
            # Missing lags become NaN and are filled by the pipeline's median imputer.
            "previous_day_consumed_qty": previous_day.get(name, float("nan")),
            "previous_7day_avg_consumed_qty": avg_7day.get(name, float("nan")),
        }
        for name in ingredients
    ]
    return pd.DataFrame(rows, columns=FEATURE_COLUMNS)


def predict_consumption(features: pd.DataFrame) -> list[float]:
    predictions = get_model().predict(features)
    return [max(0.0, float(value)) for value in predictions]


def tree_predictions(features: pd.DataFrame) -> np.ndarray:
    """Each tree of the forest's own prediction, shape (n_trees, n_rows); their spread is the forecast range."""
    pipeline = get_model()
    transformed = pipeline.named_steps["preprocessor"].transform(features)
    trees = pipeline.named_steps["regressor"].estimators_
    return np.maximum(0.0, np.stack([tree.predict(transformed) for tree in trees]))
