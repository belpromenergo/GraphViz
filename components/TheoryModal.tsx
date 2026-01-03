
import React from 'react';
import { X, BookOpen, History, Target } from 'lucide-react';
import { theoryData } from '../theoryData';
import { Language, translations } from '../i18n';

interface TheoryModalProps {
  topic: keyof typeof theoryData;
  lang: Language;
  onClose: () => void;
}

const TheoryModal: React.FC<TheoryModalProps> = ({ topic, lang, onClose }) => {
  const data = theoryData[topic][lang];
  const t = translations[lang];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-[#1e293b] border border-slate-700 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-slate-700 bg-slate-900/50">
          <h3 className="text-xl font-bold text-white flex items-center gap-3">
            <BookOpen size={24} className="text-blue-400" />
            {data.title}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors bg-slate-800 p-2 rounded-full">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-8 overflow-y-auto custom-scrollbar space-y-6">
          <section>
            <p className="text-slate-200 leading-relaxed text-base">
              {data.content}
            </p>
          </section>

          <section className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700">
            <h4 className="text-sm font-bold text-blue-400 flex items-center gap-2 mb-2 uppercase tracking-wide">
              <History size={16} /> {t.history}
            </h4>
            <p className="text-slate-400 text-sm leading-relaxed">
              {data.history}
            </p>
          </section>

          <section className="bg-blue-600/10 p-4 rounded-2xl border border-blue-500/20">
            <h4 className="text-sm font-bold text-blue-300 flex items-center gap-2 mb-2 uppercase tracking-wide">
              <Target size={16} /> {t.realLife}
            </h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              {data.example}
            </p>
          </section>
        </div>

        <div className="p-6 bg-slate-900/50 text-right border-t border-slate-700">
          <button 
            onClick={onClose}
            className="px-8 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg hover:shadow-blue-500/20"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TheoryModal;
