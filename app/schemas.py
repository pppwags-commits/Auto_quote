from __future__ import annotations

from datetime import date
from typing import Optional

from pydantic import BaseModel, Field, validator


class QuoteItem(BaseModel):
    product_id: str = Field(..., description="产品唯一标识")
    quantity: int = Field(..., gt=0, description="数量")
    unit_price: float = Field(..., gt=0, description="单价")


class QuoteRequest(BaseModel):
    seller_company: str = Field(..., description="卖方公司")
    buyer_company: str = Field(..., description="买方公司")
    incoterm: str = Field(..., description="贸易术语/协议方式")
    currency: str = Field(..., description="币种")
    payment_method_id: str = Field(..., description="付款方式 ID")
    bank_id: str = Field(..., description="收款银行 ID")
    container_id: str = Field(..., description="柜型 ID")
    freight: float = Field(..., ge=0, description="集装箱运费")
    quote_date: date = Field(..., description="报价日期")
    valid_until: date = Field(..., description="报价有效期")
    remark: Optional[str] = Field(None, description="备注")
    item: QuoteItem

    @validator("valid_until")
    def validate_valid_until(cls, v: date, values: dict) -> date:
        quote_date: date | None = values.get("quote_date")
        if quote_date and v < quote_date:
            raise ValueError("有效期不能早于报价日期")
        return v


class QuoteResponse(BaseModel):
    product_name: str
    product_specs: str
    min_order: int
    suggested_price_range: str
    subtotal: float
    freight: float
    total_amount: float
    container_name: str
    capacity: int
    capacity_message: str
    container_notes: str
    currency: str
    seller_company: str
    buyer_company: str
    incoterm: str
    payment_method: str
    bank_info: str
    quote_date: date
    valid_until: date
    remark: Optional[str]
