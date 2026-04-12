"use client";

import React, { useState } from 'react';
import { AuthService } from '../services/authService';
import { XMarkIcon, EnvelopeIcon, KeyIcon, LockClosedIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = 'request' | 'confirm' | 'success';

export default function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
  const [step, setStep] = useState<Step>('request');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await AuthService.requestPasswordChange(email);
      if (result.success) {
        setStep('confirm');
        setSuccessMessage('Código enviado a tu correo electrónico');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al enviar código');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      setLoading(false);
      return;
    }

    try {
      const result = await AuthService.confirmPasswordChange(code, newPassword, confirmPassword);
      if (result.success) {
        setStep('success');
        setSuccessMessage('Contraseña cambiada exitosamente');
        setTimeout(() => {
          handleClose();
        }, 3000);
      } else {
        setError(result.message || 'Código inválido');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cambiar contraseña');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep('request');
    setEmail('');
    setCode('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setSuccessMessage('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-[#D4C89A]/50 dark:border-zinc-800 overflow-hidden">
        
        {/* Header */}
        <div className="bg-[#3B4D36] dark:bg-green-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <LockClosedIcon className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-bold text-[#D4BD80] dark:text-white">
              Recuperar Contraseña
            </h3>
          </div>
          <button 
            onClick={handleClose}
            className="text-white/70 hover:text-white hover:bg-white/10 transition-all rounded-lg p-1"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'request' && (
            <form onSubmit={handleRequestCode} className="space-y-5">
              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-[#FCF1D5] dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-3">
                  <EnvelopeIcon className="w-7 h-7 text-[#3B4D36] dark:text-zinc-400" />
                </div>
                <p className="text-sm text-[#8B7D5E] dark:text-zinc-400">
                  Ingresa tu correo electrónico y te enviaremos un código de verificación
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#4A5D3A] dark:text-zinc-300 mb-1.5">
                  Correo electrónico
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                    <EnvelopeIcon className="w-4 h-4 text-[#8B7D5E] dark:text-zinc-500" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white dark:bg-zinc-800 border border-[#D4C89A] dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6F7153] dark:focus:ring-green-500 focus:border-transparent text-zinc-800 dark:text-zinc-100 text-sm placeholder-[#B8A989] dark:placeholder-zinc-500 transition-all"
                    placeholder="tu@email.com"
                    required
                  />
                </div>
              </div>
              
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}
              
              {successMessage && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg px-4 py-3">
                  <p className="text-sm text-green-600 dark:text-green-400">{successMessage}</p>
                </div>
              )}
              
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#3B4D36] hover:bg-[#2D3A28] dark:bg-green-600 dark:hover:bg-green-500 disabled:bg-zinc-400 text-[#D4BD80] dark:text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Enviando...
                  </>
                ) : (
                  'Enviar Código'
                )}
              </button>
            </form>
          )}

          {step === 'confirm' && (
            <form onSubmit={handleConfirmChange} className="space-y-5">
              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-[#FCF1D5] dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-3">
                  <KeyIcon className="w-7 h-7 text-[#3B4D36] dark:text-zinc-400" />
                </div>
                <p className="text-sm text-[#8B7D5E] dark:text-zinc-400">
                  Ingresa el código de verificación y tu nueva contraseña
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#4A5D3A] dark:text-zinc-300 mb-1.5">
                  Código de verificación
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full px-4 py-3 bg-white dark:bg-zinc-800 border border-[#D4C89A] dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6F7153] dark:focus:ring-green-500 focus:border-transparent text-zinc-800 dark:text-zinc-100 text-sm text-center tracking-widest font-mono placeholder-[#B8A989] dark:placeholder-zinc-500 transition-all"
                  placeholder="123456"
                  maxLength={6}
                  required
                />
                <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">Código de 6 dígitos enviado a tu correo</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#4A5D3A] dark:text-zinc-300 mb-1.5">
                  Nueva contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-12 bg-white dark:bg-zinc-800 border border-[#D4C89A] dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6F7153] dark:focus:ring-green-500 focus:border-transparent text-zinc-800 dark:text-zinc-100 text-sm placeholder-[#B8A989] dark:placeholder-zinc-500 transition-all"
                    placeholder="Mínimo 6 caracteres"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-[#8B7D5E] dark:text-zinc-400 hover:text-[#4A5D3A] dark:hover:text-zinc-300 transition-colors"
                  >
                    {showPassword ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#4A5D3A] dark:text-zinc-300 mb-1.5">
                  Confirmar contraseña
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-12 bg-white dark:bg-zinc-800 border border-[#D4C89A] dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6F7153] dark:focus:ring-green-500 focus:border-transparent text-zinc-800 dark:text-zinc-100 text-sm placeholder-[#B8A989] dark:placeholder-zinc-500 transition-all"
                    placeholder="Repite tu contraseña"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-[#8B7D5E] dark:text-zinc-400 hover:text-[#4A5D3A] dark:hover:text-zinc-300 transition-colors"
                  >
                    {showConfirmPassword ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}
              
              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="w-full py-3 bg-[#3B4D36] hover:bg-[#2D3A28] dark:bg-green-600 dark:hover:bg-green-500 disabled:bg-zinc-400 text-[#D4BD80] dark:text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Cambiando...
                  </>
                ) : (
                  'Cambiar Contraseña'
                )}
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setStep('request');
                  setError('');
                  setSuccessMessage('');
                }}
                className="w-full py-2 text-sm text-[#3B4D36] dark:text-zinc-400 hover:text-[#2D3A28] dark:hover:text-zinc-300 transition-colors"
              >
                ← Solicitar nuevo código
              </button>
            </form>
          )}

          {step === 'success' && (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircleIcon className="w-10 h-10 text-green-600 dark:text-green-400" />
              </div>
              <h4 className="text-lg font-semibold text-[#3B4D36] dark:text-zinc-100 mb-2">
                ¡Contraseña actualizada!
              </h4>
              <p className="text-sm text-[#8B7D5E] dark:text-zinc-400">
                Tu contraseña ha sido cambiada exitosamente
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}