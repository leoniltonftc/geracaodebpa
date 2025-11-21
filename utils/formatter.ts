
import { BpaHeader, BpaItem, ColumnMapping, BpaMode } from '../types';

// Reordered helper functions to top
export const smartParseCompetencia = (val: string): string => {
  if (!val) return '';
  const clean = val.trim();

  if (/^\d{6}$/.test(clean)) return clean;

  const datePart = clean.split(' ')[0].replace('T', ''); 
  
  let parts: string[] = [];
  if (datePart.includes('/')) parts = datePart.split('/');
  else if (datePart.includes('-')) parts = datePart.split('-');
  else if (datePart.includes('.')) parts = datePart.split('.'); 

  if (parts.length === 3) {
    let d = parts[0];
    let m = parts[1];
    let y = parts[2];

    if (d.length === 4) {
       y = d;
       m = parts[1];
    }

    if (y.length === 2) y = `20${y}`;
    return `${y}${m.padStart(2, '0')}`;
  }
  
  if (parts.length === 2) {
    const p1 = parts[0];
    const p2 = parts[1];
    if (p1.length === 4) return `${p1}${p2.padStart(2, '0')}`; 
    if (p2.length === 4) return `${p2}${p1.padStart(2, '0')}`; 
  }

  const digits = clean.replace(/[^0-9]/g, '');
  if (digits.length >= 6) return digits.substring(0, 6);
  return digits;
};

const normalizeKey = (str: string) => str.trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

// Helper for fixed width padding
const padNum = (val: string | number | undefined, width: number): string => {
  const str = (val || '').toString().replace(/[^0-9]/g, ''); // Remove non-numeric for numeric fields
  return str.padStart(width, '0').substring(0, width);
};

const padAlpha = (val: string | undefined, width: number): string => {
  // Remove accents/special chars - Keep strict ASCII
  let str = (val || '').toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  // Ensure only safe characters remain (Alphanumeric + Space)
  // str = str.replace(/[^A-Z0-9 ]/g, ""); // Optional: if strict validation is needed
  
  if (str.length > width) {
    return str.substring(0, width);
  }
  return str.padEnd(width, ' ');
};

const smartParseProcedure = (val: string, headerName: string = ''): string => {
  if (!val) return '';
  
  const normalized = normalizeKey(val);
  const headerNormalized = normalizeKey(headerName);
  
  let code = '';

  // Determine context based on header name
  if (headerNormalized.includes('TEC') || headerNormalized.includes('AUX')) {
     code = LOOKUP_TECNICO[normalized];
  } else if (headerNormalized.includes('ENFERMAGEM')) {
     code = LOOKUP_ENFERMAGEM[normalized];
  } else {
     // Default / Medico
     code = LOOKUP_MEDICO[normalized];
  }
  
  if (code) {
    return code.replace(/[^0-9]/g, '');
  }

  // Fallback to checking other lists if not found in specific context
  if (LOOKUP_MEDICO[normalized]) return LOOKUP_MEDICO[normalized].replace(/[^0-9]/g, '');
  if (LOOKUP_ENFERMAGEM[normalized]) return LOOKUP_ENFERMAGEM[normalized].replace(/[^0-9]/g, '');
  if (LOOKUP_TECNICO[normalized]) return LOOKUP_TECNICO[normalized].replace(/[^0-9]/g, '');

  return val.replace(/[^0-9]/g, '');
};

// Helper to format Date from AAAAMM or any format to AAAAMMDD (defaulting to 01 or current day if missing)
const formatDateFull = (val: string, competencia: string): string => {
  if (!val) {
      // Fallback: use competence start
      return padNum(competencia, 6) + '01';
  }
  
  const clean = val.trim().split(' ')[0]; // Remove time if present
  // If already 8 digits AAAAMMDD
  if (/^\d{8}$/.test(clean)) return clean;

  // Try parsing DD/MM/YYYY or DD-MM-YYYY or YYYY-MM-DD
  let parts: string[] = [];
  if (clean.includes('/')) parts = clean.split('/');
  else if (clean.includes('-')) parts = clean.split('-');
  else if (clean.includes('.')) parts = clean.split('.');

  if (parts.length === 3) {
    let d = parts[0];
    let m = parts[1];
    let y = parts[2];

    // Check if YYYY-MM-DD (Year is first)
    if (d.length === 4) {
        y = parts[0];
        m = parts[1];
        d = parts[2];
    }
    
    // Ensure strict padding
    const yy = y.padStart(4, '0');
    const mm = m.padStart(2, '0');
    const dd = d.padStart(2, '0');

    return `${yy}${mm}${dd}`;
  }
  
  // Fallback to competence start
  return padNum(competencia, 6) + '01';
}

const smartParseAge = (val: string): string => {
  const clean = val.trim();
  if (/^\d{1,3}$/.test(clean) && parseInt(clean) < 150) return clean;

  const today = new Date();
  let birthDate: Date | null = null;

  const parseDate = (str: string, separator: string) => {
     const p = str.split(separator);
     if (p.length === 3) {
         let y = parseInt(p[2]);
         let m = parseInt(p[1]) - 1;
         let d = parseInt(p[0]);
         
         if (p[0].length === 4) { 
             y = parseInt(p[0]);
             m = parseInt(p[1]) - 1;
             d = parseInt(p[2]);
         }
         
         if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
            return new Date(y, m, d);
         }
     }
     return null;
  }

  if (clean.includes('/')) birthDate = parseDate(clean, '/');
  else if (clean.includes('-')) birthDate = parseDate(clean, '-');

  if (birthDate && !isNaN(birthDate.getTime())) {
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return Math.max(0, age).toString();
  }

  return clean.replace(/[^0-9]/g, '').substring(0, 3);
};

const smartParseSex = (val: string): string => {
  if (!val) return '';
  const clean = val.trim().toUpperCase();
  
  if (clean === 'M' || clean === 'F') return clean;
  
  // Handles "MASCULINO", "MASC", "MALE"
  if (clean.startsWith('M')) return 'M';
  // Handles "FEMININO", "FEM", "FEMALE"
  if (clean.startsWith('F')) return 'F';
  
  return clean.substring(0, 1);
};

// Dictionaries
const LOOKUP_MEDICO: Record<string, string> = {
  "ELETROCARDIOGRAMA": "0211020036",
  "CONSULTA MEDICA EM ATENCAO ESPECIALIZADA": "0301010072",
  "ATENDIMENTO MEDICO EM UNIDADE DE PRONTO ATENDIMENTO": "0301060096",
  "EXERESE DE TUMOR DE PELE E ANEXOS / CISTO SEBACEO / LIPOMA": "0401010074",
  "TESTE RAPIDO PARA DETECCAO DE INFECCAO PELO HIV": "0214010058",
  "TESTE RADIO PARA SIFILIS": "0214010074", 
  "TESTE RAPIDO PARA SIFILIS": "0214010074",
  "DRENAGEM DE ABSCESSO": "0401010031",
  "RETIRADA DE CORPO ESTRANHO DA CAVIDADE AUDITIVA E NASAL": "0404010300",
  "TAMPONAMENTO NASAL ANTERIOR E/OU POSTERIOR": "0404010342",
  "REMOCAO DE CERUMEN DE CONDUTO AUDITIVO EXTERNO UNI / BILATERAL": "0404010270",
  "RETIRADA DE CORPO ESTRANHO SUBCUTANEO": "0401010112",
  "INCISAO E DRENAGEM DE ABSCESSO": "0401010104",
  "EXCISAO DE LESAO E/OU SUTURA DE FERIMENTO DA PELE ANEXOS E MUCOSA": "0401010058",
  "CURATIVO GRAU II C/ OU S/ DEBRIDAMENTO": "0401010015",
  "ATENDIMENTO DE URGENCIA EM ATENCAO ESPECIALIZADA": "0301060061",
  "CONSULTA MEDICA EM SAUDE DO TRABALHADOR": "0301010056",
  "PROVA DO LACO": "0202020509",
  "DEBRIDAMENTO DE ULCERA / NECROSE": "0415040043",
  "SUTURA": "0401010058"
};

const LOOKUP_ENFERMAGEM: Record<string, string> = {
  "ADMINISTRACAO DE MEDICAMENTOS NA ATENCAO ESPECIALIZADA": "0301100012",
  "ATIVIDADE EDUCATIVA / ORIENTACAO EM GRUPO NA ATENCAO ESPECIALIZADA": "0101010028",
  "CONSULTA/ATENDIMENTO DOMICILIAR NA ATENCAO ESPECIALIZADA": "0301010161",
  "CURATIVO GRAU II C/ OU S/ DEBRIDAMENTO": "0401010015",
  "CONSULTA DE PROFISSIONAIS DE NIVEL SUPERIOR NA ATENCAO ESPECIALIZADA (EXCETO MEDICO)": "0301010048",
  "TESTE RAPIDO PARA SIFILIS": "0214010074",
  "TESTE RAPIDO PARA DETECCAO DE INFECCAO PELO HIV": "0214010058",
  "TESTE NAO TREPONEMICO P/ DETECCAO DE SIFILIS": "0202031110",
  "TESTE FTA-ABS IGG P/ DIAGNOSTICO DA SIFILIS": "0202031128",
  "TESTE FTA-ABS IGM P/ DIAGNOSTICO DA SIFILIS": "0202031136",
  "ELETROCARDIOGRAMA": "0211020036",
  "RETIRADA DE CORPO ESTRANHO SUBCUTANEO": "040101011", 
  "CATETERISMO VERSICAL DE CANAIS EJACULADORES": "030903002",
  "RETIRADA DE PONTOS": "0301100152",
  "RETIRADA DE CORPO ESTRANHO DE OUVIDO": "040401031",
  "CATETERISMO VESICAL DE DEMORA": "0301100055",
  "SUTURA": "0401010066"
};

const LOOKUP_TECNICO: Record<string, string> = {
  "COLETA EXTERNA DE LEITE MATERNO (POR DOADORA)": "0101040032",
  "PROVA DO LACO": "0202020509",
  "TESTE RAPIDO PARA DETECCAO DE HIV NA GESTANTE OU PAI/PARCEIRO": "0214010040",
  "TESTE RAPIDO PARA DETECCAO DE INFECCAO PELO HIV": "0214010058",
  "TESTE RAPIDO PARA SIFILIS": "0214010074",
  "ELETROCARDIOGRAMA": "0211020036",
  "ADMINISTRACAO DE MEDICAMENTOS NA ATENCAO ESPECIALIZADA": "0301100012",
  "RETIRADA DE PONTOS": "0301100152"
};

// Checksum calculation per Page 6 of PDF
const calculateChecksum = (items: BpaItem[]): string => {
  let totalSum = 0;

  items.forEach(item => {
    const procCode = parseInt(item.procedimento, 10) || 0;
    const qty = parseInt(item.quantidade, 10) || 0;
    totalSum += (procCode + qty);
  });

  const remainder = totalSum % 1111;
  const result = remainder + 1111;
  
  return padNum(result, 4);
};

export const generateBpaFileContent = (header: BpaHeader, items: BpaItem[], mode: BpaMode): string => {
  // FILTER: Only include items that match the Header's Competencia
  const targetCompetencia = smartParseCompetencia(header.competencia);

  const relevantItems = items.filter(item => {
      if (!item.procedimento || item.procedimento.trim() === '') return false;
      
      // Sanitize Item Data
      if (item.cbo) item.cbo = item.cbo.replace(/[^0-9]/g, '');
      if (item.cnes) item.cnes = item.cnes.replace(/[^0-9]/g, '');
      
      return item.competencia === targetCompetencia;
  });

  const safeItems = relevantItems.filter(item => {
      if (item.procedimento === '0301100012') return false;
      return true;
  });

  const sortedItems = [...safeItems].sort((a, b) => {
    if (a.cnes !== b.cnes) return a.cnes.localeCompare(b.cnes);
    if (a.competencia !== b.competencia) return a.competencia.localeCompare(b.competencia);
    
    if (mode === 'BPA-I') {
        if (a.cbo !== b.cbo) return a.cbo.localeCompare(b.cbo);
        if ((a.cns_profissional || '') !== (b.cns_profissional || '')) return (a.cns_profissional || '').localeCompare(b.cns_profissional || '');
    }

    if (a.cbo !== b.cbo) return a.cbo.localeCompare(b.cbo);
    if (a.procedimento !== b.procedimento) return a.procedimento.localeCompare(b.procedimento);
    if (a.idade !== b.idade) return a.idade.localeCompare(b.idade);
    return a.origem.localeCompare(b.origem);
  });

  const LINES_PER_SHEET = 20;
  
  let currentSheet = 1;
  let currentSeq = 1;
  let processedLines: string[] = [];
  
  let totalSheetsAccumulator = 0;
  let maxSheetInCurrentContext = 0;

  if (sortedItems.length > 0) {
      maxSheetInCurrentContext = 1;
  }

  for (let i = 0; i < sortedItems.length; i++) {
    const item = sortedItems[i];
    const prevItem = i > 0 ? sortedItems[i - 1] : null;

    let newSheetNeeded = false;
    let resetNumbering = false;

    if (prevItem) {
      if (prevItem.cnes !== item.cnes || prevItem.competencia !== item.competencia) {
        newSheetNeeded = true;
        resetNumbering = true;
        totalSheetsAccumulator += maxSheetInCurrentContext;
        maxSheetInCurrentContext = 0;
      } 
      else if (currentSeq > LINES_PER_SHEET) {
        newSheetNeeded = true;
      }
    }

    if (newSheetNeeded) {
      if (resetNumbering) {
        currentSheet = 1;
      } else {
        currentSheet++;
      }
      currentSeq = 1;
    }

    if (currentSheet > maxSheetInCurrentContext) {
        maxSheetInCurrentContext = currentSheet;
    }

    let line = '';

    if (mode === 'BPA-C') {
        line = 
            '02' +
            padNum(item.cnes, 7) +
            padNum(item.competencia, 6) +
            padAlpha(item.cbo, 6) +
            padNum(currentSheet, 3) +
            padNum(currentSeq, 2) +
            padNum(item.procedimento, 10) +
            padNum(item.idade, 3) +
            padNum(item.quantidade, 6) +
            padAlpha(item.origem, 3);
    } else {
        const dtAtendimento = formatDateFull(item.data_atendimento || '', item.competencia);
        const dtNasc = formatDateFull(item.data_nascimento || '', item.competencia);

        // Ensure CNS is exactly 15 digits, numeric only (padNum removes non-numeric)
        const cnsProfFinal = padNum(item.cns_profissional, 15);
        const cnsPacFinal = padNum(item.cns_paciente, 15);

        line = 
            '03' +                                          
            padNum(item.cnes, 7) +                          
            padNum(item.competencia, 6) +                   
            cnsProfFinal +             
            padAlpha(item.cbo, 6) +                         
            padNum(dtAtendimento, 8) +                      
            padNum(currentSheet, 3) +                       
            padNum(currentSeq, 2) +                         
            padNum(item.procedimento, 10) +                 
            cnsPacFinal +                 
            padAlpha(item.sexo, 1) +                        
            padNum(item.ibge_municipio, 6) +                
            padAlpha(item.cid, 4) +                         
            padNum(item.idade, 3) +                         
            padNum(item.quantidade, 6) +                    
            padAlpha(item.carater_atendimento || '01', 2) + 
            padNum(item.num_autorizacao, 13) +              
            padAlpha(item.origem, 3) +                      
            padAlpha(item.nome_paciente, 30) +              
            padNum(dtNasc, 8) +                             
            padNum(item.raca || '03', 2) +                  
            padNum(item.etnia || '0000', 4) +               
            padNum(item.nacionalidade || '010', 3) +        
            padNum(item.servico, 3) +                       
            padNum(item.classificacao, 3) +                 
            padNum(item.equipe_seq, 8) +                    
            padNum(item.equipe_area, 4) +                   
            padNum(item.cnpj_empresa, 14) +                 
            padNum(item.cep, 8) +                           
            padNum('081', 3) + // Fixed to 081 (RUA)                              
            padAlpha(item.logradouro || item.endereco_descr, 30) + 
            padAlpha(item.endereco_compl, 10) +             
            padAlpha(item.endereco_numero || '00000', 5) + // Alphanumeric support   
            padAlpha(item.endereco_bairro, 30) +            
            padAlpha(item.telefone || '00000000000', 11) + // Alphanumeric support   
            padAlpha(item.email, 40) +                      
            padAlpha('', 10) + // INE (Alphanumeric)                           
            '';                                             
    }
    
    processedLines.push(line);
    currentSeq++;
  }

  totalSheetsAccumulator += maxSheetInCurrentContext;

  const totalItems = sortedItems.length;
  const totalLines = 1 + totalItems; 

  const checksum = calculateChecksum(sortedItems);

  let content = '';

  const headerLine = 
    '01' +
    '#BPA#' +
    padNum(targetCompetencia, 6) + 
    padNum(totalLines, 6) +
    padNum(totalSheetsAccumulator, 6) + 
    padNum(checksum, 4) +
    padAlpha(header.responsavel, 30) +
    padAlpha(header.sigla, 6) +
    padNum(header.cnpj, 14) +
    padAlpha(header.destino, 40) +
    header.indicador + 
    padAlpha(header.versao, 10);

  content += headerLine + '\r\n';
  content += processedLines.join('\r\n') + '\r\n';

  return content;
};

// --- GLOBAL CONSOLIDATION FUNCTION ---
export const consolidateBpaItems = (items: BpaItem[], mode: BpaMode): BpaItem[] => {
    if (mode !== 'BPA-C') return items; // No consolidation for BPA-I

    const STRICT_CBOS = ['225125', '223505', '322205'];

    const map = new Map<string, BpaItem>();

    items.forEach(item => {
        let key = '';
        if (STRICT_CBOS.includes(item.cbo)) {
             key = `${item.cnes}|${item.competencia}|${item.cbo}|${item.procedimento}`;
        } else {
             key = `${item.cnes}|${item.competencia}|${item.cbo}|${item.procedimento}|${item.idade}|${item.origem}`;
        }

        if (map.has(key)) {
            const existing = map.get(key)!;
            const newQty = (parseInt(existing.quantidade) || 0) + (parseInt(item.quantidade) || 0);
            existing.quantidade = newQty.toString();
        } else {
            map.set(key, { ...item });
        }
    });

    return Array.from(map.values());
};

export const parseMappedData = (
  text: string, 
  mapping: ColumnMapping, 
  hasHeader: boolean,
  defaults: any, 
  shouldConsolidate: boolean,
  procedureHeaderName: string = '',
  mode: BpaMode,
  professionalLookup: Record<string, string> = {},
  patientAddressLookup: Record<string, string> = {}, // Name -> Address
  limitToCompetencia: string = '' 
): BpaItem[] => {
  const lines = text.trim().split(/\r?\n/);
  const dataLines = hasHeader ? lines.slice(1) : lines;

  const rawProcHeader = normalizeKey(procedureHeaderName);
  
  const isMedicalContext = rawProcHeader.includes('MEDICO') && rawProcHeader.includes('BPA');
  
  const isNursingContext = rawProcHeader.includes('ENFERMAGEM') && 
                           !rawProcHeader.includes('TEC') && 
                           !rawProcHeader.includes('AUX') && 
                           rawProcHeader.includes('BPA');

  let cboOverride = '';
  if ((rawProcHeader.includes('TEC') || rawProcHeader.includes('AUX')) && rawProcHeader.includes('BPA')) {
     cboOverride = '322205'; 
  } else if (isNursingContext) {
     cboOverride = '223505'; 
  } else if (isMedicalContext) {
     cboOverride = '225125'; 
  }

  const targetComp = smartParseCompetencia(limitToCompetencia);

  // Improved Name Normalizer for Lookup (removes common prefixes)
  const cleanNameForLookup = (name: string) => {
      let s = normalizeKey(name);
      s = s.replace(/^DR\s+|^DRA\s+|^ENF\s+|^MEDICO\s+|^MED\s+/, '');
      return s.trim();
  };

  let rawItems: BpaItem[] = dataLines.map(line => {
    let cols: string[] = [];
    if (line.includes('\t')) {
        cols = line.split('\t');
    } else if (line.includes(';')) {
        cols = line.split(';');
    } else {
        const regex = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/;
        cols = line.split(regex);
    }
    
    cols = cols.map(c => c ? c.trim().replace(/^"|"$/g, '') : '');

    const getVal = (idx: number) => (idx !== -1 && cols[idx]) ? cols[idx] : '';
    const getDef = (field: keyof typeof defaults) => defaults[field] || '';

    const competencia = smartParseCompetencia(getVal(mapping.competencia) || getDef('competencia'));
    let cbo = getVal(mapping.cbo) || getDef('cbo');
    if (cboOverride) cbo = cboOverride;

    const rawProc = getVal(mapping.procedimento) || getDef('procedimento');
    const proc = smartParseProcedure(rawProc, procedureHeaderName);

    let item: BpaItem = {
      cnes: getVal(mapping.cnes) || getDef('cnes'),
      competencia,
      cbo,
      procedimento: proc,
      idade: smartParseAge(getVal(mapping.idade) || getDef('idade')),
      quantidade: getVal(mapping.quantidade) || getDef('quantidade'),
      origem: getVal(mapping.origem) || getDef('origem'),
    };

    if (mode === 'BPA-I') {
        let cnsProfVal = getVal(mapping.cns_profissional) || getDef('cns_profissional');
        const profName = getVal(mapping.nome_profissional) || getDef('nome_profissional');

        // --- UNIVERSAL DOCTOR/PROFESSIONAL LOOKUP LOGIC ---
        // Logic: 
        // 1. Check if CNS is empty OR if it looks like a name (non-numeric)
        // 2. Try to look up using the Name column
        // 3. Or try to look up using the CNS column value (if user mapped Name to CNS column by mistake)
        
        const isCnsInvalid = !cnsProfVal || isNaN(parseInt(cnsProfVal.replace(/[^0-9]/g, '')));
        
        if (isCnsInvalid) {
             let foundCns = '';
             
             // Try lookup using Name field
             if (profName) {
                const key = cleanNameForLookup(profName);
                if (professionalLookup[key]) foundCns = professionalLookup[key];
             }
             
             // If not found, try lookup using the value in CNS field (maybe it's a name)
             if (!foundCns && cnsProfVal) { 
                const key = cleanNameForLookup(cnsProfVal);
                if (professionalLookup[key]) foundCns = professionalLookup[key];
             }
             
             if (foundCns) cnsProfVal = foundCns;
        }

        const patientName = (getVal(mapping.nome_paciente) || '').toUpperCase().trim();
        let address = getVal(mapping.endereco_descr); 
        
        if (!address && patientName) {
             const key = normalizeKey(patientName);
             if (patientAddressLookup[key]) {
                 address = patientAddressLookup[key];
             }
        }

        // CNS Paciente Logic (Fallback to CPF if CNS missing)
        let cnsPacienteVal = getVal(mapping.cns_paciente);
        const cpfPacienteVal = getVal(mapping.cpf_paciente);

        if ((!cnsPacienteVal || cnsPacienteVal.trim() === '') && cpfPacienteVal) {
             cnsPacienteVal = cpfPacienteVal;
        }

        item = {
            ...item,
            nome_profissional: profName,
            cns_profissional: cnsProfVal,
            data_atendimento: getVal(mapping.data_atendimento), 
            cns_paciente: cnsPacienteVal, // Use resolved CNS/CPF value
            sexo: smartParseSex(getVal(mapping.sexo)),
            ibge_municipio: getVal(mapping.ibge_municipio) || getDef('ibge_municipio'),
            cid: getVal(mapping.cid),
            nome_paciente: patientName,
            data_nascimento: getVal(mapping.data_nascimento),
            raca: getVal(mapping.raca) || getDef('raca'),
            telefone: getVal(mapping.telefone) || getDef('telefone'),
            cep: getDef('cep'), 
            endereco_bairro: getVal(mapping.endereco_bairro) || getDef('endereco_bairro'),
            endereco_descr: address
        };
    }

    return item;
  });

  rawItems = rawItems.filter(i => 
      i.cnes && 
      i.procedimento && i.procedimento.trim().length > 0 &&
      i.quantidade && parseInt(i.quantidade) > 0
  );

  if (targetComp) {
      rawItems = rawItems.filter(i => i.competencia === targetComp);
  }

  rawItems = rawItems.filter(item => {
      if (item.procedimento === '0301100012' && isMedicalContext) return false;
      return true;
  });
  
  return rawItems;
};
