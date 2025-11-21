import React, { useState, useEffect } from 'react';
import HeaderForm from './components/HeaderForm';
import DataInput from './components/DataInput';
import LandingPage from './components/LandingPage';
import LearnMore from './components/LearnMore';
import Login from './components/Login';
import { BpaHeader, BpaItem, DEFAULT_HEADER, BpaMode } from './types';
import { generateBpaFileContent } from './utils/formatter';
import { Download, FileCode2, Activity, Home, LogOut } from 'lucide-react';

const App: React.FC = () => {
  // View state: 'landing' | 'login' | 'app' | 'learn_more'
  const [currentView, setCurrentView] = useState<'landing' | 'login' | 'app' | 'learn_more'>('landing');
  
  // App State
  const [mode, setMode] = useState<BpaMode>('BPA-C');
  const [headerData, setHeaderData] = useState<BpaHeader>(DEFAULT_HEADER);
  const [items, setItems] = useState<BpaItem[]>([]);
  const [generatedContent, setGeneratedContent] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);

  // Load Header from LocalStorage on mount
  useEffect(() => {
    const savedHeader = localStorage.getItem('bpa_header_config');
    if (savedHeader) {
      try {
        const parsed = JSON.parse(savedHeader);
        setHeaderData({ ...DEFAULT_HEADER, ...parsed });
      } catch (e) { console.error(e); }
    }
  }, []);

  // Save Header
  useEffect(() => {
    if (headerData !== DEFAULT_HEADER) {
      localStorage.setItem('bpa_header_config', JSON.stringify(headerData));
    }
  }, [headerData]);

  const handleGenerate = () => {
    const content = generateBpaFileContent(headerData, items, mode);
    setGeneratedContent(content);
    setShowPreview(true);
  };

  const getMonthExtension = (competencia: string) => {
    const clean = competencia.trim();
    if (clean.length !== 6) return '.TXT';
    const month = clean.substring(4, 6);
    const extensions: Record<string, string> = {
      '01': '.JAN', '02': '.FEV', '03': '.MAR', '04': '.ABR',
      '05': '.MAI', '06': '.JUN', '07': '.JUL', '08': '.AGO',
      '09': '.SET', '10': '.OUT', '11': '.NOV', '12': '.DEZ'
    };
    return extensions[month] || '.TXT';
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([generatedContent], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    
    const ext = getMonthExtension(headerData.competencia);
    // BPA-I uses same extension logic usually, just different content
    const filename = `BPA_${headerData.competencia}_${headerData.sigla || 'EXPORT'}${ext}`;
    
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleLogout = () => {
    // Clear sensitive session data if needed, then go back to landing
    setCurrentView('landing');
  };

  // Render Views
  if (currentView === 'landing') {
    return <LandingPage onStart={() => setCurrentView('login')} onLearnMore={() => setCurrentView('learn_more')} />;
  }

  if (currentView === 'login') {
    return <Login onLoginSuccess={() => setCurrentView('app')} onBack={() => setCurrentView('landing')} />;
  }

  if (currentView === 'learn_more') {
    return <LearnMore onBack={() => setCurrentView('landing')} onStart={() => setCurrentView('login')} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col animate-in fade-in duration-500">
      {/* Navbar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentView('landing')}>
            <div className="bg-blue-600 p-2 rounded-lg">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 leading-none">Gerador BPA SUS</h1>
              <span className="text-xs text-gray-500 font-medium">Consolidado & Individualizado</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-gray-600 font-medium">Logado como Admin</span>
             </div>
             <button 
               onClick={handleLogout} 
               className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors"
               title="Sair do Sistema"
             >
               <LogOut className="w-4 h-4" />
               <span className="hidden sm:inline">Sair</span>
             </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-3">
            <HeaderForm data={headerData} onChange={setHeaderData} />
          </div>
          <div className="lg:col-span-3">
            <DataInput 
              items={items} 
              onUpdateItems={setItems}
              mode={mode}
              onModeChange={setMode}
              headerCompetencia={headerData.competencia}
            />
          </div>
        </div>
      </main>

      {/* Bottom Bar */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="text-sm text-gray-500 hidden sm:block">
            {items.length > 0 ? `${items.length} itens prontos.` : 'Adicione itens para gerar o arquivo.'}
          </div>
          <div className="flex gap-4 w-full sm:w-auto">
             <button
              onClick={handleGenerate}
              disabled={items.length === 0 || !headerData.responsavel}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-all font-medium"
            >
              <FileCode2 className="w-5 h-5" />
              Visualizar Arquivo {mode}
            </button>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl">
              <div className="flex items-center gap-3">
                <FileCode2 className="w-6 h-6 text-blue-600" />
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Pré-visualização ({mode})</h3>
                  <p className="text-xs text-gray-500 font-mono">{headerData.competencia} | {items.length} registros</p>
                </div>
              </div>
              <button onClick={() => setShowPreview(false)} className="text-gray-400 hover:text-gray-600 p-2">✕</button>
            </div>
            <div className="flex-1 overflow-auto p-0 bg-gray-900">
              <pre className="text-xs sm:text-sm font-mono text-green-400 p-6 leading-relaxed whitespace-pre overflow-x-auto">{generatedContent}</pre>
            </div>
            <div className="p-6 border-t border-gray-200 bg-white rounded-b-xl flex justify-end gap-3">
              <button onClick={() => setShowPreview(false)} className="px-6 py-2.5 text-sm font-medium border rounded-lg">Fechar</button>
              <button onClick={handleDownload} className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center gap-2">
                <Download className="w-4 h-4" /> Baixar {getMonthExtension(headerData.competencia)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;