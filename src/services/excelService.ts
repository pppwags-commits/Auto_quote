/**
 * Excel服务模块
 * 用于本地Excel文件的读写操作，支持公司信息、产品库、报价单等数据的存储
 */

import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// 数据类型定义
export interface Company {
  id: string;
  name: string;
  nameEn: string;
  address: string;
  addressEn: string;
  phone: string;
  email: string;
  website: string;
  taxNumber: string;
  bankName: string;
  bankAccount: string;
  swiftCode: string;
  intermediaryBank?: string;
  logo?: string;
  isDefault: boolean;
}

export interface Product {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  category: string;
  unit: string;
  minPrice: number;
  maxPrice: number;
  currency: string;
  specifications: Record<string, any>;
  isActive: boolean;
  images?: string[];
}

export interface Customer {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  country: string;
  companyName: string;
  taxNumber: string;
  notes: string;
}

export interface Quotation {
  id: string;
  quotationNumber: string;
  companyId: string;
  customerId: string;
  quotationDate: string;
  expiryDate: string;
  currency: string;
  paymentTerms: string;
  deliveryTerms: string;
  pickupLocation: string;
  tradeTerms: string;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  notes: string;
  items: QuotationItem[];
}

export interface QuotationItem {
  id: string;
  productId: string;
  productName: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discountRate: number;
  discountAmount: number;
  totalPrice: number;
}

export interface Template {
  id: string;
  name: string;
  type: 'payment_terms' | 'delivery_terms' | 'warranty_terms' | 'other';
  content: string;
  isDefault: boolean;
}

class ExcelService {
  private dataPath: string;
  private getUserKey(): string {
    const uid = localStorage.getItem('qs_current_user') || 'default';
    return `quotation_system_data:${uid}`;
  }

  constructor() {
    this.dataPath = '/data/quotation_system.xlsx';
  }

  /**
   * 初始化Excel文件结构
   */
  async initializeExcelFile(): Promise<void> {
    const workbook = XLSX.utils.book_new();
    const sheets = [
      { name: '公司信息', data: this.getCompanyHeaders() },
      { name: '产品库', data: this.getProductHeaders() },
      { name: '客户信息', data: this.getCustomerHeaders() },
      { name: '报价单', data: this.getQuotationHeaders() },
      { name: '报价单项', data: this.getQuotationItemHeaders() },
      { name: '条款模板', data: this.getTemplateHeaders() }
    ];

    sheets.forEach(sheet => {
      const worksheet = XLSX.utils.aoa_to_sheet([sheet.data]);
      XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name);
    });

    const base64 = XLSX.write(workbook, { bookType: 'xlsx', type: 'base64' });
    localStorage.setItem(this.getUserKey(), base64);
  }

  /**
   * 获取公司信息表头
   */
  private getCompanyHeaders(): string[] {
    return [
      'ID', '公司名称', '英文名称', '地址', '英文地址', '电话', '邮箱', '网址',
      '税号', '银行名称', '银行账号', 'SWIFT代码', '中转银行', 'Logo', '是否默认'
    ];
  }

  /**
   * 获取产品库表头
   */
  private getProductHeaders(): string[] {
    return [
      'ID', '产品名称', '英文名称', '产品描述', '英文描述', '分类', '单位',
      '最低价格', '最高价格', '货币', '规格参数', '是否启用', '图片'
    ];
  }

  /**
   * 获取客户信息表头
   */
  private getCustomerHeaders(): string[] {
    return [
      'ID', '客户名称', '联系人', '邮箱', '电话', '地址', '国家', '公司名称', '税号', '备注'
    ];
  }

  /**
   * 获取报价单表头
   */
  private getQuotationHeaders(): string[] {
    return [
      'ID', '报价单号', '公司ID', '客户ID', '报价日期', '有效期', '货币',
      '付款条款', '交货条款', '提货地点', '贸易术语', '小计', '税率', '税额',
      '总金额', '状态', '备注'
    ];
  }

  /**
   * 获取报价单项表头
   */
  private getQuotationItemHeaders(): string[] {
    return [
      'ID', '报价单ID', '产品ID', '产品名称', '描述', '数量', '单位',
      '单价', '折扣率', '折扣金额', '总价'
    ];
  }

  /**
   * 获取条款模板表头
   */
  private getTemplateHeaders(): string[] {
    return [
      'ID', '模板名称', '模板类型', '内容', '是否默认'
    ];
  }

  /**
   * 从本地存储读取Excel文件
   */
  private async readFromLocalStorage(): Promise<XLSX.WorkBook | null> {
    try {
      const stored = localStorage.getItem(this.getUserKey());
      if (!stored) {
        await this.initializeExcelFile();
        return this.readFromLocalStorage();
      }

      if (stored.startsWith('blob:')) {
        try {
          const response = await fetch(stored);
          const arrayBuffer = await response.arrayBuffer();
          return XLSX.read(arrayBuffer, { type: 'array' });
        } catch {
          // 旧的 blob URL 失效，重新初始化
          await this.initializeExcelFile();
          const base64 = localStorage.getItem(this.getUserKey()) || '';
          return XLSX.read(base64, { type: 'base64' });
        }
      }

      return XLSX.read(stored, { type: 'base64' });
    } catch (error) {
      console.error('读取Excel文件失败:', error);
      return null;
    }
  }

  /**
   * 保存到本地存储
   */
  private async saveToLocalStorage(workbook: XLSX.WorkBook): Promise<void> {
    try {
      const base64 = XLSX.write(workbook, { bookType: 'xlsx', type: 'base64' });
      const legacy = localStorage.getItem(this.getUserKey());
      if (legacy && legacy.startsWith('blob:')) {
        try { URL.revokeObjectURL(legacy); } catch {}
      }
      localStorage.setItem(this.getUserKey(), base64);
    } catch (error) {
      console.error('保存Excel文件失败:', error);
      throw error;
    }
  }

  /**
   * 获取所有公司信息
   */
  async getCompanies(): Promise<Company[]> {
    const workbook = await this.readFromLocalStorage();
    if (!workbook) return [];

    const worksheet = workbook.Sheets['公司信息'];
    if (!worksheet) return [];

    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    if (data.length <= 1) return []; // 只有表头

    const headers = data[0] as string[];
    const companies: Company[] = [];

    for (let i = 1; i < data.length; i++) {
      const row = data[i] as any[];
      const company: Company = {
        id: row[headers.indexOf('ID')] || '',
        name: row[headers.indexOf('公司名称')] || '',
        nameEn: row[headers.indexOf('英文名称')] || '',
        address: row[headers.indexOf('地址')] || '',
        addressEn: row[headers.indexOf('英文地址')] || '',
        phone: row[headers.indexOf('电话')] || '',
        email: row[headers.indexOf('邮箱')] || '',
        website: row[headers.indexOf('网址')] || '',
        taxNumber: row[headers.indexOf('税号')] || '',
        bankName: row[headers.indexOf('银行名称')] || '',
        bankAccount: row[headers.indexOf('银行账号')] || '',
        swiftCode: row[headers.indexOf('SWIFT代码')] || '',
        intermediaryBank: row[headers.indexOf('中转银行')] || '',
        logo: row[headers.indexOf('Logo')] || '',
        isDefault: row[headers.indexOf('是否默认')] === '是'
      };
      companies.push(company);
    }

    return companies;
  }

  /**
   * 保存公司信息
   */
  async saveCompany(company: Company): Promise<void> {
    const workbook = await this.readFromLocalStorage();
    if (!workbook) throw new Error('无法读取Excel文件');

    let worksheet = workbook.Sheets['公司信息'];
    if (!worksheet) {
      worksheet = XLSX.utils.aoa_to_sheet([this.getCompanyHeaders()]);
    }

    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
    
    // 查找是否已存在
    let existingIndex = -1;
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === company.id) {
        existingIndex = i;
        break;
      }
    }

    const rowData = [
      company.id,
      company.name,
      company.nameEn,
      company.address,
      company.addressEn,
      company.phone,
      company.email,
      company.website,
      company.taxNumber,
      company.bankName,
      company.bankAccount,
      company.swiftCode,
      company.intermediaryBank || '',
      company.logo || '',
      company.isDefault ? '是' : '否'
    ];

    if (existingIndex >= 0) {
      // 更新现有数据
      data[existingIndex] = rowData;
    } else {
      // 添加新数据
      data.push(rowData);
    }

    // 更新工作表
    const newWorksheet = XLSX.utils.aoa_to_sheet(data);
    workbook.Sheets['公司信息'] = newWorksheet;
    
    await this.saveToLocalStorage(workbook);
  }

  /**
   * 获取所有产品
   */
  async getProducts(): Promise<Product[]> {
    const workbook = await this.readFromLocalStorage();
    if (!workbook) return [];

    const worksheet = workbook.Sheets['产品库'];
    if (!worksheet) return [];

    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    if (data.length <= 1) return [];

    const headers = data[0] as string[];
    const products: Product[] = [];

    for (let i = 1; i < data.length; i++) {
      const row = data[i] as any[];
      const product: Product = {
        id: row[headers.indexOf('ID')] || '',
        name: row[headers.indexOf('产品名称')] || '',
        nameEn: row[headers.indexOf('英文名称')] || '',
        description: row[headers.indexOf('产品描述')] || '',
        descriptionEn: row[headers.indexOf('英文描述')] || '',
        category: row[headers.indexOf('分类')] || '',
        unit: row[headers.indexOf('单位')] || '',
        minPrice: parseFloat(row[headers.indexOf('最低价格')] || '0'),
        maxPrice: parseFloat(row[headers.indexOf('最高价格')] || '0'),
        currency: row[headers.indexOf('货币')] || 'USD',
        specifications: {},
        isActive: row[headers.indexOf('是否启用')] === '是'
      };
      const imagesCell = headers.indexOf('图片');
      if (imagesCell >= 0) {
        try { product.images = JSON.parse(row[imagesCell] || '[]'); } catch { product.images = []; }
      }
      products.push(product);
    }

    return products;
  }

  /**
   * 保存产品信息
   */
  async saveProduct(product: Product): Promise<void> {
    const workbook = await this.readFromLocalStorage();
    if (!workbook) throw new Error('无法读取Excel文件');

    let worksheet = workbook.Sheets['产品库'];
    if (!worksheet) {
      worksheet = XLSX.utils.aoa_to_sheet([this.getProductHeaders()]);
    }

    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
    
    // 查找是否已存在
    let existingIndex = -1;
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === product.id) {
        existingIndex = i;
        break;
      }
    }

    const rowData = [
      product.id,
      product.name,
      product.nameEn,
      product.description,
      product.descriptionEn,
      product.category,
      product.unit,
      product.minPrice,
      product.maxPrice,
      product.currency,
      JSON.stringify(product.specifications),
      product.isActive ? '是' : '否',
      JSON.stringify(product.images || [])
    ];

    if (existingIndex >= 0) {
      data[existingIndex] = rowData;
    } else {
      data.push(rowData);
    }

    const newWorksheet = XLSX.utils.aoa_to_sheet(data);
    workbook.Sheets['产品库'] = newWorksheet;
    
    await this.saveToLocalStorage(workbook);
  }

  /**
   * 导出Excel文件
   */
  async exportExcel(): Promise<void> {
    const workbook = await this.readFromLocalStorage();
    if (!workbook) {
      throw new Error('没有数据可导出');
    }

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(blob, `quotation_system_${new Date().toISOString().split('T')[0]}.xlsx`);
  }

  /**
   * 从文件导入数据
   */
  async importExcel(file: File): Promise<void> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          
          // 验证必要的表是否存在
          const requiredSheets = ['公司信息', '产品库', '客户信息'];
          const availableSheets = workbook.SheetNames;
          
          const missingSheets = requiredSheets.filter(sheet => !availableSheets.includes(sheet));
          if (missingSheets.length > 0) {
            throw new Error(`缺少必要的工作表: ${missingSheets.join(', ')}`);
          }
          
          // 保存导入的数据
          await this.saveToLocalStorage(workbook);
          resolve();
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('文件读取失败'));
      reader.readAsArrayBuffer(file);
    });
  }

  async getQuotationItemsByQuotationId(quotationId: string): Promise<QuotationItem[]> {
    const workbook = await this.readFromLocalStorage();
    if (!workbook) return [];

    const worksheet = workbook.Sheets['报价单项'];
    if (!worksheet) return [];

    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
    if (data.length <= 1) return [];

    const headers = data[0] as string[];
    const items: QuotationItem[] = [];

    const idxQuotationId = headers.indexOf('报价单ID');
    const idxId = headers.indexOf('ID');
    const idxProductId = headers.indexOf('产品ID');
    const idxProductName = headers.indexOf('产品名称');
    const idxDescription = headers.indexOf('描述');
    const idxQuantity = headers.indexOf('数量');
    const idxUnit = headers.indexOf('单位');
    const idxUnitPrice = headers.indexOf('单价');
    const idxDiscountRate = headers.indexOf('折扣率');
    const idxDiscountAmount = headers.indexOf('折扣金额');
    const idxTotalPrice = headers.indexOf('总价');

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (String(row[idxQuotationId]) !== quotationId) continue;
      items.push({
        id: String(row[idxId] || ''),
        productId: String(row[idxProductId] || ''),
        productName: String(row[idxProductName] || ''),
        description: String(row[idxDescription] || ''),
        quantity: Number(row[idxQuantity] || 0),
        unit: String(row[idxUnit] || ''),
        unitPrice: Number(row[idxUnitPrice] || 0),
        discountRate: Number(row[idxDiscountRate] || 0),
        discountAmount: Number(row[idxDiscountAmount] || 0),
        totalPrice: Number(row[idxTotalPrice] || 0),
      });
    }

    return items;
  }

  async getQuotations(): Promise<Quotation[]> {
    const workbook = await this.readFromLocalStorage();
    if (!workbook) return [];

    const worksheet = workbook.Sheets['报价单'];
    if (!worksheet) return [];

    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
    if (data.length <= 1) return [];

    const headers = data[0] as string[];
    const list: Quotation[] = [];

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const q: Quotation = {
        id: String(row[headers.indexOf('ID')] || ''),
        quotationNumber: String(row[headers.indexOf('报价单号')] || ''),
        companyId: String(row[headers.indexOf('公司ID')] || ''),
        customerId: String(row[headers.indexOf('客户ID')] || ''),
        quotationDate: String(row[headers.indexOf('报价日期')] || ''),
        expiryDate: String(row[headers.indexOf('有效期')] || ''),
        currency: String(row[headers.indexOf('货币')] || 'USD'),
        paymentTerms: String(row[headers.indexOf('付款条款')] || ''),
        deliveryTerms: String(row[headers.indexOf('交货条款')] || ''),
        pickupLocation: String(row[headers.indexOf('提货地点')] || ''),
        tradeTerms: String(row[headers.indexOf('贸易术语')] || ''),
        subtotal: Number(row[headers.indexOf('小计')] || 0),
        taxRate: Number(row[headers.indexOf('税率')] || 0),
        taxAmount: Number(row[headers.indexOf('税额')] || 0),
        totalAmount: Number(row[headers.indexOf('总金额')] || 0),
        status: (String(row[headers.indexOf('状态')] || 'draft') as Quotation['status']),
        notes: String(row[headers.indexOf('备注')] || ''),
        items: [],
      };
      list.push(q);
    }

    return list;
  }

  async saveQuotation(quotation: Quotation): Promise<void> {
    const workbook = await this.readFromLocalStorage();
    if (!workbook) throw new Error('无法读取Excel文件');

    // 报价单表
    let sheetQ = workbook.Sheets['报价单'];
    if (!sheetQ) {
      sheetQ = XLSX.utils.aoa_to_sheet([this.getQuotationHeaders()]);
      workbook.Sheets['报价单'] = sheetQ;
    }
    const dataQ = XLSX.utils.sheet_to_json(sheetQ, { header: 1 }) as any[][];

    // upsert
    let existingIndex = -1;
    for (let i = 1; i < dataQ.length; i++) {
      if (dataQ[i][0] === quotation.id) { existingIndex = i; break; }
    }
    const rowQ = [
      quotation.id,
      quotation.quotationNumber,
      quotation.companyId,
      quotation.customerId,
      quotation.quotationDate,
      quotation.expiryDate,
      quotation.currency,
      quotation.paymentTerms,
      quotation.deliveryTerms,
      quotation.pickupLocation,
      quotation.tradeTerms,
      quotation.subtotal,
      quotation.taxRate,
      quotation.taxAmount,
      quotation.totalAmount,
      quotation.status,
      quotation.notes,
    ];
    if (existingIndex >= 0) dataQ[existingIndex] = rowQ; else dataQ.push(rowQ);
    workbook.Sheets['报价单'] = XLSX.utils.aoa_to_sheet(dataQ);

    // 报价单项表
    let sheetItems = workbook.Sheets['报价单项'];
    if (!sheetItems) {
      sheetItems = XLSX.utils.aoa_to_sheet([this.getQuotationItemHeaders()]);
      workbook.Sheets['报价单项'] = sheetItems;
    }
    const dataItems = XLSX.utils.sheet_to_json(sheetItems, { header: 1 }) as any[][];
    const headersItems = dataItems[0] as string[];
    const idxQuotationId = headersItems.indexOf('报价单ID');

    // 移除旧项
    const kept = [dataItems[0]];
    for (let i = 1; i < dataItems.length; i++) {
      const row = dataItems[i];
      if (String(row[idxQuotationId]) !== quotation.id) kept.push(row);
    }
    // 添加新项
    for (const item of quotation.items) {
      kept.push([
        item.id,
        quotation.id,
        item.productId,
        item.productName,
        item.description,
        item.quantity,
        item.unit,
        item.unitPrice,
        item.discountRate,
        item.discountAmount,
        item.totalPrice,
      ]);
    }
    workbook.Sheets['报价单项'] = XLSX.utils.aoa_to_sheet(kept);

    await this.saveToLocalStorage(workbook);
  }

  async getCustomerById(customerId: string): Promise<Customer | null> {
    const workbook = await this.readFromLocalStorage();
    if (!workbook) return null;
    const sheet = workbook.Sheets['客户信息'];
    if (!sheet) return null;
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
    if (data.length <= 1) return null;
    const headers = data[0] as string[];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[headers.indexOf('ID')] === customerId) {
        const c: Customer = {
          id: String(row[headers.indexOf('ID')] || ''),
          name: String(row[headers.indexOf('客户名称')] || ''),
          contactPerson: String(row[headers.indexOf('联系人')] || ''),
          email: String(row[headers.indexOf('邮箱')] || ''),
          phone: String(row[headers.indexOf('电话')] || ''),
          address: String(row[headers.indexOf('地址')] || ''),
          country: String(row[headers.indexOf('国家')] || ''),
          companyName: String(row[headers.indexOf('公司名称')] || ''),
          taxNumber: String(row[headers.indexOf('税号')] || ''),
          notes: String(row[headers.indexOf('备注')] || ''),
        };
        return c;
      }
    }
    return null;
  }

  async saveCustomer(customer: Customer): Promise<void> {
    const workbook = await this.readFromLocalStorage();
    if (!workbook) throw new Error('无法读取Excel文件');
    let sheet = workbook.Sheets['客户信息'];
    if (!sheet) {
      sheet = XLSX.utils.aoa_to_sheet([this.getCustomerHeaders()]);
      workbook.Sheets['客户信息'] = sheet;
    }
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
    let existingIndex = -1;
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === customer.id) { existingIndex = i; break; }
    }
    const row = [
      customer.id,
      customer.name,
      customer.contactPerson,
      customer.email,
      customer.phone,
      customer.address,
      customer.country,
      customer.companyName,
      customer.taxNumber,
      customer.notes,
    ];
    if (existingIndex >= 0) data[existingIndex] = row; else data.push(row);
    workbook.Sheets['客户信息'] = XLSX.utils.aoa_to_sheet(data);
    await this.saveToLocalStorage(workbook);
  }
}

// 创建单例实例
export const excelService = new ExcelService();
