"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/user";
import { useModal } from "@/hooks/useModal";
import { useAuth } from '@/hooks/useAuth';

// Interfaces para tipado
interface LoginCredentials {
  username: string;
  password: string;
}

interface AuthenticatedUser {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  middle_name: string;
  role: string;
}

export const useLogin = (modalActions?: { showError: (title: string, message: string, onConfirm?: () => void) => void; showSuccess: (title: string, message: string, onConfirm?: () => void) => void }) => {
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const router = useRouter();
  const { setUser } = useUser();
  const { login } = useAuth();
  
  // Usar las funciones de modal pasadas como parámetro, o crear instancia local como fallback
  const fallbackModal = useModal();
  const showError = modalActions?.showError || fallbackModal.showError;
  const showSuccess = modalActions?.showSuccess || fallbackModal.showSuccess;

  const validateCredentials = (username: string, password: string): boolean => {
    if (!username.trim() || !password.trim()) {
      showError(
        "¡Ups! Faltan datos",
        "Por favor completa tanto tu usuario como tu contraseña para poder ingresar."
      );
      return false;
    }
    return true;
  };

  const handleNetworkError = (error: unknown): void => {
    console.error("Error en la llamada a la API:", error);

    if (error instanceof TypeError && error.message.includes("fetch")) {
      showError(
        "Sin conexión",
        "No podemos conectarnos al servidor en este momento. Por favor verifica tu conexión a internet e intenta nuevamente."
      );
    } else {
      showError(
        "Error inesperado",
        "Ha ocurrido un problema técnico. Si el problema persiste, por favor contacta al administrador del sistema."
      );
    }
  };

  const handleSuccessfulLogin = (userData: AuthenticatedUser): void => {
    if (userData) {
      // Guardar datos en localStorage
      localStorage.setItem("user", JSON.stringify(userData));
      
      // Actualizar estado global
      setUser(userData);

      // Dar tiempo para que el estado se propague antes de mostrar el modal
      setTimeout(() => {
        showSuccess(
          "¡Bienvenido de vuelta!",
          `Hola ${userData.first_name}, nos alegra verte de nuevo.`,
          () => {
            router.push("/pages/main");
          }
        );
      }, 100);
    }
  };

  const performLogin = async (credentials: LoginCredentials): Promise<void> => {
    try {
      await login(credentials.username, credentials.password);

      // after login, current user is stored in localStorage by AuthProvider; read it
      const stored = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      if (stored) {
        try {
          handleSuccessfulLogin(JSON.parse(stored));
          return;
        } catch {}
      }

      // fallback: show success without user
      showSuccess('Inicio exitoso', 'Has iniciado sesión correctamente', () => router.push('/pages/main'));
    } catch (error: unknown) {
      if (error instanceof Error && error.message) {
        showError('Error de autenticación', error.message);
      } else {
        handleNetworkError(error);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validar credenciales
      if (!validateCredentials(username, password)) {
        setIsLoading(false);
        return;
      }

      // Preparar credenciales
      const credentials: LoginCredentials = {
        username: username.trim(),
        password: password.trim(),
      };

      // Realizar login
      await performLogin(credentials);

    } catch (error) {
      handleNetworkError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = (): void => {
    setShowPassword(!showPassword);
  };

  const resetForm = (): void => {
    setUsername("");
    setPassword("");
    setShowPassword(false);
  };

  return {
    // Estados
    username,
    password,
    showPassword,
    isLoading,
    
    // Funciones de estado
    setUsername,
    setPassword,
    togglePasswordVisibility,
    resetForm,
    
    // Función principal
    handleSubmit,
  };
};
