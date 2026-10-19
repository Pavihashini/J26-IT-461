def main() -> int:
    try:
        from sqlalchemy import text
        from sqlalchemy.exc import SQLAlchemyError

        from app.db.session import engine

        with engine.connect() as connection:
            database_name, database_user = connection.execute(
                text("SELECT current_database(), current_user")
            ).one()
    except RuntimeError as error:
        print(f"Database configuration failed: {error}")
        return 1
    except SQLAlchemyError as error:
        print(f"Database connection failed: {error.__class__.__name__}.")
        print("Check DATABASE_URL, Neon project status, and network access to the pooler host.")
        return 1

    print("Database connection successful.")
    print(f"Database: {database_name}")
    print(f"User: {database_user}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
