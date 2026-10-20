"""Works out which dishes the remaining stock can make and how much stock to buy."""

from __future__ import annotations

import math

# Ingredient quantity per portion, in each ingredient's model unit (kg, litre, piece, loaf).
# These are planning assumptions; adjust them to the restaurant's real recipes.
RECIPES: dict[str, dict[str, float]] = {
    "Rice & curry": {"Samba rice": 0.15, "Red dhal / parippu": 0.04, "Coconut milk": 0.05, "Big onion": 0.03, "Green chilli": 0.005, "Pumpkin": 0.06},
    "Chicken fried rice": {"Nadu rice": 0.18, "Chicken": 0.1, "Egg": 1, "Carrot": 0.03, "Big onion": 0.02, "Garlic": 0.005, "Coconut oil": 0.01},
    "Vegetable kottu": {"Wheat flour": 0.12, "Carrot": 0.04, "Green beans": 0.04, "Big onion": 0.03, "Egg": 1, "Green chilli": 0.005, "Coconut oil": 0.01},
    "Dhal curry & red rice": {"Red rice": 0.15, "Red dhal / parippu": 0.06, "Coconut milk": 0.04, "Red onion": 0.02, "Garlic": 0.005},
    "Fish curry & rice": {"Nadu rice": 0.15, "Fish (mixed, planning proxy)": 0.12, "Coconut milk": 0.05, "Tomato": 0.03, "Garlic": 0.005, "Ginger": 0.005, "Green chilli": 0.005},
    "Beef curry & rice": {"Samba rice": 0.15, "Beef": 0.12, "Big onion": 0.03, "Potato": 0.05, "Garlic": 0.005, "Ginger": 0.005},
    "Egg hoppers": {"Nadu rice": 0.08, "Coconut milk": 0.05, "Egg": 1, "Sugar": 0.005},
    "Egg sandwich": {"Bread": 0.25, "Egg": 1, "Tomato": 0.02, "Cucumber": 0.02},
    "Milk tea": {"Tea": 0.005, "Fresh milk": 0.1, "Sugar": 0.01},
    "Fruit salad": {"Banana": 0.1, "Papaya": 0.1, "Lime": 0.25},
}

WHOLE_UNITS = {"piece", "loaf_450g"}


def purchase_quantity(needed: float, in_stock: float, unit: str) -> float:
    """Shortfall between predicted need and stock; whole units are rounded up."""
    shortfall = max(0.0, needed - in_stock)
    if unit in WHOLE_UNITS:
        return float(math.ceil(shortfall - 1e-9))
    return round(shortfall, 2)


SUGGESTION_PORTIONS = 10


def dish_availability(stock: dict[str, float], units: dict[str, str]) -> list[dict]:
    """For every dish: portions the stock allows, and what to buy to reach SUGGESTION_PORTIONS."""
    results = []
    for dish, recipe in RECIPES.items():
        portions = min(math.floor((stock.get(name, 0.0) + 1e-9) / amount) for name, amount in recipe.items())
        missing = [name for name, amount in recipe.items() if stock.get(name, 0.0) + 1e-9 < amount]
        to_buy = [
            {"ingredient": name, "quantity": purchase_quantity(amount * SUGGESTION_PORTIONS, stock.get(name, 0.0), units.get(name, "kg"))}
            for name, amount in recipe.items()
        ]
        results.append({
            "dish": dish,
            "max_portions": portions,
            "missing": missing,
            "to_buy": [item for item in to_buy if item["quantity"] > 0],
        })
    return sorted(results, key=lambda item: (-item["max_portions"], len(item["to_buy"]), item["dish"]))
