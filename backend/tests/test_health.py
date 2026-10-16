import unittest

from app.main import health_check


class HealthCheckTest(unittest.TestCase):
    def test_health_check_response(self) -> None:
        self.assertEqual(
            health_check(),
            {
                "status": "ok",
                "service": "food-waste-prevention-backend",
            },
        )


if __name__ == "__main__":
    unittest.main()
