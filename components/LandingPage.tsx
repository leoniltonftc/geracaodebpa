import React from 'react';
import { Activity, FileSpreadsheet, Wand2, ShieldCheck, ArrowRight, Zap, FileCode2, CheckCircle2 } from 'lucide-react';

interface Props {
  onStart: () => void;
  onLearnMore: () => void;
}

const LandingPage: React.FC<Props> = ({ onStart, onLearnMore }) => {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-slate-900 pb-16 pt-20 sm:pb-24 lg:pb-32">
        <div className="absolute inset-0">
          <img
            className="h-full w-full object-cover opacity-10"
            src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
            alt="Medical Background"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/60 via-slate-900/80 to-slate-900" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl lg:max-w-4xl">
            <div className="flex items-center gap-3 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="bg-blue-600 p-2 rounded-lg inline-flex">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <span className="text-blue-400 font-semibold tracking-wide uppercase text-sm">
                Sistema de Faturamento SUS
              </span>
            </div>
            
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
              Geração de BPA-C <br />
              <span className="text-blue-500">Simples e Inteligente</span>
            </h1>
            
            <p className="mt-6 text-xl leading-8 text-gray-300 max-w-2xl animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">
              Transforme planilhas do Google Sheets e Excel em arquivos de exportação BPA-C perfeitamente formatados e validados. Adeus à digitação manual de códigos.
            </p>

            <div className="mt-10 flex items-center gap-x-6 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300">
              <button
                onClick={onStart}
                className="rounded-lg bg-blue-600 px-8 py-4 text-lg font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400 transition-all flex items-center gap-2 group"
              >
                Acessar Sistema
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button 
                onClick={onLearnMore}
                className="text-sm font-semibold leading-6 text-white hover:text-blue-300 transition-colors"
              >
                Saiba mais <span aria-hidden="true">→</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="py-24 sm:py-32 bg-gray-50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-blue-600">Produtividade Máxima</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Tudo o que você precisa para o faturamento
            </p>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              O sistema automatiza as tarefas repetitivas de conversão e formatação, permitindo que você foque na conferência e qualidade da informação.
            </p>
          </div>

          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
              
              {/* Feature 1 */}
              <div className="flex flex-col bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                  <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-green-100">
                    <FileSpreadsheet className="h-6 w-6 text-green-600" />
                  </div>
                  Integração Google Sheets
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">
                    Conecte diretamente sua planilha online ou cole dados do Excel. O sistema identifica as colunas automaticamente com um assistente visual intuitivo.
                  </p>
                </dd>
              </div>

              {/* Feature 2 */}
              <div className="flex flex-col bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                  <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-purple-100">
                    <Wand2 className="h-6 w-6 text-purple-600" />
                  </div>
                  Tradução Inteligente
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">
                    Não sabe o código? Não tem problema. O sistema reconhece termos como "BPA Médico" ou "Enfermagem" e converte descrições em códigos SIGTAP oficiais automaticamente.
                  </p>
                </dd>
              </div>

              {/* Feature 3 */}
              <div className="flex flex-col bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                  <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-blue-100">
                    <Zap className="h-6 w-6 text-blue-600" />
                  </div>
                  Consolidação Automática
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">
                    O layout BPA-C exige agrupamento. Nós fazemos isso por você: registros com mesmo CBO, Idade e Procedimento são somados em uma única linha.
                  </p>
                </dd>
              </div>

            </dl>
          </div>
        </div>
      </div>

      {/* Trust/Tech Section */}
      <div className="relative isolate overflow-hidden bg-slate-900 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-2">
            <div className="max-w-xl lg:max-w-lg">
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Pronto para exportar?</h2>
              <p className="mt-4 text-lg leading-8 text-gray-300">
                Gere arquivos .TXT compatíveis com os validadores do DATASUS (SIA/BPA). O sistema calcula automaticamente o Checksum e formata as páginas (20 linhas por folha).
              </p>
              <div className="mt-6 flex max-w-md gap-x-4">
                <div className="flex-none rounded-md bg-white/5 p-2 ring-1 ring-white/10">
                  <FileCode2 className="h-6 w-6 text-white" aria-hidden="true" />
                </div>
                <div className="flex-none rounded-md bg-white/5 p-2 ring-1 ring-white/10">
                  <ShieldCheck className="h-6 w-6 text-white" aria-hidden="true" />
                </div>
                <div className="text-sm leading-6 text-gray-300 py-2">
                  Processamento local e seguro no seu navegador.
                </div>
              </div>
            </div>
            <dl className="grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 lg:pt-2">
              <div className="flex flex-col items-start">
                <div className="rounded-md bg-white/5 p-2 ring-1 ring-white/10">
                  <CheckCircle2 className="h-6 w-6 text-white" aria-hidden="true" />
                </div>
                <dt className="mt-4 font-semibold text-white">Validação de Layout</dt>
                <dd className="mt-2 leading-7 text-gray-400">Garante o posicionamento correto dos caracteres conforme manual.</dd>
              </div>
              <div className="flex flex-col items-start">
                <div className="rounded-md bg-white/5 p-2 ring-1 ring-white/10">
                  <CheckCircle2 className="h-6 w-6 text-white" aria-hidden="true" />
                </div>
                <dt className="mt-4 font-semibold text-white">Cálculo de Hash</dt>
                <dd className="mt-2 leading-7 text-gray-400">Algoritmo "Módulo 1111" implementado nativamente para evitar erros de importação.</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
      
      <footer className="bg-white py-8 border-t border-gray-100">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 flex justify-center text-gray-500 text-sm">
          &copy; {new Date().getFullYear()} Gerador BPA-C SUS. Desenvolvido para facilitar a gestão pública.
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;