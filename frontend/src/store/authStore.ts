import { create } from "zustand";
import type { Usuario, Tienda } from "../types";

interface AuthState {
  token: string | null;
  usuario: Usuario | null;
  tienda: Tienda | null;
  isAuthenticated: boolean;
  setAuth: (token: string, usuario: Usuario, tienda: Tienda) => void;
  setUsuario: (usuario: Usuario, tienda: Tienda) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem("token"),
  usuario: null,
  tienda: null,
  isAuthenticated: !!localStorage.getItem("token"),

  setAuth: (token, usuario, tienda) => {
    localStorage.setItem("token", token);
    set({ token, usuario, tienda, isAuthenticated: true });
  },

  setUsuario: (usuario, tienda) => {
    set({ usuario, tienda });
  },

  logout: () => {
    localStorage.removeItem("token");
    set({ token: null, usuario: null, tienda: null, isAuthenticated: false });
  },
}));
