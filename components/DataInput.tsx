
import React, { useState, useEffect } from 'react';
import { BpaItem, EXAMPLE_CSV, EXAMPLE_CSV_BPA_I, ColumnMapping, BpaMode } from '../types';
import { parseMappedData } from '../utils/formatter';
import { Table, ClipboardPaste, Trash2, ArrowRight, Check, Settings2, Grid3X3, Link as LinkIcon, Loader2, AlertTriangle, Users, FileStack, User } from 'lucide-react';

interface Props {
  items: BpaItem[];
  onUpdateItems: (items: BpaItem[]) => void;
  mode: BpaMode;
  onModeChange: (mode: BpaMode) => void;
}

const DataInput: React.FC<Props> = ({ items, onUpdateItems, mode, onModeChange }) => {
  const [showModal, setShowModal] = useState(false);
  
  // Import State
  const [step, setStep] = useState<1 | 2>(1);
  const [importMethod, setImportMethod] = useState<'paste' | 'url'>('url'); 
  const [rawContent, setRawContent] = useState('');
  
  // Google Sheets State
  const [sheetUrl, setSheetUrl] = useState('https://docs.google.com/spreadsheets/d/1re5sm_3Nbr6xAHoawkesv2vI04Aj3WwS9v5hERek-oA/edit?usp=sharing');
  const [sheetTabName, setSheetTabName] = useState('BD_PROCEDIMENTO');
  const [isLoadingSheet, setIsLoadingSheet] = useState(false);
  const [sheetError, setSheetError] = useState('');

  // Analysis State
  const [detectedHeaders, setDetectedHeaders] = useState<string[]>([]);
  const [previewRows, setPreviewRows] = useState<string[][]>([]);
  const [hasHeaderRow, setHasHeaderRow] = useState(true);
  const [shouldConsolidate, setShouldConsolidate] = useState(mode === 'BPA-C');
  
  // Stats from last import
  const [importStats, setImportStats] = useState<{ original: number, consolidated: number } | null>(null);

  // Defaults
  const [defaults, setDefaults] = useState({
    cnes: '2477963',
    competencia: '',
    cbo: '225125',
    procedimento: '',
    idade: '',
    quantidade: '1',
    origem: 'EXT',
    // BPA-I defaults
    cns_profissional: '',
    ibge_municipio: '2802809',
    raca: '99'
  });

  // Load Defaults
  useEffect(() => {
    const savedDefaults = localStorage.getItem('bpa_import_defaults');
    if (savedDefaults) {
      try {
        setDefaults({ ...defaults, ...JSON.parse(savedDefaults) });
      } catch(e) { console.error(e); }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('bpa_import_defaults', JSON.stringify(defaults));
  }, [defaults]);
  
  // Mapping
  const [mapping, setMapping] = useState<ColumnMapping>({
    cnes: -1,
    competencia: -1,
    cbo: -1,
    procedimento: -1,
    idade: -1,
    quantidade: -1,
    origem: -1,
    // BPA-I
    cns_profissional: -1,
    data_atendimento: -1,
    cns_paciente: -1,
    sexo: -1,
    ibge_municipio: -1,
    cid: -1,
    nome_paciente: -1,
    data_nascimento: -1,
    raca: -1,
    telefone: -1,
    endereco_descr: -1,
    endereco_numero: -1,
    endereco_bairro: -1
  });

  // Reset consolidation when mode changes
  useEffect(() => {
    setShouldConsolidate(mode === 'BPA-C');
  }, [mode]);

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
    newItems[index][field] = value as any;
    onUpdateItems(newItems);
  };

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
      setSheetError('Falha ao carregar. Verifique se o NOME DA ABA está correto e se a planilha está pública (Qualquer pessoa com o link).');
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
      
      // Common Mappings
      if (h.includes('cnes')) newMapping.cnes = index;
      
      // Competencia: Prioritize "J - DATA"
      if (h === 'jdata') {
         newMapping.competencia = index;
      } else if (newMapping.competencia === -1 && h.includes('data') && !h.includes('nasc') && !h.includes('atend')) {
         newMapping.competencia = index;
      }
      
      if (h.includes('cbo') || h.includes('ocupacao')) newMapping.cbo = index;
      
      if (h.includes('bpamedico') || h.includes('bpaenfermagem') || h.includes('bpatec')) {
         newMapping.procedimento = index;
      } else if (newMapping.procedimento === -1 && (h.includes('procedimento') || h.includes('cod') || h.includes('proc'))) {
         newMapping.procedimento = index;
      }

      if (h.includes('datadenascimento') || h.includes('dtnasc')) {
         newMapping.data_nascimento = index;
         // Sometimes age is derived, but let's map it if explicit
      }
      
      if (h.includes('idade')) newMapping.idade = index;
      if (h.includes('quantidade') || h.includes('qtd')) newMapping.quantidade = index;
      if (h.includes('origem') || h.includes('fonte')) newMapping.origem = index;

      // BPA-I Specific
      if (h.includes('nome') && (h.includes('paciente') || h.includes('usuario') || h === 'nome')) newMapping.nome_paciente = index;
      
      // CNS Paciente logic: often just "CNS" or "CNS PACIENTE". 
      // If it contains "PROF", it is likely professional.
      if (h.includes('cns') || h.includes('cartao')) {
          if (h.includes('prof') || h.includes('medico')) {
             newMapping.cns_profissional = index;
          } else {
             newMapping.cns_paciente = index;
          }
      }

      if (h.includes('sexo') || h.includes('genero')) newMapping.sexo = index;
      if (h.includes('raca') || h.includes('cor')) newMapping.raca = index;
      if (h.includes('municipio') || h.includes('ibge')) newMapping.ibge_municipio = index;
      if (h.includes('telefone') || h.includes('celular')) newMapping.telefone = index;
    });
    
    setMapping(newMapping);
    setStep(2);
  };

  const handleFinishImport = () => {
    let procedureHeaderName = '';
    if (mapping.procedimento !== -1 && detectedHeaders[mapping.procedimento]) {
      procedureHeaderName = detectedHeaders[mapping.procedimento];
    }

    const newItems = parseMappedData(
      rawContent, 
      mapping, 
      hasHeaderRow, 
      defaults, 
      shouldConsolidate,
      procedureHeaderName,
      mode
    );
    
    onUpdateItems([...items, ...newItems]);
    
    setShowModal(false);
    setRawContent('');
    setStep(1);
    setSheetError('');
  };

  const mapField = (field: keyof ColumnMapping, val: string) => {
    setMapping(prev => ({ ...prev, [field]: parseInt(val) }));
  };

  const ColumnSelector = ({ label, field, required = false }: { label: string, field: keyof ColumnMapping, required?: boolean }) => {
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

        {isFixed && (defaults as any)[field] !== undefined && (
          <input
            type="text"
            placeholder={`Valor fixo para ${label}...`}
            value={(defaults as any)[field]}
            onChange={e => setDefaults(prev => ({...prev, [field]: e.target.value}))}
            className="w-full rounded-md border border-blue-300 bg-blue-50 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-200"
          />
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
            <h2 className="text-lg font-semibold text-gray-800">Itens do {mode}</h2>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>{items.length} registros</span>
            </div>
          </div>
        </div>

        {/* Mode Toggle */}
        <div className="flex bg-gray-200 rounded-lg p-1">
            <button
                onClick={() => onModeChange('BPA-C')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 transition-all ${mode === 'BPA-C' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
            >
                <FileStack className="w-3.5 h-3.5" />
                Consolidado
            </button>
            <button
                onClick={() => onModeChange('BPA-I')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 transition-all ${mode === 'BPA-I' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
            >
                <User className="w-3.5 h-3.5" />
                Individualizado
            </button>
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
          <h3 className="text-gray-900 font-medium text-lg mb-2">Nenhum dado {mode === 'BPA-I' ? 'individualizado' : 'consolidado'}</h3>
          <p className="text-gray-500 text-sm max-w-md mb-6">
            Clique em "Importar Dados" para começar.
          </p>
        </div>
      )}

      {/* Data Table */}
      {items.length > 0 && (
        <div className="overflow-auto flex-1 min-h-[300px] max-h-[600px]">
          <table className="w-full text-sm text-left text-gray-600 border-collapse">
            <thead className="text-xs text-gray-700 uppercase bg-gray-100 sticky top-0 shadow-sm z-10">
              <tr>
                <th className="px-3 py-3 w-12">#</th>
                <th className="px-3 py-3">CNES</th>
                <th className="px-3 py-3">Comp.</th>
                {mode === 'BPA-I' && <th className="px-3 py-3 text-purple-700">CNS Prof.</th>}
                <th className="px-3 py-3">CBO</th>
                <th className="px-3 py-3">Procedimento</th>
                {mode === 'BPA-I' && (
                    <>
                        <th className="px-3 py-3 text-purple-700 min-w-[120px]">Paciente</th>
                        <th className="px-3 py-3 text-purple-700">CNS Pac.</th>
                        <th className="px-3 py-3 text-purple-700">Nasc.</th>
                    </>
                )}
                <th className="px-3 py-3 w-16">Idade</th>
                <th className="px-3 py-3 w-16">Qtde</th>
                <th className="px-3 py-3 w-10 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50 group">
                  <td className="px-3 py-2 font-mono text-xs text-gray-400">{idx + 1}</td>
                  <td className="px-1 py-1"><input type="text" value={item.cnes} onChange={(e) => handleEditItem(idx, 'cnes', e.target.value)} className="w-full bg-transparent border-none text-xs font-mono"/></td>
                  <td className="px-1 py-1"><input type="text" value={item.competencia} onChange={(e) => handleEditItem(idx, 'competencia', e.target.value)} className="w-full bg-transparent border-none text-xs font-mono"/></td>
                  
                  {mode === 'BPA-I' && (
                      <td className="px-1 py-1 bg-purple-50/30">
                          <input type="text" value={item.cns_profissional || ''} onChange={(e) => handleEditItem(idx, 'cns_profissional', e.target.value)} className="w-full bg-transparent border-none text-xs font-mono text-purple-800" placeholder="Obrigatório"/>
                      </td>
                  )}

                  <td className="px-1 py-1"><input type="text" value={item.cbo} onChange={(e) => handleEditItem(idx, 'cbo', e.target.value)} className="w-full bg-transparent border-none text-xs font-mono"/></td>
                  <td className="px-1 py-1"><input type="text" value={item.procedimento} onChange={(e) => handleEditItem(idx, 'procedimento', e.target.value)} className="w-full bg-transparent border-none text-xs font-mono font-medium text-blue-600"/></td>
                  
                  {mode === 'BPA-I' && (
                    <>
                        <td className="px-1 py-1 bg-purple-50/30"><input type="text" value={item.nome_paciente || ''} onChange={(e) => handleEditItem(idx, 'nome_paciente', e.target.value)} className="w-full bg-transparent border-none text-xs text-purple-800"/></td>
                        <td className="px-1 py-1 bg-purple-50/30"><input type="text" value={item.cns_paciente || ''} onChange={(e) => handleEditItem(idx, 'cns_paciente', e.target.value)} className="w-full bg-transparent border-none text-xs font-mono text-purple-800"/></td>
                        <td className="px-1 py-1 bg-purple-50/30"><input type="text" value={item.data_nascimento || ''} onChange={(e) => handleEditItem(idx, 'data_nascimento', e.target.value)} className="w-full bg-transparent border-none text-xs font-mono text-purple-800"/></td>
                    </>
                  )}

                  <td className="px-1 py-1"><input type="text" value={item.idade} onChange={(e) => handleEditItem(idx, 'idade', e.target.value)} className="w-full bg-transparent border-none text-xs font-mono text-center"/></td>
                  <td className="px-1 py-1"><input type="text" value={item.quantidade} onChange={(e) => handleEditItem(idx, 'quantidade', e.target.value)} className="w-full bg-transparent border-none text-xs font-mono text-center"/></td>
                  <td className="px-1 py-1 text-right">
                    <button onClick={() => handleDeleteItem(idx)} className="text-gray-300 hover:text-red-500 p-1"><Trash2 className="w-4 h-4" /></button>
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
                <h3 className="text-xl font-semibold text-gray-800">Importação de Dados ({mode})</h3>
                <div className="flex items-center gap-2 text-xs mt-1">
                   <span className={`font-medium ${step === 1 ? 'text-blue-600' : 'text-green-600'}`}>1. Fonte</span>
                   <ArrowRight className="w-3 h-3 text-gray-400" />
                   <span className={`font-medium ${step === 2 ? 'text-blue-600' : 'text-gray-400'}`}>2. Mapear Colunas</span>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            {/* Body */}
            <div className="p-6 flex-1 overflow-y-auto flex flex-col bg-gray-50/50">
              
              {step === 1 && (
                <div className="flex flex-col h-full space-y-6">
                  {/* ... (Keep existing Source selection) ... */}
                  <div className="flex rounded-lg bg-gray-200 p-1 self-start">
                     <button onClick={() => setImportMethod('url')} className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${importMethod === 'url' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>Link Google Sheets</button>
                     <button onClick={() => setImportMethod('paste')} className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${importMethod === 'paste' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>Colar Dados</button>
                  </div>

                  {importMethod === 'url' && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input type="text" value={sheetUrl} onChange={(e) => setSheetUrl(e.target.value)} placeholder="https://docs.google.com/spreadsheets/d/..." className="w-full rounded-md border border-gray-300 px-3 py-2"/>
                            <input type="text" value={sheetTabName} onChange={(e) => setSheetTabName(e.target.value)} placeholder="Ex: BD_PROCEDIMENTO" className="w-full rounded-md border border-gray-300 px-3 py-2"/>
                        </div>
                        {sheetError && <div className="text-red-600 text-sm">{sheetError}</div>}
                    </div>
                  )}

                  {importMethod === 'paste' && (
                    <textarea
                        className="w-full flex-1 min-h-[200px] p-4 border border-gray-300 rounded-lg font-mono text-xs"
                        placeholder={`Cole aqui...\n\nExemplo:\n${mode === 'BPA-I' ? EXAMPLE_CSV_BPA_I : EXAMPLE_CSV}`}
                        value={rawContent}
                        onChange={(e) => setRawContent(e.target.value)}
                    />
                  )}
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                   {/* Preview Grid ... */}
                   <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                      <div className="overflow-x-auto">
                          <table className="w-full text-xs text-left whitespace-nowrap">
                              <thead><tr>{previewRows[0]?.map((_, idx) => <th key={idx} className="bg-gray-50 px-3 py-1 border">{getColumnLabel(idx)}</th>)}</tr></thead>
                              <tbody>{previewRows.slice(hasHeaderRow?1:0, 4).map((r,i) => <tr key={i}>{r.map((c,j)=><td key={j} className="px-3 py-1 border">{c}</td>)}</tr>)}</tbody>
                          </table>
                      </div>
                   </div>

                   {mode === 'BPA-C' && (
                    <div className="bg-white border border-blue-100 rounded-lg p-4 flex items-center gap-2 shadow-sm">
                        <input type="checkbox" checked={shouldConsolidate} onChange={e => setShouldConsolidate(e.target.checked)} className="w-4 h-4"/>
                        <label className="text-sm font-medium">Consolidar registros iguais</label>
                    </div>
                   )}

                   <div>
                     <h4 className="text-sm font-bold text-gray-800 mb-3 border-b pb-1">Campos Obrigatórios ({mode})</h4>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <ColumnSelector label="CNES" field="cnes" required />
                        <ColumnSelector label="Competência" field="competencia" required />
                        <ColumnSelector label="CBO Profissional" field="cbo" required />
                        <ColumnSelector label="Procedimento" field="procedimento" required />
                        <ColumnSelector label="Idade" field="idade" required />
                        <ColumnSelector label="Quantidade" field="quantidade" required />
                        
                        {mode === 'BPA-I' && (
                            <>
                                <div className="col-span-full h-px bg-gray-200 my-2"></div>
                                <h5 className="col-span-full text-purple-700 font-bold text-xs uppercase">Dados do Paciente (BPA-I)</h5>
                                <ColumnSelector label="CNS Profissional" field="cns_profissional" required />
                                <ColumnSelector label="CNS Paciente" field="cns_paciente" required />
                                <ColumnSelector label="Nome Paciente" field="nome_paciente" required />
                                <ColumnSelector label="Data Nascimento" field="data_nascimento" required />
                                <ColumnSelector label="Sexo (M/F)" field="sexo" required />
                                <ColumnSelector label="Raça/Cor (Cod)" field="raca" />
                                <ColumnSelector label="IBGE Município" field="ibge_municipio" />
                                <ColumnSelector label="Telefone" field="telefone" />
                            </>
                        )}
                     </div>
                   </div>
                </div>
              )}

            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-xl flex justify-end gap-3">
                {step === 2 && <button onClick={() => setStep(1)} className="px-4 py-2 text-sm border rounded-md">Voltar</button>}
                {step === 1 ? (
                    <button onClick={importMethod === 'url' ? handleFetchFromUrl : () => processContent(rawContent)} className="px-5 py-2 text-sm text-white bg-blue-600 rounded-md">Próximo</button>
                ) : (
                    <button onClick={handleFinishImport} className="px-6 py-2 text-sm text-white bg-green-600 rounded-md">Concluir</button>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataInput;
