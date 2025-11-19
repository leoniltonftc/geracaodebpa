import React from 'react';
import { BpaHeader } from '../types';
import { FileText, Building2, Hash, Calendar } from 'lucide-react';

interface Props {
  data: BpaHeader;
  onChange: (data: BpaHeader) => void;
}

const HeaderForm: React.FC<Props> = ({ data, onChange }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    onChange({ ...data, [name]: value });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
        <FileText className="w-5 h-5 text-blue-600" />
        <h2 className="text-lg font-semibold text-gray-800">Dados do Cabeçalho (Header)</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Responsável */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
            Nome do Órgão Responsável
            <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              name="responsavel"
              maxLength={30}
              value={data.responsavel}
              onChange={handleChange}
              placeholder="Ex: SECRETARIA DE SAUDE"
              className="pl-9 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <p className="text-xs text-gray-500">Máx 30 caracteres</p>
        </div>

        {/* CNPJ */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
            CNPJ / CPF Responsável
            <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Hash className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              name="cnpj"
              maxLength={14}
              value={data.cnpj}
              onChange={handleChange}
              placeholder="Apenas números"
              className="pl-9 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Competência */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
            Competência (AAAAMM)
            <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              name="competencia"
              maxLength={6}
              value={data.competencia}
              onChange={handleChange}
              placeholder="202310"
              className="pl-9 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Sigla */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Sigla do Órgão</label>
          <input
            type="text"
            name="sigla"
            maxLength={6}
            value={data.sigla}
            onChange={handleChange}
            placeholder="Ex: SMS"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Destino */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Órgão Destino</label>
          <input
            type="text"
            name="destino"
            maxLength={40}
            value={data.destino}
            onChange={handleChange}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Indicador */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Esfera</label>
          <select
            name="indicador"
            value={data.indicador}
            onChange={handleChange}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="M">Municipal (M)</option>
            <option value="E">Estadual (E)</option>
          </select>
        </div>

      </div>
    </div>
  );
};

export default HeaderForm;