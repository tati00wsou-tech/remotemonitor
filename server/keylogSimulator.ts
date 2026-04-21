import { createKeylog } from "./db";

/**
 * Simulador de keylogs em tempo real
 * Envia keylogs fictícios para simular um dispositivo capturando digitações
 */

const SAMPLE_KEYLOGS = [
  { app: "Gmail", keys: ["a", "d", "m", "i", "n", "@", "g", "m", "a", "i", "l", ".", "c", "o", "m"] },
  { app: "Gmail", keys: ["s", "e", "n", "h", "a", "1", "2", "3"] },
  { app: "WhatsApp", keys: ["O", "l", "á", ",", " ", "t", "u", "d", "o", " ", "b", "e", "m", "?"] },
  { app: "WhatsApp", keys: ["S", "i", "m", ",", " ", "t", "u", "d", "o", " ", "c", "e", "r", "t", "o", "!"] },
  { app: "Chrome", keys: ["w", "w", "w", ".", "g", "o", "o", "g", "l", "e", ".", "c", "o", "m"] },
  { app: "Facebook", keys: ["p", "a", "s", "s", "w", "o", "r", "d", "1", "2", "3"] },
  { app: "Instagram", keys: ["l", "o", "v", "e", "t", "h", "i", "s", "p", "h", "o", "t", "o"] },
  { app: "Twitter", keys: ["G", "r", "e", "a", "t", " ", "d", "a", "y", " ", "t", "o", "d", "a", "y", "!"] },
];

let simulationRunning = false;

/**
 * Inicia o simulador de keylogs
 * Envia keylogs aleatórios a cada 3-5 segundos
 */
export async function startKeylogSimulator(deviceId: string, userId: number) {
  if (simulationRunning) {
    console.log("[Keylog Simulator] Já está rodando");
    return;
  }

  simulationRunning = true;
  console.log(`[Keylog Simulator] Iniciado para dispositivo: ${deviceId}`);

  // Simular envio de keylogs
  const simulateKeylogs = async () => {
    while (simulationRunning) {
      try {
        // Selecionar um keylog aleatório
        const randomLog = SAMPLE_KEYLOGS[Math.floor(Math.random() * SAMPLE_KEYLOGS.length)];
        
        // Selecionar algumas teclas aleatórias
        const numKeys = Math.floor(Math.random() * 5) + 1;
        const selectedKeys = randomLog.keys.slice(0, numKeys).join("");

        // Enviar para o banco de dados
        await createKeylog({
          deviceId,
          userId,
          appName: randomLog.app,
          keyText: selectedKeys,
        });

        console.log(`[Keylog Simulator] Keylog enviado: ${randomLog.app} - ${selectedKeys}`);

        // Aguardar 3-5 segundos antes do próximo
        const delay = Math.random() * 2000 + 3000;
        await new Promise((resolve) => setTimeout(resolve, delay));
      } catch (error) {
        console.error("[Keylog Simulator] Erro ao enviar keylog:", error);
      }
    }
  };

  // Iniciar simulação em background
  simulateKeylogs().catch(console.error);
}

/**
 * Para o simulador de keylogs
 */
export function stopKeylogSimulator() {
  simulationRunning = false;
  console.log("[Keylog Simulator] Parado");
}

/**
 * Verifica se o simulador está rodando
 */
export function isKeylogSimulatorRunning(): boolean {
  return simulationRunning;
}
