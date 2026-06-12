export interface CnpjResponse {
  cnpj_raiz: string;
  razao_social: string;
  capital_social: string;
  qsa: Array<{
    nome: string;
    qualificacao_socio: {
      descricao: string;
    };
  }>;
  estabelecimento: {
    cnpj: string;
    nome_fantasia: string | null;
    situacao_cadastral: string;
    data_inicio_atividade: string;
    logradouro: string;
    numero: string;
    complemento: string | null;
    bairro: string;
    cep: string;
    cidade: { nome: string };
    estado: { sigla: string };
    cnae_fiscal_principal: {
      id: string;
      descricao: string;
    };
    inscricoes_estaduais: Array<{
      inscricao_estadual: string;
      estado: { sigla: string };
      ativo: boolean;
    }>;
  };
}
