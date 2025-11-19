export interface BpaHeader {
  competencia: string; // AAAAMM
  responsavel: string;
  sigla: string;
  cnpj: string;
  destino: string;
  indicador: 'E' | 'M';
  versao: string;
}

export interface BpaItem {
  cnes: string;
  competencia: string; // AAAAMM
  cbo: string;
  procedimento: string;
  idade: string;
  quantidade: string;
  origem: string;
}

export interface ColumnMapping {
  cnes: number;
  competencia: number;
  cbo: number;
  procedimento: number;
  idade: number;
  quantidade: number;
  origem: number;
}

// Helper to track validation errors
export interface ValidationError {
  row: number;
  field: string;
  message: string;
}

export const DEFAULT_HEADER: BpaHeader = {
  competencia: new Date().toISOString().slice(0, 7).replace('-', ''),
  responsavel: '',
  sigla: '',
  cnpj: '11306581000100',
  destino: 'SECRETARIA MUNICIPAL DE SAUDE',
  indicador: 'M',
  versao: 'BPA_MAG',
};

export const EXAMPLE_CSV = `CNES\tCOMPETENCIA\tCBO\tPROCEDIMENTO\tIDADE\tQUANTIDADE\tORIGEM
1234567\t202310\t225125\t0301010072\t025\t1\tBPA
7654321\t202310\t223505\t0301010048\t045\t2\tBPA`;