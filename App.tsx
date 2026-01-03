
import React, { useState } from 'react';
import MathPlot from './components/MathPlot';
import ControlPanel from './components/ControlPanel';
import { FunctionDef } from './types';
import { Language, translations } from './i18n';
import { Maximize, Minimize, RotateCcw, Compass, Plus } from 'lucide-react';

const INITIAL_FUNCTIONS: FunctionDef[] = [
  {
    id: '1',
    expression: 'sin(x) + a',
    color: '#3b82f6',
    visible: true,
    parameters: [
      { name: 'a', value: 0, min: -10, max: 10, step: 0.1 }
    ],
    showIntegral: false,
    integralRange: [-Math.PI, Math.PI],
    showLimit: false,
    limitX: 0,
    tangentX: 0,
    showTangent: false
  }
];

const App: React.FC = () => {
  const [lang, setLang] = useState<Language>('ru');
  const [functions, setFunctions] = useState<FunctionDef[]>(INITIAL_FUNCTIONS);
  const [viewport, setViewport] = useState<{ x: [number, number], y: [number, number] }>({
    x: [-10, 10],
    y: [-10, 10]
  });

  const t = translations[lang];

  return (
    <div className="flex h-screen w-screen bg-[#0f172a] text-slate-100 font-sans selection:bg-blue-500/30 overflow-hidden">
      <ControlPanel 
        functions={functions} 
        onUpdate={setFunctions} 
        lang={lang}
        onSetLang={setLang}
      />
      
      <main className="flex-1 relative overflow-hidden flex flex-col">
        {/* Top Header Overlay */}
        <div className="absolute top-4 left-4 z-20 flex items-center gap-4 bg-slate-900/70 backdrop-blur-xl px-5 py-2.5 rounded-full border border-slate-700/50 shadow-2xl transition-all">
          <div className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-widest text-slate-400">
             <Compass size={16} className="text-blue-400" /> 
             <span className="text-slate-500">{t.viewport}:</span>
             <span className="text-blue-100 font-mono">X[{viewport.x[0].toFixed(1)}, {viewport.x[1].toFixed(1)}]</span>
             <span className="text-blue-100 font-mono">Y[{viewport.y[0].toFixed(1)}, {viewport.y[1].toFixed(1)}]</span>
          </div>
        </div>

        {/* Viewport Controls */}
        <div className="absolute top-4 right-4 z-20 flex flex-col gap-3">
          <button 
            onClick={() => setViewport(p => ({x:[p.x[0]*0.8, p.x[1]*0.8], y:[p.y[0]*0.8, p.y[1]*0.8]}))} 
            className="p-3 bg-slate-800/80 hover:bg-slate-700 backdrop-blur-md rounded-xl border border-slate-700 shadow-xl text-slate-300 transition-all hover:scale-110 active:scale-95"
            title={t.zoomIn}
          >
            <Maximize size={20} />
          </button>
          <button 
            onClick={() => setViewport(p => ({x:[p.x[0]*1.25, p.x[1]*1.25], y:[p.y[0]*1.25, p.y[1]*1.25]}))} 
            className="p-3 bg-slate-800/80 hover:bg-slate-700 backdrop-blur-md rounded-xl border border-slate-700 shadow-xl text-slate-300 transition-all hover:scale-110 active:scale-95"
            title={t.zoomOut}
          >
            <Minimize size={20} />
          </button>
          <button 
            onClick={() => setViewport({x:[-10,10], y:[-10,10]})} 
            className="p-3 bg-slate-800/80 hover:bg-slate-700 backdrop-blur-md rounded-xl border border-slate-700 shadow-xl text-slate-300 transition-all hover:scale-110 active:scale-95"
            title={t.reset}
          >
            <RotateCcw size={20} />
          </button>
        </div>

        <div className="flex-1 relative cursor-crosshair">
          <MathPlot functions={functions} viewport={viewport} />
        </div>

        {/* Legend */}
        <div className="p-4 bg-slate-900/95 border-t border-slate-700/50 z-20 flex justify-between items-center text-[10px] text-slate-500 uppercase tracking-widest font-bold backdrop-blur-md">
            <div className="flex gap-8">
                <div className="flex items-center gap-3 transition-opacity hover:opacity-100 opacity-70">
                    <div className="w-2.5 h-2.5 rounded-full border border-slate-400 bg-white"></div> 
                    {t.roots}
                </div>
                <div className="flex items-center gap-3 transition-opacity hover:opacity-100 opacity-70">
                    <div className="w-2.5 h-2.5 rounded-full border-2 border-slate-200 bg-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div> 
                    {t.extrema}
                </div>
                <div className="flex items-center gap-3 transition-opacity hover:opacity-100 opacity-70">
                    <div className="w-3 h-0.5 border-t-2 border-dashed border-white"></div> 
                    {t.tangent}
                </div>
            </div>
            <div className="text-slate-600 font-mono tracking-tighter">
                {t.title.toUpperCase()} • v4.0 PLATINUM EDITION • CIS EDU COMPLIANT
            </div>
        </div>
      </main>
    </div>
  );
};

export default App;
