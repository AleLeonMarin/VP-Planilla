/* eslint-disable @typescript-eslint/no-unused-expressions */
"use client";

import React from "react";
import {
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";

export type ModalType = "success" | "error" | "warning" | "info";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: ModalType;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  showCancel?: boolean;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  type,
  title,
  message,
  confirmText = "Aceptar",
  cancelText = "Cancelar",
  onConfirm,
  onCancel,
  showCancel = false,
}) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  const handleCancel = () => {
    onCancel ? onCancel() : onClose();
  };

  // Configuración de iconos y colores según el tipo
  const getModalConfig = () => {
    switch (type) {
      case "success":
        return {
          icon: <CheckCircleIcon className="w-12 h-12 text-green-600 dark:text-green-400" />,
          iconBg: "bg-green-100 dark:bg-green-900/30",
        };
      case "error":
        return {
          icon: <XCircleIcon className="w-12 h-12 text-red-600 dark:text-red-400" />,
          iconBg: "bg-red-100 dark:bg-red-900/30",
        };
      case "warning":
        return {
          icon: <ExclamationTriangleIcon className="w-12 h-12 text-yellow-600 dark:text-yellow-400" />,
          iconBg: "bg-yellow-100 dark:bg-yellow-900/30",
        };
      case "info":
      default:
        return {
          icon: <InformationCircleIcon className="w-12 h-12 text-blue-600 dark:text-blue-400" />,
          iconBg: "bg-blue-100 dark:bg-blue-900/30",
        };
    }
  };

  const config = getModalConfig();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      {/* Backdrop con color del sistema y blur */}
      <div className="absolute inset-0 bg-[#3B4D36]/20 dark:bg-black/60 backdrop-blur-sm" />

      {/* Modal Container */}
      <div className="relative bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-2xl max-w-lg w-full p-8">
        {/* Header con botón de cerrar */}
        <div className="flex justify-end mb-2">
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors"
            aria-label="Cerrar"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Icono centrado */}
        <div className={`flex justify-center mb-6 p-4 rounded-full ${config.iconBg}`}>
          {config.icon}
        </div>

        {/* Título centrado */}
        <h2 className="text-2xl font-semibold text-zinc-800 dark:text-zinc-100 text-center mb-4">
          {title}
        </h2>

        {/* Message */}
        <div className="mb-8">
          <p className="text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed text-center">
            {message}
          </p>
        </div>

        {/* Buttons */}
        <div className="flex justify-center gap-3">
          {showCancel && (
            <button
              onClick={handleCancel}
              className="px-8 py-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg transition-colors duration-200 font-medium border border-zinc-200 dark:border-zinc-700"
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={handleConfirm}
            className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white dark:bg-green-600 dark:hover:bg-green-700 rounded-lg transition-colors duration-200 font-medium"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
