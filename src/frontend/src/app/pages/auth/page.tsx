"use client";

import { useState } from "react";
import Image from "next/image";
import {
  EyeIcon,
  EyeSlashIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/user";
import { useModal } from "@/hooks/useModal";

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

interface LoginResponse {
  success: boolean;
  user?: AuthenticatedUser;
  token?: string;
  message?: string;
  type?: string;
}

const LoginScreen = () => {
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const router = useRouter();
  const { setUser } = useUser();
  const { showError, showSuccess, ModalComponent } = useModal();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Validaciones básicas
    if (!username.trim() || !password.trim()) {
      showError(
        "¡Ups! Faltan datos",
        "Por favor completa tanto tu usuario como tu contraseña para poder ingresar."
      );
      setIsLoading(false);
      return;
    }

    try {
      const credentials: LoginCredentials = {
        username: username.trim(),
        password: password.trim(),
      };

      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) {
        showError(
          "Error de configuración",
          "Hay un problema con la configuración del sistema. Por favor contacta al administrador."
        );
        setIsLoading(false);
        return;
      }

      const loginUrl = `${apiUrl}/login`;

      const response = await fetch(loginUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });

      const data: LoginResponse = await response.json();

      console.log("Respuesta completa de la API:", data);

      if (data.success && data.user && data.token) {
        // Login exitoso
        localStorage.setItem("authToken", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        setUser(JSON.stringify(data.user));

        showSuccess(
          "¡Bienvenido de vuelta!",
          `Hola ${data.user.first_name}, nos alegra verte de nuevo.`,
          () => router.push("/pages/main")
        );
      } else {
        // Manejar diferentes tipos de errores
        let errorTitle = "No pudimos conectarte";
        let errorMessage = "Verifica tus datos e intenta nuevamente.";

        if (data.type === "user_not_found") {
          errorTitle = "Usuario no encontrado";
          errorMessage =
            "El usuario que ingresaste no existe en nuestro sistema. ¿Estás seguro de que escribiste bien tu nombre de usuario?";
        } else if (data.type === "invalid_password") {
          errorTitle = "Contraseña incorrecta";
          errorMessage =
            "La contraseña que ingresaste no es correcta. Por favor verifica e intenta nuevamente.";
        } else if (data.type === "invalid_credentials") {
          errorTitle = "Datos incorrectos";
          errorMessage =
            "El usuario o la contraseña que ingresaste no son correctos. Por favor revisa tus datos.";
        } else if (data.type === "validation_error") {
          errorTitle = "Datos incompletos";
          errorMessage =
            data.message ||
            "Por favor completa todos los campos requeridos.";
        } else if (response.status === 401) {
          errorTitle = "Acceso denegado";
          errorMessage =
            "Los datos que ingresaste no coinciden con nuestros registros. ¿Necesitas ayuda para recuperar tu acceso?";
        } else if (response.status >= 500) {
          errorTitle = "Problema del servidor";
          errorMessage =
            "Tenemos un problema técnico en este momento. Por favor intenta nuevamente en unos minutos.";
        } else {
          errorMessage =
            data.message ||
            "Ha ocurrido un problema inesperado. Por favor intenta nuevamente.";
        }

        showError(errorTitle, errorMessage);
      }
    } catch (error) {
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
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="flex min-h-screen font-inter">
        {/* Left Panel */}
        <div className="flex-none w-[40%] bg-[#FCF1D5] flex flex-col p-10 shadow-lg relative z-10 rounded-l-lg">
          {/* Top-left aligned Logo and Title Section */}
          <div className="flex items-center self-start mb-auto">
            <Image
              src="/images/Logo.png"
              alt="Verde Pradera Cafetería Logo"
              width={100}
              height={100}
              className="mr-4 rounded-full"
            />
            <div className="flex flex-col">
              <h1 className="text-4xl font-semibold text-[#3B4D36] tracking-tight leading-none whitespace-nowrap">
                VERDE PRADERA
              </h1>
              <p className="text-xl text-[#D4BD80] mt-1 whitespace-nowrap">
                Control de planilla
              </p>
            </div>
          </div>

          <div className="flex-grow"></div>

          {/* Form Section */}
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-sm mx-auto mt-auto"
          >
            <div className="mb-6">
              <label
                htmlFor="username-input"
                className="block text-xl font-medium text-gray-700 mb-2"
              >
                Usuario
              </label>
              <input
                type="text"
                id="username-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-4 border bg-white border-gray-300 rounded-md focus:ring-green-600 focus:border-green-600 text-lg"
                aria-label="Username"
                required
                disabled={isLoading}
              />
            </div>

            <div className="mb-8">
              <label
                htmlFor="password-input"
                className="block text-xl font-medium text-gray-700 mb-2"
              >
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-4 bg-white border rounded-md border-gray-300 focus:ring-green-600 focus:border-green-600 text-lg pr-12"
                  aria-label="Password"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-600"
                  aria-label={
                    showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                  }
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-6 w-6" />
                  ) : (
                    <EyeIcon className="h-6 w-6" />
                  )}
                </button>
              </div>
            </div>

            {/* Login button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-4 rounded-md text-xl flex items-center justify-center gap-3 transition-colors duration-200 ${
                isLoading
                  ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                  : "bg-[#3B4D36] text-[#D4BD80] hover:bg-green-800 focus:ring-4 focus:ring-green-500 focus:ring-opacity-50"
              }`}
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Iniciando sesión...
                </>
              ) : (
                <>
                  Ingresar
                  <ArrowRightIcon className="h-6 w-6" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Panel */}
        <div className="flex-1 bg-[#344838] relative overflow-hidden">
          <Image
            src="/images/LogInBackground.png"
            alt="Decorative Background Pattern"
            fill
            style={{ objectFit: "cover" }}
            className="mix-blend-multiply opacity-50"
          />
        </div>
      </div>

      {/* Modal Component */}
      <ModalComponent />
    </>
  );
};

export default LoginScreen;
