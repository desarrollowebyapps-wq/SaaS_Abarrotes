export interface Usuario {
  id: string;
  nombre: string;
  apellido?: string;
  email: string;
  rol: "admin" | "vendedor" | "encargado";
}

export interface Tienda {
  id: string;
  nombre: string;
}

export interface AuthResponse {
  token: string;
  usuario: Usuario;
  tienda: Tienda;
}

export interface ApiError {
  error: string;
}
