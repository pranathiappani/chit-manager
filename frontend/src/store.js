import { create } from 'zustand';

export const useAuthStore = create((set) => ({
    user: JSON.parse(localStorage.getItem('user')) || null,
    token: localStorage.getItem('token') || null,
    login: (userData, token) => {
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', token);
        set({ user: userData, token });
    },
    logout: () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        set({ user: null, token: null });
    }
}));

export const useThemeStore = create((set) => ({
    mode: localStorage.getItem('themeMode') || 'light',
    setMode: (newMode) => {
        localStorage.setItem('themeMode', newMode);
        set({ mode: newMode });
    },
    toggleMode: () => set((state) => {
        const newMode = state.mode === 'light' ? 'dark' : 'light';
        localStorage.setItem('themeMode', newMode);
        return { mode: newMode };
    })
}));
