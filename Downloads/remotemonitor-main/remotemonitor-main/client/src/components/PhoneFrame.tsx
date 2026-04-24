import React from "react";

interface PhoneFrameProps {
  children?: React.ReactNode;
  status?: string;
}

export default function PhoneFrame({ children, status = "Transmissão ao vivo" }: PhoneFrameProps) {
  return (
    <div className="flex items-center justify-center">
      {/* Moldura do Celular */}
      <div className="relative" style={{ width: "360px", height: "720px" }}>
        {/* Moldura Exterior */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 to-slate-800 rounded-3xl shadow-2xl border-8 border-slate-900 flex flex-col">
          {/* Notch (Entalhe) */}
          <div className="h-6 bg-black rounded-b-3xl mx-auto w-40 flex items-center justify-center">
            <div className="w-1 h-1 bg-slate-600 rounded-full mx-1"></div>
            <div className="text-xs text-slate-400">9:41</div>
            <div className="w-1 h-1 bg-slate-600 rounded-full mx-1"></div>
          </div>

          {/* Tela */}
          <div className="flex-1 bg-black rounded-2xl m-1 overflow-hidden flex flex-col">
            {/* Status Bar */}
            <div className="bg-black px-4 py-2 flex justify-between items-center text-xs text-slate-300 border-b border-slate-700">
              <span>📶 Sinal</span>
              <span>🔋 85%</span>
            </div>

            {/* Conteúdo da Tela */}
            <div className="flex-1 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 overflow-hidden flex flex-col items-center justify-center">
              {children ? (
                children
              ) : (
                <div className="text-center">
                  <div className="text-4xl mb-4">📱</div>
                  <p className="text-slate-400 text-sm">{status}</p>
                  <p className="text-red-500 text-xs mt-2">● Gravando</p>
                </div>
              )}
            </div>
          </div>

          {/* Botão Home */}
          <div className="h-8 bg-slate-900 flex items-center justify-center">
            <div className="w-20 h-1 bg-slate-700 rounded-full"></div>
          </div>
        </div>

        {/* Brilho/Reflexo */}
        <div className="absolute inset-0 rounded-3xl pointer-events-none" style={{
          background: "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%)",
        }}></div>
      </div>
    </div>
  );
}
