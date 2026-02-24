// Auth Store - User authentication state management
import { defineStore } from 'pinia';

interface User {
  id: string;
  phone: string;
  name: string;
  role: string;
  avatar?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  loading: boolean;
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    token: null,
    refreshToken: null,
    loading: false,
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
    userRole: (state) => state.user?.role || '',
    userName: (state) => state.user?.name || '',
    // Role checks
    isAdmin: (state) => state.user?.role === 'ADMIN',
    isSchoolAdmin: (state) => state.user?.role === 'SCHOOL_ADMIN',
    isCafeteriaManager: (state) => state.user?.role === 'CAFETERIA_MANAGER',
    isCafeteriaCook: (state) => state.user?.role === 'CAFETERIA_COOK',
    isDoctor: (state) => state.user?.role === 'DOCTOR',
    isStudent: (state) => state.user?.role === 'STUDENT',
    isParent: (state) => state.user?.role === 'PARENT',
    isInstitution: (state) => state.user?.role === 'INSTITUTION',
    // Group checks
    isStaff: (state) => ['ADMIN', 'SCHOOL_ADMIN', 'CAFETERIA_MANAGER', 'CAFETERIA_COOK', 'DOCTOR', 'INSTITUTION'].includes(state.user?.role || ''),
    canManageCafeteria: (state) => ['ADMIN', 'CAFETERIA_MANAGER'].includes(state.user?.role || ''),
    canViewSchool: (state) => ['ADMIN', 'SCHOOL_ADMIN', 'CAFETERIA_MANAGER', 'CAFETERIA_COOK'].includes(state.user?.role || ''),
    // Role badge color
    roleBadgeColor: (state) => {
      const colors: Record<string, string> = {
        ADMIN: 'bg-red-100 text-red-700',
        SCHOOL_ADMIN: 'bg-purple-100 text-purple-700',
        CAFETERIA_MANAGER: 'bg-orange-100 text-orange-700',
        CAFETERIA_COOK: 'bg-amber-100 text-amber-700',
        DOCTOR: 'bg-blue-100 text-blue-700',
        INSTITUTION: 'bg-teal-100 text-teal-700',
        STUDENT: 'bg-green-100 text-green-700',
        PARENT: 'bg-indigo-100 text-indigo-700',
      }
      return colors[state.user?.role || ''] || 'bg-gray-100 text-gray-700'
    },
  },

  actions: {
    // Initialize auth state from localStorage
    init() {
      if (import.meta.client) {
        const token = localStorage.getItem('token');
        const refreshToken = localStorage.getItem('refreshToken');
        const userStr = localStorage.getItem('user');

        if (token && userStr) {
          try {
            this.token = token;
            this.refreshToken = refreshToken;
            this.user = JSON.parse(userStr);
          } catch {
            this.logout();
          }
        }
      }
    },

    // Login
    async login(phone: string, password: string) {
      this.loading = true;
      try {
        const config = useRuntimeConfig();
        const response = await fetch(`${config.public.apiBase}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone, password }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || '登录失败');
        }

        // Store tokens and user
        this.token = data.data.token;
        this.refreshToken = data.data.refreshToken;
        this.user = data.data.user;

        // Persist to localStorage
        if (import.meta.client) {
          localStorage.setItem('token', data.data.token);
          localStorage.setItem('refreshToken', data.data.refreshToken);
          localStorage.setItem('user', JSON.stringify(data.data.user));
        }

        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message };
      } finally {
        this.loading = false;
      }
    },

    // Register
    async register(phone: string, password: string, name: string, role: string = 'PARENT') {
      this.loading = true;
      try {
        const config = useRuntimeConfig();
        const response = await fetch(`${config.public.apiBase}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone, password, name, role }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || '注册失败');
        }

        // Auto login after register
        return await this.login(phone, password);
      } catch (error: any) {
        return { success: false, error: error.message };
      } finally {
        this.loading = false;
      }
    },

    // Logout
    logout() {
      this.user = null;
      this.token = null;
      this.refreshToken = null;

      if (import.meta.client) {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
      }

      navigateTo('/login');
    },

    // Get role display name
    getRoleName(role: string): string {
      const roles: Record<string, string> = {
        PARENT: '家长',
        STUDENT: '学生',
        SCHOOL_ADMIN: '学校管理员',
        CAFETERIA_MANAGER: '食堂管理员',
        CAFETERIA_COOK: '食堂厨师',
        DOCTOR: '医生',
        INSTITUTION: '营养机构',
        ADMIN: '系统管理员',
      };
      return roles[role] || role;
    },
  },
});
