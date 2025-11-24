/**
 * 产品库管理页面
 * 管理产品信息和价格体系
 */

import React, { useState, useEffect } from 'react';
import { Card, Button, Form, Input, Select, Table, Modal, Space, Tag, message, Upload, Switch } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, UploadOutlined } from '@ant-design/icons';
import { useProductStore } from '../stores/productStore';
import { Product } from '../services/excelService';
import { v4 as uuidv4 } from 'uuid';

const { TextArea } = Input;
const { Option } = Select;

export const ProductManagement: React.FC = () => {
  const [form] = Form.useForm();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  
  const {
    products,
    categories,
    loading,
    error,
    loadProducts,
    saveProduct,
    deleteProduct,
    searchProducts,
    getProductsByCategory
  } = useProductStore();

  // 初始化加载产品信息
  useEffect(() => {
    loadProducts();
  }, []);

  // 显示错误信息
  useEffect(() => {
    if (error) {
      message.error(error);
    }
  }, [error]);

  /**
   * 处理新建产品
   */
  const handleNewProduct = () => {
    setEditingProduct(null);
    form.resetFields();
    setModalVisible(true);
  };

  /**
   * 处理编辑产品
   */
  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    form.setFieldsValue({
      ...product,
      minPrice: product.minPrice.toString(),
      maxPrice: product.maxPrice.toString()
    });
    setModalVisible(true);
  };

  /**
   * 处理删除产品
   */
  const handleDeleteProduct = async (productId: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个产品吗？此操作不可恢复。',
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        try {
          await deleteProduct(productId);
          message.success('产品删除成功');
        } catch (error) {
          message.error('删除失败，请重试');
        }
      }
    });
  };

  /**
   * 处理表单提交
   */
  const handleFormSubmit = async (values: any) => {
    try {
      let images: string[] = [];
      if (values.images && Array.isArray(values.images)) {
        images = values.images;
      }
      const productData: Product = {
        id: editingProduct?.id || uuidv4(),
        name: values.name,
        nameEn: values.nameEn,
        description: values.description,
        descriptionEn: values.descriptionEn,
        category: values.category,
        unit: values.unit,
        minPrice: parseFloat(values.minPrice) || 0,
        maxPrice: parseFloat(values.maxPrice) || 0,
        currency: values.currency || 'USD',
        specifications: values.specifications || {},
        isActive: values.isActive !== false
      };
      if (images.length) productData.images = images;

      await saveProduct(productData);
      message.success(editingProduct ? '产品更新成功' : '产品创建成功');
      setModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error('保存失败，请重试');
    }
  };

  /**
   * 处理搜索
   */
  const handleSearch = () => {
    // 搜索逻辑在store中已经实现
  };

  /**
   * 获取过滤后的产品列表
   */
  const getFilteredProducts = () => {
    let filtered = products;
    
    if (selectedCategory) {
      filtered = getProductsByCategory(selectedCategory);
    }
    
    if (searchQuery) {
      filtered = searchProducts(searchQuery);
    }
    
    return filtered;
  };

  /**
   * 表格列定义
   */
  const columns = [
    {
      title: '产品名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (text: string, record: Product) => (
        <div>
          <div className="font-medium">{text}</div>
          <div className="text-gray-500 text-sm">{record.nameEn}</div>
        </div>
      )
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 120,
      render: (category: string) => (
        <Tag color="blue">{category}</Tag>
      )
    },
    {
      title: '产品描述',
      dataIndex: 'description',
      key: 'description',
      width: 300,
      render: (text: string, record: Product) => (
        <div>
          <div>{text}</div>
          <div className="text-gray-500 text-sm">{record.descriptionEn}</div>
        </div>
      )
    },
    {
      title: '单位',
      dataIndex: 'unit',
      key: 'unit',
      width: 80
    },
    {
      title: '建议价格区间',
      dataIndex: 'priceRange',
      key: 'priceRange',
      width: 150,
      render: (text: string, record: Product) => (
        <div className="text-right">
          <div className="font-medium">
            {record.currency} {record.minPrice.toFixed(2)} - {record.maxPrice.toFixed(2)}
          </div>
          <div className="text-gray-500 text-sm">/{record.unit}</div>
        </div>
      )
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 80,
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? '启用' : '禁用'}
        </Tag>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (text: string, record: Product) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEditProduct(record)}
          >
            编辑
          </Button>
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteProduct(record.id)}
          >
            删除
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-800">产品库管理</h1>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleNewProduct}
          >
            新建产品
          </Button>
        </div>
        
        {/* 搜索和筛选 */}
        <div className="flex space-x-4 mb-4">
          <div className="flex-1">
            <Input
              placeholder="搜索产品名称、描述..."
              prefix={<SearchOutlined />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onPressEnter={handleSearch}
            />
          </div>
          <Select
            placeholder="选择分类"
            style={{ width: 200 }}
            value={selectedCategory}
            onChange={setSelectedCategory}
            allowClear
          >
            {categories.map(category => (
              <Option key={category} value={category}>{category}</Option>
            ))}
          </Select>
          <Button type="primary" onClick={handleSearch}>
            搜索
          </Button>
        </div>
      </div>

      {/* 产品表格 */}
      <Card>
        <Table
          columns={columns}
          dataSource={getFilteredProducts()}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* 编辑模态框 */}
      <Modal
        title={editingProduct ? '编辑产品信息' : '新建产品信息'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFormSubmit}
          initialValues={{
            currency: 'USD',
            unit: 'SET',
            isActive: true,
            minPrice: '0',
            maxPrice: '0'
          }}
        >
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              label="产品名称"
              name="name"
              rules={[{ required: true, message: '请输入产品名称' }]}
            >
              <Input placeholder="请输入产品名称" />
            </Form.Item>
            
            <Form.Item
              label="英文名称"
              name="nameEn"
              rules={[{ required: true, message: '请输入英文名称' }]}
            >
              <Input placeholder="请输入英文名称" />
            </Form.Item>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              label="分类"
              name="category"
              rules={[{ required: true, message: '请选择分类' }]}
            >
              <Select placeholder="选择分类" allowClear>
                {categories.map(category => (
                  <Option key={category} value={category}>{category}</Option>
                ))}
                <Option value="new">+ 新建分类</Option>
              </Select>
            </Form.Item>
            
            <Form.Item
              label="单位"
              name="unit"
              rules={[{ required: true, message: '请输入单位' }]}
            >
              <Select placeholder="选择单位" allowClear>
                <Option value="SET">SET</Option>
                <Option value="PCS">PCS</Option>
                <Option value="UNIT">UNIT</Option>
                <Option value="KG">KG</Option>
                <Option value="TON">TON</Option>
                <Option value="METER">METER</Option>
                <Option value="ROLL">ROLL</Option>
                <Option value="BAG">BAG</Option>
              </Select>
            </Form.Item>
          </div>

          <Form.Item
            label="产品描述"
            name="description"
            rules={[{ required: true, message: '请输入产品描述' }]}
          >
            <TextArea rows={3} placeholder="请输入产品描述" />
          </Form.Item>

          <Form.Item
            label="英文描述"
            name="descriptionEn"
            rules={[{ required: true, message: '请输入英文描述' }]}
          >
            <TextArea rows={3} placeholder="请输入英文描述" />
          </Form.Item>

          <div className="border-t pt-4 mt-4">
            <h3 className="text-lg font-medium mb-4">建议价格区间</h3>
            
            <div className="grid grid-cols-3 gap-4">
              <Form.Item
                label="最低价格"
                name="minPrice"
                rules={[{ required: true, message: '请输入最低价格' }]}
              >
                <Input type="number" step="0.01" placeholder="0.00" />
              </Form.Item>
              
              <Form.Item
                label="最高价格"
                name="maxPrice"
                rules={[{ required: true, message: '请输入最高价格' }]}
              >
                <Input type="number" step="0.01" placeholder="0.00" />
              </Form.Item>
              
              <Form.Item
                label="货币"
                name="currency"
                rules={[{ required: true, message: '请选择货币' }]}
              >
                <Select placeholder="选择货币">
                  <Option value="USD">USD</Option>
                  <Option value="EUR">EUR</Option>
                  <Option value="CNY">CNY</Option>
                  <Option value="GBP">GBP</Option>
                </Select>
              </Form.Item>
            </div>
          </div>

          <Form.Item
            label="产品图片"
            name="images"
          >
            <Upload
              accept="image/*"
              multiple
              showUploadList={true}
              beforeUpload={file => {
                const reader = new FileReader();
                reader.onload = () => {
                  const current = form.getFieldValue('images') || [];
                  form.setFieldsValue({ images: [...current, reader.result as string] });
                };
                reader.readAsDataURL(file);
                return false;
              }}
            >
              <Button icon={<UploadOutlined />}>上传产品图片</Button>
            </Upload>
          </Form.Item>

          <Form.Item
            label="状态"
            name="isActive"
            valuePropName="checked"
          >
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>

          <Form.Item className="mb-0">
            <div className="flex justify-end space-x-3">
              <Button onClick={() => setModalVisible(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                {editingProduct ? '更新' : '创建'}
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
