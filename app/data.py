from __future__ import annotations

from typing import List, Literal, TypedDict


class Product(TypedDict):
    id: str
    name: str
    specs: str
    min_order: int
    price_range: List[float]
    description: str


class Container(TypedDict):
    id: Literal["20GP", "40HQ"]
    name: str
    capacity: int
    notes: str


class PaymentMethod(TypedDict):
    id: str
    name: str
    description: str


class Bank(TypedDict):
    id: str
    name: str
    account_name: str
    account_number: str
    swift: str
    address: str


PRODUCTS: List[Product] = [
    {
        "id": "pvc-panel",
        "name": "PVC 面板",
        "specs": "120cm x 240cm, 厚度 15mm",
        "min_order": 200,
        "price_range": [5.2, 6.8],
        "description": "适用于室内装修的防火、防潮装饰面板。",
    },
    {
        "id": "aluminum-frame",
        "name": "铝合金门窗框",
        "specs": "6063-T5, 氧化银色, 1.2mm 壁厚",
        "min_order": 300,
        "price_range": [8.5, 12.3],
        "description": "轻质高强度，可定制长度和表面处理。",
    },
    {
        "id": "lighting-kit",
        "name": "LED 照明套件",
        "specs": "AC 110-240V, 50W, 4000K 中性光",
        "min_order": 150,
        "price_range": [12.0, 18.5],
        "description": "包含灯具、驱动电源和安装配件的整套解决方案。",
    },
]


CONTAINERS: List[Container] = [
    {
        "id": "20GP",
        "name": "20GP 小柜",
        "capacity": 1000,
        "notes": "适合小批量或重量型货物，参考容量 1000 件/标准件。",
    },
    {
        "id": "40HQ",
        "name": "40HQ 大柜",
        "capacity": 2200,
        "notes": "高箱大柜，参考容量 2200 件/标准件，适合大批量出货。",
    },
]


PAYMENT_METHODS: List[PaymentMethod] = [
    {
        "id": "tt-advance",
        "name": "T/T 预付 30%",
        "description": "出货前支付尾款 70%。",
    },
    {
        "id": "lc-sight",
        "name": "L/C at Sight",
        "description": "即期信用证，适用于大额和长期合作。",
    },
    {
        "id": "oa-30",
        "name": "O/A 30 天",
        "description": "账期 30 天，需信用审批。",
    },
]


BANKS: List[Bank] = [
    {
        "id": "icbc-shenzhen",
        "name": "中国工商银行深圳分行",
        "account_name": "Shenzhen Buildmate Co., Ltd.",
        "account_number": "6222001234567890",
        "swift": "ICBKCNBJSZN",
        "address": "深圳市南山区科技园中区 9 号",
    },
    {
        "id": "hsbc-hk",
        "name": "HSBC Hong Kong",
        "account_name": "Buildmate Trading Limited",
        "account_number": "102-123456-001",
        "swift": "HSBCHKHHHKH",
        "address": "1 Queen's Road Central, Hong Kong",
    },
]

# 常用贸易术语与币种，供前端选择并用于校验
INCOTERMS: List[str] = ["FOB", "CIF", "EXW", "DAP"]
CURRENCIES: List[str] = ["USD", "CNY", "EUR", "GBP"]
