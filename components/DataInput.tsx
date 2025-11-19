import React, { useState, useEffect } from 'react';
import { BpaItem, EXAMPLE_CSV, ColumnMapping } from '../types';
import { parseMappedData } from '../utils/formatter';
import { Table, ClipboardPaste, Trash2, ArrowRight, Check, Settings2, Grid3X3, FileText, Link as LinkIcon, Loader2, AlertTriangle, Save, Edit2 } from 'lucide-react';

interface Props {
  items: BpaItem[];
  onUpdateItems: (items: BpaItem[]) => void;
}

const DataInput: React.FC<Props> = ({ items, onUpdateItems }) => {
  const [showModal, setShowModal] = useState(false);
  
  // Import State
  const [step, setStep] = useState<1 | 2>(1);
  const [importMethod, setImportMethod] = useState<'paste' | 'url'>('url'); 
  const [rawContent, setRawContent] = useState('');
  
  // Google Sheets State
  const [sheetUrl, setSheetUrl] = useState('');
  const [sheetTabName, setSheetTabName] = useState('BD_PROCEDIMENTO');
  const [isLoadingSheet, setIsLoadingSheet] = useState(false);
  const [sheetError, setSheetError] = useState('');

  // Analysis State
  const [detectedHeaders, setDetectedHeaders] = useState<string[]>([]);
  const [previewRows, setPreviewRows] = useState<string[][]>([]);
  const [hasHeaderRow, setHasHeaderRow] = useState(true);
  const [shouldConsolidate, setShouldConsolidate] = useState(true);
  
  // Stats from last import
  const [importStats, setImportStats] = useState<{ original: number, consolidated: number } | null>(null);

  // Defaults for missing columns
  const [defaults, setDefaults] = useState({
    cnes: '2477963',
    competencia: '',
    cbo: '225125',
    procedimento: '',
    idade: '',
    quantidade: '1',
    origem: 'EXT'
  });

  // Load Defaults from LocalStorage
  useEffect(() => {
    const savedDefaults = localStorage.getItem('bpa_import_defaults');
    if (savedDefaults) {
      try {
        setDefaults(JSON.parse(savedDefaults));
      } catch(e) { console.error(e); }
    }
  }, []);

  // Save Defaults to LocalStorage
  useEffect(() => {
    localStorage.setItem('bpa_import_defaults', JSON.stringify(defaults));
  }, [defaults]);
  
  // Mapping: -1 means "Use Default/Fixed Value"
  const [mapping, setMapping] = useState<ColumnMapping>({
    cnes: -1,
    competencia: -1,
    cbo: -1,
    procedimento: -1,
    idade: -1,
    quantidade: -1,
    origem: -1
  });

  const handleClear = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm('Tem certeza que deseja limpar todos os itens?')) {
      onUpdateItems([]);
      setImportStats(null);
    }
  };

  const handleDeleteItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    onUpdateItems(newItems);
  };

  const handleEditItem = (index: number, field: keyof BpaItem, value: string) => {
    const newItems = [...items];
    
    // Basic validation/masking during edit
    if (field === 'quantidade' || field === 'idade') {
      newItems[index][field] = value.replace(/[^0-9]/g, '');
    } else if (field === 'cnes' || field === 'procedimento') {
      newItems[index][field] = value.replace(/[^0-9]/g, ''); // Keep clean
    } else {
      newItems[index][field] = value;
    }
    
    onUpdateItems(newItems);
  };

  // Helper to get Excel-like column labels (A, B, C... AA, AB)
  const getColumnLabel = (index: number) => {
    let label = '';
    let i = index;
    while (i >= 0) {
      label = String.fromCharCode((i % 26) + 65) + label;
      i = Math.floor(i / 26) - 1;
    }
    return label;
  };

  const extractSheetId = (url: string): string | null => {
    const match = url.match(/[-\w]{25,}/);
    return match ? match[0] : null;
  };

  const handleFetchFromUrl = async () => {
    setSheetError('');
    const id = extractSheetId(sheetUrl);
    
    if (!id) {
      setSheetError('URL inválida. Não conseguimos identificar o ID da planilha.');
      return;
    }

    setIsLoadingSheet(true);

    const csvUrl = `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetTabName)}`;

    try {
      const response = await fetch(csvUrl);
      
      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const text = await response.text();
      
      if (text.toLowerCase().includes('<!doctype html>') || text.toLowerCase().includes('<html')) {
         throw new Error('O Google bloqueou o acesso direto. Certifique-se que a planilha está compartilhada como "Qualquer pessoa com o link".');
      }

      setRawContent(text);
      processContent(text);

    } catch (err: any) {
      console.error(err);
      setSheetError('Falha ao carregar. Verifique se o NOME DA ABA está correto e se a planilha está pública (Qualquer pessoa com o link). Se o erro persistir, use a aba "Colar Dados".');
    } finally {
      setIsLoadingSheet(false);
    }
  };

  const processContent = (content: string) => {
    if (!content.trim()) return;
    
    const lines = content.trim().split(/\r?\n/).filter(line => line.trim() !== '');
    if (lines.length === 0) return;

    const firstLine = lines[0];
    let delimiter = ',';
    if (firstLine.includes('\t')) delimiter = '\t';
    else if (firstLine.includes(';')) delimiter = ';';
    
    const splitLine = (line: string) => {
      if (delimiter === ',') {
        return line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.trim().replace(/^"|"$/g, ''));
      }
      return line.split(delimiter).map(c => c.trim().replace(/^"|"$/g, ''));
    };

    const parsedRows = lines.slice(0, 6).map(splitLine);
    
    const headers = hasHeaderRow ? parsedRows[0] : parsedRows[0].map((_, i) => `Dados ${i+1}`);
    
    setDetectedHeaders(headers);
    setPreviewRows(parsedRows);

    // Auto-map logic
    const newMapping = { ...mapping };
    
    headers.forEach((header, index) => {
      const h = header.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") 
        .replace(/[^a-z0-9]/g, "");
        
      const rawH = header.toUpperCase().trim();

      // CNES
      if (h.includes('cnes')) newMapping.cnes = index;

      // Competencia 
      if (rawH === 'DATA') newMapping.competencia = index;
      else if (newMapping.competencia === -1 && (h.includes('competencia') || h.includes('mes') || h.includes('dt') || h.includes('data'))) newMapping.competencia = index;

      // CBO
      if (h.includes('cbo') || h.includes('ocupacao')) newMapping.cbo = index;

      // Procedimento
      if (h.includes('bpamedico') || h.includes('bpaenfermagem') || h.includes('bpatec')) {
         if (newMapping.procedimento === -1) newMapping.procedimento = index;
         else {
            if (h.includes('bpamedico')) newMapping.procedimento = index; 
         }
      }
      else if (newMapping.procedimento === -1 && (h.includes('procedimento') || h.includes('cod') || h.includes('proc'))) newMapping.procedimento = index;

      // Idade
      if (h.includes('datadenascimento')) newMapping.idade = index;
      else if (newMapping.idade === -1 && (h.includes('idade') || h.includes('nasc'))) newMapping.idade = index;

      // Quantidade
      if (h.includes('quantidade') || h.includes('qtd')) newMapping.quantidade = index;

      // Origem
      if (h.includes('origem') || h.includes('fonte')) newMapping.origem = index;
    });
    
    setMapping(newMapping);
    setStep(2);
  };

  const handleFinishImport = () => {
    let procedureHeaderName = '';
    if (mapping.procedimento !== -1 && detectedHeaders[mapping.procedimento]) {
      procedureHeaderName = detectedHeaders[mapping.procedimento];
    }

    // Get raw count before processing
    const rawLines = rawContent.trim().split(/\r?\n/).filter(line => line.trim() !== '');
    const rawCount = hasHeaderRow ? rawLines.length - 1 : rawLines.length;

    const newItems = parseMappedData(
      rawContent, 
      mapping, 
      hasHeaderRow, 
      defaults, 
      shouldConsolidate,
      procedureHeaderName 
    );
    
    onUpdateItems([...items, ...newItems]);
    setImportStats({ original: rawCount, consolidated: newItems.length });
    
    setShowModal(false);
    setRawContent('');
    setStep(1);
    setSheetError('');
  };

  const mapField = (field: keyof ColumnMapping, val: string) => {
    setMapping(prev => ({
      ...prev,
      [field]: parseInt(val)
    }));
  };

  const ColumnSelector = ({ 
    label, 
    field, 
    required = false 
  }: { 
    label: string, 
    field: keyof ColumnMapping, 
    required?: boolean 
  }) => {
    const selectedIndex = mapping[field];
    const isFixed = selectedIndex === -1;

    return (
      <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-2 flex justify-between items-center">
          <span>{label} {required && <span className="text-red-500">*</span>}</span>
        </label>
        
        <select
          value={selectedIndex}
          onChange={(e) => mapField(field, e.target.value)}
          className={`w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2 ${
            isFixed && !defaults[field as keyof typeof defaults] && required ? 'border-orange-300' : 'border-gray-300'
          }`}
        >
          <option value="-1">🔹 Usar Valor Fixo / Padrão</option>
          {detectedHeaders.map((header, idx) => (
            <option key={idx} value={idx}>
              {getColumnLabel(idx)} - {header.substring(0, 20)} {hasHeaderRow ? '' : `(Ex: ${previewRows[0][idx]})`}
            </option>
          ))}
        </select>

        {isFixed && (
          <div className="animate-in fade-in slide-in-from-top-1 duration-200">
            <input
              type="text"
              placeholder={`Digite o valor fixo para ${label}...`}
              value={defaults[field as keyof typeof defaults]}
              onChange={e => setDefaults(prev => ({...prev, [field]: e.target.value}))}
              className="w-full rounded-md border border-blue-300 bg-blue-50 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-200 placeholder-blue-300 text-blue-900"
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col h-full">
      
      {/* Toolbar */}
      <div className="p-4 border-b border-gray-100 flex flex-wrap gap-4 justify-between items-center bg-gray-50 rounded-t-lg">
        <div className="flex items-center gap-2">
          <Table className="w-5 h-5 text-blue-600" />
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Itens do BPA-C</h2>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>{items.length} registros</span>
              {importStats && (
                <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-[10px] font-medium">
                  Consolidado de {importStats.original}
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleClear}
            disabled={items.length === 0}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 bg-white border border-red-200 rounded-md hover:bg-red-50 disabled:opacity-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Limpar
          </button>
          <button
            onClick={() => { setShowModal(true); setStep(1); }}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 shadow-sm transition-colors"
          >
            <ClipboardPaste className="w-4 h-4" />
            Importar Dados
          </button>
        </div>
      </div>

      {/* Empty State */}
      {items.length === 0 && (
        <div className="p-8 text-center bg-white flex flex-col items-center justify-center flex-1 min-h-[200px]">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
             <Grid3X3 className="w-8 h-8 text-blue-400" />
          </div>
          <h3 className="text-gray-900 font-medium text-lg mb-2">Nenhum dado importado</h3>
          <p className="text-gray-500 text-sm max-w-md mb-6">
            Clique em "Importar Dados" para conectar sua Planilha Google ou colar os dados manualmente.
          </p>
        </div>
      )}

      {/* Data Table with Inline Edit */}
      {items.length > 0 && (
        <div className="overflow-auto flex-1 min-h-[300px] max-h-[600px]">
          <table className="w-full text-sm text-left text-gray-600 border-collapse">
            <thead className="text-xs text-gray-700 uppercase bg-gray-100 sticky top-0 shadow-sm z-10">
              <tr>
                <th className="px-3 py-3 w-12">#</th>
                <th className="px-3 py-3 min-w-[90px]">CNES</th>
                <th className="px-3 py-3 min-w-[80px]">Comp.</th>
                <th className="px-3 py-3 min-w-[80px]">CBO</th>
                <th className="px-3 py-3 min-w-[120px]">Procedimento</th>
                <th className="px-3 py-3 w-16">Idade</th>
                <th className="px-3 py-3 w-16">Qtde</th>
                <th className="px-3 py-3 w-16">Origem</th>
                <th className="px-3 py-3 w-10 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50 group">
                  <td className="px-3 py-2 font-mono text-xs text-gray-400 bg-white group-hover:bg-gray-50">
                    {idx + 1}
                  </td>
                  <td className="px-1 py-1">
                    <input 
                      type="text" 
                      value={item.cnes}
                      onChange={(e) => handleEditItem(idx, 'cnes', e.target.value)}
                      className="w-full bg-transparent border-none focus:ring-1 focus:ring-blue-500 rounded px-2 py-1 text-xs font-mono hover:bg-white transition-colors"
                    />
                  </td>
                  <td className="px-1 py-1">
                     <input 
                      type="text" 
                      value={item.competencia}
                      onChange={(e) => handleEditItem(idx, 'competencia', e.target.value)}
                      className="w-full bg-transparent border-none focus:ring-1 focus:ring-blue-500 rounded px-2 py-1 text-xs font-mono hover:bg-white transition-colors"
                    />
                  </td>
                  <td className="px-1 py-1">
                    <input 
                      type="text" 
                      value={item.cbo}
                      onChange={(e) => handleEditItem(idx, 'cbo', e.target.value)}
                      className={`w-full bg-transparent border-none focus:ring-1 focus:ring-blue-500 rounded px-2 py-1 text-xs font-mono hover:bg-white transition-colors ${!item.cbo ? 'border border-red-300 bg-red-50' : ''}`}
                    />
                  </td>
                  <td className="px-1 py-1">
                    <input 
                      type="text" 
                      value={item.procedimento}
                      onChange={(e) => handleEditItem(idx, 'procedimento', e.target.value)}
                      className={`w-full bg-transparent border-none focus:ring-1 focus:ring-blue-500 rounded px-2 py-1 text-xs font-mono font-medium text-blue-600 hover:bg-white transition-colors ${!item.procedimento ? 'ring-1 ring-red-400 bg-red-50 placeholder-red-300' : ''}`}
                      placeholder="Obrigatório"
                    />
                  </td>
                  <td className="px-1 py-1">
                    <input 
                      type="text" 
                      value={item.idade}
                      maxLength={3}
                      onChange={(e) => handleEditItem(idx, 'idade', e.target.value)}
                      className="w-full bg-transparent border-none focus:ring-1 focus:ring-blue-500 rounded px-2 py-1 text-xs font-mono hover:bg-white transition-colors text-center"
                    />
                  </td>
                  <td className="px-1 py-1">
                    <input 
                      type="text" 
                      value={item.quantidade}
                      onChange={(e) => handleEditItem(idx, 'quantidade', e.target.value)}
                      className={`w-full bg-transparent border-none focus:ring-1 focus:ring-blue-500 rounded px-2 py-1 text-xs font-mono hover:bg-white transition-colors text-center ${item.quantidade === '0' ? 'text-red-500 font-bold' : ''}`}
                    />
                  </td>
                  <td className="px-1 py-1">
                     <input 
                      type="text" 
                      value={item.origem}
                      onChange={(e) => handleEditItem(idx, 'origem', e.target.value)}
                      className="w-full bg-transparent border-none focus:ring-1 focus:ring-blue-500 rounded px-2 py-1 text-xs font-mono hover:bg-white transition-colors text-center"
                    />
                  </td>
                  <td className="px-1 py-1 text-right">
                    <button 
                      onClick={() => handleDeleteItem(idx)}
                      className="text-gray-300 hover:text-red-500 p-1 rounded hover:bg-red-50 transition-colors"
                      title="Excluir linha"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Import Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl flex flex-col max-h-[95vh]">
            
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-semibold text-gray-800">Importação de Dados</h3>
                <div className="flex items-center gap-2 text-xs mt-1">
                   <span className={`font-medium ${step === 1 ? 'text-blue-600' : 'text-green-600'}`}>1. Fonte de Dados</span>
                   <ArrowRight className="w-3 h-3 text-gray-400" />
                   <span className={`font-medium ${step === 2 ? 'text-blue-600' : 'text-gray-400'}`}>2. Mapear Colunas</span>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 p-2">
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="p-6 flex-1 overflow-y-auto flex flex-col bg-gray-50/50">
              
              {step === 1 && (
                <div className="flex flex-col h-full space-y-6">
                  
                  {/* Method Switcher */}
                  <div className="flex rounded-lg bg-gray-200 p-1 self-start">
                     <button 
                       onClick={() => setImportMethod('url')}
                       className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${importMethod === 'url' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                     >
                       <div className="flex items-center gap-2">
                         <LinkIcon className="w-4 h-4" />
                         Link Google Sheets
                       </div>
                     </button>
                     <button 
                       onClick={() => setImportMethod('paste')}
                       className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${importMethod === 'paste' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                     >
                       <div className="flex items-center gap-2">
                         <ClipboardPaste className="w-4 h-4" />
                         Colar Dados
                       </div>
                     </button>
                  </div>

                  {/* CONTENT: URL METHOD */}
                  {importMethod === 'url' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-left-2 duration-200">
                      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                        <h4 className="text-sm font-bold text-blue-900 mb-2">Instruções:</h4>
                        <ul className="text-sm text-blue-800 list-disc ml-4 space-y-1">
                          <li>Cole o link da sua planilha do Google Sheets.</li>
                          <li>Certifique-se que ela está visível para <strong>"Qualquer pessoa com o link"</strong>.</li>
                          <li>Informe o nome exato da aba que deseja importar.</li>
                        </ul>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-sm font-medium text-gray-700">Link da Planilha</label>
                          <input 
                            type="text" 
                            value={sheetUrl}
                            onChange={(e) => setSheetUrl(e.target.value)}
                            placeholder="https://docs.google.com/spreadsheets/d/..."
                            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-sm font-medium text-gray-700">Nome da Aba</label>
                          <input 
                            type="text" 
                            value={sheetTabName}
                            onChange={(e) => setSheetTabName(e.target.value)}
                            placeholder="Ex: BD_PROCEDIMENTO"
                            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          />
                        </div>
                      </div>

                      {sheetError && (
                        <div className="bg-red-50 border border-red-100 text-red-600 p-3 rounded-md text-sm flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          {sheetError}
                        </div>
                      )}
                    </div>
                  )}

                  {/* CONTENT: PASTE METHOD */}
                  {importMethod === 'paste' && (
                    <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-2 duration-200">
                       <div className="bg-gray-100 rounded-lg p-3 mb-2 text-xs text-gray-600">
                          Copie as colunas do seu Excel ou Planilha e cole abaixo.
                       </div>
                       <textarea
                        className="w-full flex-1 min-h-[200px] p-4 border border-gray-300 rounded-lg font-mono text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none whitespace-pre bg-white shadow-sm"
                        placeholder={`Cole aqui...\n\nExemplo de dados:\n${EXAMPLE_CSV}`}
                        value={rawContent}
                        onChange={(e) => setRawContent(e.target.value)}
                      />
                    </div>
                  )}

                </div>
              )}

              {/* STEP 2: MAPPING (Shared for both methods) */}
              {step === 2 && (
                <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
                   
                   {/* DATA PREVIEW GRID */}
                   <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                     <div className="bg-gray-100 px-4 py-2 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase flex items-center gap-2">
                       <Grid3X3 className="w-3 h-3" />
                       Pré-visualização dos dados carregados
                     </div>
                     <div className="overflow-x-auto">
                       <table className="w-full text-xs text-left whitespace-nowrap">
                         <thead>
                           <tr>
                             {previewRows[0]?.map((_, idx) => (
                               <th key={idx} className="bg-gray-50 border-b border-r border-gray-200 px-3 py-1 min-w-[80px] text-center text-blue-600 font-bold">
                                 {getColumnLabel(idx)}
                               </th>
                             ))}
                           </tr>
                           {hasHeaderRow && (
                             <tr className="bg-blue-50/30">
                               {previewRows[0]?.map((header, idx) => (
                                 <th key={idx} className="border-b border-r border-gray-200 px-3 py-2 font-semibold text-gray-700 truncate max-w-[150px]">
                                   {header}
                                 </th>
                               ))}
                             </tr>
                           )}
                         </thead>
                         <tbody>
                           {previewRows.slice(hasHeaderRow ? 1 : 0, 4).map((row, rIdx) => (
                             <tr key={rIdx}>
                               {row.map((cell, cIdx) => (
                                 <td key={cIdx} className="border-b border-r border-gray-100 px-3 py-1.5 text-gray-600 truncate max-w-[150px]">
                                   {cell}
                                 </td>
                               ))}
                             </tr>
                           ))}
                         </tbody>
                       </table>
                     </div>
                   </div>

                   {/* CONSOLIDATION OPTION */}
                   <div className="bg-white border border-blue-100 rounded-lg p-4 flex items-start gap-3 shadow-sm">
                      <Settings2 className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <input 
                            type="checkbox"
                            id="checkConsolidate"
                            checked={shouldConsolidate}
                            onChange={e => setShouldConsolidate(e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <label htmlFor="checkConsolidate" className="text-sm font-medium text-gray-900 cursor-pointer">
                            Consolidar registros iguais automaticamente (Recomendado para BPA-C)
                          </label>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 ml-6">
                          Se marcado, o sistema irá somar as quantidades de procedimentos que tenham o mesmo CNES, CBO, Idade e Código.
                        </p>
                      </div>
                   </div>

                   {/* MAPPING GRID */}
                   <div>
                     <h4 className="text-sm font-bold text-gray-800 mb-3 uppercase tracking-wider border-b pb-1">
                        Identifique as Colunas (Mapeamento)
                     </h4>
                     <p className="text-xs text-gray-500 mb-4">
                       Indique qual coluna da planilha corresponde a cada campo do BPA. Se a coluna não existir na planilha, selecione "Valor Fixo" e digite um valor padrão.
                     </p>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <ColumnSelector label="CNES" field="cnes" required />
                        <ColumnSelector label="Competência (Data)" field="competencia" required />
                        <ColumnSelector label="Procedimento" field="procedimento" required />
                        <ColumnSelector label="CBO" field="cbo" required />
                        <ColumnSelector label="Idade / Nascimento" field="idade" required />
                        <ColumnSelector label="Quantidade" field="quantidade" required />
                        <ColumnSelector label="Origem" field="origem" />
                     </div>
                   </div>
                </div>
              )}

            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-xl flex justify-end gap-3">
              {step === 2 && (
                <button
                  onClick={() => setStep(1)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Voltar
                </button>
              )}
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              
              {step === 1 ? (
                <button
                  onClick={importMethod === 'url' ? handleFetchFromUrl : () => processContent(rawContent)}
                  disabled={importMethod === 'url' ? (!sheetUrl || isLoadingSheet) : !rawContent.trim()}
                  className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 shadow-sm transition-all min-w-[140px] justify-center"
                >
                  {isLoadingSheet ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                    <>
                      Próximo <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleFinishImport}
                  className="px-6 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center gap-2 shadow-sm shadow-green-200 transition-all transform active:scale-95"
                >
                  <Check className="w-4 h-4" />
                  Concluir Importação
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataInput;