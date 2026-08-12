from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from models import SessionLocal
from schemas import ProductCreate, ProductRead
from crud import get_product, get_products, create_product

router = APIRouter(prefix="/api/v1", tags=["products"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/products/", response_model=ProductRead, status_code=status.HTTP_201_CREATED)
def api_create_product(product: ProductCreate, db: Session = Depends(get_db)):
    return create_product(db, product)


@router.get("/products/{product_id}", response_model=ProductRead)
def api_read_product(product_id: int, db: Session = Depends(get_db)):
    db_product = get_product(db, product_id)
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    return db_product


@router.get("/products/", response_model=List[ProductRead])
def api_list_products(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return get_products(db, skip, limit)
