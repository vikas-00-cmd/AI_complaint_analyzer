from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel, Field, field_validator


class CustomerBase(BaseModel):
    name: str = Field(..., max_length=100)
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    type: Optional[str] = Field(None, description="hospital, pharmacy, distributor")

    class Config:
        from_attributes = True


class CustomerCreate(CustomerBase):
    pass


class CustomerRead(CustomerBase):
    id: int
    created_at: Optional[str] = None

    @field_validator('created_at', mode='before')
    @classmethod
    def convert_created_at(cls, v):
        if isinstance(v, datetime):
            return v.isoformat()
        return v

    class Config:
        from_attributes = True


class ProductBase(BaseModel):
    name: str = Field(..., max_length=100)
    description: Optional[str] = None
    type: Optional[str] = Field(None, description="API or FDF")
    dosage_form: Optional[str] = None
    strength: Optional[str] = None
    unit_of_measure: Optional[str] = None

    class Config:
        from_attributes = True


class ProductCreate(ProductBase):
    pass


class ProductRead(ProductBase):
    id: int
    created_at: Optional[str] = None

    @field_validator('created_at', mode='before')
    @classmethod
    def convert_created_at(cls, v):
        if isinstance(v, datetime):
            return v.isoformat()
        return v

    class Config:
        from_attributes = True


class BatchBase(BaseModel):
    batch_number: str = Field(..., max_length=50)
    product_id: Optional[int] = None
    product_name: str = Field(..., max_length=100)
    strength_grade: Optional[str] = None
    manufacturing_date: Optional[date] = None
    expiry_date: Optional[date] = None
    quantity_manufactured: Optional[str] = None

    class Config:
        from_attributes = True


class BatchCreate(BatchBase):
    pass


class BatchRead(BatchBase):
    created_at: Optional[str] = None

    @field_validator('created_at', mode='before')
    @classmethod
    def convert_created_at(cls, v):
        if isinstance(v, datetime):
            return v.isoformat()
        return v

    class Config:
        from_attributes = True


class ComplaintBase(BaseModel):
    complaint_source: str = Field(..., description="email, phone, web, pdf")
    customer_id: Optional[int] = None
    customer_name: str = Field(..., max_length=100)
    product_id: Optional[int] = None
    product_name: str = Field(..., max_length=100)
    product_strength: Optional[str] = None
    batch_number: str = Field(..., max_length=50)
    manufacturing_date: Optional[str] = None
    expiry_date: Optional[str] = None
    affected_quantity: Optional[str] = None
    complaint_category: Optional[str] = None
    complaint_date: Optional[str] = None
    description: str
    severity: Optional[str] = None
    priority: Optional[str] = None
    risk_assessment: Optional[str] = None
    status: Optional[str] = "Pending Triage"

    class Config:
        from_attributes = True


class ComplaintCreate(ComplaintBase):
    pass


class ComplaintRead(ComplaintBase):
    id: int
    created_at: Optional[str] = None

    @field_validator('created_at', mode='before')
    @classmethod
    def convert_created_at(cls, v):
        if isinstance(v, datetime):
            return v.isoformat()
        return v

    class Config:
        from_attributes = True


class ComplaintUpdate(BaseModel):
    severity: Optional[str] = None
    priority: Optional[str] = None
    risk_assessment: Optional[str] = None
    status: Optional[str] = None
    complaint_category: Optional[str] = None

    class Config:
        from_attributes = True
