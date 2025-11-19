import React from 'react';
import { ArrowLeft, CheckCircle2, FileText, Calculator, Wand2, Play, HelpCircle, FileSpreadsheet } from 'lucide-react';

interface Props {
  onBack: () => void;
  onStart: () => void;
}

const LearnMore: React.FC<Props> = ({ onBack, onStart }) => {
  return (
    <div className="min-h-screen bg-white animate-in fade-in slide-in-from-right-4 duration-500">
      
      {/* Header */}
      <div className="bg-slate-900 text-white py-12">
        <div className="max-w-4xl mx-auto px-6">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors mb-6 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Voltar para o início
          </button>
          <h1 className="text-3xl md:text-5xl font-bold mb-4">
            Como funciona o Gerador BPA-C?
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl">
            Entenda a lógica de consolidação, tradução de códigos e formatação técnica por trás do sistema.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12 space-y-16">

        {/* Section 1: O que é */}
        <section>
          <div className="flex items-start gap-4">
            <div className="bg-blue-100 p-3 rounded-lg text-blue-600 mt-1">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">O que é o BPA-C?</h2>
              <div className="prose text-gray-600 leading-relaxed">
                <p className="mb-3">
                  O <strong>Boletim de Produção Ambulatorial Consolidado (BPA-C)</strong> é um instrumento de coleta de dados do SUS utilizado para registrar procedimentos ambulatoriais que não exigem a identificação nominal do paciente (diferente do BPA-I, que é Individualizado).
                </p>
                <p>
                  Ele é utilizado para faturar procedimentos de baixa e média complexidade, como atendimentos básicos, visitas domiciliares e procedimentos de enfermagem. O arquivo gerado deve seguir rigorosamente o layout definido pelo DATASUS para ser importado no SIA (Sistema de Informações Ambulatoriais).
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: A Lógica Inteligente */}
        <section className="bg-gray-50 rounded-2xl p-8 border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <Wand2 className="w-6 h-6 text-purple-600" />
            Tradução Inteligente de Códigos
          </h2>
          <p className="text-gray-600 mb-6">
            Um dos maiores desafios é lembrar os códigos SIGTAP (ex: 03.01.01.007-2). Este sistema elimina essa necessidade utilizando <strong>Dicionários de Contexto</strong>. O sistema analisa o nome da coluna na sua planilha para decidir qual código usar.
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
              <h3 className="font-semibold text-blue-700 mb-3 flex items-center gap-2">
                Exemplo 1: Coluna "BPA MÉDICO"
              </h3>
              <p className="text-sm text-gray-500 mb-3">Se a coluna se chama "BPA Médico", o sistema busca na tabela médica:</p>
              <ul className="space-y-2 text-sm">
                <li className="flex justify-between border-b pb-1">
                  <span>"Consulta Especializada"</span>
                  <span className="font-mono font-bold text-gray-800">0301010072</span>
                </li>
                <li className="flex justify-between border-b pb-1">
                  <span>"Eletrocardiograma"</span>
                  <span className="font-mono font-bold text-gray-800">0211020036</span>
                </li>
                <li className="flex justify-between">
                  <span>"Sutura"</span>
                  <span className="font-mono font-bold text-gray-800">0401010058</span>
                </li>
              </ul>
            </div>

            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
              <h3 className="font-semibold text-green-700 mb-3 flex items-center gap-2">
                Exemplo 2: Coluna "BPA ENFERMAGEM"
              </h3>
              <p className="text-sm text-gray-500 mb-3">Se a coluna contém "Enfermagem", o sistema ajusta os códigos automaticamente:</p>
              <ul className="space-y-2 text-sm">
                <li className="flex justify-between border-b pb-1">
                  <span>"Consulta Domiciliar"</span>
                  <span className="font-mono font-bold text-gray-800">0301010161</span>
                </li>
                <li className="flex justify-between border-b pb-1">
                  <span>"Curativo Grau II"</span>
                  <span className="font-mono font-bold text-gray-800">0401010015</span>
                </li>
                <li className="flex justify-between">
                  <span>"Sutura"</span>
                  <span className="font-mono font-bold text-gray-800">0401010066</span>
                </li>
              </ul>
              <p className="text-xs text-gray-400 mt-2">* Note que o código de "Sutura" muda dependendo do profissional.</p>
            </div>
          </div>
        </section>

        {/* Section 3: Consolidação e Formatação */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <Calculator className="w-6 h-6 text-orange-600" />
            Regras de Negócio Automatizadas
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="border border-gray-200 rounded-xl p-5">
              <h3 className="font-bold text-gray-800 mb-2">Consolidação</h3>
              <p className="text-sm text-gray-600">
                Se você importar 10 linhas de "Consulta Médica" para pacientes de 25 anos e mesmo CBO, o sistema agrupa em <strong>uma única linha</strong> com quantidade 10. Isso reduz drasticamente o tamanho do arquivo e evita erros de duplicidade.
              </p>
            </div>

            {/* Card 2 */}
            <div className="border border-gray-200 rounded-xl p-5">
              <h3 className="font-bold text-gray-800 mb-2">Paginação (20 linhas)</h3>
              <p className="text-sm text-gray-600">
                O layout BPA exige que cada "folha" do arquivo digital tenha no máximo 20 procedimentos. O sistema quebra seu arquivo automaticamente em múltiplas folhas virtuais, gerenciando a numeração sequencial.
              </p>
            </div>

            {/* Card 3 */}
            <div className="border border-gray-200 rounded-xl p-5">
              <h3 className="font-bold text-gray-800 mb-2">Cálculo de Hash</h3>
              <p className="text-sm text-gray-600">
                O arquivo requer um "Dígito Verificador" (Checksum) baseado na soma dos códigos e quantidades, módulo 1111. Nós calculamos isso em tempo real para garantir que o arquivo não seja rejeitado.
              </p>
            </div>
          </div>
        </section>

        {/* Section 4: Como Importar */}
        <section className="bg-blue-50 rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <FileSpreadsheet className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">Guia Rápido de Importação</h2>
          </div>

          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="w-8 h-8 bg-blue-200 text-blue-800 rounded-full flex items-center justify-center font-bold flex-shrink-0">1</div>
              <div>
                <h4 className="font-semibold text-gray-900">Prepare sua Planilha</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Use o Google Sheets. Certifique-se que a primeira linha contém os nomes das colunas (ex: Data, Procedimento, Quantidade).
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-8 h-8 bg-blue-200 text-blue-800 rounded-full flex items-center justify-center font-bold flex-shrink-0">2</div>
              <div>
                <h4 className="font-semibold text-gray-900">Conecte ao Sistema</h4>
                <p className="text-sm text-gray-600 mt-1">
                  No sistema, clique em "Importar Dados". Cole o link da sua planilha e o nome da aba (ex: "BD_PROCEDIMENTO").
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-8 h-8 bg-blue-200 text-blue-800 rounded-full flex items-center justify-center font-bold flex-shrink-0">3</div>
              <div>
                <h4 className="font-semibold text-gray-900">Mapeie as Colunas</h4>
                <p className="text-sm text-gray-600 mt-1">
                  O sistema tentará adivinhar as colunas. Se sua planilha não tiver uma coluna (ex: CNES é sempre o mesmo), selecione <strong>"Usar Valor Fixo"</strong> e digite o valor.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="pt-8 border-t border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-3">
            <HelpCircle className="w-6 h-6 text-gray-400" />
            Perguntas Frequentes
          </h2>
          
          <div className="space-y-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Meus dados ficam salvos?</h4>
              <p className="text-gray-600 text-sm">
                Não. Todo o processamento é feito no navegador do seu computador. Nada é enviado para servidores externos além do Google (para baixar sua planilha). Ao fechar a aba, os dados somem.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">O que acontece se eu errar a data?</h4>
              <p className="text-gray-600 text-sm">
                O sistema tenta corrigir automaticamente. Se você digitar "25/09/2023", ele converte para "202309" (Formato AAAAMM exigido pelo SUS).
              </p>
            </div>
             <div>
              <h4 className="font-semibold text-gray-900 mb-2">Posso gerar BPA Individualizado (BPA-I)?</h4>
              <p className="text-gray-600 text-sm">
                Atualmente este sistema é focado no BPA Consolidado (BPA-C). O BPA-I exige dados sensíveis do paciente (CNS, Data Nasc, Nome) que requerem um layout diferente.
              </p>
            </div>
          </div>
        </section>

        {/* Footer CTA */}
        <div className="flex justify-center py-12">
           <button 
             onClick={onStart}
             className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-xl shadow-blue-200 hover:shadow-blue-300 transition-all transform hover:-translate-y-1 flex items-center gap-3"
           >
             <Play className="w-5 h-5 fill-current" />
             Começar a Usar Agora
           </button>
        </div>

      </div>
    </div>
  );
};

export default LearnMore;
