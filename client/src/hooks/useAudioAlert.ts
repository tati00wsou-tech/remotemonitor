/**
 * Hook para reproduzir alertas sonoros
 */

export function useAudioAlert() {
  /**
   * Reproduzir bip simples
   */
  const playBeep = (frequency: number = 800, duration: number = 200) => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = "sine";

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration / 1000);
    } catch (error) {
      console.log("Áudio não disponível:", error);
    }
  };

  /**
   * Reproduzir múltiplos bips (alerta de conexão)
   */
  const playConnectionAlert = () => {
    playBeep(800, 150);
    setTimeout(() => playBeep(1000, 150), 200);
    setTimeout(() => playBeep(800, 200), 400);
  };

  /**
   * Reproduzir bip de erro
   */
  const playErrorAlert = () => {
    playBeep(400, 300);
    setTimeout(() => playBeep(300, 300), 350);
  };

  /**
   * Reproduzir bip de sucesso
   */
  const playSuccessAlert = () => {
    playBeep(800, 100);
    setTimeout(() => playBeep(1000, 100), 150);
    setTimeout(() => playBeep(1200, 200), 300);
  };

  return {
    playBeep,
    playConnectionAlert,
    playErrorAlert,
    playSuccessAlert,
  };
}
