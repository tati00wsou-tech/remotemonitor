/**
 * Lista de Bancos por País
 * Usado no APK Builder e no painel de monitoramento
 */

export interface Bank {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  icon?: string;
}

export const BANKS: Bank[] = [
  // 🇧🇷 BRASIL - Todos os bancos
  {
    id: "bb",
    name: "Banco do Brasil",
    country: "Brasil",
    countryCode: "BR",
  },
  {
    id: "caixa",
    name: "Caixa Econômica Federal",
    country: "Brasil",
    countryCode: "BR",
  },
  { id: "itau", name: "Itaú Unibanco", country: "Brasil", countryCode: "BR" },
  {
    id: "bradesco",
    name: "Banco Bradesco",
    country: "Brasil",
    countryCode: "BR",
  },
  {
    id: "santander",
    name: "Banco Santander Brasil",
    country: "Brasil",
    countryCode: "BR",
  },
  { id: "nubank", name: "Nubank", country: "Brasil", countryCode: "BR" },
  { id: "inter", name: "Banco Inter", country: "Brasil", countryCode: "BR" },
  { id: "c6", name: "C6 Bank", country: "Brasil", countryCode: "BR" },
  { id: "picpay", name: "PicPay", country: "Brasil", countryCode: "BR" },
  { id: "safra", name: "Banco Safra", country: "Brasil", countryCode: "BR" },
  {
    id: "votorantim",
    name: "Banco Votorantim",
    country: "Brasil",
    countryCode: "BR",
  },
  {
    id: "original",
    name: "Banco Original",
    country: "Brasil",
    countryCode: "BR",
  },
  { id: "neon", name: "Banco Neon", country: "Brasil", countryCode: "BR" },
  {
    id: "mercantil",
    name: "Banco Mercantil",
    country: "Brasil",
    countryCode: "BR",
  },
  { id: "hsbc", name: "HSBC Brasil", country: "Brasil", countryCode: "BR" },
  {
    id: "scotiabank",
    name: "Scotiabank Brasil",
    country: "Brasil",
    countryCode: "BR",
  },
  { id: "sicredi", name: "Sicredi", country: "Brasil", countryCode: "BR" },
  { id: "sicoob", name: "Sicoob", country: "Brasil", countryCode: "BR" },
  {
    id: "banrisul",
    name: "Banrisul",
    country: "Brasil",
    countryCode: "BR",
  },
  { id: "banese", name: "Banese", country: "Brasil", countryCode: "BR" },

  // 🇲🇽 MÉXICO - Principais bancos
  { id: "banamex", name: "Banamex", country: "México", countryCode: "MX" },
  { id: "bbva_mx", name: "BBVA México", country: "México", countryCode: "MX" },
  {
    id: "santander_mx",
    name: "Santander México",
    country: "México",
    countryCode: "MX",
  },
  { id: "scotiabank_mx", name: "Scotiabank México", country: "México", countryCode: "MX" },
  { id: "inbursa", name: "Inbursa", country: "México", countryCode: "MX" },
  { id: "banorte", name: "Banorte", country: "México", countryCode: "MX" },
  { id: "bajio", name: "Banco del Bajío", country: "México", countryCode: "MX" },

  // 🇺🇸 ESTADOS UNIDOS - Principais bancos
  { id: "chase", name: "Chase Bank", country: "Estados Unidos", countryCode: "US" },
  {
    id: "bofa",
    name: "Bank of America",
    country: "Estados Unidos",
    countryCode: "US",
  },
  {
    id: "wellsfargo",
    name: "Wells Fargo",
    country: "Estados Unidos",
    countryCode: "US",
  },
  { id: "citi", name: "Citibank", country: "Estados Unidos", countryCode: "US" },

  // 🇬🇧 REINO UNIDO - Principais bancos
  { id: "barclays", name: "Barclays", country: "Reino Unido", countryCode: "UK" },
  { id: "hsbc_uk", name: "HSBC UK", country: "Reino Unido", countryCode: "UK" },
  {
    id: "lloyds",
    name: "Lloyds Banking Group",
    country: "Reino Unido",
    countryCode: "UK",
  },
  { id: "natwest", name: "NatWest", country: "Reino Unido", countryCode: "UK" },

  // 🇪🇸 ESPANHA - Principais bancos
  { id: "santander_es", name: "Santander España", country: "Espanha", countryCode: "ES" },
  { id: "bbva_es", name: "BBVA España", country: "Espanha", countryCode: "ES" },
  { id: "caixabank", name: "CaixaBank", country: "Espanha", countryCode: "ES" },
  { id: "sabadell", name: "Banco Sabadell", country: "Espanha", countryCode: "ES" },

  // 🇵🇹 PORTUGAL - Principais bancos
  { id: "millenniumbcp", name: "Millennium BCP", country: "Portugal", countryCode: "PT" },
  { id: "cgd", name: "Caixa Geral de Depósitos", country: "Portugal", countryCode: "PT" },
  { id: "santander_pt", name: "Santander Portugal", country: "Portugal", countryCode: "PT" },

  // 🇦🇷 ARGENTINA - Principais bancos
  { id: "galicia", name: "Banco Galicia", country: "Argentina", countryCode: "AR" },
  { id: "bbva_ar", name: "BBVA Argentina", country: "Argentina", countryCode: "AR" },
  { id: "santander_ar", name: "Santander Argentina", country: "Argentina", countryCode: "AR" },

  // 🇨🇴 COLÔMBIA - Principais bancos
  { id: "bancolombia", name: "Bancolombia", country: "Colômbia", countryCode: "CO" },
  { id: "davivienda", name: "Davivienda", country: "Colômbia", countryCode: "CO" },

  // 🇨🇱 CHILE - Principais bancos
  { id: "santander_cl", name: "Santander Chile", country: "Chile", countryCode: "CL" },
  { id: "bbva_cl", name: "BBVA Chile", country: "Chile", countryCode: "CL" },

  // 🇵🇪 PERU - Principais bancos
  { id: "bbva_pe", name: "BBVA Perú", country: "Peru", countryCode: "PE" },
  { id: "interbank", name: "Interbank", country: "Peru", countryCode: "PE" },

  // 🇩🇪 ALEMANHA - Principais bancos
  { id: "deutsche", name: "Deutsche Bank", country: "Alemanha", countryCode: "DE" },
  { id: "commerzbank", name: "Commerzbank", country: "Alemanha", countryCode: "DE" },
  { id: "dresdner", name: "Dresdner Bank", country: "Alemanha", countryCode: "DE" },

  // 🇫🇷 FRANÇA - Principais bancos
  { id: "bnp", name: "BNP Paribas", country: "França", countryCode: "FR" },
  { id: "credit_agricole", name: "Crédit Agricole", country: "França", countryCode: "FR" },
  { id: "societe_generale", name: "Société Générale", country: "França", countryCode: "FR" },
];

/**
 * Agrupar bancos por país
 */
export const BANKS_BY_COUNTRY = BANKS.reduce(
  (acc, bank) => {
    if (!acc[bank.country]) {
      acc[bank.country] = [];
    }
    acc[bank.country].push(bank);
    return acc;
  },
  {} as Record<string, Bank[]>
);

/**
 * Ordenar países alfabeticamente
 */
export const COUNTRIES_SORTED = Object.keys(BANKS_BY_COUNTRY).sort();

/**
 * Obter bancos de um país específico
 */
export function getBanksByCountry(country: string): Bank[] {
  return BANKS_BY_COUNTRY[country] || [];
}

/**
 * Obter banco por ID
 */
export function getBankById(id: string): Bank | undefined {
  return BANKS.find((bank) => bank.id === id);
}

/**
 * Obter nome do banco por ID
 */
export function getBankName(id: string): string {
  return getBankById(id)?.name || "Banco Desconhecido";
}

/**
 * Obter país do banco por ID
 */
export function getBankCountry(id: string): string {
  return getBankById(id)?.country || "País Desconhecido";
}

/**
 * Contar total de bancos
 */
export function getTotalBanksCount(): number {
  return BANKS.length;
}

/**
 * Contar bancos por país
 */
export function getBanksCountByCountry(country: string): number {
  return getBanksByCountry(country).length;
}
