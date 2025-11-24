/**
 * 报价单创建页面
 * 支持选择公司、客户、产品，生成专业报价单
 */

import React, { useState, useEffect } from 'react';
import { Card, Button, Form, Input, Select, DatePicker, InputNumber, Table, Space, message, Modal, Steps, Row, Col, Switch } from 'antd';
import { saveAs } from 'file-saver';
import { PlusOutlined, DeleteOutlined, EyeOutlined, FilePdfOutlined, SaveOutlined } from '@ant-design/icons';
import { useCompanyStore } from '../stores/companyStore';
import { useProductStore } from '../stores/productStore';
import { pdfService } from '../services/pdfService';
import { Company, Product, Quotation, QuotationItem, Customer, excelService } from '../services/excelService';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;
// Step组件已在Ant Design中移除，直接使用Steps组件

interface QuotationFormData {
  companyId: string;
  customerName: string;
  customerCompany: string;
  customerAddress: string;
  customerCountry: string;
  customerContact: string;
  customerEmail: string;
  customerPhone: string;
  quotationNumber: string;
  quotationDate: string;
  expiryDate: string;
  currency: string;
  pickupLocation: string;
  tradeTerms: string;
  paymentTerms: string;
  deliveryTerms: string;
  notes: string;
  taxRate: number;
}

export const QuotationCreate: React.FC = () => {
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedItems, setSelectedItems] = useState<QuotationItem[]>([]);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [pdfLoading, setPdfLoading] = useState(false);
  const [logoPosition, setLogoPosition] = useState<'left'|'center'|'right'>('right');
  const [showProductImages, setShowProductImages] = useState<boolean>(false);
  
  const { companies, currentCompany } = useCompanyStore();
  const { products, searchProducts } = useProductStore();

  // 步骤定义
  const steps = [
    {
      title: '基本信息',
      content: 'BasicInfo',
      key: 'basic'
    },
    {
      title: '客户信息',
      content: 'CustomerInfo',
      key: 'customer'
    },
    {
      title: '产品选择',
      content: 'ProductSelection',
      key: 'products'
    },
    {
      title: '条款设置',
      content: 'TermsSettings',
      key: 'terms'
    },
    {
      title: '预览确认',
      content: 'PreviewConfirm',
      key: 'preview'
    }
  ];

  /**
   * 生成报价单号
   */
  const generateQuotationNumber = () => {
    if (!currentCompany) return '';
    
    const companyCode = currentCompany.nameEn.substring(0, 3).toUpperCase();
    const date = dayjs();
    const year = date.format('YY');
    const month = date.format('MM');
    const day = date.format('DD');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    return `${companyCode}-${year}${month}${day}-${random}`;
  };

  /**
   * 步骤改变处理
   */
  const handleStepChange = (step: number) => {
    setCurrentStep(step);
  };

  /**
   * 下一步
   */
  const handleNext = async () => {
    try {
      // 验证当前步骤的表单
      if (currentStep === 0) {
        await form.validateFields(['companyId', 'quotationDate', 'expiryDate', 'currency']);
      } else if (currentStep === 1) {
        await form.validateFields(['customerName', 'customerCompany', 'customerAddress']);
      } else if (currentStep === 2) {
        if (selectedItems.length === 0) {
          message.warning('请至少选择一个产品');
          return;
        }
      }
      
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      }
    } catch (error) {
      // 表单验证失败，错误信息会自动显示
    }
  };

  /**
   * 上一步
   */
  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  /**
   * 添加产品到报价单
   */
  const handleAddProduct = (product: Product) => {
    const existingItem = selectedItems.find(item => item.productId === product.id);
    if (existingItem) {
      message.warning('该产品已添加到报价单');
      return;
    }

    const newItem: QuotationItem = {
      id: uuidv4(),
      productId: product.id,
      productName: product.name,
      description: product.description,
      quantity: 1,
      unit: product.unit,
      unitPrice: product.minPrice,
      discountRate: 0,
      discountAmount: 0,
      totalPrice: product.minPrice
    };
    (newItem as any).images = product.images || [];

    setSelectedItems([...selectedItems, newItem]);
    message.success('产品已添加到报价单');
  };

  /**
   * 从报价单移除产品
   */
  const handleRemoveProduct = (itemId: string) => {
    setSelectedItems(selectedItems.filter(item => item.id !== itemId));
  };

  /**
   * 更新产品数量
   */
  const handleQuantityChange = (itemId: string, quantity: number) => {
    if (quantity <= 0) return;
    
    setSelectedItems(selectedItems.map(item => {
      if (item.id === itemId) {
        const totalPrice = quantity * item.unitPrice * (1 - item.discountRate / 100);
        return {
          ...item,
          quantity,
          totalPrice
        };
      }
      return item;
    }));
  };

  /**
   * 更新产品单价
   */
  const handleUnitPriceChange = (itemId: string, unitPrice: number) => {
    if (unitPrice < 0) return;
    
    setSelectedItems(selectedItems.map(item => {
      if (item.id === itemId) {
        const totalPrice = item.quantity * unitPrice * (1 - item.discountRate / 100);
        return {
          ...item,
          unitPrice,
          totalPrice
        };
      }
      return item;
    }));
  };

  /**
   * 计算总金额
   */
  const calculateTotals = () => {
    const subtotal = selectedItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const taxRate = form.getFieldValue('taxRate') || 0;
    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount;
    
    return { subtotal, taxAmount, total };
  };

  /**
   * 生成PDF预览
   */
  const handlePreviewPDF = async () => {
    if (!currentCompany || selectedItems.length === 0) {
      message.warning('请先完成报价单信息');
      return;
    }

    setPdfLoading(true);
    try {
      const formData = form.getFieldsValue(true);
      const { subtotal, taxAmount, total } = calculateTotals();

      const quotationDateStr = formData.quotationDate
        ? dayjs(formData.quotationDate).format('YYYY-MM-DD')
        : dayjs().format('YYYY-MM-DD');
      const expiryDateStr = formData.expiryDate
        ? dayjs(formData.expiryDate).format('YYYY-MM-DD')
        : dayjs().add(30, 'day').format('YYYY-MM-DD');

      const quotationData = {
        quotationNumber: formData.quotationNumber || generateQuotationNumber(),
        quotationDate: quotationDateStr,
        expiryDate: expiryDateStr,
        currency: formData.currency || 'USD',
        pickupLocation: formData.pickupLocation || '',
        tradeTerms: formData.tradeTerms || '',
        paymentTerms: formData.paymentTerms || '',
        deliveryTerms: formData.deliveryTerms || '',
        subtotal,
        taxRate: Number(formData.taxRate || 0),
        taxAmount,
        totalAmount: total,
        notes: formData.notes || '',
        items: selectedItems
      };

      const customerData = {
        name: formData.customerName || '',
        companyName: formData.customerCompany || '',
        address: formData.customerAddress || '',
        country: formData.customerCountry || '',
        contactPerson: formData.customerContact || '',
        email: formData.customerEmail || '',
        phone: formData.customerPhone || ''
      };

      const blob = await pdfService.generateQuotationPDF(
        currentCompany,
        customerData,
        quotationData,
        { template: 'quotation', format: 'A4', orientation: 'portrait', margin: { top: 20, right: 20, bottom: 20, left: 20 } } as any,
        { logoPosition, showProductImages }
      );
      
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      setPreviewVisible(true);
    } catch (error) {
      message.error('PDF生成失败，请重试');
    } finally {
      setPdfLoading(false);
    }
  };

  /**
   * 保存报价单
   */
  const handleSaveQuotation = async () => {
    try {
      // 验证必填字段
      await form.validateFields();
      
      if (selectedItems.length === 0) {
        message.warning('请至少选择一个产品');
        return;
      }

      const formData = form.getFieldsValue(true);
      const { subtotal, taxAmount, total } = calculateTotals();
      
      const quotationDateStr = formData.quotationDate
        ? dayjs(formData.quotationDate).format('YYYY-MM-DD')
        : dayjs().format('YYYY-MM-DD');
      const expiryDateStr = formData.expiryDate
        ? dayjs(formData.expiryDate).format('YYYY-MM-DD')
        : dayjs().add(30, 'day').format('YYYY-MM-DD');

      const customer: Customer = {
        id: uuidv4(),
        name: formData.customerName || '',
        contactPerson: formData.customerContact || '',
        email: formData.customerEmail || '',
        phone: formData.customerPhone || '',
        address: formData.customerAddress || '',
        country: formData.customerCountry || '',
        companyName: formData.customerCompany || '',
        taxNumber: '',
        notes: formData.notes || ''
      };
      await excelService.saveCustomer(customer);

      const quotation: Quotation = {
        id: uuidv4(),
        quotationNumber: formData.quotationNumber || generateQuotationNumber(),
        companyId: formData.companyId,
        customerId: customer.id,
        quotationDate: quotationDateStr,
        expiryDate: expiryDateStr,
        currency: formData.currency || 'USD',
        paymentTerms: formData.paymentTerms || '',
        deliveryTerms: formData.deliveryTerms || '',
        pickupLocation: formData.pickupLocation || '',
        tradeTerms: formData.tradeTerms || '',
        subtotal,
        taxRate: Number(formData.taxRate || 0),
        taxAmount,
        totalAmount: total,
        status: 'draft',
        notes: formData.notes || '',
        items: selectedItems
      };

      await excelService.saveQuotation(quotation);
      message.success('报价单保存成功！');
      
      // 重置表单
      form.resetFields();
      setSelectedItems([]);
      setCurrentStep(0);
      
    } catch (error) {
      message.error('请检查必填字段');
    }
  };

  const handleDownloadPDF = async () => {
    if (!currentCompany || selectedItems.length === 0) {
      message.warning('请先完成报价单信息');
      return;
    }

    setPdfLoading(true);
    try {
      const formData = form.getFieldsValue(true);
      const { subtotal, taxAmount, total } = calculateTotals();

      const quotationDateStr = formData.quotationDate
        ? dayjs(formData.quotationDate).format('YYYY-MM-DD')
        : dayjs().format('YYYY-MM-DD');
      const expiryDateStr = formData.expiryDate
        ? dayjs(formData.expiryDate).format('YYYY-MM-DD')
        : dayjs().add(30, 'day').format('YYYY-MM-DD');

      const quotationData = {
        quotationNumber: formData.quotationNumber || generateQuotationNumber(),
        quotationDate: quotationDateStr,
        expiryDate: expiryDateStr,
        currency: formData.currency || 'USD',
        pickupLocation: formData.pickupLocation || '',
        tradeTerms: formData.tradeTerms || '',
        paymentTerms: formData.paymentTerms || '',
        deliveryTerms: formData.deliveryTerms || '',
        subtotal,
        taxRate: Number(formData.taxRate || 0),
        taxAmount,
        totalAmount: total,
        notes: formData.notes || '',
        items: selectedItems
      };

      const customerData = {
        name: formData.customerName || '',
        companyName: formData.customerCompany || '',
        address: formData.customerAddress || '',
        country: formData.customerCountry || '',
        contactPerson: formData.customerContact || '',
        email: formData.customerEmail || '',
        phone: formData.customerPhone || ''
      };

      const blob = await pdfService.generateQuotationPDF(
        currentCompany,
        customerData,
        quotationData,
        { template: 'quotation', format: 'A4', orientation: 'portrait', margin: { top: 20, right: 20, bottom: 20, left: 20 } } as any,
        { logoPosition, showProductImages }
      );

      saveAs(blob, `${quotationData.quotationNumber}.pdf`);
      message.success('PDF已下载');
    } catch (error) {
      message.error('PDF生成失败，请重试');
    } finally {
      setPdfLoading(false);
    }
  };

  /**
   * 渲染基本信息步骤
   */
  const renderBasicInfo = () => (
    <Card title="基本信息" className="mb-6">
      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="选择公司"
              name="companyId"
              rules={[{ required: true, message: '请选择公司' }]}
              initialValue={currentCompany?.id}
            >
              <Select placeholder="请选择公司">
                {companies.map(company => (
                  <Option key={company.id} value={company.id}>
                    {company.name} ({company.nameEn})
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="报价单号"
              name="quotationNumber"
              initialValue={generateQuotationNumber()}
            >
              <Input placeholder="自动生成" />
            </Form.Item>
          </Col>
        </Row>
        
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="报价日期"
              name="quotationDate"
              rules={[{ required: true, message: '请选择报价日期' }]}
              initialValue={dayjs()}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="有效期至"
              name="expiryDate"
              rules={[{ required: true, message: '请选择有效期' }]}
              initialValue={dayjs().add(30, 'day')}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="货币"
              name="currency"
              rules={[{ required: true, message: '请选择货币' }]}
              initialValue="USD"
            >
              <Select>
                <Option value="USD">USD</Option>
                <Option value="EUR">EUR</Option>
                <Option value="CNY">CNY</Option>
                <Option value="GBP">GBP</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Card>
  );

  /**
   * 渲染客户信息步骤
   */
  const renderCustomerInfo = () => (
    <Card title="客户信息" className="mb-6">
      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="客户名称"
              name="customerName"
              rules={[{ required: true, message: '请输入客户名称' }]}
            >
              <Input placeholder="请输入客户名称" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="公司名称"
              name="customerCompany"
              rules={[{ required: true, message: '请输入公司名称' }]}
            >
              <Input placeholder="请输入公司名称" />
            </Form.Item>
          </Col>
        </Row>
        
        <Form.Item
          label="地址"
          name="customerAddress"
          rules={[{ required: true, message: '请输入地址' }]}
        >
          <TextArea rows={3} placeholder="请输入详细地址" />
        </Form.Item>
        
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="国家"
              name="customerCountry"
              rules={[{ required: true, message: '请输入国家' }]}
            >
              <Input placeholder="请输入国家" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="联系人"
              name="customerContact"
            >
              <Input placeholder="请输入联系人" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="电话"
              name="customerPhone"
            >
              <Input placeholder="请输入电话" />
            </Form.Item>
          </Col>
        </Row>
        
        <Form.Item
          label="邮箱"
          name="customerEmail"
          rules={[
            { type: 'email', message: '请输入有效的邮箱地址' }
          ]}
        >
          <Input placeholder="请输入邮箱" />
        </Form.Item>
      </Form>
    </Card>
  );

  /**
   * 渲染产品选择步骤
   */
  const renderProductSelection = () => (
    <div className="mb-6">
      <Card title="产品选择" className="mb-4">
        <div className="mb-4">
          <Select
            showSearch
            style={{ width: 400 }}
            placeholder="搜索并选择产品"
            filterOption={false}
            onSearch={(value) => {
              // 搜索产品逻辑
            }}
            onSelect={(productId) => {
              const product = products.find(p => p.id === productId);
              if (product) {
                handleAddProduct(product);
              }
            }}
          >
            {products.filter(p => p.isActive).map(product => (
              <Option key={product.id} value={product.id}>
                <div className="flex justify-between">
                  <span>{product.name}</span>
                  <span className="text-gray-500">
                    {product.currency} {product.minPrice.toFixed(2)} - {product.maxPrice.toFixed(2)}/{product.unit}
                  </span>
                </div>
              </Option>
            ))}
          </Select>
        </div>
      </Card>

      {selectedItems.length > 0 && (
        <Card title="已选产品">
          <Table
            dataSource={selectedItems}
            columns={[
              {
                title: '产品名称',
                dataIndex: 'productName',
                key: 'productName',
                width: 200
              },
              {
                title: '描述',
                dataIndex: 'description',
                key: 'description',
                width: 300
              },
              {
                title: '数量',
                dataIndex: 'quantity',
                key: 'quantity',
                width: 120,
                render: (quantity, record) => (
                  <InputNumber
                    min={1}
                    value={quantity}
                    onChange={(value) => handleQuantityChange(record.id, value || 1)}
                    style={{ width: '100%' }}
                  />
                )
              },
              {
                title: '单位',
                dataIndex: 'unit',
                key: 'unit',
                width: 80
              },
              {
                title: '单价',
                dataIndex: 'unitPrice',
                key: 'unitPrice',
                width: 120,
                render: (unitPrice, record) => (
                  <InputNumber
                    min={0}
                    precision={2}
                    value={unitPrice}
                    onChange={(value) => handleUnitPriceChange(record.id, value || 0)}
                    style={{ width: '100%' }}
                  />
                )
              },
              {
                title: '总价',
                dataIndex: 'totalPrice',
                key: 'totalPrice',
                width: 120,
                render: (totalPrice) => `USD ${totalPrice.toFixed(2)}`
              },
              {
                title: '操作',
                key: 'action',
                width: 80,
                render: (text, record) => (
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleRemoveProduct(record.id)}
                  />
                )
              }
            ]}
            pagination={false}
            summary={() => {
              const { subtotal, taxAmount, total } = calculateTotals();
              return (
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={5}>
                    <div className="text-right font-medium">小计:</div>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1}>
                    <div className="font-medium">USD {subtotal.toFixed(2)}</div>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={2} />
                </Table.Summary.Row>
              );
            }}
          />
        </Card>
      )}
    </div>
  );

  /**
   * 渲染条款设置步骤
   */
  const renderTermsSettings = () => {
    const { subtotal, taxAmount, total } = calculateTotals();
    
    return (
      <div className="mb-6">
        <Row gutter={16}>
          <Col span={16}>
            <Card title="交易条款" className="mb-4">
              <Form form={form} layout="vertical">
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      label="提货地点"
                      name="pickupLocation"
                    >
                      <Input placeholder="请输入提货地点" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      label="贸易术语"
                      name="tradeTerms"
                    >
                      <Select placeholder="选择贸易术语">
                        <Option value="FOB">FOB</Option>
                        <Option value="CIF">CIF</Option>
                        <Option value="CFR">CFR</Option>
                        <Option value="EXW">EXW</Option>
                        <Option value="DDP">DDP</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>
                
                <Form.Item
                  label="付款条款"
                  name="paymentTerms"
                >
                  <TextArea rows={3} placeholder="例如: T/T 30% deposit, 70% before shipment" />
                </Form.Item>
                
                <Form.Item
                  label="交货条款"
                  name="deliveryTerms"
                >
                  <TextArea rows={3} placeholder="例如: Within 30 days after receiving deposit" />
                </Form.Item>
                
                <Form.Item
                  label="备注"
                  name="notes"
                >
                  <TextArea rows={3} placeholder="其他备注信息" />
                </Form.Item>
              </Form>
            </Card>
          </Col>
          
          <Col span={8}>
            <Card title="金额汇总">
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span>小计:</span>
                  <span className="font-medium">USD {subtotal.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span>税率:</span>
                  <Form.Item
                    name="taxRate"
                    initialValue={0}
                    className="mb-0"
                  >
                    <InputNumber
                      min={0}
                      max={100}
                      precision={2}
                      formatter={value => `${value}%`}
                      parser={value => {
                        const num = parseFloat(value!.replace('%', ''));
                        return Math.min(100, Math.max(0, num)) as 0 | 100;
                      }}
                      style={{ width: 80 }}
                    />
                  </Form.Item>
                </div>
                
                {taxAmount > 0 && (
                  <div className="flex justify-between">
                    <span>税额:</span>
                    <span>USD {taxAmount.toFixed(2)}</span>
                  </div>
                )}
                
                <div className="border-t pt-2">
                  <div className="flex justify-between text-lg font-bold">
                    <span>总计:</span>
                    <span className="text-blue-600">USD {total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    );
  };

  /**
   * 渲染预览确认步骤
   */
  const renderPreviewConfirm = () => (
    <Card title="预览确认" className="mb-6">
      <div className="text-center py-8">
        <div className="text-6xl mb-4">📄</div>
        <h3 className="text-xl font-bold mb-2">报价单预览</h3>
        <p className="text-gray-600 mb-6">
          请确认所有信息无误后生成PDF文档
        </p>
        
        <div className="bg-gray-50 p-4 rounded-lg mb-6 text-left max-w-2xl mx-auto">
          <h4 className="font-medium mb-2">报价单摘要:</h4>
          <ul className="text-sm space-y-1">
            <li>• 公司: {currentCompany?.name}</li>
            <li>• 客户: {form.getFieldValue('customerName')}</li>
            <li>• 产品数量: {selectedItems.length} 项</li>
            <li>• 总金额: USD {calculateTotals().total.toFixed(2)}</li>
          </ul>
        </div>
        
        <Space size="large">
          <Button
            type="primary"
            icon={<EyeOutlined />}
            size="large"
            onClick={handlePreviewPDF}
            loading={pdfLoading}
          >
            预览PDF
          </Button>
          <Button
            icon={<FilePdfOutlined />}
            size="large"
            onClick={handleDownloadPDF}
            loading={pdfLoading}
          >
            生成PDF
          </Button>
          <Button
            icon={<SaveOutlined />}
            size="large"
            onClick={handleSaveQuotation}
          >
            保存报价单
          </Button>
        </Space>
      </div>
    </Card>
  );

  /**
   * 渲染当前步骤内容
   */
  const renderCurrentStepContent = () => {
    switch (currentStep) {
      case 0:
        return renderBasicInfo();
      case 1:
        return renderCustomerInfo();
      case 2:
        return renderProductSelection();
      case 3:
        return renderTermsSettings();
      case 4:
        return renderPreviewConfirm();
      default:
        return null;
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">创建报价单</h1>
        <Steps current={currentStep} onChange={handleStepChange} items={steps.map(item => ({
          key: item.title,
          title: item.title
        }))} />
      </div>

      {renderCurrentStepContent()}

      <div className="flex justify-between mt-6">
        <Button
          onClick={handlePrev}
          disabled={currentStep === 0}
        >
          上一步
        </Button>
        
        <div className="space-x-3">
          {currentStep < steps.length - 1 && (
            <Button type="primary" onClick={handleNext}>
              下一步
            </Button>
          )}
        </div>
      </div>

      <Modal
        title="PDF预览"
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        footer={null}
        width={900}
      >
        {previewUrl ? (
          <iframe
            src={previewUrl}
            style={{ width: '100%', height: 600, border: 'none' }}
            title="PDF预览"
          />
        ) : null}
        <div className="mt-4 flex gap-4 items-center">
          <span>Logo位置:</span>
          <Select value={logoPosition} style={{ width: 140 }} onChange={setLogoPosition as any}>
            <Option value="left">左侧</Option>
            <Option value="center">居中</Option>
            <Option value="right">右侧</Option>
          </Select>
          <span>显示产品图片:</span>
          <Switch checked={showProductImages} onChange={setShowProductImages} />
        </div>
      </Modal>
    </div>
  );
};
