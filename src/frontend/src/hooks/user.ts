// src/hooks/useUser.ts
import { useState, useEffect } from 'react';

/**
 * Custom Hook para gestionar el usuario en localStorage.
 * Proporciona el usuario actual (o null si está cargando/no disponible)
 * y una función para actualizarlo.
 */
export function useUser() {
  // Inicializamos el estado del usuario como null.
  // Esto significa que en el servidor y en el primer renderizado del cliente,
  // el usuario será null (o un valor que indique "cargando").
  const [user, setUserState] = useState<string | null>(null);
  const [isUserLoaded, setIsUserLoaded] = useState<boolean>(false); // Nuevo estado para saber si ya se cargó del localStorage

  useEffect(() => {
    // Este código se ejecuta solo en el lado del cliente, después de la hidratación.
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUserState(storedUser);
      } else {
        // Si no hay usuario en localStorage, establece "Usuario Anónimo"
        // Asegúrate de que esto también se refleje si quieres guardarlo por primera vez
        setUserState('Usuario Anónimo');
      }
      setIsUserLoaded(true); // Marcamos que el usuario ya se cargó
    }
  }, []); // El array vacío asegura que este efecto se ejecuta UNA SOLA VEZ al montar.

  // Efecto para sincronizar el estado del usuario con localStorage
  // Se ejecuta cada vez que 'user' cambia, PERO solo si ya se cargó inicialmente.
  useEffect(() => {
    if (isUserLoaded && typeof window !== 'undefined' && user !== null) {
      localStorage.setItem('user', user);
    }
  }, [user, isUserLoaded]); // Dependencias: user y isUserLoaded

  /**
   * Función para actualizar el usuario y guardarlo en localStorage.
   * @param newUser El nuevo nombre de usuario a guardar.
   */
  const setUser = (newUser: string) => {
    setUserState(newUser);
    // Asegurarse de que `isUserLoaded` sea true cuando se establece el usuario
    if (!isUserLoaded) {
      setIsUserLoaded(true);
    }
  };

  return { user, setUser, isUserLoaded };
}

// Funciones utilitarias para el localStorage
export const userStorage = {
  getUser: (): AuthenticatedUser | null => {
    if (typeof window === 'undefined') return null;
    
    try {
      const savedUser = localStorage.getItem('user');
      const token = localStorage.getItem('authToken');
      
      if (savedUser && token) {
        return JSON.parse(savedUser);
      }
    } catch (error) {
      console.error('Error parsing saved user:', error);
      localStorage.removeItem('user');
      localStorage.removeItem('authToken');
    }
    
    return null;
  },

  setUser: (user: AuthenticatedUser | null): void => {
    if (typeof window === 'undefined') return;
    
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
      console.log('Usuario guardado:', {
        fullName: `${user.first_name} ${user.middle_name} ${user.last_name}`.trim(),
        username: user.username,
        role: user.role
      });
    } else {
      localStorage.removeItem('user');
      localStorage.removeItem('authToken');
    }
  },

  getToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('authToken');
  },

  setToken: (token: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('authToken', token);
  },

  clearAuth: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
  }
};

// Función utilitaria para obtener el nombre completo
export const getFullName = (user: AuthenticatedUser | null): string => {
  if (!user) return "Usuario";

  const { first_name, middle_name, last_name } = user;
  
  const nameParts = [
    first_name?.trim(),
    middle_name?.trim(), 
    last_name?.trim()
  ].filter(Boolean);

  return nameParts.length > 0 ? nameParts.join(" ") : "Usuario";
};

// Define the AuthenticatedUser type if not already defined elsewhere
export type AuthenticatedUser = {
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  username?: string;
  role?: string;
  // Add other fields as needed
};

export type UserContextType = {
  user: AuthenticatedUser | null;
  setUser: (user: AuthenticatedUser | null) => void;
  isUserLoaded: boolean;
};

