
export type BpaMode = 'BPA-C' | 'BPA-I';

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
  // Common Fields
  cnes: string;
  competencia: string; // AAAAMM
  cbo: string;
  procedimento: string;
  idade: string;
  quantidade: string;
  origem: string;

  // BPA-I Specific Fields (Optional for BPA-C)
  nome_profissional?: string; // Added for UI reference and lookup
  cns_profissional?: string; // 15 digits
  data_atendimento?: string; // AAAAMMDD
  cns_paciente?: string; // 15 digits
  sexo?: string; // M or F
  ibge_municipio?: string; // 6 digits
  cid?: string; // 4 chars
  carater_atendimento?: string; // 2 digits (01=Eletivo)
  num_autorizacao?: string; // 13 digits
  nome_paciente?: string; // 30 chars
  data_nascimento?: string; // AAAAMMDD
  raca?: string; // 2 digits
  etnia?: string; // 4 digits
  nacionalidade?: string; // 3 digits (010 = BR)
  servico?: string; // 3 digits
  classificacao?: string; // 3 digits
  equipe_seq?: string; // 8 digits
  equipe_area?: string; // 4 digits
  cnpj_empresa?: string; // 14 digits
  cep?: string; // 8 digits
  logradouro?: string; // 3 digits (code) or free text? Layout says 'Código logradouro' (003) then 'Endereço' (030)
  endereco_descr?: string; // 30 chars
  endereco_numero?: string; // 5 chars
  endereco_compl?: string; // 10 chars
  endereco_bairro?: string; // 30 chars
  telefone?: string; // 11 digits
  email?: string; // 40 chars
}

export interface ColumnMapping {
  cnes: number;
  competencia: number;
  cbo: number;
  procedimento: number;
  idade: number;
  quantidade: number;
  origem: number;

  // BPA-I Mappings
  nome_profissional: number; // Added
  cns_profissional: number;
  data_atendimento: number;
  cns_paciente: number;
  cpf_paciente: number; // Fallback for CNS
  sexo: number;
  ibge_municipio: number;
  cid: number;
  nome_paciente: number;
  data_nascimento: number;
  raca: number;
  telefone: number;
  endereco_descr: number;
  endereco_numero: number;
  endereco_bairro: number;
}

// Helper to track validation errors
export interface ValidationError {
  row: number;
  field: string;
  message: string;
}

export const DEFAULT_HEADER: BpaHeader = {
  competencia: new Date().toISOString().slice(0, 7).replace('-', ''),
  responsavel: 'SECRETARIA DE SAUDE',
  sigla: 'SMS',
  cnpj: '11306581000100',
  destino: 'SECRETARIA MUNICIPAL DE SAUDE',
  indicador: 'M',
  versao: 'BPA_MAG',
};

export const EXAMPLE_CSV = `CNES\tCOMPETENCIA\tCBO\tPROCEDIMENTO\tIDADE\tQUANTIDADE\tORIGEM
1234567\t202310\t225125\t0301010072\t025\t1\tBPA
7654321\t202310\t223505\t0301010048\t045\t2\tBPA`;

export const EXAMPLE_CSV_BPA_I = `CNES\tDATA\tCBO\tCNS_PROF\tPROCEDIMENTO\tCNS_PACIENTE\tNOME_PACIENTE\tDT_NASC\tSEXO\tRACA
1234567\t25/09/2023\t225125\t700000000000000\t0301010072\t898000000000000\tJOAO DA SILVA\t10/05/1980\tM\t01
1234567\t26/09/2023\t225125\t700000000000000\t0301010072\t898000000000001\tMARIA SOUZA\t20/08/1995\tF\t02`;
