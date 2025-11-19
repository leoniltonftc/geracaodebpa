import { BpaHeader, BpaItem, ColumnMapping } from '../types';

// Helper for fixed width padding
const padNum = (val: string | number, width: number): string => {
  const str = val.toString().replace(/[^0-9]/g, ''); // Remove non-numeric for numeric fields
  return str.padStart(width, '0').substring(0, width);
};

const padAlpha = (val: string, width: number): string => {
  // Remove accents/special chars
  let str = val.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (str.length > width) {
    return str.substring(0, width);
  }
  return str.padEnd(width, ' ');
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

export const generateBpaFileContent = (header: BpaHeader, items: BpaItem[]): string => {
  const LINES_PER_SHEET = 20;
  const totalItems = items.length;
  const totalSheets = Math.ceil(totalItems / LINES_PER_SHEET) || 1;
  const totalLines = 1 + totalItems; 

  const checksum = calculateChecksum(items);

  let content = '';

  const headerLine = 
    '01' +
    '#BPA#' +
    padNum(header.competencia, 6) +
    padNum(totalLines, 6) +
    padNum(totalSheets, 6) +
    padNum(checksum, 4) +
    padAlpha(header.responsavel, 30) +
    padAlpha(header.sigla, 6) +
    padNum(header.cnpj, 14) +
    padAlpha(header.destino, 40) +
    header.indicador + 
    padAlpha(header.versao, 10);

  content += headerLine + '\r\n';

  items.forEach((item, index) => {
    const sheetNum = Math.floor(index / LINES_PER_SHEET) + 1;
    const seqNum = (index % LINES_PER_SHEET) + 1;

    const line = 
      '02' +
      padNum(item.cnes, 7) +
      padNum(item.competencia, 6) +
      padAlpha(item.cbo, 6) +
      padNum(sheetNum, 3) +
      padNum(seqNum, 2) +
      padNum(item.procedimento, 10) +
      padNum(item.idade, 3) +
      padNum(item.quantidade, 6) +
      padAlpha(item.origem, 3);
      
    content += line + '\r\n';
  });

  return content;
};

// --- SMART PARSING HELPERS ---

const normalizeKey = (str: string) => str.trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

// Dictionaries
const LOOKUP_MEDICO: Record<string, string> = {
  "ELETROCARDIOGRAMA": "0211020036",
  "CONSULTA MEDICA EM ATENCAO ESPECIALIZADA": "0301010072",
  "ADMINISTRACAO DE MEDICAMENTOS NA ATENCAO ESPECIALIZADA": "0301100012",
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
  "RETIRADA DE CORPO ESTRANHO SUBCUTANEO": "040101011", // As requested
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
  // (e.g. user put a medico code in technical column but description matches generally)
  if (LOOKUP_MEDICO[normalized]) return LOOKUP_MEDICO[normalized].replace(/[^0-9]/g, '');
  if (LOOKUP_ENFERMAGEM[normalized]) return LOOKUP_ENFERMAGEM[normalized].replace(/[^0-9]/g, '');
  if (LOOKUP_TECNICO[normalized]) return LOOKUP_TECNICO[normalized].replace(/[^0-9]/g, '');

  // If not found in any lookup, assume it's a code and strip punctuation
  return val.replace(/[^0-9]/g, '');
};

// Converts "25/09/2023", "09/2023", "2023-09-25" to "202309"
const smartParseCompetencia = (val: string): string => {
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

export const parseMappedData = (
  text: string, 
  mapping: ColumnMapping, 
  hasHeader: boolean,
  defaults: { cnes: string, competencia: string, origem: string },
  shouldConsolidate: boolean,
  procedureHeaderName: string = '' // NEW: Context for procedure parsing
): BpaItem[] => {
  const lines = text.trim().split(/\r?\n/);
  const dataLines = hasHeader ? lines.slice(1) : lines;

  let rawItems: BpaItem[] = dataLines.map(line => {
    let cols: string[] = [];
    if (line.includes('\t')) {
        cols = line.split('\t');
    } else if (line.includes(';')) {
        cols = line.split(';');
    } else {
        cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/); 
    }

    const getValue = (index: number) => {
      if (index < 0 || index >= cols.length) return '';
      let val = cols[index].trim();
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.substring(1, val.length - 1);
      }
      return val;
    };

    const rawCnes = mapping.cnes !== -1 ? getValue(mapping.cnes) : defaults.cnes;
    const rawComp = mapping.competencia !== -1 ? getValue(mapping.competencia) : defaults.competencia;
    const rawOrigem = mapping.origem !== -1 ? getValue(mapping.origem) : defaults.origem;
    
    const rawIdade = getValue(mapping.idade);
    const rawQtde = getValue(mapping.quantidade);
    const rawProc = getValue(mapping.procedimento);

    return {
      cnes: rawCnes || defaults.cnes,
      competencia: smartParseCompetencia(rawComp || defaults.competencia),
      cbo: getValue(mapping.cbo),
      procedimento: smartParseProcedure(rawProc, procedureHeaderName),
      idade: smartParseAge(rawIdade),
      quantidade: rawQtde === '' ? '1' : rawQtde,
      origem: rawOrigem || 'BPA'
    };
  }).filter(item => item.procedimento !== ''); 

  if (!shouldConsolidate) {
    return rawItems;
  }

  const map = new Map<string, BpaItem>();

  rawItems.forEach(item => {
    const key = `${item.cnes}|${item.competencia}|${item.cbo}|${item.procedimento}|${item.idade}|${item.origem}`;
    
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