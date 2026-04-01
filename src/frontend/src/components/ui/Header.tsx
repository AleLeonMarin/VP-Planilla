"use client";
import { getCurrentSpanishFormattedDateString } from "@/utils/time";
import { useWeather } from "@/utils/weather";
import { useState, useEffect } from "react";
import { useUser } from "@/hooks/user";
import { useTheme } from "@/hooks/useTheme";
import { SunIcon, MoonIcon, Bars3Icon, BellIcon } from "@heroicons/react/24/outline";

interface HeaderProps {
  onMenuClick?: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const currentDate = getCurrentSpanishFormattedDateString();
  const { weather: currentWeather, isLoadingWeather } = useWeather();
  const { user: currentUser } = useUser();
  const { theme, toggleTheme, mounted } = useTheme();
  const [showNotifications, setShowNotifications] = useState(false);

  const notifications = [
    {
      id: 1,
      title: "Quincena de Pago",
      message: "La quincena de pago se procesará mañana",
      time: "Hace 2 horas",
      type: "payment",
      unread: true
    },
    {
      id: 2,
      title: "Registro de Asistencia",
      message: "3 empleados no han marcado salida",
      time: "Hace 4 horas",
      type: "attendance",
      unread: true
    },
    {
      id: 3,
      title: "Reporte Mensual",
      message: "El reporte de junio está listo para revisión",
      time: "Hace 1 día",
      type: "report",
      unread: false
    },
    {
      id: 4,
      title: "Nuevo Empleado",
      message: "Se ha registrado un nuevo empleado en el sistema",
      time: "Hace 2 días",
      type: "employee",
      unread: false
    }
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showNotifications && !target.closest('.notification-container')) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

  const getFullName = () => {
    if (!currentUser) return "Usuario";

    const { first_name, last_name, middle_name  } = currentUser;
    
    const nameParts = [
      first_name?.trim(),
      last_name?.trim(),
      middle_name?.trim() 
    ].filter(Boolean);
    
    return nameParts.length > 0 ? nameParts.join(" ") : "Usuario";
  };

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <header className="bg-[#FCF1D5] dark:bg-zinc-900 border-b border-[#D4C89A] dark:border-zinc-800 px-4 md:px-6 py-3 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 rounded-lg hover:bg-[#F0E6D2] dark:hover:bg-zinc-800 text-[#4A5D3A] dark:text-zinc-400"
          aria-label="Open menu"
        >
          <Bars3Icon className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-base font-medium text-[#4A5D3A] dark:text-zinc-100 leading-tight">
            Bienvenido de vuelta, {getFullName()}
          </h1>
          <p className="text-sm text-[#D9C38B] dark:text-zinc-400 mt-0.5">
            {currentDate} |{" "}
            {isLoadingWeather
              ? "Cargando clima..."
              : `Día de ${currentWeather?.description} en ${currentWeather?.city}`}
          </p>
        </div>
      </div>
      <div className="relative flex items-center space-x-3 notification-container">
        {mounted && (
          <button
            onClick={toggleTheme}
            className="w-8 h-8 rounded-full border border-[rgba(184,179,166,0.37)] dark:border-zinc-700 flex items-center justify-center text-[#4A5D3A] dark:text-zinc-400 hover:bg-[#F0E6D2] dark:hover:bg-zinc-800 transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? (
              <MoonIcon className="w-5 h-5" />
            ) : (
              <SunIcon className="w-5 h-5" />
            )}
          </button>
        )}
        
        <div 
          className="relative w-8 h-8 rounded-full border border-[rgba(184,179,166,0.37)] dark:border-zinc-700 flex items-center justify-center text-[#4A5D3A] dark:text-zinc-400 hover:bg-[#F0E6D2] dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          onClick={toggleNotifications}
        >
          <BellIcon className="w-5 h-5" />
          {unreadCount > 0 && (
            <div className="absolute flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-red-500 rounded-full -top-1 -right-1">
              {unreadCount}
            </div>
          )}
        </div>
      </div>

      {showNotifications && (
        <div className="fixed top-16 right-6 w-80 bg-white dark:bg-zinc-900 rounded-lg shadow-xl border border-[#E0D6B7] dark:border-zinc-800 z-50 animate-in slide-in-from-top-2 duration-200">
          <div className="px-4 py-3 border-b border-[#F0EDE5] dark:border-zinc-800 bg-[#FCF1D5] dark:bg-zinc-800 rounded-t-lg">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-[#4A5D3A] dark:text-zinc-100 text-sm">Notificaciones</h3>
              <span className="text-xs text-[#6B7556] dark:text-zinc-400">{unreadCount} sin leer</span>
            </div>
          </div>

          <div className="overflow-y-auto max-h-96">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`px-4 py-3 border-b border-[#F8F6F1] dark:border-zinc-800 hover:bg-[#FDFCF9] dark:hover:bg-zinc-800/50 transition-colors cursor-pointer ${
                  notification.unread ? 'bg-[#FFF9E6] dark:bg-zinc-800/30' : ''
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                    notification.unread ? 'bg-blue-500' : 'bg-gray-300 dark:bg-zinc-600'
                  }`}></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-[#4A5D3A] dark:text-zinc-100 truncate">
                        {notification.title}
                      </p>
                      <span className="text-xs text-[#8B8B8B] dark:text-zinc-500 flex-shrink-0 ml-2">
                        {notification.time}
                      </span>
                    </div>
                    <p className="text-xs text-[#6B7556] dark:text-zinc-400 mt-1 leading-relaxed">
                      {notification.message}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="px-4 py-3 bg-[#F8F6F1] dark:bg-zinc-800 rounded-b-lg">
            <button className="text-xs text-[#4A5D3A] dark:text-zinc-400 hover:text-[#2A3A1A] dark:hover:text-zinc-200 font-medium transition-colors">
              Ver todas las notificaciones
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
