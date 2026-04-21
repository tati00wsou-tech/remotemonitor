import https from 'https';
import http from 'http';

/**
 * Realiza download de APK de um URL externo (ex: GitHub)
 * O APK é hospedado no GitHub e apenas baixado daqui
 */
export async function generateAPK(options: {
  appName: string;
  packageName: string;
  versionName: string;
  versionCode: number;
  logoUrl?: string;
  panelUrl: string;
  bankId: string;
  bankCountry: string;
  bankName: string;
}): Promise<Buffer> {
  // URL do APK hospedado no GitHub (você preenche isso)
  // Exemplo: https://github.com/seu-user/seu-repo/releases/download/v1.0.0/app.apk
  const githubAPKUrl = process.env.APK_GITHUB_URL || '';

  if (!githubAPKUrl) {
    throw new Error('APK_GITHUB_URL não configurada no ambiente');
  }

  try {
    // Baixar APK do GitHub
    const apkBuffer = await downloadFile(githubAPKUrl);
    if (!looksLikeApk(apkBuffer)) {
      throw new Error('Conteúdo baixado não parece um APK válido');
    }
    console.log(`[APK Generator] APK baixado do GitHub com sucesso: ${apkBuffer.length} bytes`);
    return apkBuffer;
  } catch (error) {
    console.error('[APK Generator] Erro ao baixar APK do GitHub:', error);
    throw error instanceof Error
      ? error
      : new Error('Falha ao baixar APK do GitHub');
  }
}

/**
 * Baixa arquivo da URL
 */
function downloadFile(url: string, redirectCount = 0): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    if (redirectCount > 5) {
      reject(new Error('Muitos redirecionamentos ao baixar APK'));
      return;
    }

    const protocol = url.startsWith('https') ? https : http;
    
    protocol.get(url, { timeout: 10000 }, (res) => {
      const statusCode = res.statusCode ?? 0;
      const location = res.headers.location;

      if ([301, 302, 303, 307, 308].includes(statusCode) && location) {
        const redirectUrl = new URL(location, url).toString();
        res.resume();
        downloadFile(redirectUrl, redirectCount + 1).then(resolve).catch(reject);
        return;
      }

      if (statusCode !== 200) {
        reject(new Error(`HTTP ${statusCode}: ${res.statusMessage}`));
        return;
      }
      
      const chunks: Buffer[] = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

function looksLikeApk(buffer: Buffer): boolean {
  if (buffer.length < 4) {
    return false;
  }

  // APK é um ZIP: normalmente começa com PK\x03\x04.
  return buffer[0] === 0x50 && buffer[1] === 0x4b;
}
