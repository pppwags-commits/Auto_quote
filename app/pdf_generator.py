from io import BytesIO
from typing import Dict, Any
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.enums import TA_CENTER, TA_LEFT
import os

def build_quote_pdf(data: Dict[str, Any]) -> bytes:
    """
    根据报价数据生成 PDF，返回字节流
    """
    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4

    # 注册支持中文的字体（使用系统自带或打包的思源黑体）
    # 这里用系统已有的 SimHei 作为示例，若部署环境不同请替换为实际字体文件
    font_name = "SimHei"
    try:
        pdfmetrics.registerFont(TTFont(font_name, "/System/Library/Fonts/STHeiti Medium.ttc"))
    except:
        # 降级使用默认字体，中文会显示为方框；生产环境请上传字体文件
        font_name = "Helvetica"

    # 标题
    c.setFont(font_name, 20)
    c.drawCentredString(width / 2, height - 30 * mm, "QUOTATION SHEET")

    # 基本信息表格
    styles = getSampleStyleSheet()
    styleN = styles["Normal"]
    styleN.fontName = font_name
    styleN.fontSize = 10

    basic_info = [
        ["报价日期", data["quote_date"], "有效期至", data["valid_until"]],
        ["卖方公司", data["seller_company"], "买方公司", data["buyer_company"]],
        ["协议方式", data["incoterm"], "币种", data["currency"]],
        ["付款方式", data["payment_method"], "收款银行", data["bank_info"]],
    ]

    t = Table(basic_info, colWidths=[30 * mm, 60 * mm, 30 * mm, 60 * mm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.lightgrey),
        ("TEXTCOLOR", (0, 0), (-1, -1), colors.black),
        ("ALIGN", (0, 0), (-1, -1), "LEFT"),
        ("FONTNAME", (0, 0), (-1, -1), font_name),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
    ]))

    from reportlab.platypus import SimpleDocTemplate, Paragraph
    frame_height = height - 70 * mm
    t.wrapOn(c, width - 40 * mm, frame_height)
    t.drawOn(c, 20 * mm, frame_height - 0)

    # 产品信息
    y = frame_height - 20 * mm
    c.setFont(font_name, 12)
    c.drawString(20 * mm, y, "产品信息")
    y -= 10 * mm

    product_info = [
        ["产品名称", data["product_name"]],
        ["规格", data["product_specs"]],
        ["最小起订量", str(data["min_order"]) + " 件"],
        ["建议价格区间", data["suggested_price_range"] + " " + data["currency"]],
    ]
    t2 = Table(product_info, colWidths=[40 * mm, 140 * mm])
    t2.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), colors.lightgrey),
        ("ALIGN", (0, 0), (-1, -1), "LEFT"),
        ("FONTNAME", (0, 0), (-1, -1), font_name),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
    ]))
    t2.wrapOn(c, width - 40 * mm, y)
    t2.drawOn(c, 20 * mm, y - 0)

    # 金额汇总
    y = y - 20 * mm
    c.setFont(font_name, 12)
    c.drawString(20 * mm, y, "金额汇总")
    y -= 10 * mm

    summary_info = [
        ["货值小计", f"{data['subtotal']:.2f} {data['currency']}"],
        ["运费", f"{data['freight']:.2f} {data['currency']}"],
        ["总金额", f"{data['total_amount']:.2f} {data['currency']}"],
    ]
    t3 = Table(summary_info, colWidths=[40 * mm, 60 * mm])
    t3.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), colors.lightgrey),
        ("ALIGN", (0, 0), (-1, -1), "LEFT"),
        ("FONTNAME", (0, 0), (-1, -1), font_name),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
    ]))
    t3.wrapOn(c, width - 40 * mm, y)
    t3.drawOn(c, 20 * mm, y - 0)

    # 柜型信息
    y = y - 20 * mm
    c.setFont(font_name, 12)
    c.drawString(20 * mm, y, "柜型信息")
    y -= 10 * mm

    container_info = [
        ["柜型", data["container_name"]],
        ["参考容量", str(data["capacity"]) + " 件"],
        ["容量说明", data["capacity_message"]],
    ]
    if data.get("container_notes"):
        container_info.append(["备注", data["container_notes"]])
    t4 = Table(container_info, colWidths=[40 * mm, 140 * mm])
    t4.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), colors.lightgrey),
        ("ALIGN", (0, 0), (-1, -1), "LEFT"),
        ("FONTNAME", (0, 0), (-1, -1), font_name),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
    ]))
    t4.wrapOn(c, width - 40 * mm, y)
    t4.drawOn(c, 20 * mm, y - 0)

    # 备注
    if data.get("remark"):
        y = y - 20 * mm
        c.setFont(font_name, 12)
        c.drawString(20 * mm, y, "备注")
        y -= 10 * mm
        c.setFont(font_name, 10)
        text_obj = c.beginText(20 * mm, y)
        text_obj.textLines(data["remark"])
        c.drawText(text_obj)

    c.save()
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes