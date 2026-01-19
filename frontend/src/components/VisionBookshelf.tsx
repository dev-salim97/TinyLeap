import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, BookOpen, Clock, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api';
import { COLOR_KEYS, MORANDI_COLORS } from '../constants';

interface Vision {
  _id: string;
  vision: string;
  updatedAt: string;
}

interface VisionBookshelfProps {
  onSelectVision: (id: string) => void;
  onChangePassword: () => void;
}

const VisionBookshelf: React.FC<VisionBookshelfProps> = ({ onSelectVision, onChangePassword }) => {
  const { t } = useTranslation();
  const [visions, setVisions] = useState<Vision[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newVisionText, setNewVisionText] = useState('');

  useEffect(() => {
    loadVisions();
  }, []);

  const loadVisions = async () => {
    try {
      const data = await api.getAllVisions();
      setVisions(data);
    } catch (error) {
      console.error('Failed to load visions', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newVisionText.trim()) return;

    try {
      const newWorkshop = await api.createWorkshop(newVisionText);
      onSelectVision(newWorkshop._id);
    } catch (error) {
      console.error('Failed to create vision', error);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm(t('sidebar.clearConfirm') || 'Are you sure you want to delete this vision?')) return;

    try {
      await api.deleteWorkshop(id);
      setVisions(prev => prev.filter(v => v._id !== id));
    } catch (error) {
      console.error('Failed to delete vision', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] px-6 py-12 md:px-12 lg:px-24">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12 flex items-baseline justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-2">
              {t('bookshelf.title') || '我的愿望清单'}
            </h1>
            <p className="text-slate-500">
              {t('bookshelf.subtitle') || '每一个微小的跨越，都始于一个清晰的愿望'}
            </p>
          </div>
          <div className="flex items-center gap-6">
            <button
              onClick={onChangePassword}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all flex items-center gap-2 text-sm font-medium"
              title={t('auth.changeTitle')}
            >
              <Settings className="w-5 h-5" />
              <span className="hidden md:inline">{t('auth.changeTitle')}</span>
            </button>
            <div className="text-slate-400 text-sm">
              {visions.length} {t('bookshelf.count') || '个愿望'}
            </div>
          </div>
        </header>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
          {/* Add New Vision Card */}
          <motion.div
            whileHover={{ y: -5 }}
            className="aspect-[3/4] relative group"
          >
            <button
              onClick={() => setIsAdding(true)}
              className="w-full h-full border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-4 bg-white hover:border-blue-400 hover:bg-blue-50/30 transition-all group-hover:shadow-md"
            >
              <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                <Plus className="w-6 h-6 text-slate-400 group-hover:text-blue-500" />
              </div>
              <span className="text-slate-400 group-hover:text-blue-500 font-medium">
                {t('bookshelf.addNew') || '开启新愿望'}
              </span>
            </button>
          </motion.div>

          {/* Vision Cards */}
          <AnimatePresence>
            {visions.map((v, index) => (
              <motion.div
                key={v._id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                whileHover={{ y: -8 }}
                onClick={() => onSelectVision(v._id)}
                className="aspect-[3/4] relative cursor-pointer group"
              >
                <div className={`w-full h-full rounded-xl shadow-sm border border-slate-100 flex flex-col overflow-hidden bg-white group-hover:shadow-xl transition-all`}>
                  {/* "Book Cover" Top Part */}
                  <div 
                    className="h-2/3 p-6 flex flex-col justify-between relative overflow-hidden"
                    style={{ backgroundColor: MORANDI_COLORS[COLOR_KEYS[index % COLOR_KEYS.length]] + '80' }}
                  >
                    <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => handleDelete(e, v._id)}
                        className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="z-10">
                      <BookOpen className="w-5 h-5 text-slate-400 mb-4" />
                      <h3 className="text-lg font-bold text-slate-800 line-clamp-3 leading-tight">
                        {v.vision || t('common.untitled')}
                      </h3>
                    </div>

                    <div className="z-10 flex items-center gap-2 text-xs text-slate-400">
                      <Clock className="w-3 h-3" />
                      {formatDate(v.updatedAt)}
                    </div>

                    {/* Decorative element */}
                    <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/20 rounded-full blur-2xl" />
                  </div>

                  {/* Bottom Part */}
                  <div className="h-1/3 p-4 flex items-center justify-center bg-white">
                    <span className="text-sm font-medium text-slate-600 group-hover:text-blue-600 transition-colors">
                      {t('bookshelf.enter')}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Create Dialog */}
        <AnimatePresence>
          {isAdding && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsAdding(false)}
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-8"
              >
                <h2 className="text-2xl font-bold text-slate-800 mb-6">
                  {t('bookshelf.addTitle')}
                </h2>
                <form onSubmit={handleCreate}>
                  <textarea
                    autoFocus
                    value={newVisionText}
                    onChange={(e) => setNewVisionText(e.target.value)}
                    placeholder={t('sidebar.visionPlaceholder')}
                    className="w-full h-32 p-4 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all resize-none mb-6"
                  />
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setIsAdding(false)}
                      className="flex-1 px-6 py-3 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors"
                    >
                      {t('common.cancel')}
                    </button>
                    <button
                      type="submit"
                      disabled={!newVisionText.trim()}
                      className="flex-1 px-6 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-200"
                    >
                      {t('common.confirm')}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {isLoading && (
          <div className="flex justify-center py-24">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
          </div>
        )}
      </div>
    </div>
  );
};

export default VisionBookshelf;
