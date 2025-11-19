
import { BpaHeader, BpaItem, ColumnMapping, BpaMode } from '../types';

// Helper for fixed width padding
const padNum = (val: string | number | undefined, width: number): string => {
  const str = (val || '').toString().replace(/[^0-9]/g, ''); // Remove non-numeric for numeric fields
  return str.padStart(width, '0').substring(0, width);
};

const padAlpha = (val: string | undefined, width: number): string => {
  // Remove accents/special chars
  let str = (val || '').toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (str.length > width) {
    return str.substring(0, width);
  }
  return str.padEnd(width, ' ');
};

// Helper to format Date from AAAAMM or any format to AAAAMMDD (defaulting to 01 or current day if missing)
const formatDateFull = (val: string, competencia: string): string => {
  if (!val) {
      // Fallback: use competencia + '01'
      return padNum(competencia, 6) + '01';
  }
  
  const clean = val.replace(/[^0-9]/g, '');
  
  // If already 8 digits, return
  if (clean.length === 8) return clean;

  // If it is a standard date string passed from smart parser
  if (val.includes('/')) {
     const parts = val.split('/'); // DD/MM/YYYY
     if (parts.length === 3) {
        const d = parts[0].padStart(2,'0');
        const m = parts[1].padStart(2,'0');
        const y = parts[2];
        return `${y}${m}${d}`;
     }
  }
  
  // Fallback to competence start
  return padNum(competencia, 6) + '01';
}

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

// --- SMART PARSING HELPERS ---

const normalizeKey = (str: string) => str.trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

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
  if (LOOKUP_MEDICO[normalized]) return LOOKUP_MEDICO[normalized].replace(/[^0-9]/g, '');
  if (LOOKUP_ENFERMAGEM[normalized]) return LOOKUP_ENFERMAGEM[normalized].replace(/[^0-9]/g, '');
  if (LOOKUP_TECNICO[normalized]) return LOOKUP_TECNICO[normalized].replace(/[^0-9]/g, '');

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

export const generateBpaFileContent = (header: BpaHeader, items: BpaItem[], mode: BpaMode): string => {
  // FILTER: Only include items that match the Header's Competencia
  // Normalize header competence (e.g. if user typed 03/2025 -> 202503)
  const targetCompetencia = smartParseCompetencia(header.competencia);

  const relevantItems = items.filter(item => {
      // Sanitize Item Data just in case
      // Ensure CBO is pure numbers
      if (item.cbo) item.cbo = item.cbo.replace(/[^0-9]/g, '');
      // Ensure CNES is pure numbers
      if (item.cnes) item.cnes = item.cnes.replace(/[^0-9]/g, '');
      
      // Filter Logic
      return item.competencia === targetCompetencia;
  });

  // FINAL FILTER: Ensure forbidden codes are not generated
  const safeItems = relevantItems.filter(item => {
      // Explicitly forbid 0301100012 (ADM MED) as requested if it snuck in
      if (item.procedimento === '0301100012') return false;
      return true;
  });

  // 1. SORT ITEMS
  // Sort logic differs slightly for BPA-I (maybe group by Sheet/Professional), but generic sort works well.
  const sortedItems = [...safeItems].sort((a, b) => {
    if (a.cnes !== b.cnes) return a.cnes.localeCompare(b.cnes);
    if (a.competencia !== b.competencia) return a.competencia.localeCompare(b.competencia);
    
    // For BPA-I, maybe sort by Professional or Date?
    if (mode === 'BPA-I') {
        // Sort by CBO -> Professional -> Date -> Name
        if (a.cbo !== b.cbo) return a.cbo.localeCompare(b.cbo);
        if ((a.cns_profissional || '') !== (b.cns_profissional || '')) return (a.cns_profissional || '').localeCompare(b.cns_profissional || '');
    }

    if (a.cbo !== b.cbo) return a.cbo.localeCompare(b.cbo);
    if (a.procedimento !== b.procedimento) return a.procedimento.localeCompare(b.procedimento);
    if (a.idade !== b.idade) return a.idade.localeCompare(b.idade);
    return a.origem.localeCompare(b.origem);
  });

  const LINES_PER_SHEET = 20;
  
  // 2. CALCULATE PAGINATION
  let currentSheet = 1;
  let currentSeq = 1;
  let processedLines: string[] = [];
  
  // Total sheets count must be calculated correctly.
  // Since we reset sheet numbering per context change (Comp/CNES), we need to accumulate total sheets header value.
  let totalSheetsAccumulator = 0;
  let maxSheetInCurrentContext = 0;

  // Initialize with sortedItems[0] context
  if (sortedItems.length > 0) {
      maxSheetInCurrentContext = 1;
  }

  for (let i = 0; i < sortedItems.length; i++) {
    const item = sortedItems[i];
    const prevItem = i > 0 ? sortedItems[i - 1] : null;

    let newSheetNeeded = false;
    let resetNumbering = false;

    if (prevItem) {
      // Rule 1: If Context Changes (CNES or Competencia) -> RESET SHEETS
      if (prevItem.cnes !== item.cnes || prevItem.competencia !== item.competencia) {
        newSheetNeeded = true;
        resetNumbering = true;
        // Add max sheet from prev context to total
        totalSheetsAccumulator += maxSheetInCurrentContext;
        maxSheetInCurrentContext = 0;
      } 
      // Rule 2: Max 20 lines per sheet
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
        // --- RECORD 02 (Consolidated) ---
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
        // --- RECORD 03 (Individualized) ---
        // Reference: PDF Page 3, 4, 5, 6 (BPA-I Layout Interno)
        
        const dtAtendimento = formatDateFull(item.data_atendimento || '', item.competencia);
        const dtNasc = formatDateFull(item.data_nascimento || '', item.competencia);

        line = 
            '03' +                                          // 001-002 Identificação
            padNum(item.cnes, 7) +                          // 003-009 CNES
            padNum(item.competencia, 6) +                   // 010-015 Competência
            padNum(item.cns_profissional, 15) +             // 016-030 CNS Profissional
            padAlpha(item.cbo, 6) +                         // 031-036 CBO
            padNum(dtAtendimento, 8) +                      // 037-044 Data Atendimento AAAAMMDD
            padNum(currentSheet, 3) +                       // 045-047 Folha
            padNum(currentSeq, 2) +                         // 048-049 Seq
            padNum(item.procedimento, 10) +                 // 050-059 Procedimento
            padNum(item.cns_paciente, 15) +                 // 060-074 CNS Paciente
            padAlpha(item.sexo, 1) +                        // 075-075 Sexo (M/F)
            padNum(item.ibge_municipio, 6) +                // 076-081 IBGE Municipio Residência
            padAlpha(item.cid, 4) +                         // 082-085 CID
            padNum(item.idade, 3) +                         // 086-088 Idade
            padNum(item.quantidade, 6) +                    // 089-94  Qtde
            padAlpha(item.carater_atendimento || '01', 2) + // 95-96 Carater (01 Eletivo default)
            padNum(item.num_autorizacao, 13) +              // 97-109 Num Autorização
            padAlpha(item.origem, 3) +                      // 110-112 Origem
            padAlpha(item.nome_paciente, 30) +              // 113-142 Nome Paciente
            padNum(dtNasc, 8) +                             // 143-150 Dt Nasc AAAAMMDD
            padNum(item.raca, 2) +                          // 151-152 Raça/Cor
            padNum(item.etnia, 4) +                         // 153-156 Etnia
            padNum(item.nacionalidade || '010', 3) +        // 157-159 Nacionalidade (010 Brasil)
            padNum(item.servico, 3) +                       // 160-162 Serviço
            padNum(item.classificacao, 3) +                 // 163-165 Classificação
            padNum(item.equipe_seq, 8) +                    // 166-173 Equipe Seq
            padNum(item.equipe_area, 4) +                   // 174-177 Equipe Area
            padNum(item.cnpj_empresa, 14) +                 // 178-191 CNPJ
            padNum(item.cep, 8) +                           // 192-199 CEP
            padNum('000', 3) +                              // 200-202 Cod Logradouro (Deprecated often)
            padAlpha(item.logradouro || item.endereco_descr, 30) + // 203-232 Endereço
            padAlpha(item.endereco_compl, 10) +             // 233-242 Complemento
            padNum(item.endereco_numero, 5) +               // 243-247 Numero
            padAlpha(item.endereco_bairro, 30) +            // 248-277 Bairro
            padNum(item.telefone, 11) +                     // 278-288 Telefone
            padAlpha(item.email, 40) +                      // 289-328 Email
            padNum('', 10) +                                // 329-338 INE (Equipe) - Optional, usually empty in basic
            '';                                             // 339-340 Fim (CRLF added by join)

            // Note: Some layouts put INE at 329.
    }
    
    processedLines.push(line);
    currentSeq++;
  }

  // Add last context sheets
  totalSheetsAccumulator += maxSheetInCurrentContext;

  const totalItems = sortedItems.length;
  const totalLines = 1 + totalItems; // Header + Items

  // Checksum is calculated on the items INCLUDED in the file
  const checksum = calculateChecksum(sortedItems);

  let content = '';

  const headerLine = 
    '01' +
    '#BPA#' +
    padNum(targetCompetencia, 6) + // Use strict target competence in header
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

export const parseMappedData = (
  text: string, 
  mapping: ColumnMapping, 
  hasHeader: boolean,
  defaults: any, 
  shouldConsolidate: boolean,
  procedureHeaderName: string = '',
  mode: BpaMode
): BpaItem[] => {
  const lines = text.trim().split(/\r?\n/);
  const dataLines = hasHeader ? lines.slice(1) : lines;

  // Pre-calculate CBO Override based on Procedure Header
  const rawProcHeader = normalizeKey(procedureHeaderName);
  
  const isMedicalContext = rawProcHeader.includes('MEDICO') && rawProcHeader.includes('BPA');
  
  // Check for Nursing Context (Enfermagem) but exclude Techs/Auxs
  const isNursingContext = rawProcHeader.includes('ENFERMAGEM') && 
                           !rawProcHeader.includes('TEC') && 
                           !rawProcHeader.includes('AUX') && 
                           rawProcHeader.includes('BPA');

  let cboOverride = '';
  if ((rawProcHeader.includes('TEC') || rawProcHeader.includes('AUX')) && rawProcHeader.includes('BPA')) {
     cboOverride = '322205'; // TEC ENFERMAGEM
  } else if (isNursingContext) {
     cboOverride = '223505'; // ENFERMEIRO
  } else if (isMedicalContext) {
     cboOverride = '225125'; // MEDICO
  }

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

    // Common fields
    const rawCnes = mapping.cnes !== -1 ? getValue(mapping.cnes) : defaults.cnes;
    const rawComp = mapping.competencia !== -1 ? getValue(mapping.competencia) : defaults.competencia;
    const rawOrigem = mapping.origem !== -1 ? getValue(mapping.origem) : defaults.origem;
    const rawIdade = getValue(mapping.idade);
    const rawQtde = getValue(mapping.quantidade);
    const rawProc = getValue(mapping.procedimento);
    
    // CBO Logic: Check override first, then map, then default
    let finalCbo = '';
    if (cboOverride) {
        finalCbo = cboOverride;
    } else {
        finalCbo = mapping.cbo !== -1 ? getValue(mapping.cbo) : defaults.cbo;
    }

    // BPA-I fields
    const rawCnsProf = mapping.cns_profissional !== -1 ? getValue(mapping.cns_profissional) : defaults.cns_profissional;
    const rawCnsPac = mapping.cns_paciente !== -1 ? getValue(mapping.cns_paciente) : '';
    const rawNomePac = mapping.nome_paciente !== -1 ? getValue(mapping.nome_paciente) : '';
    const rawDtNasc = mapping.data_nascimento !== -1 ? getValue(mapping.data_nascimento) : '';
    const rawSexo = mapping.sexo !== -1 ? getValue(mapping.sexo) : '';
    const rawRaca = mapping.raca !== -1 ? getValue(mapping.raca) : defaults.raca;
    const rawTel = mapping.telefone !== -1 ? getValue(mapping.telefone) : '';
    const rawMun = mapping.ibge_municipio !== -1 ? getValue(mapping.ibge_municipio) : defaults.ibge_municipio;

    return {
      cnes: rawCnes || defaults.cnes,
      competencia: smartParseCompetencia(rawComp || defaults.competencia),
      cbo: finalCbo,
      procedimento: smartParseProcedure(rawProc, procedureHeaderName),
      idade: smartParseAge(rawIdade),
      quantidade: rawQtde === '' ? '1' : rawQtde,
      origem: rawOrigem || 'BPA',
      
      // BPA-I specific
      cns_profissional: rawCnsProf,
      cns_paciente: rawCnsPac,
      nome_paciente: rawNomePac,
      data_nascimento: rawDtNasc, // Formatting happens in generation to keep raw valid for Date object
      sexo: smartParseSex(rawSexo),
      raca: rawRaca,
      telefone: rawTel,
      ibge_municipio: rawMun,
      data_atendimento: rawComp || defaults.competencia, // Logic to infer date if missing
      // Defaults for fields that are often static or derived
      nacionalidade: '010',
      carater_atendimento: '01'
    };
  }).filter(item => item.procedimento !== ''); 

  // FILTER: Exclude specific Medical procedure if requested (0301100012)
  // Only applies if in Medical Context
  const filteredRawItems = rawItems.filter(item => {
     if (isMedicalContext && item.procedimento === '0301100012') {
         return false; // Drop it
     }
     return true;
  });

  // BPA-C Consolidates. BPA-I usually SHOULD NOT consolidate (individualized), 
  // unless exactly same patient/procedure/day.
  
  if (!shouldConsolidate || mode === 'BPA-I') {
    return filteredRawItems;
  }

  const map = new Map<string, BpaItem>();
  
  filteredRawItems.forEach(item => {
    let key = '';
    
    // STRICT CONSOLIDATION RULE:
    // If Medical OR Nursing Context, consolidate by Procedure Code only (Sum Qty, Ignore Age/Origin differences)
    if (isMedicalContext || isNursingContext) {
        key = `${item.cnes}|${item.competencia}|${item.cbo}|${item.procedimento}`;
    } else {
        // Standard Rule: Consolidate by Procedure + Age + Origin
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
