import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, Column, Integer, String, Date, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import declarative_base, sessionmaker, relationship
import pymysql

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "mysql+pymysql://root:@localhost:3306/qms")

def create_database_if_not_exists(url):
    if url.startswith("mysql"):
        try:
            db_part = url.split("/")[-1]
            server_part = url[:-len(db_part)]
            temp_engine = create_engine(server_part)
            with temp_engine.connect() as conn:
                from sqlalchemy import text
                conn.execute(text(f"CREATE DATABASE IF NOT EXISTS `{db_part}`"))
            temp_engine.dispose()
            print(f"Database '{db_part}' checked/created successfully.")
        except Exception as e:
            print(f"Warning: Could not check/create database automatically: {e}")

create_database_if_not_exists(DATABASE_URL)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100))
    phone = Column(String(20))
    address = Column(Text)
    type = Column(String(20))
    created_at = Column(DateTime, default=func.now())

    complaints = relationship("Complaint", back_populates="customer")

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    type = Column(String(20))
    dosage_form = Column(String(50))
    strength = Column(String(50))
    unit_of_measure = Column(String(20))
    created_at = Column(DateTime, default=func.now())

    batches = relationship("Batch", back_populates="product")
    complaints = relationship("Complaint", back_populates="product")

class Batch(Base):
    __tablename__ = "batches"

    batch_number = Column(String(50), primary_key=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)
    product_name = Column(String(100), nullable=False)
    strength_grade = Column(String(50))
    manufacturing_date = Column(Date)
    expiry_date = Column(Date, nullable=True)
    quantity_manufactured = Column(String(100))
    created_at = Column(DateTime, default=func.now())

    product = relationship("Product", back_populates="batches")

class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, autoincrement=True)
    complaint_source = Column(String(50))
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True)
    customer_name = Column(String(100))
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)
    product_name = Column(String(100))
    product_strength = Column(String(50))
    batch_number = Column(String(50))
    manufacturing_date = Column(String(50))
    expiry_date = Column(String(50))
    affected_quantity = Column(String(100))
    complaint_category = Column(String(100))
    complaint_date = Column(String(50), nullable=True)
    description = Column(Text)
    severity = Column(String(20))
    priority = Column(String(20))
    risk_assessment = Column(Text)
    status = Column(String(30), default="Pending Triage")
    created_at = Column(DateTime, default=func.now())

    customer = relationship("Customer", back_populates="complaints")
    product = relationship("Product", back_populates="complaints")
