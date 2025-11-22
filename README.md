# 报价单生成器

一个基于 FastAPI 的简易报价单工具，前端使用 Bulma + 原生 JS，后端提供产品、柜型、付款方式等基础数据，并生成报价结果。

## 快速开始

1. 安装依赖

```bash
pip install -r requirements.txt
```

2. 运行服务

```bash
uvicorn app.main:app --reload
```

默认监听 `http://127.0.0.1:8000/`，首页为报价表单。

## 接口

- `GET /api/options`：基础数据（产品、柜型、付款方式、银行、incoterms）。
- `POST /api/quotes`：传入报价请求，返回计算后的报价明细、柜量提示等。

## 结构

```
app/
  data.py        # 静态数据：产品、柜型、付款方式、银行
  schemas.py     # Pydantic 模型
  main.py        # FastAPI 主应用，提供 API 并托管静态页
static/
  index.html     # 前端单页应用
```

## 说明

- 前端会根据产品设置 MOQ 与建议单价区间，并校验有效期日期。
- 后端会根据参考柜容量给出装柜提示，并计算小计、运费及总金额。

## 测试

使用内置的语法检查命令快速验证代码是否可被解释器加载：

```bash
python -m compileall app
```
