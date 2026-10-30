import unittest

from fastapi.testclient import TestClient

from app.api.deps import require_admin
from app.main import app


class ConsumptionForecastTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        app.dependency_overrides[require_admin] = lambda: None
        cls.client = TestClient(app)

    @classmethod
    def tearDownClass(cls) -> None:
        app.dependency_overrides.pop(require_admin, None)

    def test_options_list_trained_categories(self) -> None:
        body = self.client.get("/api/forecast/options").json()
        self.assertIn("Kandy Hill Foods", body["restaurants"])
        self.assertEqual(len(body["ingredients"]), 32)

    def test_consumption_forecast_returns_one_row_per_ingredient(self) -> None:
        response = self.client.post(
            "/api/forecast/consumption",
            json={
                "restaurant_name": "Kandy Hill Foods",
                "forecast_date": "2026-10-20",
                "estimated_customers": 200,
                "weather": "Rainy",
                "ingredients": ["Nadu rice", "Egg"],
                "history": {"Egg": {"previous_day_qty": 40, "avg_7day_qty": 38}},
            },
        )
        self.assertEqual(response.status_code, 200)
        forecasts = response.json()["forecasts"]
        self.assertEqual([row["ingredient"] for row in forecasts], ["Nadu rice", "Egg"])
        self.assertTrue(all(row["predicted_qty"] >= 0 for row in forecasts))

    def test_unknown_restaurant_is_rejected(self) -> None:
        response = self.client.post(
            "/api/forecast/consumption",
            json={"restaurant_name": "Nope", "forecast_date": "2026-10-20", "estimated_customers": 10},
        )
        self.assertEqual(response.status_code, 422)

    def test_stock_plan_suggests_dishes_and_purchases(self) -> None:
        response = self.client.post(
            "/api/forecast/stock-plan",
            json={
                "restaurant_name": "Kandy Hill Foods",
                "forecast_date": "2026-10-20",
                "estimated_customers": 200,
                "stock": {"Banana": 1, "Papaya": 1, "Lime": 5},
            },
        )
        self.assertEqual(response.status_code, 200)
        body = response.json()
        dishes = {row["dish"]: row for row in body["dishes"]}
        self.assertEqual(dishes["Fruit salad"]["max_portions"], 10)
        self.assertEqual(dishes["Milk tea"]["max_portions"], 0)
        self.assertTrue(all(row["to_purchase"] > 0 for row in body["purchases"]))


if __name__ == "__main__":
    unittest.main()
