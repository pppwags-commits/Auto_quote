/**
 * 产品库管理Store
 * 管理产品信息和价格体系的存储和状态
 */

import { create } from 'zustand';
import { excelService, Product } from '../services/excelService';

interface ProductState {
  products: Product[];
  categories: string[];
  loading: boolean;
  error: string | null;
  
  // 操作函数
  loadProducts: () => Promise<void>;
  saveProduct: (product: Product) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  getProductById: (productId: string) => Product | null;
  getProductsByCategory: (category: string) => Product[];
  searchProducts: (query: string) => Product[];
  getPriceSuggestion: (productId: string) => { min: number; max: number; currency: string } | null;
}

export const useProductStore = create<ProductState>()((set, get) => ({
  products: [],
  categories: [],
  loading: false,
  error: null,

  /**
   * 加载产品列表
   */
  loadProducts: async () => {
    set({ loading: true, error: null });
    try {
      const products = await excelService.getProducts();
      
      // 提取分类列表
      const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean)));
      
      set({ products, categories, loading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : '加载产品信息失败',
        loading: false 
      });
    }
  },

  /**
   * 保存产品信息
   */
  saveProduct: async (product) => {
    set({ loading: true, error: null });
    try {
      await excelService.saveProduct(product);
      
      // 重新加载产品列表
      await get().loadProducts();
      set({ loading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : '保存产品信息失败',
        loading: false 
      });
      throw error;
    }
  },

  /**
   * 删除产品信息
   */
  deleteProduct: async (productId) => {
    set({ loading: true, error: null });
    try {
      const { products } = get();
      const updatedProducts = products.filter(p => p.id !== productId);
      
      // 重新保存所有产品信息（除了被删除的）
      for (const product of updatedProducts) {
        await excelService.saveProduct(product);
      }
      
      // 重新加载产品列表
      await get().loadProducts();
      set({ loading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : '删除产品信息失败',
        loading: false 
      });
      throw error;
    }
  },

  /**
   * 根据ID获取产品
   */
  getProductById: (productId) => {
    const { products } = get();
    return products.find(p => p.id === productId) || null;
  },

  /**
   * 根据分类获取产品
   */
  getProductsByCategory: (category) => {
    const { products } = get();
    return products.filter(p => p.category === category && p.isActive);
  },

  /**
   * 搜索产品
   */
  searchProducts: (query) => {
    const { products } = get();
    const searchTerm = query.toLowerCase();
    
    return products.filter(product => 
      product.isActive && (
        product.name.toLowerCase().includes(searchTerm) ||
        product.nameEn.toLowerCase().includes(searchTerm) ||
        product.description.toLowerCase().includes(searchTerm) ||
        product.descriptionEn.toLowerCase().includes(searchTerm) ||
        product.category.toLowerCase().includes(searchTerm)
      )
    );
  },

  /**
   * 获取价格建议
   */
  getPriceSuggestion: (productId) => {
    const product = get().getProductById(productId);
    if (!product) return null;
    
    return {
      min: product.minPrice,
      max: product.maxPrice,
      currency: product.currency
    };
  }
}));

// 初始化时加载产品信息
useProductStore.getState().loadProducts();