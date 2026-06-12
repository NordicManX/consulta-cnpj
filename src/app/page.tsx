'use client';

import { useState, useEffect } from 'react';
import { maskCnpj } from '../utils/mask';
import { fetchCnpj } from '../lib/api';
import { supabase } from '../lib/supabase';

export default function Home() {
  const [cnpjInput, setCnpjInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resultado, setResultado] = useState<any>(null);
  const [erro, setErro] = useState<string | null>(null);

  // Estado para armazenar a lista de buscas da sessão atual
  const [historico, setHistorico] = useState<any[]>([]);

  // Carrega o histórico salvo ao abrir a página
  useEffect(() => {
    const historicoSalvo = sessionStorage.getItem('cnpj_historico_sessao');
    if (historicoSalvo) {
      setHistorico(JSON.parse(historicoSalvo));
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCnpjInput(maskCnpj(e.target.value));
  };

  // Atualiza o histórico lateral e salva no cache do navegador
  const atualizarHistorico = (novoRegistro: any) => {
    setHistorico((prevHistorico) => {
      const filtrado = prevHistorico.filter((item) => item.cnpj !== novoRegistro.cnpj);
      const listaAtualizada = [novoRegistro, ...filtrado];
      sessionStorage.setItem('cnpj_historico_sessao', JSON.stringify(listaAtualizada));
      return listaAtualizada;
    });
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
        .maybeSingle();

      if (cacheData) {
        setResultado(cacheData);
        atualizarHistorico(cacheData);
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
      atualizarHistorico(novoRegistro);
    } catch (err: any) {
      setErro(err.message || 'Erro ao processar consulta.');
    } finally {
      setIsLoading(false);
    }
  };

  // Renderiza a empresa direto do histórico lateral sem gastar requisição
  const selecionarDoHistorico = (empresa: any) => {
    setResultado(empresa);
    setCnpjInput(maskCnpj(empresa.cnpj));
    setErro(null);
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
      {/* Container expandido para suportar o layout com a barra lateral */}
      <div className="w-full max-w-6xl flex flex-col md:flex-row gap-6 print:max-w-full print:flex-col">
        
        {/* Barra Lateral: Histórico de Consultas */}
        <div className="w-full md:w-64 flex flex-col gap-4 print:hidden shrink-0">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200/80">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-2 mb-3">
              Consultas da Sessão
            </h3>
            
            {historico.length === 0 ? (
              <p className="text-xs text-gray-400 italic text-center py-4">Nenhuma consulta recente nesta aba.</p>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                {historico.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => selecionarDoHistorico(item)}
                    className={`w-full text-left p-2.5 rounded-lg border text-xs transition-all flex flex-col gap-1 hover:border-blue-300 hover:bg-blue-50/30 ${
                      resultado?.cnpj === item.cnpj 
                        ? 'border-blue-500 bg-blue-50/50 font-medium' 
                        : 'border-gray-100 bg-gray-50/50'
                    }`}
                  >
                    <span className="font-bold text-gray-900 truncate w-full">
                      {item.razao_social}
                    </span>
                    <span className="text-gray-500 font-mono">
                      {item.cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5")}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Área Principal de Pesquisa e Exibição */}
        <div className="flex-1 space-y-6">
          <div className="text-center md:text-left space-y-2 print:hidden">
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Consulta de CNPJ</h1>
            <p className="text-gray-500 max-w-md mx-auto md:mx-0">Consulta de dados cadastrais, financeiros e quadro societário.</p>
          </div>

          <form onSubmit={handleSearch} className="w-full flex flex-col sm:flex-row items-center gap-4 print:hidden">
            <input
              type="text"
              value={cnpjInput}
              onChange={handleInputChange}
              placeholder="00.000.000/0000-00"
              className="w-full sm:flex-1 px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-lg text-gray-900 placeholder-gray-400 bg-white"
            />
            <button
              type="submit"
              disabled={isLoading || cnpjInput.length < 18}
              className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all whitespace-nowrap"
            >
              {isLoading ? 'Buscando...' : 'Consultar'}
            </button>
          </form>

          {erro && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200 text-center font-medium print:hidden">
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
                  Imprimir
                </button>
              </div>

              {/* Bloco 2: Informações Fiscais & Financeiras */}
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

              {/* Bloco 3: Atividade Econômica (CNAE) */}
              {resultado.cnae_principal && (
                <div className="p-6 print:p-0 print:py-4">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2 print:text-black print:font-bold">Atividade Econômica Principal (CNAE)</p>
                  <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100 print:bg-white print:p-0 print:border-none">
                    <strong className="text-gray-900 font-mono print:font-sans">{resultado.cnae_principal.id}</strong> — {resultado.cnae_principal.descricao}
                  </div>
                </div>
              )}

              {/* Bloco 4: Localização */}
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

              {/* Bloco 5: Inscrições Estaduais */}
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

              {/* Bloco 6: Quadro de Sócios (QSA) */}
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
      </div>

      {/* Seu rodapé customizado mantido perfeitamente no lugar */}
      <footer className="mt-12 text-center text-gray-500 text-sm print:hidden">
        Desenvolvido por Nordic-Tech - 2026. Consulta CNPJ. Dados fornecidos por API pública do Governo Brasileiro.
      </footer>
    </main>
  );
}