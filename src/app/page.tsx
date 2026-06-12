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

      const apiData = await fetchCnpj(cnpjInput);

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

      await supabase.from('consultas_cnpj').insert([novoRegistro]);
      setResultado(novoRegistro);
    } catch (err: any) {
      setErro(err.message || 'Erro ao processar consulta.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatarMoeda = (valor: string) => {
    const num = parseFloat(valor);
    if (isNaN(num)) return 'Não informado';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num);
  };

  const formatarData = (dataStr: string) => {
    if (!dataStr) return 'Não informada';
    const partes = dataStr.split('-');
    if (partes.length !== 3) return dataStr;
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  };

  return (
    
    <main className="min-h-screen bg-gray-50 p-4 md:p-8 flex flex-col items-center justify-start pt-16 font-sans print:p-8 print:pt-16 print:bg-white">
      <div className="w-full max-w-4xl space-y-6 print:max-w-full">
        

        <div className="text-center space-y-2 print:hidden">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Consulta de CNPJ</h1>
          <p className="text-gray-500 max-w-md mx-auto">Consulta de dados cadastrais, financeiros e quadro societário.</p>
        </div>

      
        <form onSubmit={handleSearch} className="w-full max-w-3xl mx-auto flex items-center gap-4 print:hidden">
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
          <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200 text-center font-medium max-w-3xl mx-auto print:hidden">
            {erro}
          </div>
        )}

        {resultado && (
          
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 divide-y divide-gray-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300 print:shadow-none print:border-0 print:divide-gray-300">
            
            {/* Bloco 1: Identificação Principal + Botão de Impressão */}
            <div className="p-6 bg-gradient-to-r from-gray-50 to-white flex justify-between items-start print:bg-none print:p-0 print:pb-4">
              <div>
                <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-blue-50 text-blue-700 border border-blue-100 print:bg-white print:text-black print:border-black">
                  CNPJ: {resultado.cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5")}
                </span>
                <h2 className="text-2xl font-bold text-gray-900 mt-2 print:text-xl">{resultado.razao_social}</h2>
                {resultado.nome_fantasia && (
                  <p className="text-gray-500 text-md mt-0.5 print:text-sm">{resultado.nome_fantasia}</p>
                )}
              </div>
              
             
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg shadow-sm flex items-center gap-2 transition-all print:hidden"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Imprimir Relatório
              </button>
            </div>

           
            <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-6 print:p-0 print:py-4 print:grid-cols-3">
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1 print:text-black print:font-bold">Situação Cadastral</p>
                <span className={`inline-flex px-2 py-0.5 text-sm font-semibold rounded-md ${
                  resultado.situacao_cadastral === 'Ativa' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                } border print:bg-white print:text-black print:border-none print:p-0`}>
                  {resultado.situacao_cadastral}
                </span>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1 print:text-black print:font-bold">Data de Abertura</p>
                <p className="font-semibold text-gray-800 print:text-sm print:font-normal">{formatarData(resultado.data_abertura)}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1 print:text-black print:font-bold">Capital Social</p>
                <p className="font-semibold text-gray-800 print:text-sm print:font-normal">{formatarMoeda(resultado.capital_social)}</p>
              </div>
            </div>

           
            {resultado.cnae_principal && (
              <div className="p-6 print:p-0 print:py-4">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2 print:text-black print:font-bold">Atividade Econômica Principal (CNAE)</p>
                <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100 print:bg-white print:p-0 print:border-none">
                  <strong className="text-gray-900 font-mono print:font-sans">{resultado.cnae_principal.id}</strong> — {resultado.cnae_principal.descricao}
                </div>
              </div>
            )}

           
            <div className="p-6 print:p-0 print:py-4">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2 print:text-black print:font-bold">Endereço Completo</p>
              <p className="text-sm text-gray-800">
                {resultado.endereco.logradouro}, {resultado.endereco.numero}
                {resultado.endereco.complemento && ` — ${resultado.endereco.complemento}`}
              </p>
              <p className="text-sm text-gray-600 mt-1 print:text-black">
                {resultado.endereco.bairro} — {resultado.endereco.cidade}/{resultado.endereco.estado} — CEP: {resultado.endereco.cep}
              </p>
            </div>

           
            <div className="p-6 print:p-0 print:py-4">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3 print:text-black print:font-bold">Inscrições Estaduais</p>
              {resultado.inscricoes_estaduais && resultado.inscricoes_estaduais.length > 0 ? (
                <div className="flex gap-2 flex-wrap print:flex-col print:gap-1">
                  {resultado.inscricoes_estaduais.map((ie: any, idx: number) => (
                    <span key={idx} className={`px-2.5 py-1 text-xs font-medium rounded-md border ${
                      ie.ativo ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
                    } print:bg-white print:text-black print:border-none print:p-0 print:text-sm`}>
                      <strong>{ie.estado.sigla}:</strong> {ie.inscricao_estadual} ({ie.ativo ? 'Ativa' : 'Inativa'})
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic print:text-black">Nenhuma inscrição estadual vinculada.</p>
              )}
            </div>

            
            <div className="p-6 bg-gray-50/50 print:bg-white print:p-0 print:py-4">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3 print:text-black print:font-bold">Quadro de Sócios e Administradores (QSA)</p>
              {resultado.qsa && resultado.qsa.length > 0 ? (
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 print:grid-cols-1 print:gap-2">
                  {resultado.qsa.map((socio: any, idx: number) => (
                    <div key={idx} className="bg-white p-3 rounded-lg border border-gray-200/80 shadow-sm flex flex-col justify-center print:p-0 print:border-none print:shadow-none">
                      <p className="text-sm font-bold text-gray-900 print:text-sm print:font-normal">• {socio.nome} — <span className="text-gray-500 text-xs print:text-sm print:text-gray-700">{socio.qualificacao_socio.descricao}</span></p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic print:text-black">Empresa Individual ou QSA não disponível publicamente.</p>
              )}
            </div>

          </div>
        )}
      </div>
    </main>
  );
}