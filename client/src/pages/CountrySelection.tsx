import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Globe, Check } from 'lucide-react';

interface Country {
  code: string;
  name: string;
  flag: string;
  color: string;
}

const countries: Country[] = [
  { code: 'BR', name: 'Brasil', flag: '🇧🇷', color: 'from-green-600 to-yellow-600' },
  { code: 'MX', name: 'México', flag: '🇲🇽', color: 'from-green-600 to-red-600' },
  { code: 'ES', name: 'Espanha', flag: '🇪🇸', color: 'from-red-600 to-yellow-600' },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹', color: 'from-green-600 to-red-600' },
  { code: 'US', name: 'Estados Unidos', flag: '🇺🇸', color: 'from-blue-600 to-red-600' },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷', color: 'from-blue-600 to-white' },
  { code: 'DE', name: 'Alemanha', flag: '🇩🇪', color: 'from-black to-red-600' },
];

export default function CountrySelection() {
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);

  const toggleCountry = (code: string) => {
    setSelectedCountries(prev =>
      prev.includes(code)
        ? prev.filter(c => c !== code)
        : [...prev, code]
    );
  };

  const handleConfirm = () => {
    localStorage.setItem('selectedCountries', JSON.stringify(selectedCountries));
    setShowConfirm(true);
    setTimeout(() => {
      window.location.href = '/';
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      </div>

      {/* Main Card */}
      <div className="relative z-10 w-full max-w-2xl">
        <Card className="bg-slate-800/50 backdrop-blur-xl border-cyan-400/30 p-8">
          {!showConfirm ? (
            <>
              {/* Header */}
              <div className="text-center mb-8">
                <div className="flex justify-center mb-4">
                  <Globe className="w-12 h-12 text-cyan-400" />
                </div>
                <h1 className="text-3xl font-bold text-cyan-300 mb-2">Selecione os Países</h1>
                <p className="text-slate-400">Escolha os países onde seu painel pode conectar</p>
              </div>

              {/* Countries Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                {countries.map(country => (
                  <button
                    key={country.code}
                    onClick={() => toggleCountry(country.code)}
                    className={`
                      relative p-6 rounded-lg border-2 transition-all duration-300 transform hover:scale-105
                      ${selectedCountries.includes(country.code)
                        ? `bg-gradient-to-br ${country.color} border-white shadow-lg shadow-cyan-500/50`
                        : 'bg-slate-700/30 border-slate-600/50 hover:border-cyan-400/50'
                      }
                    `}
                  >
                    {/* Flag */}
                    <div className="text-5xl mb-2 text-center">{country.flag}</div>

                    {/* Name */}
                    <p className={`text-sm font-semibold text-center ${
                      selectedCountries.includes(country.code)
                        ? 'text-white'
                        : 'text-slate-300'
                    }`}>
                      {country.name}
                    </p>

                    {/* Check Icon */}
                    {selectedCountries.includes(country.code) && (
                      <div className="absolute top-2 right-2 bg-white rounded-full p-1">
                        <Check className="w-4 h-4 text-green-600" />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* Info */}
              <div className="bg-slate-700/30 border border-cyan-400/20 rounded-lg p-4 mb-8">
                <p className="text-sm text-slate-300">
                  <strong className="text-cyan-300">Selecionados:</strong> {selectedCountries.length} país(es)
                </p>
                {selectedCountries.length > 0 && (
                  <p className="text-xs text-slate-400 mt-2">
                    {countries
                      .filter(c => selectedCountries.includes(c.code))
                      .map(c => c.name)
                      .join(', ')}
                  </p>
                )}
              </div>

              {/* Buttons */}
              <div className="flex gap-4">
                <Button
                  onClick={() => setSelectedCountries(countries.map(c => c.code))}
                  variant="outline"
                  className="flex-1 border-cyan-400/30 text-cyan-300 hover:bg-slate-700/50"
                >
                  Selecionar Todos
                </Button>
                <Button
                  onClick={handleConfirm}
                  disabled={selectedCountries.length === 0}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold disabled:opacity-50"
                >
                  Confirmar Seleção
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Success Message */}
              <div className="text-center py-12">
                <div className="mb-4 text-6xl animate-bounce">✅</div>
                <h2 className="text-2xl font-bold text-green-400 mb-2">Configuração Salva!</h2>
                <p className="text-slate-300 mb-4">
                  Seu painel agora está configurado para os países selecionados.
                </p>
                <p className="text-sm text-slate-400">Redirecionando...</p>
              </div>
            </>
          )}

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-cyan-400/20 text-center">
            <p className="text-xs text-slate-500">
              © 2026 FazTudo Tecnologia Ltda
            </p>
          </div>
        </Card>
      </div>

      <style>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
    </div>
  );
}
