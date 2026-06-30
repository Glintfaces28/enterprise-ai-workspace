from sqlalchemy import text

import models
from database import Base, engine


def column_exists(connection, table_name: str, column_name: str) -> bool:
    return bool(
        connection.scalar(
            text(
                """
                SELECT 1
                FROM information_schema.columns
                WHERE table_name = :table_name
                  AND column_name = :column_name
                """
            ),
            {"table_name": table_name, "column_name": column_name},
        )
    )


def run():
    print("Creating missing tables...")
    Base.metadata.create_all(bind=engine)

    with engine.begin() as connection:
        print("Checking teams.created_by...")
        if not column_exists(connection, "teams", "created_by"):
            print("Adding teams.created_by...")
            connection.execute(text("ALTER TABLE teams ADD COLUMN created_by INTEGER"))

        if column_exists(connection, "teams", "owner_id"):
            print("Backfilling teams.created_by from owner_id...")
            connection.execute(text("UPDATE teams SET created_by = owner_id WHERE created_by IS NULL"))
            print("Allowing legacy teams.owner_id to be empty...")
            connection.execute(text("ALTER TABLE teams ALTER COLUMN owner_id DROP NOT NULL"))

        print("Promoting creators to owner role...")
        connection.execute(
            text(
                """
                UPDATE team_members
                SET role = 'owner'
                FROM teams
                WHERE team_members.team_id = teams.id
                  AND team_members.user_id = teams.created_by
                """
            )
        )

        print("Enforcing teams.created_by NOT NULL...")
        connection.execute(text("ALTER TABLE teams ALTER COLUMN created_by SET NOT NULL"))


if __name__ == "__main__":
    run()
    print("Teams migration complete.")
