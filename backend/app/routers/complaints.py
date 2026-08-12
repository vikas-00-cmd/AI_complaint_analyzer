from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import traceback

from models import SessionLocal
from schemas import ComplaintCreate, ComplaintRead, ComplaintUpdate
from crud import get_complaint, get_complaints, create_complaint, update_complaint, get_complaints_by_batch

router = APIRouter(prefix="/api/v1", tags=["complaints"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/complaints/", response_model=ComplaintRead, status_code=status.HTTP_201_CREATED)
def api_create_complaint(complaint: ComplaintCreate, db: Session = Depends(get_db)):
    try:
        return create_complaint(db, complaint)
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/complaints/{complaint_id}", response_model=ComplaintRead)
def api_read_complaint(complaint_id: int, db: Session = Depends(get_db)):
    db_complaint = get_complaint(db, complaint_id)
    if not db_complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    return db_complaint


@router.get("/complaints/", response_model=List[ComplaintRead])
def api_list_complaints(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return get_complaints(db, skip, limit)


@router.put("/complaints/{complaint_id}", response_model=ComplaintRead)
def api_update_complaint(complaint_id: int, complaint: ComplaintUpdate, db: Session = Depends(get_db)):
    db_complaint = update_complaint(db, complaint_id, complaint)
    if not db_complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    return db_complaint


@router.get("/complaints/by-batch/{batch_number}", response_model=List[ComplaintRead])
def api_read_complaints_by_batch(batch_number: str, db: Session = Depends(get_db)):
    return get_complaints_by_batch(db, batch_number)
