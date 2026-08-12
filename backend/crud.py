from sqlalchemy.orm import Session
from typing import List, Optional
from models import Customer, Product, Batch, Complaint
from schemas import CustomerCreate, ProductCreate, BatchCreate, ComplaintCreate, ComplaintUpdate


def get_customer(db: Session, customer_id: int) -> Optional[Customer]:
    return db.query(Customer).filter(Customer.id == customer_id).first()


def get_customers(db: Session, skip: int = 0, limit: int = 100) -> List[Customer]:
    return db.query(Customer).offset(skip).limit(limit).all()


def create_customer(db: Session, customer: CustomerCreate) -> Customer:
    db_customer = Customer(**customer.model_dump())
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    return db_customer


def get_product(db: Session, product_id: int) -> Optional[Product]:
    return db.query(Product).filter(Product.id == product_id).first()


def get_products(db: Session, skip: int = 0, limit: int = 100) -> List[Product]:
    return db.query(Product).offset(skip).limit(limit).all()


def create_product(db: Session, product: ProductCreate) -> Product:
    db_product = Product(**product.model_dump())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product


def get_batch(db: Session, batch_number: str) -> Optional[Batch]:
    return db.query(Batch).filter(Batch.batch_number == batch_number).first()


def get_batches(db: Session, skip: int = 0, limit: int = 100) -> List[Batch]:
    return db.query(Batch).offset(skip).limit(limit).all()


def create_batch(db: Session, batch: BatchCreate) -> Batch:
    db_batch = Batch(**batch.model_dump())
    db.add(db_batch)
    db.commit()
    db.refresh(db_batch)
    return db_batch


def get_complaint(db: Session, complaint_id: int) -> Optional[Complaint]:
    return db.query(Complaint).filter(Complaint.id == complaint_id).first()


def get_complaints(db: Session, skip: int = 0, limit: int = 100) -> List[Complaint]:
    return db.query(Complaint).offset(skip).limit(limit).all()


def create_complaint(db: Session, complaint: ComplaintCreate) -> Complaint:
    db_complaint = Complaint(**complaint.model_dump())
    db.add(db_complaint)
    db.commit()
    db.refresh(db_complaint)
    return db_complaint


def update_complaint(db: Session, complaint_id: int, complaint: ComplaintUpdate) -> Optional[Complaint]:
    db_complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not db_complaint:
        return None
    update_data = complaint.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_complaint, field, value)
    db.add(db_complaint)
    db.commit()
    db.refresh(db_complaint)
    return db_complaint


def get_complaints_by_batch(db: Session, batch_number: str) -> List[Complaint]:
    return db.query(Complaint).filter(Complaint.batch_number == batch_number).all()
