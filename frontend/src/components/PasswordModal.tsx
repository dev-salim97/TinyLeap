import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Key, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api';

interface PasswordModalProps {
  mode: 'verify' | 'set' | 'change';
  onSuccess: () => void;
  onCancel?: () => void;
}

const PasswordModal: React.FC<PasswordModalProps> = ({ mode, onSuccess, onCancel }) => {
  const { t } = useTranslation();
  const [password, setPassword] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'verify') {
        const res = await api.verifyPassword(password);
        if (res.success) {
          setIsSuccess(true);
          setTimeout(() => {
            onSuccess();
          }, 800);
        } else {
          setError(t('auth.wrongPassword'));
        }
      } else if (mode === 'set') {
        if (password !== confirmPassword) {
          setError(t('auth.passwordMismatch'));
          setLoading(false);
          return;
        }
        const res = await api.setPassword(password);
        if (res.success) {
          setIsSuccess(true);
          setTimeout(() => {
            onSuccess();
          }, 800);
        }
      } else if (mode === 'change') {
        if (password !== confirmPassword) {
          setError(t('auth.passwordMismatch'));
          setLoading(false);
          return;
        }
        const res = await api.setPassword(password, oldPassword);
        if (res.success) {
          setIsSuccess(true);
          setTimeout(() => {
            onSuccess();
          }, 800);
        } else {
          setError(t('auth.wrongPassword'));
        }
      }
    } catch (err) {
      setError('System error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
              {isSuccess ? (
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              ) : (
                <Lock className="w-8 h-8 text-blue-500" />
              )}
            </div>
            <h2 className="text-2xl font-bold text-slate-800">
              {mode === 'verify' ? t('auth.title') : mode === 'set' ? t('auth.setTitle') : t('auth.changeTitle')}
            </h2>
            {mode === 'set' && (
              <p className="text-slate-500 text-center mt-2 text-sm">
                {t('auth.firstTimeDesc')}
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'change' && (
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder={t('auth.oldPasswordPlaceholder')}
                  className="w-full pl-10 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  required
                />
              </div>
            )}

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'verify' ? t('auth.passwordPlaceholder') : t('auth.newPasswordPlaceholder')}
                className="w-full pl-10 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                required
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {(mode === 'set' || mode === 'change') && (
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t('auth.confirmPasswordPlaceholder')}
                  className="w-full pl-10 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  required
                />
              </div>
            )}

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2 text-red-500 text-sm bg-red-50 p-3 rounded-lg"
                >
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex gap-3 pt-4">
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="flex-1 py-3 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-colors"
                >
                  {t('common.cancel')}
                </button>
              )}
              <button
                type="submit"
                disabled={loading || isSuccess}
                className={`flex-[2] py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : isSuccess ? (
                  t('auth.setupSuccess')
                ) : (
                  mode === 'verify' ? t('auth.verifyButton') : mode === 'set' ? t('auth.setButton') : t('auth.changeButton')
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default PasswordModal;
