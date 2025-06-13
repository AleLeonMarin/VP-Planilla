"use client";
import Image from "next/image";
import { getCurrentSpanishFormattedDateString } from "@/utils/time";
import { useWeather } from "@/utils/weather";
import { useState, useEffect } from "react";

interface AuthenticatedUser {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  middle_name: string;
  role: string;
}

export default function Header() {
  const currentDate = getCurrentSpanishFormattedDateString();
  const { weather: currentWeather, isLoadingWeather } = useWeather();
  const [currentUser, setCurrentUser] = useState<AuthenticatedUser | null>(null);

  useEffect(() => {
    // Obtener usuario del localStorage
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setCurrentUser(parsedUser);
      } catch (error) {
        console.error('Error parsing user from localStorage:', error);
      }
    }
  }, []);

  // Función para obtener el nombre completo del usuario
  const getFullName = () => {
    if (!currentUser) return "Usuario";

    const { first_name, middle_name, last_name } = currentUser;
    
    // Construir nombre completo, manejando valores nulos o vacíos
    const nameParts = [
      first_name?.trim(),
      middle_name?.trim(), 
      last_name?.trim()
    ].filter(Boolean); // Filtra valores falsy (null, undefined, "")

    return nameParts.length > 0 ? nameParts.join(" ") : "Usuario";
  };

  return (
    <header className="bg-[#FCF1D5] p-4 flex items-center justify-between shadow-sm border-b border-[#FCF1D5]">
      <div>
        <h1 className="text-24px text-[#3B4D36]">
          Bienvenido de vuelta, {getFullName()}
        </h1>
        <p className="text-20px text-[#D9C28B]">
          {currentDate} |{" "}
          {isLoadingWeather
            ? "Cargando clima..."
            : `Día de ${currentWeather?.description} en ${currentWeather?.city}`}
        </p>
      </div>
      <div className="flex items-center space-x-4">
        {/* Notification Bell Icon */}
        <div className="relative w-10 h-10 rounded-full border border-[rgba(184,179,166,0.37)] flex items-center justify-center text-[#4A5D3A] text-xl cursor-pointer">
          <Image
            src={"/images/layout/notification.png"}
            alt="Notification Bell"
            width={42}
            height={42}
          />
        </div>
      </div>
    </header>
  );
}
