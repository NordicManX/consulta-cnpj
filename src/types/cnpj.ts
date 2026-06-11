export interface CnpjResponse {
  cnpj_raiz: string;
  razao_social: string;
  estabelecimento: {
    cnpj: string;
    nome_fantasia: string | null;
    situacao_cadastral: string;
    logradouro: string;
    numero: string;
    complemento: string | null;
    bairro: string;
    cep: string;
    cidade: {
      nome: string;
    };
    estado: {
      sigla: string;
    };
    inscricoes_estaduais: Array<{
      inscricao_estadual: string;
      estado: {
        sigla: string;
      };
      ativo: boolean;
    }>;
  };
}
