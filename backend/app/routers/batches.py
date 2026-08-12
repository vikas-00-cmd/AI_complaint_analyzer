from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from models import SessionLocal
from schemas import BatchCreate, BatchRead
from crud import get_batch, get_batches, create_batch

router = APIRouter(prefix="/api/v1", tags=["batches"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/batches/", response_model=BatchRead, status_code=status.HTTP_201_CREATED)
def api_create_batch(batch: BatchCreate, db: Session = Depends(get_db)):
    return create_batch(db, batch)


@router.get("/batches/{batch_number}", response_model=BatchRead)
def api_read_batch(batch_number: str, db: Session = Depends(get_db)):
    db_batch = get_batch(db, batch_number)
    if not db_batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    return db_batch


@router.get("/batches/", response_model=List[BatchRead])
def api_list_batches(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return get_batches(db, skip, limit)
