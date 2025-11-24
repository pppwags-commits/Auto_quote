/**
 * PDF生成服务
 * 用于生成专业的英文报价单和付款发票PDF文档
 */

import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// PDF模板类型
export type PDFTemplate = 'quotation' | 'invoice' | 'proforma';

// PDF配置
interface PDFConfig {
  template: PDFTemplate;
  format: 'A4' | 'Letter';
  orientation: 'portrait' | 'landscape';
  margin: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

interface PDFOptions {
  logoPosition?: 'left' | 'center' | 'right';
  showProductImages?: boolean;
}

// 公司信息接口
interface CompanyInfo {
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
}

// 客户信息接口
interface CustomerInfo {
  name: string;
  companyName: string;
  address: string;
  country: string;
  contactPerson: string;
  email: string;
  phone: string;
}

// 报价单项接口
interface QuotationItem {
  productName: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
}

// 报价单数据接口
interface QuotationData {
  quotationNumber: string;
  quotationDate: string;
  expiryDate: string;
  currency: string;
  pickupLocation: string;
  tradeTerms: string;
  paymentTerms: string;
  deliveryTerms: string;
  items: QuotationItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  notes: string;
}

class PDFService {
  private defaultConfig: PDFConfig = {
    template: 'quotation',
    format: 'A4',
    orientation: 'portrait',
    margin: { top: 20, right: 20, bottom: 20, left: 20 }
  };

  /**
   * 生成报价单PDF
   */
  async generateQuotationPDF(
    company: CompanyInfo,
    customer: CustomerInfo,
    quotation: QuotationData,
    config: Partial<PDFConfig> = {},
    options: PDFOptions = {}
  ): Promise<Blob> {
    const finalConfig = { ...this.defaultConfig, ...config, template: 'quotation' as PDFTemplate };
    
    // 创建HTML内容
    const htmlContent = this.generateQuotationHTML(company, customer, quotation, options);
    
    // 使用html2canvas和jsPDF生成PDF
    return this.generatePDF(htmlContent, finalConfig);
  }

  /**
   * 生成发票PDF
   */
  async generateInvoicePDF(
    company: CompanyInfo,
    customer: CustomerInfo,
    invoice: QuotationData,
    config: Partial<PDFConfig> = {}
  ): Promise<Blob> {
    const finalConfig = { ...this.defaultConfig, ...config, template: 'invoice' as PDFTemplate };
    
    // 创建HTML内容
    const htmlContent = this.generateInvoiceHTML(company, customer, invoice);
    
    // 使用html2canvas和jsPDF生成PDF
    return this.generatePDF(htmlContent, finalConfig);
  }

  /**
   * 生成PDF预览
   */
  async generatePDFPreview(
    company: CompanyInfo,
    customer: CustomerInfo,
    quotation: QuotationData,
    config: Partial<PDFConfig> = {}
  ): Promise<string> {
    const blob = await this.generateQuotationPDF(company, customer, quotation, config);
    return URL.createObjectURL(blob);
  }

  /**
   * 生成报价单HTML内容
   */
  private generateQuotationHTML(
    company: CompanyInfo,
    customer: CustomerInfo,
    quotation: QuotationData,
    options: PDFOptions = {}
  ): string {
    const logoHtml = company.logo ? `<img src="${company.logo}" alt="Company Logo" class="logo">` : '';
    let logoContainer = '';
    if (options.logoPosition === 'center') {
      logoContainer = `<div style="text-align:center; margin-bottom:10px;">${logoHtml}</div>`;
    }
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>QUOTATION - ${quotation.quotationNumber}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Arial', sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: #333;
          }
          
          .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
          }
          
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #1e40af;
          }
          
          .company-info {
            flex: 1;
          }
          
          .company-name {
            font-size: 18px;
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 8px;
          }
          
          .company-name-en {
            font-size: 14px;
            color: #666;
            margin-bottom: 12px;
          }
          
          .company-details {
            font-size: 11px;
            line-height: 1.5;
          }
          
          .company-details div {
            margin-bottom: 4px;
          }
          
          .logo {
            width: 120px;
            height: 80px;
            object-fit: contain;
          }
          
          .title {
            text-align: center;
            font-size: 24px;
            font-weight: bold;
            color: #1e40af;
            margin: 30px 0;
            text-transform: uppercase;
            letter-spacing: 2px;
          }
          
          .info-section {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
          }
          
          .info-block {
            flex: 1;
            padding: 15px;
            border: 1px solid #e5e7eb;
            border-radius: 4px;
          }
          
          .info-block h3 {
            font-size: 14px;
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 10px;
            text-transform: uppercase;
          }
          
          .info-row {
            display: flex;
            margin-bottom: 6px;
          }
          
          .info-label {
            font-weight: bold;
            width: 80px;
            color: #666;
          }
          
          .info-value {
            flex: 1;
          }
          
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            font-size: 11px;
          }
          
          .items-table th {
            background-color: #1e40af;
            color: white;
            padding: 10px;
            text-align: left;
            font-weight: bold;
            border: 1px solid #374151;
          }
          
          .items-table td {
            padding: 8px;
            border: 1px solid #e5e7eb;
            vertical-align: top;
          }
          
          .items-table .number {
            text-align: right;
          }
          
          .items-table .description {
            max-width: 300px;
            word-wrap: break-word;
          }
          
          .totals {
            margin-left: auto;
            width: 300px;
            margin-top: 20px;
          }
          
          .total-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #e5e7eb;
          }
          
          .total-row:last-child {
            border-bottom: 2px solid #1e40af;
            font-weight: bold;
            font-size: 14px;
          }
          
          .terms-section {
            margin-top: 30px;
            padding: 15px;
            border: 1px solid #e5e7eb;
            border-radius: 4px;
            background-color: #f9fafb;
          }
          
          .terms-section h3 {
            font-size: 14px;
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 10px;
          }
          
          .terms-content {
            font-size: 11px;
            line-height: 1.5;
            white-space: pre-line;
          }
          
          .bank-info {
            margin-top: 20px;
            padding: 15px;
            border: 1px solid #e5e7eb;
            border-radius: 4px;
            background-color: #f0f9ff;
          }
          
          .bank-info h3 {
            font-size: 14px;
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 10px;
          }
          
          .bank-details {
            font-size: 11px;
            line-height: 1.5;
          }
          
          .signature-section {
            display: flex;
            justify-content: space-between;
            margin-top: 50px;
            padding-top: 30px;
            border-top: 1px solid #e5e7eb;
          }
          
          .signature-block {
            text-align: center;
            width: 200px;
          }
          
          .signature-title {
            font-weight: bold;
            margin-bottom: 40px;
            text-transform: uppercase;
          }
          
          .signature-line {
            border-top: 1px solid #333;
            margin-top: 40px;
            padding-top: 5px;
            font-size: 11px;
          }
          
          .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 10px;
            color: #666;
            border-top: 1px solid #e5e7eb;
            padding-top: 15px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          ${logoContainer}
          <!-- 公司抬头 -->
          <div class="header">
            <div class="company-info">
              <div class="company-name">${company.name}</div>
              <div class="company-name-en">${company.nameEn}</div>
              <div class="company-details">
                <div>地址: ${company.address}</div>
                <div>Address: ${company.addressEn}</div>
                <div>电话: ${company.phone}</div>
                <div>邮箱: ${company.email}</div>
                <div>网址: ${company.website}</div>
                <div>税号: ${company.taxNumber}</div>
              </div>
            </div>
            ${options.logoPosition === 'left' ? logoHtml : options.logoPosition === 'right' ? logoHtml : ''}
          </div>
          
          <!-- 标题 -->
          <div class="title">QUOTATION</div>
          
          <!-- 基本信息 -->
          <div class="info-section">
            <div class="info-block">
              <h3>To: ${customer.name}</h3>
              <div class="info-row">
                <span class="info-label">Company:</span>
                <span class="info-value">${customer.companyName}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Address:</span>
                <span class="info-value">${customer.address}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Country:</span>
                <span class="info-value">${customer.country}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Contact:</span>
                <span class="info-value">${customer.contactPerson}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Email:</span>
                <span class="info-value">${customer.email}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Phone:</span>
                <span class="info-value">${customer.phone}</span>
              </div>
            </div>
            
            <div class="info-block">
              <h3>Quotation Details</h3>
              <div class="info-row">
                <span class="info-label">PI No:</span>
                <span class="info-value">${quotation.quotationNumber}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Date:</span>
                <span class="info-value">${quotation.quotationDate}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Expiry:</span>
                <span class="info-value">${quotation.expiryDate}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Currency:</span>
                <span class="info-value">${quotation.currency}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Pickup:</span>
                <span class="info-value">${quotation.pickupLocation}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Terms:</span>
                <span class="info-value">${quotation.tradeTerms}</span>
              </div>
            </div>
          </div>
          
          <!-- 产品明细表 -->
          <table class="items-table">
            <thead>
              <tr>
                <th>No.</th>
                <th>Product</th>
                <th>Description</th>
                <th>Quantity</th>
                <th>Unit</th>
                <th>Unit Price</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${quotation.items.map((item, index) => `
                <tr>
                  <td class="number">${index + 1}</td>
                  <td>${item.productName}</td>
                  <td class="description">${item.description}
                  ${options.showProductImages && (item as any).images && (item as any).images.length ? `<div style="margin-top:6px; display:flex; gap:6px; flex-wrap:wrap;">${(item as any).images.slice(0,3).map((src: string) => `<img src="${src}" style="width:60px;height:60px;object-fit:contain;border:1px solid #eee;padding:2px;" />`).join('')}</div>` : ''}
                  </td>
                  <td class="number">${item.quantity}</td>
                  <td>${item.unit}</td>
                  <td class="number">${quotation.currency} ${item.unitPrice.toFixed(2)}</td>
                  <td class="number">${quotation.currency} ${item.totalPrice.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <!-- 金额汇总 -->
          <div class="totals">
            <div class="total-row">
              <span>Subtotal:</span>
              <span>${quotation.currency} ${quotation.subtotal.toFixed(2)}</span>
            </div>
            ${quotation.taxRate > 0 ? `
              <div class="total-row">
                <span>Tax (${quotation.taxRate}%):</span>
                <span>${quotation.currency} ${quotation.taxAmount.toFixed(2)}</span>
              </div>
            ` : ''}
            <div class="total-row">
              <span>Total:</span>
              <span>${quotation.currency} ${quotation.totalAmount.toFixed(2)}</span>
            </div>
          </div>
          
          <!-- 条款和条件 -->
          <div class="terms-section">
            <h3>Terms and Conditions</h3>
            <div class="terms-content">
              1. PAYMENT TERMS: ${quotation.paymentTerms}
              2. DELIVERY TERMS: ${quotation.deliveryTerms}
              3. VALIDITY: This quotation is valid until ${quotation.expiryDate}
              ${quotation.notes ? `4. NOTES: ${quotation.notes}` : ''}
            </div>
          </div>
          
          <!-- 银行信息 -->
          <div class="bank-info">
            <h3>Bank Information</h3>
            <div class="bank-details">
              <div><strong>Bank Name:</strong> ${company.bankName}</div>
              <div><strong>Account Number:</strong> ${company.bankAccount}</div>
              <div><strong>SWIFT Code:</strong> ${company.swiftCode}</div>
              ${company.intermediaryBank ? `<div><strong>Intermediary Bank:</strong> ${company.intermediaryBank}</div>` : ''}
            </div>
          </div>
          
          <!-- 签字区域 -->
          <div class="signature-section">
            <div class="signature-block">
              <div class="signature-title">Seller</div>
              <div class="signature-line">Signature & Date</div>
            </div>
            <div class="signature-block">
              <div class="signature-title">Buyer</div>
              <div class="signature-line">Signature & Date</div>
            </div>
          </div>
          
          <!-- 页脚 -->
          <div class="footer">
            This document is generated by Quotation System. For questions, please contact ${company.email}
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * 生成发票HTML内容
   */
  private generateInvoiceHTML(
    company: CompanyInfo,
    customer: CustomerInfo,
    invoice: QuotationData
  ): string {
    // 发票与报价单格式类似，但标题和部分内容不同
    return this.generateQuotationHTML(company, customer, invoice).replace(
      '<div class="title">QUOTATION</div>',
      '<div class="title">COMMERCIAL INVOICE</div>'
    );
  }

  /**
   * 生成PDF文件
   */
  private async generatePDF(htmlContent: string, config: PDFConfig): Promise<Blob> {
    return new Promise((resolve, reject) => {
      // 创建临时iframe来渲染HTML
      const iframe = document.createElement('iframe');
      iframe.style.position = 'absolute';
      iframe.style.left = '-9999px';
      iframe.style.width = '210mm'; // A4宽度
      iframe.style.height = '297mm'; // A4高度
      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) {
        reject(new Error('无法创建iframe文档'));
        return;
      }

      iframeDoc.open();
      iframeDoc.write(htmlContent);
      iframeDoc.close();

      // 等待内容加载完成
      iframe.onload = async () => {
        try {
          // 使用html2canvas将HTML转换为图片
          const canvas = await html2canvas(iframeDoc.body, {
            scale: Math.min(2, (window.devicePixelRatio || 1)),
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            width: 794, // A4宽度(210mm) in pixels at 96 DPI
            height: 1123 // A4高度(297mm) in pixels at 96 DPI
          });

          // 创建jsPDF实例
          const pdf = new jsPDF({
            orientation: config.orientation,
            unit: 'mm',
            format: config.format
          });

          // 计算图片尺寸以适应页面
          const pdfWidth = pdf.internal.pageSize.getWidth() - config.margin.left - config.margin.right;
          const pdfHeight = pdf.internal.pageSize.getHeight() - config.margin.top - config.margin.bottom;
          
          const imgWidth = canvas.width;
          const imgHeight = canvas.height;
          
          const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
          
          const imgData = canvas.toDataURL('image/png');
          
          // 添加图片到PDF
          pdf.addImage(
            imgData, 
            'PNG', 
            config.margin.left, 
            config.margin.top, 
            imgWidth * ratio, 
            imgHeight * ratio
          );

          // 生成PDF blob
          const pdfBlob = pdf.output('blob');
          
          // 清理iframe
          document.body.removeChild(iframe);
          
          resolve(pdfBlob);
        } catch (error) {
          document.body.removeChild(iframe);
          reject(error);
        }
      };

      iframe.onerror = () => {
        document.body.removeChild(iframe);
        reject(new Error('iframe加载失败'));
      };
    });
  }

  /**
   * 生成报价单号
   */
  generateQuotationNumber(companyCode: string): string {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    return `${companyCode}-${year}${month}${day}-${random}`;
  }

  /**
   * 格式化货币金额
   */
  formatCurrency(amount: number, currency: string): string {
    return `${currency} ${amount.toFixed(2)}`;
  }

  /**
   * 格式化日期
   */
  formatDate(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}

// 创建单例实例
export const pdfService = new PDFService();
