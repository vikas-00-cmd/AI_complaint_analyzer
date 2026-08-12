from datetime import datetime
from models import engine, Base, SessionLocal, Batch

def seed_database():
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    try:
        print("Clearing existing batch records...")
        db.query(Batch).delete()

        mock_batches = [
            Batch(
                batch_number="AMX240602",
                product_name="Amoxicillin Capsules",
                strength_grade="500 mg",
                manufacturing_date=datetime.strptime("2026-03-01", "%Y-%m-%d").date(),
                expiry_date=datetime.strptime("2028-02-01", "%Y-%m-%d").date()
            ),
            Batch(
                batch_number="CHG 260712A",
                product_name="Metformin Hydrochloride API",
                strength_grade="IP/BP",
                manufacturing_date=datetime.strptime("2026-06-25", "%Y-%m-%d").date(),
                expiry_date=None
            )
        ]

        print("Seeding batch records...")
        for batch in mock_batches:
            db.add(batch)
            print(f"Added Batch: {batch.batch_number} - {batch.product_name}")

        db.commit()
        print("Database seeding completed successfully.")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
