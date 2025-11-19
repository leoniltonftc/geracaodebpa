import React, { useState } from 'react';
import HeaderForm from './components/HeaderForm';
import DataInput from './components/DataInput';
import LandingPage from './components/LandingPage';
import LearnMore from './components/LearnMore';
import { BpaHeader, BpaItem, DEFAULT_HEADER } from './types';
import { generateBpaFileContent } from './utils/formatter';
import { Download, FileCode2, Activity, Home } from 'lucide-react';

const App: React.FC = () => {
  // View state: 'landing' | 'app' | 'learn_more'
  const [currentView, setCurrentView] = useState<'landing' | 'app' | 'learn_more'>('landing');
  
  const [headerData, setHeaderData] = useState<BpaHeader>(DEFAULT_HEADER);
  const [items, setItems] = useState<BpaItem[]>([]);
  const [generatedContent, setGeneratedContent] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);

  const handleGenerate = () => {
    const content = generateBpaFileContent(headerData, items);
    setGeneratedContent(content);
    setShowPreview(true);
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([generatedContent], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    const filename = `BPA_${headerData.competencia}_${headerData.sigla || 'EXPORT'}.txt`;
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Render Views
  if (currentView === 'landing') {
    return (
      <LandingPage 
        onStart={() => setCurrentView('app')} 
        onLearnMore={() => setCurrentView('learn_more')} 
      />
    );
  }

  if (currentView === 'learn_more') {
    return (
      <LearnMore 
        onBack={() => setCurrentView('landing')} 
        onStart={() => setCurrentView('app')}
      />
    );
  }

  // Main App View
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
              <h1 className="text-xl font-bold text-gray-900 leading-none">Gerador BPA-C</h1>
              <span className="text-xs text-gray-500 font-medium">Layout Consolidado SUS</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <button 
               onClick={() => setCurrentView('landing')}
               className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
               title="Voltar para Início"
             >
               <Home className="w-5 h-5" />
             </button>
             <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium border border-green-200">
               Sistema Ativo
             </span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Header Config */}
          <div className="lg:col-span-3">
            <HeaderForm 
              data={headerData} 
              onChange={setHeaderData} 
            />
          </div>

          {/* Main Content: Data Input */}
          <div className="lg:col-span-3">
            <DataInput 
              items={items} 
              onUpdateItems={setItems} 
            />
          </div>

        </div>
      </main>

      {/* Bottom Sticky Action Bar */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="text-sm text-gray-500 hidden sm:block">
            {items.length > 0 
              ? `${items.length} itens prontos para processamento.` 
              : 'Adicione itens para gerar o arquivo.'}
          </div>
          <div className="flex gap-4 w-full sm:w-auto">
             <button
              onClick={handleGenerate}
              disabled={items.length === 0 || !headerData.responsavel}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
            >
              <FileCode2 className="w-5 h-5" />
              Visualizar Arquivo
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
                  <h3 className="text-lg font-bold text-gray-900">Pré-visualização do Arquivo</h3>
                  <p className="text-xs text-gray-500 font-mono">
                    {headerData.responsavel.toUpperCase().slice(0,20)}... | Checksum calculado
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowPreview(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-200 rounded-full"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-auto p-0 bg-gray-900">
              <pre className="text-xs sm:text-sm font-mono text-green-400 p-6 leading-relaxed whitespace-pre overflow-x-auto">
                {generatedContent}
              </pre>
            </div>

            <div className="p-6 border-t border-gray-200 bg-white rounded-b-xl flex justify-end gap-3">
              <button
                onClick={() => setShowPreview(false)}
                className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Fechar
              </button>
              <button
                onClick={handleDownload}
                className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-600/20 flex items-center gap-2 transition-all transform hover:-translate-y-0.5"
              >
                <Download className="w-4 h-4" />
                Baixar Arquivo .TXT
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default App;