/**
 * 公司信息管理Store
 * 管理三套公司身份信息的存储和状态
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { excelService, Company } from '../services/excelService';

interface CompanyState {
  companies: Company[];
  currentCompany: Company | null;
  loading: boolean;
  error: string | null;
  
  // 操作函数
  loadCompanies: () => Promise<void>;
  setCurrentCompany: (company: Company) => void;
  saveCompany: (company: Company) => Promise<void>;
  deleteCompany: (companyId: string) => Promise<void>;
  getDefaultCompany: () => Company | null;
  setDefaultCompany: (companyId: string) => Promise<void>;
}

export const useCompanyStore = create<CompanyState>()(
  persist(
    (set, get) => ({
      companies: [],
      currentCompany: null,
      loading: false,
      error: null,

      /**
       * 加载公司信息列表
       */
      loadCompanies: async () => {
        set({ loading: true, error: null });
        try {
          const companies = await excelService.getCompanies();
          set({ companies, loading: false });
          
          // 如果没有当前选中的公司，选择默认公司或第一个公司
          const { currentCompany } = get();
          if (!currentCompany && companies.length > 0) {
            const defaultCompany = companies.find(c => c.isDefault) || companies[0];
            set({ currentCompany: defaultCompany });
          }
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : '加载公司信息失败',
            loading: false 
          });
        }
      },

      /**
       * 设置当前选中的公司
       */
      setCurrentCompany: (company) => {
        set({ currentCompany: company });
      },

      /**
       * 保存公司信息
       */
      saveCompany: async (company) => {
        set({ loading: true, error: null });
        try {
          await excelService.saveCompany(company);
          
          // 重新加载公司列表
          await get().loadCompanies();
          set({ loading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : '保存公司信息失败',
            loading: false 
          });
          throw error;
        }
      },

      /**
       * 删除公司信息
       */
      deleteCompany: async (companyId) => {
        set({ loading: true, error: null });
        try {
          const { companies } = get();
          const updatedCompanies = companies.filter(c => c.id !== companyId);
          
          // 重新保存所有公司信息（除了被删除的）
          for (const company of updatedCompanies) {
            await excelService.saveCompany(company);
          }
          
          // 重新加载公司列表
          await get().loadCompanies();
          set({ loading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : '删除公司信息失败',
            loading: false 
          });
          throw error;
        }
      },

      /**
       * 获取默认公司
       */
      getDefaultCompany: () => {
        const { companies } = get();
        return companies.find(c => c.isDefault) || null;
      },

      /**
       * 设置默认公司
       */
      setDefaultCompany: async (companyId) => {
        set({ loading: true, error: null });
        try {
          const { companies } = get();
          const updatedCompanies = companies.map(company => ({
            ...company,
            isDefault: company.id === companyId
          }));

          // 重新保存所有公司信息
          for (const company of updatedCompanies) {
            await excelService.saveCompany(company);
          }

          // 重新加载公司列表
          await get().loadCompanies();
          set({ loading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : '设置默认公司失败',
            loading: false 
          });
          throw error;
        }
      }
    }),
    {
      name: 'company-store',
      partialize: (state) => ({ 
        currentCompany: state.currentCompany 
      })
    }
  )
);

// 初始化时加载公司信息
useCompanyStore.getState().loadCompanies();