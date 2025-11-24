/**
 * 主应用组件
 * 包含路由配置和导航菜单
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { Layout, Menu, Avatar, Dropdown, Space, Button, Card } from 'antd';
import { 
  HomeOutlined, 
  ShopOutlined, 
  UserOutlined, 
  ShoppingOutlined, 
  FileTextOutlined,
  HistoryOutlined,
  SettingOutlined,
  LogoutOutlined
} from '@ant-design/icons';
import { CompanyManagement } from './pages/CompanyManagement';
import { ProductManagement } from './pages/ProductManagement';
import { QuotationCreate } from './pages/QuotationCreate';
import { excelService, Quotation } from './services/excelService';
import { Input as AntInput, Statistic, Row as AntRow, Col as AntCol } from 'antd';
import { pdfService } from './services/pdfService';
import { useCompanyStore } from './stores/companyStore';
import { Button as AntButton, Table, Tag, Input, DatePicker, Space as AntSpace } from 'antd';
import dayjs from 'dayjs';

const { Header, Sider, Content } = Layout;

const App: React.FC = () => {
  const [collapsed, setCollapsed] = React.useState(false);

  // 菜单项
  const menuItems = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: <Link to="/">首页</Link>,
    },
    {
      key: '/companies',
      icon: <ShopOutlined />,
      label: <Link to="/companies">公司管理</Link>,
    },
    {
      key: '/products',
      icon: <ShoppingOutlined />,
      label: <Link to="/products">产品库</Link>,
    },
    {
      key: '/quotations/new',
      icon: <FileTextOutlined />,
      label: <Link to="/quotations/new">创建报价单</Link>,
    },
    {
      key: '/history',
      icon: <HistoryOutlined />,
      label: <Link to="/history">历史记录</Link>,
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: <Link to="/settings">系统设置</Link>,
    },
  ];

  // 用户菜单
  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人资料',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
    },
  ];

  return (
    <Router>
      <Layout style={{ minHeight: '100vh' }}>
        {/* 侧边栏 */}
        <Sider 
          collapsible 
          collapsed={collapsed} 
          onCollapse={setCollapsed}
          theme="light"
          style={{
            overflow: 'auto',
            height: '100vh',
            position: 'fixed',
            left: 0,
            top: 0,
            bottom: 0,
          }}
        >
          <div className="p-4 text-center border-b">
            <h2 className={`font-bold text-blue-600 ${collapsed ? 'text-sm' : 'text-lg'}`}>
              {collapsed ? '报价' : '报价系统'}
            </h2>
          </div>
          
          <Menu
            mode="inline"
            items={menuItems}
            defaultSelectedKeys={['/']}
            style={{ border: 'none' }}
          />
        </Sider>
        
        <Layout style={{ marginLeft: collapsed ? 80 : 200 }}>
          {/* 顶部导航栏 */}
          <Header style={{ 
            padding: '0 24px', 
            background: '#fff', 
            borderBottom: '1px solid #f0f0f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <h1 className="text-xl font-semibold text-gray-800">报价与发票管理系统</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button type="primary">
                <Link to="/quotations/new">新建报价单</Link>
              </Button>
              
              <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
                <Space className="cursor-pointer hover:bg-gray-100 p-2 rounded">
                  <Avatar size="small" icon={<UserOutlined />} />
                  <span className="hidden md:inline">管理员</span>
                </Space>
              </Dropdown>
            </div>
          </Header>
          
          {/* 主内容区域 */}
          <Content style={{ 
            margin: '24px 16px', 
            padding: 24, 
            background: '#fff',
            borderRadius: '8px',
            minHeight: 'calc(100vh - 112px)'
          }}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/companies" element={<CompanyManagement />} />
              <Route path="/products" element={<ProductManagement />} />
              <Route path="/quotations/new" element={<QuotationCreate />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Content>
        </Layout>
      </Layout>
    </Router>
  );
};

// 首页组件
const HomePage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="text-center py-12">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">欢迎使用报价系统</h1>
        <p className="text-xl text-gray-600 mb-8">专业的报价单与发票生成工具</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
          <div className="bg-blue-50 p-6 rounded-lg text-center">
            <div className="text-3xl mb-3">🏢</div>
            <h3 className="font-semibold mb-2">公司管理</h3>
            <p className="text-sm text-gray-600">管理多套公司信息</p>
            <Link to="/companies">
              <Button type="primary" className="mt-3">进入</Button>
            </Link>
          </div>
          
          <div className="bg-green-50 p-6 rounded-lg text-center">
            <div className="text-3xl mb-3">📦</div>
            <h3 className="font-semibold mb-2">产品库</h3>
            <p className="text-sm text-gray-600">维护产品信息与价格</p>
            <Link to="/products">
              <Button type="primary" className="mt-3">进入</Button>
            </Link>
          </div>
          
          <div className="bg-purple-50 p-6 rounded-lg text-center">
            <div className="text-3xl mb-3">📋</div>
            <h3 className="font-semibold mb-2">创建报价单</h3>
            <p className="text-sm text-gray-600">生成专业报价文档</p>
            <Link to="/quotations/new">
              <Button type="primary" className="mt-3">进入</Button>
            </Link>
          </div>
          
          <div className="bg-orange-50 p-6 rounded-lg text-center">
            <div className="text-3xl mb-3">📚</div>
            <h3 className="font-semibold mb-2">历史记录</h3>
            <p className="text-sm text-gray-600">查看历史报价单</p>
            <Link to="/history">
              <Button type="primary" className="mt-3">进入</Button>
            </Link>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="快速操作" className="shadow-sm">
          <div className="space-y-3">
            <Button type="primary" block>
              <Link to="/quotations/new">新建报价单</Link>
            </Button>
            <Button block>
              <Link to="/companies">管理公司信息</Link>
            </Button>
            <Button block>
              <Link to="/products">查看产品库</Link>
            </Button>
          </div>
        </Card>
        
        <Card title="系统状态" className="shadow-sm">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>公司数量:</span>
              <span className="font-medium">3</span>
            </div>
            <div className="flex justify-between">
              <span>产品数量:</span>
              <span className="font-medium">150</span>
            </div>
            <div className="flex justify-between">
              <span>历史报价单:</span>
              <span className="font-medium">89</span>
            </div>
            <div className="flex justify-between">
              <span>系统版本:</span>
              <span className="font-medium">v1.0.0</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

// 历史记录页面
const HistoryPage: React.FC = () => {
  const [list, setList] = React.useState<Quotation[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [dateRange, setDateRange] = React.useState<any>(null);
  const { companies } = useCompanyStore();

  const load = async () => {
    setLoading(true);
    const qs = await excelService.getQuotations();
    setList(qs);
    setLoading(false);
  };
  React.useEffect(() => { load(); }, []);

  const filtered = list.filter(q => {
    const okQuery = query ? (q.quotationNumber.includes(query) || q.customerId.includes(query)) : true;
    const okDate = dateRange ? (dayjs(q.quotationDate).isAfter(dateRange[0]) && dayjs(q.quotationDate).isBefore(dateRange[1])) : true;
    return okQuery && okDate;
  });

  const columns: any[] = [
    { title: '报价单号', dataIndex: 'quotationNumber', key: 'quotationNumber', width: 160 },
    { title: '日期', dataIndex: 'quotationDate', key: 'quotationDate', width: 120 },
    { title: '公司', dataIndex: 'companyId', key: 'companyId', width: 200, render: (id: string) => {
      const c = companies.find(c => c.id === id); return c ? `${c.name} (${c.nameEn})` : id; } },
    { title: '客户', dataIndex: 'customerId', key: 'customerId', width: 180 },
    { title: '金额', dataIndex: 'totalAmount', key: 'totalAmount', width: 120, render: (v: number, r: Quotation) => `${r.currency} ${v.toFixed(2)}` },
    { title: '状态', dataIndex: 'status', key: 'status', width: 100, render: (s: Quotation['status']) => <Tag color={s==='draft'?'blue':s==='sent'?'gold':s==='accepted'?'green':s==='rejected'?'red':'default'}>{s}</Tag> },
    { title: '操作', key: 'action', width: 220, render: (_: any, r: Quotation) => (
      <AntSpace>
        <AntButton size="small" onClick={async () => {
          const company = companies.find(c => c.id === r.companyId);
          if (!company) return;
          const customer = await excelService.getCustomerById(r.customerId);
          const blob = await pdfService.generateQuotationPDF(company, customer ? {
            name: customer.name,
            companyName: customer.companyName,
            address: customer.address,
            country: customer.country,
            contactPerson: customer.contactPerson,
            email: customer.email,
            phone: customer.phone,
          } : {
            name: r.customerId,
            companyName: r.customerId,
            address: '', country: '', contactPerson: '', email: '', phone: ''
          }, {
            quotationNumber: r.quotationNumber,
            quotationDate: r.quotationDate,
            expiryDate: r.expiryDate,
            currency: r.currency,
            pickupLocation: r.pickupLocation,
            tradeTerms: r.tradeTerms,
            paymentTerms: r.paymentTerms,
            deliveryTerms: r.deliveryTerms,
            items: r.items.length ? r.items : await excelService.getQuotationItemsByQuotationId(r.id),
            subtotal: r.subtotal,
            taxRate: r.taxRate,
            taxAmount: r.taxAmount,
            totalAmount: r.totalAmount,
            notes: r.notes,
          });
          const url = URL.createObjectURL(blob);
          window.open(url, '_blank');
        }}>预览PDF</AntButton>
        <AntButton size="small" onClick={async () => { await excelService.exportExcel(); }}>导出Excel</AntButton>
      </AntSpace>
    ) },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">历史记录</h1>
      <Card className="mb-4">
        <AntRow gutter={16}>
          <AntCol span={6}><Statistic title="报价数量" value={list.length} /></AntCol>
          <AntCol span={6}><Statistic title="总金额" value={list.reduce((s, q) => s + q.totalAmount, 0).toFixed(2)} /></AntCol>
          <AntCol span={6}><Statistic title="公司数" value={new Set(list.map(q => q.companyId)).size} /></AntCol>
          <AntCol span={6}><Statistic title="客户数" value={new Set(list.map(q => q.customerId)).size} /></AntCol>
        </AntRow>
      </Card>
      <Card className="mb-4">
        <div className="flex gap-4 items-center">
          <Input placeholder="搜索报价单号或客户" value={query} onChange={(e) => setQuery(e.target.value)} style={{ width: 260 }} />
          <DatePicker.RangePicker onChange={setDateRange as any} />
          <AntButton onClick={load}>刷新</AntButton>
        </div>
      </Card>
      <Card>
        <Table columns={columns} dataSource={filtered} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />
      </Card>
    </div>
  );
};

// 系统设置页面
const SettingsPage: React.FC = () => {
  const [userId, setUserId] = React.useState(localStorage.getItem('qs_current_user') || 'default');
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">系统设置</h1>
      <Card title="账户设置" className="mb-4">
        <div className="flex items-center gap-4">
          <span>用户ID:</span>
          <AntInput style={{ width: 240 }} value={userId} onChange={(e) => setUserId(e.target.value)} />
          <AntButton type="primary" onClick={() => { localStorage.setItem('qs_current_user', userId || 'default'); }}>保存到本机</AntButton>
        </div>
        <p className="text-gray-600 mt-2">不同用户ID将使用不同的本地数据文件，刷新不会互相覆盖。</p>
      </Card>
      <Card title="数据管理">
        <AntButton onClick={() => excelService.exportExcel()}>导出所有数据为Excel</AntButton>
      </Card>
    </div>
  );
};

export default App;
