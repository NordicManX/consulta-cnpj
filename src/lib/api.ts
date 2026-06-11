import { CnpjResponse } from "../types/cnpj";

export async function fetchCnpj(cnpj: string): Promise<CnpjResponse> {
  // O Replace limpa a máscara e envia apenas os números para a API
  const cleanCnpj = cnpj.replace(/\D/g, "");

  if (cleanCnpj.length !== 14) {
    throw new Error("CNPJ inválido. O formato deve conter 14 dígitos.");
  }

  const response = await fetch(`https://publica.cnpj.ws/cnpj/${cleanCnpj}`);

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error(
        "Limite de consultas atingido (3 por minuto). Aguarde um instante.",
      );
    }
    throw new Error("CNPJ não encontrado ou indisponível no momento.");
  }

  return response.json();
}
