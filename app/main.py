from __future__ import annotations

from pathlib import Path
from typing import Any, Dict

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.data import (
    BANKS,
    CONTAINERS,
    CURRENCIES,
    INCOTERMS,
    PAYMENT_METHODS,
    PRODUCTS,
)
from app.schemas import QuoteRequest, QuoteResponse

BASE_DIR = Path(__file__).resolve().parent.parent
static_dir = BASE_DIR / "static"

app = FastAPI(title="报价单生成器", description="生成包含产品、柜型和付款信息的报价单。")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")


@app.get("/api/options")
def get_options() -> Dict[str, Any]:
    return {
        "products": PRODUCTS,
        "containers": CONTAINERS,
        "payment_methods": PAYMENT_METHODS,
        "banks": BANKS,
        "incoterms": INCOTERMS,
        "currencies": CURRENCIES,
    }


def _get_product(product_id: str):
    for product in PRODUCTS:
        if product["id"] == product_id:
            return product
    return None


def _get_container(container_id: str):
    for container in CONTAINERS:
        if container["id"] == container_id:
            return container
    return None


def _get_payment_method(method_id: str):
    for method in PAYMENT_METHODS:
        if method["id"] == method_id:
            return method
    return None


def _get_bank(bank_id: str):
    for bank in BANKS:
        if bank["id"] == bank_id:
            return bank
    return None


def _is_valid_currency(currency: str) -> bool:
    return currency in CURRENCIES


@app.post("/api/quotes", response_model=QuoteResponse)
def create_quote(payload: QuoteRequest) -> QuoteResponse:
    product = _get_product(payload.item.product_id)
    container = _get_container(payload.container_id)
    payment_method = _get_payment_method(payload.payment_method_id)
    bank = _get_bank(payload.bank_id)

    if not product:
        raise HTTPException(status_code=404, detail="未找到对应产品")
    if not container:
        raise HTTPException(status_code=404, detail="未找到对应柜型")
    if not payment_method:
        raise HTTPException(status_code=404, detail="未找到对应付款方式")
    if not bank:
        raise HTTPException(status_code=404, detail="未找到对应收款银行")
    if payload.incoterm not in INCOTERMS:
        raise HTTPException(status_code=400, detail="不支持的协议方式")
    if not _is_valid_currency(payload.currency):
        raise HTTPException(status_code=400, detail="不支持的币种")

    if payload.item.quantity < product["min_order"]:
        raise HTTPException(status_code=400, detail="数量低于最小起订量")
    min_price, max_price = product["price_range"]
    if not (min_price <= payload.item.unit_price <= max_price):
        raise HTTPException(status_code=400, detail="单价不在建议价格区间内")

    subtotal = round(payload.item.quantity * payload.item.unit_price, 2)
    total = round(subtotal + payload.freight, 2)

    capacity_message = ""
    if payload.item.quantity > container["capacity"]:
        capacity_message = "数量超过参考柜容量，建议调整柜型或拆分发货。"
    elif payload.item.quantity > container["capacity"] * 0.85:
        capacity_message = "已接近柜子参考容量，请确认包装尺寸和装柜方式。"
    else:
        capacity_message = "数量在参考容量范围内。"

    suggested_price_range = f"{product['price_range'][0]:.2f} - {product['price_range'][1]:.2f}"
    bank_info = (
        f"{bank['name']} / {bank['account_name']} / {bank['account_number']} "
        f"(SWIFT: {bank['swift']})"
    )

    return QuoteResponse(
        product_name=product["name"],
        product_specs=product["specs"],
        min_order=product["min_order"],
        suggested_price_range=suggested_price_range,
        subtotal=subtotal,
        freight=payload.freight,
        total_amount=total,
        container_name=container["name"],
        capacity=container["capacity"],
        capacity_message=capacity_message,
        container_notes=container.get("notes", ""),
        currency=payload.currency,
        seller_company=payload.seller_company,
        buyer_company=payload.buyer_company,
        incoterm=payload.incoterm,
        payment_method=payment_method["name"],
        bank_info=bank_info,
        quote_date=payload.quote_date,
        valid_until=payload.valid_until,
        remark=payload.remark,
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
