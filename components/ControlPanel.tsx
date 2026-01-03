
import React, { useState, useEffect, useRef } from 'react';
import { FunctionDef, Parameter } from '../types';
import { getMathInsights, getDiscoveryInfo } from '../services/gemini';
import { getDerivativeExpression } from '../utils/mathUtils';
import { Trash2, Plus, Eye, EyeOff, Sparkles, ChevronDown, ChevronUp, Book, Settings, FunctionSquare, Languages, Info, MoveHorizontal, BookOpen, HelpCircle, X, Calculator } from 'lucide-react';
import { Language, translations } from '../i18n';
import TheoryModal from './TheoryModal';
import { theoryData } from '../theoryData';

// @ts-ignore: katex loaded from CDN
const katex = window.katex;

const CONTRAST_COLORS = [
  '#3b82f6', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#f97316', '#a855f7', '#14b8a6'
];

const MathFormula: React.FC<{ tex: string; className?: string; displayMode?: boolean }> = ({ tex, className, displayMode = false }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (containerRef.current) {
      try {
        katex.render(tex, containerRef.current, { 
          throwOnError: false, 
          displayMode,
          trust: true,
          strict: false
        });
      } catch (e) {
        containerRef.current.textContent = tex;
      }
    }
  }, [tex, displayMode]);
  return <div ref={containerRef} className={`${className} font-serif`} />;
};

interface ControlPanelProps {
  functions: FunctionDef[];
  onUpdate: (functions: FunctionDef[]) => void;
  lang: Language;
  onSetLang: (l: Language) => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ functions, onUpdate, lang, onSetLang }) => {
  const t = translations[lang];
  const [expandedId, setExpandedId] = useState<string | null>(functions[0]?.id || null);
  const [activeTab, setActiveTab] = useState<Record<string, 'params' | 'research'>>({});
  const [aiInsights, setAiInsights] = useState<Record<string, string>>({});
  const [loadingAi, setLoadingAi] = useState<Record<string, boolean>>({});
  const [discoveryData, setDiscoveryData] = useState<Record<string, { history: string, example: string }>>({});
  const [loadingDiscovery, setLoadingDiscovery] = useState<Record<string, boolean>>({});
  const [theoryTopic, setTheoryTopic] = useState<keyof typeof theoryData | null>(null);
  const [showDiscoveryModal, setShowDiscoveryModal] = useState<string | null>(null);

  const templates = [
    { name: t.templates.linear, expr: 'k * x + b', params: [{name:'k', v:1}, {name:'b', v:0}] },
    { name: t.templates.quadratic, expr: 'a*x^2 + b*x + c', params: [{name:'a', v:1}, {name:'b', v:0}, {name:'c', v:0}] },
    { name: t.templates.sine, expr: 'a * sin(k * x)', params: [{name:'a', v:1}, {name:'k', v:1}] },
    { name: t.templates.cos, expr: 'a * cos(k * x)', params: [{name:'a', v:1}, {name:'k', v:1}] },
    { name: t.templates.tg, expr: 'a * tg(k * x)', params: [{name:'a', v:1}, {name:'k', v:1}] },
    { name: t.templates.ctg, expr: 'a * ctg(k * x)', params: [{name:'a', v:1}, {name:'k', v:1}] },
    { name: t.templates.power, expr: 'x^n', params: [{name:'n', v:3}] },
    { name: t.templates.root, expr: 'nthRoot(x, n)', params: [{name:'n', v:2}] },
    { name: t.templates.abs, expr: 'abs(x)', params: [] },
    { name: t.templates.log, expr: 'a * lg(x)', params: [{name:'a', v:1}] },
    { name: t.templates.exponential, expr: 'e^(k * x)', params: [{name:'k', v:1}] }
  ];

  const getUndefinedVars = (fn: FunctionDef) => {
    const standardSymbols = [
      'x', 'y', 'sin', 'cos', 'tan', 'tg', 'ctg', 'atan', 'arctg', 'arcctg', 
      'sh', 'ch', 'th', 'lg', 'ln', 'exp', 'abs', 'sqrt', 'nthRoot', 'pi', 'e', 
      'log10', 'log', 'sinh', 'cosh', 'tanh', 'coth', 'cth'
    ];
    const matches = fn.expression.match(/[a-zA-Z_][a-zA-Z0-9_]*/g) || [];
    const paramNames = fn.parameters.map(p => p.name);
    return [...new Set(matches)].filter(m => !standardSymbols.includes(m) && !paramNames.includes(m));
  };

  const formatToTeX = (expr: string, isDerivative: boolean = false) => {
    if (!expr || expr === 'Error') return isDerivative ? '?' : 'f(x) = ?';
    
    let res = expr
      .replace(/\*/g, ' \\cdot ')
      .replace(/\^/g, '^')
      .replace(/nthRoot\((.*?),\s*(.*?)\)/g, '\\sqrt[$2]{$1}')
      .replace(/sqrt\((.*?)\)/g, '\\sqrt{$1}')
      .replace(/\^\s*\((.*?)\)/g, '^{$1}')
      .replace(/sin/g, '\\sin')
      .replace(/cos/g, '\\cos')
      .replace(/tg/g, '\\operatorname{tg}')
      .replace(/ctg/g, '\\operatorname{ctg}')
      .replace(/arctg/g, '\\operatorname{arctg}')
      .replace(/arcctg/g, '\\operatorname{arcctg}')
      .replace(/sh/g, '\\operatorname{sh}')
      .replace(/ch/g, '\\operatorname{ch}')
      .replace(/th/g, '\\operatorname{th}')
      .replace(/lg/g, '\\lg')
      .replace(/ln/g, '\\ln')
      .replace(/exp\((.*?)\)/g, 'e^{$1}')
      .replace(/abs\((.*?)\)/g, '|$1|')
      .replace(/pi/g, '\\pi');
    
    return isDerivative ? res : `f(x) = ${res}`;
  };

  const updateFn = (id: string, updates: Partial<FunctionDef>) => {
    onUpdate(functions.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const handleParamChange = (fnId: string, paramName: string, value: number) => {
    onUpdate(functions.map(f => f.id === fnId ? {
      ...f, parameters: f.parameters.map(p => p.name === paramName ? { ...p, value } : p)
    } : f));
  };

  const addFromTemplate = (tmpl: any) => {
    const newFn: FunctionDef = {
      id: Math.random().toString(36).substr(2, 9),
      expression: tmpl.expr,
      color: CONTRAST_COLORS[functions.length % CONTRAST_COLORS.length],
      visible: true,
      parameters: tmpl.params.map((p: any) => ({ name: p.name, value: p.v, min: -10, max: 10, step: 0.1 })),
      integralRange: [-2, 2],
      limitX: 0,
      tangentX: 0,
      showTangent: false
    };
    onUpdate([...functions, newFn]);
    setExpandedId(newFn.id);
  };

  return (
    <div className="w-96 bg-[#1e293b] h-full flex flex-col border-r border-slate-700 shadow-xl z-10 font-sans">
      <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-900/50">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Calculator className="text-blue-400" /> {t.title}
        </h2>
        <button 
            onClick={() => onSetLang(lang === 'en' ? 'ru' : 'en')}
            className="p-2 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest border border-slate-700"
        >
            <Languages size={14} /> {lang}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
        <div className="bg-slate-800/40 p-4 rounded-xl border border-dashed border-slate-600">
           <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-3">{t.library}</span>
           <div className="grid grid-cols-2 gap-2">
             {templates.map(tmpl => (
                <button 
                  key={tmpl.name} 
                  onClick={() => addFromTemplate(tmpl)}
                  className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-[10px] text-left text-slate-200 border border-slate-600 transition-all hover:scale-[1.02] flex items-center justify-between group"
                >
                  {tmpl.name}
                  <Plus size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
             ))}
           </div>
        </div>

        {functions.map(fn => {
          const tab = activeTab[fn.id] || 'params';
          const undefinedVars = getUndefinedVars(fn);
          const derivativeRaw = getDerivativeExpression(fn.expression);
          
          return (
          <div key={fn.id} className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-lg transition-all border-l-4" style={{borderLeftColor: fn.color}}>
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                  <input 
                    value={fn.expression}
                    onChange={(e) => updateFn(fn.id, { expression: e.target.value })}
                    className="w-full bg-slate-900/50 text-white font-mono outline-none border border-slate-700 focus:border-blue-500 rounded-lg px-3 py-2 text-sm"
                    placeholder={t.placeholder}
                  />
                </div>
                <div className="flex gap-1">
                  <button onClick={() => updateFn(fn.id, { visible: !fn.visible })} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
                    {fn.visible ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                  <button onClick={() => setExpandedId(expandedId === fn.id ? null : fn.id)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
                    {expandedId === fn.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  <button onClick={() => onUpdate(functions.filter(f => f.id !== fn.id))} className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="bg-black/30 rounded-xl p-3 border border-white/5 flex items-center justify-center min-h-[50px] overflow-hidden">
                <MathFormula tex={formatToTeX(fn.expression)} className="text-blue-200 text-lg" />
              </div>
            </div>

            {expandedId === fn.id && (
              <div className="p-5 border-t border-slate-700 bg-slate-800/50 animate-in slide-in-from-top-1 duration-200">
                <div className="flex gap-4 border-b border-slate-700 mb-5">
                    <button onClick={() => setActiveTab({...activeTab, [fn.id]: 'params'})}
                        className={`pb-2 text-[10px] font-bold uppercase tracking-wider ${tab === 'params' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-500 hover:text-slate-300'}`}>
                        {t.parameters}
                    </button>
                    <button onClick={() => setActiveTab({...activeTab, [fn.id]: 'research'})}
                        className={`pb-2 text-[10px] font-bold uppercase tracking-wider ${tab === 'research' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-500 hover:text-slate-300'}`}>
                        {t.research}
                    </button>
                </div>

                {tab === 'params' ? (
                  <div className="space-y-6">
                    {fn.parameters.map(p => (
                        <div key={p.name} className="relative pt-4">
                            <div className="flex justify-between items-center mb-1">
                                <span className="font-mono text-slate-200 text-xs">{p.name}</span>
                                <span className="text-[10px] bg-slate-900 text-blue-400 font-bold px-2 py-0.5 rounded border border-slate-700">{p.value.toFixed(2)}</span>
                            </div>
                            <input type="range" min={p.min} max={p.max} step={p.step} value={p.value}
                                onChange={(e) => handleParamChange(fn.id, p.name, parseFloat(e.target.value))}
                                className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500" />
                        </div>
                    ))}
                    
                    <div className="pt-2">
                        {undefinedVars.length > 0 ? (
                            <div className="flex flex-col gap-2">
                                <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest">{lang === 'ru' ? 'Найдены переменные:' : 'Variables detected:'}</p>
                                <div className="flex flex-wrap gap-2">
                                    {undefinedVars.map(v => (
                                        <button key={v} className="text-[10px] bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 px-3 py-1.5 rounded-lg border border-blue-400/20 flex items-center gap-1 font-bold uppercase transition-all"
                                            onClick={() => updateFn(fn.id, { parameters: [...fn.parameters, {name: v, value: 1, min:-10, max:10, step:0.1}] })}>
                                            <Plus size={10}/> {v}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                           <button className="text-[10px] text-slate-500 hover:text-blue-400 flex items-center gap-1 font-bold uppercase tracking-wider border border-slate-700 border-dashed rounded-lg p-2 w-full justify-center" 
                               onClick={() => {
                                   const n = prompt(lang === 'ru' ? "Имя переменной" : "Variable name");
                                   if(n) updateFn(fn.id, { parameters: [...fn.parameters, {name: n, value: 1, min:-10, max:10, step:0.1}] });
                               }}>
                               <Plus size={12}/> {t.addVar}
                           </button>
                        )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-slate-900/40 p-3 rounded-2xl border border-slate-700">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.derivative}</span>
                            <button onClick={() => setTheoryTopic('derivative')} className="text-blue-400 hover:text-blue-300"><Info size={14}/></button>
                        </div>
                        <div className="text-blue-300 bg-black/30 p-3 rounded-xl border border-blue-500/10 mb-4 flex items-center justify-center overflow-x-auto">
                            {derivativeRaw === 'Error' ? (
                                <span className="text-xs text-red-400 italic">{lang === 'ru' ? 'Невозможно вычислить' : 'Calculation impossible'}</span>
                            ) : (
                                <MathFormula tex={`f'(x) = ${formatToTeX(derivativeRaw, true)}`} />
                            )}
                        </div>
                        <label className="flex items-center gap-3 text-xs text-slate-300 cursor-pointer hover:text-white transition-colors bg-slate-800/50 p-2 rounded-lg border border-slate-700">
                            <input type="checkbox" checked={fn.showTangent} onChange={e => updateFn(fn.id, {showTangent: e.target.checked})} className="rounded bg-slate-700 border-slate-600 w-4 h-4 accent-blue-500" />
                            <span className="font-medium">{t.tangent}</span>
                        </label>
                        {fn.showTangent && (
                            <div className="mt-4 space-y-1 relative pt-4">
                                <div className="absolute top-0 right-0 px-2 py-0.5 bg-white text-slate-900 rounded text-[10px] font-bold transform -translate-y-1 shadow-lg">
                                    {fn.tangentX?.toFixed(1)}
                                </div>
                                <div className="text-[9px] text-slate-500 uppercase font-bold mb-2 tracking-widest">{t.tangentAt}</div>
                                <input type="range" min="-10" max="10" step="0.1" value={fn.tangentX || 0} onChange={e => updateFn(fn.id, {tangentX: parseFloat(e.target.value)})} className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer" />
                            </div>
                        )}
                    </div>

                    <div className="bg-slate-900/40 p-3 rounded-2xl border border-slate-700">
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-3 cursor-pointer tracking-wider">
                                <input type="checkbox" checked={fn.showIntegral} onChange={e => updateFn(fn.id, {showIntegral: e.target.checked})} className="rounded w-4 h-4 accent-blue-500" />
                                {t.integral}
                            </label>
                            <button onClick={() => setTheoryTopic('integral')} className="text-blue-400 hover:text-blue-300"><Info size={14}/></button>
                        </div>
                        {fn.showIntegral && (
                             <div className="flex gap-4 items-center text-[11px] text-slate-300 pt-2">
                                <div className="flex-1">
                                    <div className="text-[9px] uppercase font-bold mb-1 text-slate-500">{t.from}</div>
                                    <input type="number" step="0.5" value={fn.integralRange?.[0]} onChange={e => updateFn(fn.id, {integralRange: [parseFloat(e.target.value), fn.integralRange![1]]})} className="w-full bg-slate-700 rounded-lg p-1.5 border border-slate-600 outline-none focus:border-blue-500" />
                                </div>
                                <div className="flex-1">
                                    <div className="text-[9px] uppercase font-bold mb-1 text-slate-500">{t.to}</div>
                                    <input type="number" step="0.5" value={fn.integralRange?.[1]} onChange={e => updateFn(fn.id, {integralRange: [fn.integralRange![0], parseFloat(e.target.value)]})} className="w-full bg-slate-700 rounded-lg p-1.5 border border-slate-600 outline-none focus:border-blue-500" />
                                </div>
                             </div>
                        )}
                    </div>
                  </div>
                )}

                <div className="mt-8 pt-4 border-t border-slate-700 space-y-3">
                   <div className="flex gap-2">
                      <button onClick={async () => {
                          setLoadingAi(p => ({...p, [fn.id]: true}));
                          const res = await getMathInsights(fn.expression, lang);
                          setAiInsights(p => ({...p, [fn.id]: res}));
                          setLoadingAi(p => ({...p, [fn.id]: false}));
                      }} className="flex-1 py-3 flex items-center justify-center gap-2 text-[10px] font-bold bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-400/20 rounded-xl transition-all shadow-sm uppercase tracking-widest">
                        <Sparkles size={14} /> {loadingAi[fn.id] ? t.analyzing : t.aiInsights}
                      </button>
                      <button 
                        onClick={async () => {
                            setLoadingDiscovery(p => ({...p, [fn.id]: true}));
                            const res = await getDiscoveryInfo(fn.expression, lang);
                            setDiscoveryData(p => ({...p, [fn.id]: res}));
                            setLoadingDiscovery(p => ({...p, [fn.id]: false}));
                            setShowDiscoveryModal(fn.id);
                        }}
                        className="py-3 px-4 flex items-center justify-center gap-2 text-[10px] font-bold bg-slate-700/50 hover:bg-slate-700 text-slate-200 border border-slate-600 rounded-xl transition-all shadow-sm uppercase tracking-widest"
                      >
                        <BookOpen size={14} /> {loadingDiscovery[fn.id] ? '...' : ''}
                      </button>
                   </div>
                   {aiInsights[fn.id] && (
                    <div className="mt-4 p-3 bg-blue-600/5 rounded-xl border border-blue-500/10 animate-in fade-in duration-300">
                      <p className="text-[11px] text-slate-400 italic leading-relaxed">{aiInsights[fn.id]}</p>
                    </div>
                   )}
                </div>
              </div>
            )}
          </div>
          );
        })}
      </div>

      {theoryTopic && (
        <TheoryModal topic={theoryTopic} lang={lang} onClose={() => setTheoryTopic(null)} />
      )}

      {showDiscoveryModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#1e293b] border border-slate-700 rounded-[2.5rem] w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between p-8 border-b border-slate-700 bg-slate-900/50">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500/10 rounded-2xl">
                    <HelpCircle size={32} className="text-blue-400" />
                </div>
                <div>
                    <h3 className="text-2xl font-black text-white">{t.functionRef}</h3>
                    <p className="text-slate-500 text-xs font-mono uppercase tracking-widest">{discoveryData[showDiscoveryModal]?.history?.split(' ')[0]} ANALYSIS</p>
                </div>
              </div>
              <button onClick={() => setShowDiscoveryModal(null)} className="text-slate-400 hover:text-white transition-colors bg-slate-800 p-2.5 rounded-full">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-10 overflow-y-auto custom-scrollbar space-y-8">
              <section className="relative">
                <h4 className="text-xs font-bold text-blue-400 flex items-center gap-2 mb-4 uppercase tracking-[0.2em]">
                  <BookOpen size={16} /> {t.historyTitle}
                </h4>
                <div className="bg-slate-800/40 p-6 rounded-3xl border border-slate-700 leading-relaxed text-slate-300 text-base">
                  {discoveryData[showDiscoveryModal]?.history}
                </div>
              </section>

              <section className="relative">
                <h4 className="text-xs font-bold text-blue-300 flex items-center gap-2 mb-4 uppercase tracking-[0.2em]">
                  <Sparkles size={16} /> {t.exampleTitle}
                </h4>
                <div className="bg-blue-600/5 p-6 rounded-3xl border border-blue-500/10 leading-relaxed text-slate-200 text-base">
                  {discoveryData[showDiscoveryModal]?.example}
                </div>
              </section>
            </div>

            <div className="p-8 bg-slate-900/50 flex justify-end border-t border-slate-700">
              <button 
                onClick={() => setShowDiscoveryModal(null)}
                className="px-10 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-sm font-black transition-all shadow-xl shadow-blue-500/20 active:scale-95 uppercase tracking-widest"
              >
                {t.close}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ControlPanel;
