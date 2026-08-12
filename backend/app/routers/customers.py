from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from models import SessionLocal
from schemas import CustomerCreate, CustomerRead
from crud import get_customer, get_customers, create_customer

router = APIRouter(prefix="/api/v1", tags=["customers"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/customers/", response_model=CustomerRead, status_code=status.HTTP_201_CREATED)
def api_create_customer(customer: CustomerCreate, db: Session = Depends(get_db)):
    return create_customer(db, customer)


@router.get("/customers/{customer_id}", response_model=CustomerRead)
def api_read_customer(customer_id: int, db: Session = Depends(get_db)):
    db_customer = get_customer(db, customer_id)
    if not db_customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return db_customer


@router.get("/customers/", response_model=List[CustomerRead])
def api_list_customers(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return get_customers(db, skip, limit)
