/**
 * 公司信息管理页面
 * 支持三套公司身份的创建、编辑和管理
 */

import React, { useState, useEffect } from 'react';
import { Card, Button, Form, Input, Upload, message, Modal, Switch, Space } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined, CheckOutlined } from '@ant-design/icons';
import { useCompanyStore } from '../stores/companyStore';
import { Company } from '../services/excelService';
import { v4 as uuidv4 } from 'uuid';

const { TextArea } = Input;

export const CompanyManagement: React.FC = () => {
  const [form] = Form.useForm();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  
  const {
    companies,
    currentCompany,
    loading,
    error,
    loadCompanies,
    saveCompany,
    deleteCompany,
    setCurrentCompany,
    setDefaultCompany
  } = useCompanyStore();

  // 初始化加载公司信息
  useEffect(() => {
    loadCompanies();
  }, []);

  // 显示错误信息
  useEffect(() => {
    if (error) {
      message.error(error);
    }
  }, [error]);

  /**
   * 处理新建公司
   */
  const handleNewCompany = () => {
    setEditingCompany(null);
    form.resetFields();
    setModalVisible(true);
  };

  /**
   * 处理编辑公司
   */
  const handleEditCompany = (company: Company) => {
    setEditingCompany(company);
    form.setFieldsValue(company);
    setModalVisible(true);
  };

  /**
   * 处理删除公司
   */
  const handleDeleteCompany = async (companyId: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这家公司信息吗？此操作不可恢复。',
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        try {
          await deleteCompany(companyId);
          message.success('公司信息删除成功');
        } catch (error) {
          message.error('删除失败，请重试');
        }
      }
    });
  };

  /**
   * 处理设置为当前公司
   */
  const handleSetCurrentCompany = (company: Company) => {
    setCurrentCompany(company);
    message.success(`已切换到: ${company.name}`);
  };

  /**
   * 处理设置为默认公司
   */
  const handleSetDefaultCompany = async (companyId: string) => {
    try {
      await setDefaultCompany(companyId);
      message.success('默认公司设置成功');
    } catch (error) {
      message.error('设置默认公司失败');
    }
  };

  /**
   * 处理表单提交
   */
  const handleFormSubmit = async (values: any) => {
    try {
      const companyData: Company = {
        id: editingCompany?.id || uuidv4(),
        name: values.name,
        nameEn: values.nameEn,
        address: values.address,
        addressEn: values.addressEn,
        phone: values.phone,
        email: values.email,
        website: values.website,
        taxNumber: values.taxNumber,
        bankName: values.bankName,
        bankAccount: values.bankAccount,
        swiftCode: values.swiftCode,
        intermediaryBank: values.intermediaryBank,
        logo: values.logo,
        isDefault: false // 新建公司不设置为默认
      };

      await saveCompany(companyData);
      message.success(editingCompany ? '公司信息更新成功' : '公司信息创建成功');
      setModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error('保存失败，请重试');
    }
  };

  /**
   * 处理Logo上传
   */
  const handleLogoUpload = ({ file }: any) => {
    const reader = new FileReader();
    reader.onload = () => {
      form.setFieldsValue({ logo: reader.result as string });
      message.success(`${file.name} 上传成功`);
    };
    reader.onerror = () => message.error(`${file.name} 上传失败`);
    reader.readAsDataURL(file);
  };

  /**
   * 渲染公司卡片
   */
  const renderCompanyCard = (company: Company) => (
    <Card
      key={company.id}
      title={
        <div className="flex justify-between items-center">
          <span>{company.name}</span>
          <Space>
            {company.isDefault && (
              <span className="text-green-600 text-sm bg-green-100 px-2 py-1 rounded">
                默认
              </span>
            )}
            {currentCompany?.id === company.id && (
              <span className="text-blue-600 text-sm bg-blue-100 px-2 py-1 rounded">
                当前使用
              </span>
            )}
          </Space>
        </div>
      }
      className="mb-4"
      actions={[
        <Button
          key="edit"
          type="text"
          icon={<EditOutlined />}
          onClick={() => handleEditCompany(company)}
        >
          编辑
        </Button>,
        <Button
          key="delete"
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleDeleteCompany(company.id)}
        >
          删除
        </Button>,
        <Button
          key="current"
          type="text"
          icon={<CheckOutlined />}
          onClick={() => handleSetCurrentCompany(company)}
          disabled={currentCompany?.id === company.id}
        >
          设为当前
        </Button>,
        <Button
          key="default"
          type="text"
          onClick={() => handleSetDefaultCompany(company.id)}
          disabled={company.isDefault}
        >
          设为默认
        </Button>
      ]}
    >
      <div className="space-y-2">
        <div>
          <span className="font-medium">英文名称:</span> {company.nameEn}
        </div>
        <div>
          <span className="font-medium">地址:</span> {company.address}
        </div>
        <div>
          <span className="font-medium">英文地址:</span> {company.addressEn}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="font-medium">电话:</span> {company.phone}
          </div>
          <div>
            <span className="font-medium">邮箱:</span> {company.email}
          </div>
        </div>
        <div>
          <span className="font-medium">网址:</span> {company.website}
        </div>
        <div>
          <span className="font-medium">税号:</span> {company.taxNumber}
        </div>
        <div className="border-t pt-2 mt-2">
          <div className="font-medium text-blue-600 mb-1">银行信息</div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">银行名称:</span> {company.bankName}
            </div>
            <div>
              <span className="font-medium">银行账号:</span> {company.bankAccount}
            </div>
            <div>
              <span className="font-medium">SWIFT代码:</span> {company.swiftCode}
            </div>
            {company.intermediaryBank && (
              <div>
                <span className="font-medium">中转银行:</span> {company.intermediaryBank}
              </div>
            )}
          </div>
        </div>
        {company.logo && (
          <div className="border-t pt-2 mt-2">
            <div className="font-medium mb-1">Logo:</div>
            <img src={company.logo} alt="Company Logo" className="h-16 object-contain" />
          </div>
        )}
      </div>
    </Card>
  );

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-800">公司信息管理</h1>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleNewCompany}
            disabled={companies.length >= 3}
          >
            新建公司
          </Button>
        </div>
        
        {companies.length >= 3 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
            <p className="text-yellow-800 text-sm">
              系统最多支持管理3套公司信息，如需添加新公司，请先删除现有公司。
            </p>
          </div>
        )}
        
        {currentCompany && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
            <p className="text-blue-800 text-sm">
              当前使用公司: <strong>{currentCompany.name}</strong> ({currentCompany.nameEn})
            </p>
          </div>
        )}
      </div>

      <div className="grid gap-4">
        {companies.map(renderCompanyCard)}
      </div>

      {companies.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">暂无公司信息</div>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleNewCompany}>
            创建第一家公司
          </Button>
        </div>
      )}

      {/* 编辑模态框 */}
      <Modal
        title={editingCompany ? '编辑公司信息' : '新建公司信息'}
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
            isDefault: false
          }}
        >
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              label="公司名称"
              name="name"
              rules={[{ required: true, message: '请输入公司名称' }]}
            >
              <Input placeholder="请输入公司名称" />
            </Form.Item>
            
            <Form.Item
              label="英文名称"
              name="nameEn"
              rules={[{ required: true, message: '请输入英文名称' }]}
            >
              <Input placeholder="请输入英文名称" />
            </Form.Item>
          </div>

          <Form.Item
            label="地址"
            name="address"
            rules={[{ required: true, message: '请输入地址' }]}
          >
            <TextArea rows={2} placeholder="请输入地址" />
          </Form.Item>

          <Form.Item
            label="英文地址"
            name="addressEn"
            rules={[{ required: true, message: '请输入英文地址' }]}
          >
            <TextArea rows={2} placeholder="请输入英文地址" />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              label="电话"
              name="phone"
              rules={[{ required: true, message: '请输入电话' }]}
            >
              <Input placeholder="请输入电话" />
            </Form.Item>
            
            <Form.Item
              label="邮箱"
              name="email"
              rules={[
                { required: true, message: '请输入邮箱' },
                { type: 'email', message: '请输入有效的邮箱地址' }
              ]}
            >
              <Input placeholder="请输入邮箱" />
            </Form.Item>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              label="网址"
              name="website"
            >
              <Input placeholder="请输入网址" />
            </Form.Item>
            
            <Form.Item
              label="税号"
              name="taxNumber"
              rules={[{ required: true, message: '请输入税号' }]}
            >
              <Input placeholder="请输入税号" />
            </Form.Item>
          </div>

          <div className="border-t pt-4 mt-4">
            <h3 className="text-lg font-medium mb-4">银行信息</h3>
            
            <Form.Item
              label="银行名称"
              name="bankName"
              rules={[{ required: true, message: '请输入银行名称' }]}
            >
              <Input placeholder="请输入银行名称" />
            </Form.Item>

            <div className="grid grid-cols-2 gap-4">
              <Form.Item
                label="银行账号"
                name="bankAccount"
                rules={[{ required: true, message: '请输入银行账号' }]}
              >
                <Input placeholder="请输入银行账号" />
              </Form.Item>
              
              <Form.Item
                label="SWIFT代码"
                name="swiftCode"
                rules={[{ required: true, message: '请输入SWIFT代码' }]}
              >
                <Input placeholder="请输入SWIFT代码" />
              </Form.Item>
            </div>

            <Form.Item
              label="中转银行"
              name="intermediaryBank"
            >
              <Input placeholder="请输入中转银行（可选）" />
            </Form.Item>
          </div>

          <Form.Item
            label="公司Logo"
            name="logo"
          >
            <Upload
              accept="image/*"
              showUploadList={false}
              beforeUpload={(file) => { handleLogoUpload({ file }); return false; }}
            >
              <Button icon={<UploadOutlined />}>上传Logo</Button>
            </Upload>
          </Form.Item>

          <Form.Item className="mb-0">
            <div className="flex justify-end space-x-3">
              <Button onClick={() => setModalVisible(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                {editingCompany ? '更新' : '创建'}
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
