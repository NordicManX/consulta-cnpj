'use client';

import { useState } from 'react';
import { maskCnpj } from '../utils/mask';

export default function Home() {
  const [cnpjInput, setCnpjInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Função que lida com a digitação no input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatado = maskCnpj(e.target.value);
    setCnpjInput(formatado);
  };

  // Função disparada ao clicar no botão ou apertar Enter
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cnpjInput.length < 18) return; // 14 dígitos + 4 caracteres da máscara

    setIsLoading(true);
    // Aqui entrará a lógica de integração no próximo passo!
    console.log('Buscando CNPJ:', cnpjInput);
    
    // Simulando um tempo de carregamento apenas para testar o visual do botão
    setTimeout(() => setIsLoading(false), 1000);
  };

  return (
    <main className="min-h-screen bg-gray-50 p-8 flex flex-col items-center justify-center font-sans">
      <div className="w-full max-w-3xl space-y-8">
        
        {/* Cabeçalho */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Consulta Inteligente de CNPJ</h1>
          <p className="text-gray-500 mt-2">Busca rápida com Inscrição Estadual e cachê inteligente.</p>
        </div>

        {/* Formulário de Busca */}
        <form onSubmit={handleSearch} className="w-full max-w-3xl mx-auto flex items-center gap-4">
  <input
    type="text"
    value={cnpjInput}
    onChange={handleInputChange}
    placeholder="07.307.860/0001-11"
    // Adicionei flex-1 para o input ocupar o espaço disponível e manter o alinhamento
    className="flex-1 px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-lg text-gray-900 placeholder-gray-400 bg-white"
  />
  <button
    type="submit"
    disabled={isLoading || cnpjInput.length < 18}
    // Removi paddings horizontais exagerados para o botão não quebrar a linha
    className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all whitespace-nowrap"
  >
    {isLoading ? 'Buscando...' : 'Consultar'}
  </button>
</form>

        {/* Área reservada para o Card de Resultado (Por enquanto vazio visualmente, aguardando os dados) */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 min-h-[200px] flex items-center justify-center text-gray-400">
          Nenhum CNPJ consultado ainda. Digite acima para começar.
        </div>

      </div>
      <footer className="mt-12 text-center text-gray-500 text-sm">
        &copy; Desenvolvido por Nordic-Tech - 2026 Consulta CNPJ. Todos os direitos reservados.
      </footer>
    </main>
  );
}