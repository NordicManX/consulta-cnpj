'use client';

import { useState } from 'react';
import { maskCnpj } from '../utils/mask';
import { fetchCnpj } from '../lib/api';
import { supabase } from '../lib/supabase';

export default function Home() {
  const [cnpjInput, setCnpjInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resultado, setResultado] = useState<any>(null);
  const [erro, setErro] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCnpjInput(maskCnpj(e.target.value));
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cnpjInput.length < 18) return;

    setIsLoading(true);
    setErro(null);
    setResultado(null);

    const cleanCnpj = cnpjInput.replace(/\D/g, '');

    try {
      // 1. Busca no Banco de Dados (Cache)
      const { data: cacheData } = await supabase
        .from('consultas_cnpj')
        .select('*')
        .eq('cnpj', cleanCnpj)
        .single();

      if (cacheData) {
        setResultado(cacheData);
        setIsLoading(false);
        return;
      }

      // 2. Busca na API Externa
      const apiData = await fetchCnpj(cnpjInput);

      // 3. Mapeia incluindo os novos dados organizados
      const novoRegistro = {
        cnpj: cleanCnpj,
        razao_social: apiData.razao_social,
        nome_fantasia: apiData.estabelecimento.nome_fantasia,
        situacao_cadastral: apiData.estabelecimento.situacao_cadastral,
        inscricoes_estaduais: apiData.estabelecimento.inscricoes_estaduais,
        capital_social: apiData.capital_social,
        data_abertura: apiData.estabelecimento.data_inicio_atividade,
        qsa: apiData.qsa || [],
        cnae_principal: apiData.estabelecimento.cnae_fiscal_principal,
        endereco: {
          logradouro: apiData.estabelecimento.logradouro,
          numero: apiData.estabelecimento.numero,
          complemento: apiData.estabelecimento.complemento,
          bairro: apiData.estabelecimento.bairro,
          cep: apiData.estabelecimento.cep,
          cidade: apiData.estabelecimento.cidade.nome,
          estado: apiData.estabelecimento.estado.sigla,
        }
      };

      // 4. Salva no banco de dados
      await supabase.from('consultas_cnpj').insert([novoRegistro]);

      setResultado(novoRegistro);
    } catch (err: any) {
      setErro(err.message || 'Erro ao processar consulta.');
    } {
      setIsLoading(false);
    }
  };

  // Formatador simples para o Capital Social (Ex: 100000 -> R$ 100.000,00)
  const formatarMoeda = (valor: string) => {
    const num = parseFloat(valor);
    if (isNaN(num)) return 'Não informado';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num);
  };

  // Formatador simples para Data (Ex: 2020-05-15 -> 15/05/2020)
  const formatarData = (dataStr: string) => {
    if (!dataStr) return 'Não informada';
    const partes = dataStr.split('-');
    if (partes.length !== 3) return dataStr;
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  };

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8 flex flex-col items-center justify-start pt-16 font-sans">
      <div className="w-full max-w-4xl space-y-6">
        
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Consulta CNPJ</h1>
          <p className="text-gray-500 max-w-md mx-auto">Consulta de dados cadastrais, financeiros e quadro societário.</p>
        </div>

        <form onSubmit={handleSearch} className="w-full max-w-3xl mx-auto flex items-center gap-4">
          <input
            type="text"
            value={cnpjInput}
            onChange={handleInputChange}
            placeholder="00.000.000/0000-00"
            className="flex-1 px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-lg text-gray-900 placeholder-gray-400 bg-white"
          />
          <button
            type="submit"
            disabled={isLoading || cnpjInput.length < 18}
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all whitespace-nowrap"
          >
            {isLoading ? 'Buscando...' : 'Consultar'}
          </button>
        </form>

        {erro && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200 text-center font-medium max-w-3xl mx-auto">
            {erro}
          </div>
        )}

        {resultado && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 divide-y divide-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
            
            {/* Bloco 1: Identificação Principal */}
            <div className="p-6 bg-gradient-to-r from-gray-50 to-white">
              <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-blue-50 text-blue-700 border border-blue-100">
                CNPJ: {resultado.cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5")}
              </span>
              <h2 className="text-2xl font-bold text-gray-900 mt-2">{resultado.razao_social}</h2>
              {resultado.nome_fantasia && (
                <p className="text-gray-500 text-md mt-0.5">{resultado.nome_fantasia}</p>
              )}
            </div>

            {/* Bloco 2: Informações Fiscais & Financeiras */}
            <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Situação Cadastral</p>
                <span className={`inline-flex px-2 py-0.5 text-sm font-semibold rounded-md ${
                  resultado.situacao_cadastral === 'Ativa' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                } border`}>
                  {resultado.situacao_cadastral}
                </span>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Data de Abertura</p>
                <p className="font-semibold text-gray-800">{formatarData(resultado.data_abertura)}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Capital Social</p>
                <p className="font-semibold text-gray-800">{formatarMoeda(resultado.capital_social)}</p>
              </div>
            </div>

            {/* Bloco 3: Atividade Econômica (CNAE) */}
            {resultado.cnae_principal && (
              <div className="p-6">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Atividade Econômica Principal (CNAE)</p>
                <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <strong className="text-gray-900 font-mono">{resultado.cnae_principal.id}</strong> — {resultado.cnae_principal.descricao}
                </div>
              </div>
            )}

            {/* Bloco 4: Localização */}
            <div className="p-6">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Endereço Completo</p>
              <p className="text-sm text-gray-800">
                {resultado.endereco.logradouro}, {resultado.endereco.numero}
                {resultado.endereco.complemento && ` — ${resultado.endereco.complemento}`}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {resultado.endereco.bairro} — {resultado.endereco.cidade}/{resultado.endereco.estado} — CEP: {resultado.endereco.cep}
              </p>
            </div>

            {/* Bloco 5: Inscrições Estaduais */}
            <div className="p-6">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Inscrições Estaduais</p>
              {resultado.inscricoes_estaduais && resultado.inscricoes_estaduais.length > 0 ? (
                <div className="flex gap-2 flex-wrap">
                  {resultado.inscricoes_estaduais.map((ie: any, idx: number) => (
                    <span key={idx} className={`px-2.5 py-1 text-xs font-medium rounded-md border ${
                      ie.ativo ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
                    }`}>
                      {ie.estado.sigla}: {ie.inscricao_estadual} ({ie.ativo ? 'Ativa' : 'Inativa'})
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">Nenhuma inscrição estadual vinculada.</p>
              )}
            </div>

            {/* Bloco 6: Quadro de Sócios e Administradores (QSA) */}
            <div className="p-6 bg-gray-50/50">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Quadro de Sócios e Administradores (QSA)</p>
              {resultado.qsa && resultado.qsa.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {resultado.qsa.map((socio: any, idx: number) => (
                    <div key={idx} className="bg-white p-3 rounded-lg border border-gray-200/80 shadow-sm flex flex-col justify-center">
                      <p className="text-sm font-bold text-gray-900">{socio.nome}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{socio.qualificacao_socio.descricao}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">Empresa Individual ou QSA não disponível publicamente.</p>
              )}
            </div>

          </div>
        )}
      </div>
    </main>
  );
}