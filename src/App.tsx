import React, { useState } from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import {
  convertNumbers,
  type ConversionResult,
  type InputKind,
} from './utils/mathConverter';
import { StackedFraction } from './components/FractionDisplay';
import { ExplanationAccordion } from './components/ExplanationAccordion';
import {
  DecimalShapeIcon,
  FractionShapeIcon,
  PercentShapeIcon,
} from './components/ShapeIcons';

interface FieldValues {
  pecahan: string;
  desimal: string;
  persen: string;
}

const INITIAL_VALUES: FieldValues = {
  pecahan: '',
  desimal: '',
  persen: '',
};

export default function App() {
  const [values, setValues] = useState<FieldValues>(INITIAL_VALUES);
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({});

  const handleFieldChange = (kind: InputKind, nextValue: string) => {
    setError(null);

    if (result) {
      // Starting a fresh edit from a previously converted state:
      // keep only the edited column and clear the two auto-filled/old columns.
      setValues({
        pecahan: kind === 'pecahan' ? nextValue : '',
        desimal: kind === 'desimal' ? nextValue : '',
        persen: kind === 'persen' ? nextValue : '',
      });
      setResult(null);
      setOpenIds({});
      return;
    }

    setValues((prev) => ({
      ...prev,
      [kind]: nextValue,
    }));
  };

  const handleConvert = (e: React.FormEvent) => {
    e.preventDefault();

    // If already converted and user clicks Konversi again without editing,
    // re-evaluate only the original source column so clicking Konversi twice stays valid.
    const inputsToConvert: FieldValues = result
      ? {
          pecahan: result.sourceKind === 'pecahan' ? values.pecahan : '',
          desimal: result.sourceKind === 'desimal' ? values.desimal : '',
          persen: result.sourceKind === 'persen' ? values.persen : '',
        }
      : values;

    const outcome = convertNumbers(inputsToConvert);

    if ('error' in outcome) {
      setError(outcome.error);
      setResult(null);
      setOpenIds({});
      return;
    }

    setError(null);
    setResult(outcome);
    setOpenIds({});
    setValues({
      pecahan: outcome.pecahanText,
      desimal: outcome.desimalText,
      persen: outcome.persenText,
    });
  };

  const handleReset = () => {
    setValues(INITIAL_VALUES);
    setResult(null);
    setError(null);
    setOpenIds({});
  };

  const toggleAccordion = (id: string) => {
    setOpenIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const getFieldStatusLabel = (kind: InputKind): string | null => {
    if (!result) return null;
    return result.sourceKind === kind ? 'Input Anda' : 'Hasil';
  };

  return (
    <div className="min-h-screen bg-[#F3F7FC] text-[#0F2440] flex flex-col items-center justify-start px-4 py-6 sm:px-6 sm:py-10">
      <main className="w-full max-w-[920px] bg-white rounded-3xl shadow-[0_14px_40px_-14px_rgba(15,36,64,0.08)] px-5 py-7 sm:px-10 sm:py-9">
        {/* 1. Judul & 2. Subjudul */}
        <header className="text-center mb-7">
          <h1 className="text-[28px] sm:text-[34px] font-bold tracking-tight text-[#0F2440] text-balance">
            Konversi Bilangan
          </h1>
          <p className="mt-2 text-[15px] sm:text-base text-slate-600 text-balance max-w-md mx-auto">
            Ubah pecahan, desimal, dan persen dengan mudah.
          </p>
        </header>

        {/* 3. Tiga kolom input & 4. Tombol Konversi & 5. Hasil konversi */}
        <form onSubmit={handleConvert} noValidate>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Kolom Pecahan */}
            <div
              className={`rounded-2xl p-4 transition-colors duration-150 ${
                result && result.sourceKind !== 'pecahan'
                  ? 'bg-[#EEF5FF] ring-1 ring-blue-200/80'
                  : 'bg-[#F8FAFC] ring-1 ring-slate-200/70'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <label
                  htmlFor="input-pecahan"
                  className="flex items-center gap-2 text-sm font-semibold text-[#0F2440]"
                >
                  <FractionShapeIcon className="w-6 h-6 shrink-0" />
                  <span>Pecahan</span>
                </label>
                {getFieldStatusLabel('pecahan') && (
                  <span
                    className={`text-xs font-medium ${
                      result?.sourceKind === 'pecahan'
                        ? 'text-slate-500'
                        : 'text-blue-700'
                    }`}
                  >
                    {getFieldStatusLabel('pecahan')}
                  </span>
                )}
              </div>

              <input
                id="input-pecahan"
                name="pecahan"
                type="text"
                inputMode="text"
                autoComplete="off"
                value={values.pecahan}
                onChange={(e) => handleFieldChange('pecahan', e.target.value)}
                placeholder="Contoh: 3/4 atau 1 1/2"
                className="w-full min-h-[46px] rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[15px] font-math text-[#0F2440] placeholder:font-sans placeholder:text-sm placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-3 focus:ring-blue-600/15 transition-all duration-150"
              />

              {result && result.pecahanParts.den !== '1' && result.pecahanParts.num !== '0' && (
                <div
                  className="mt-3 pt-2.5 border-t border-slate-200/60 flex flex-wrap items-center gap-2 text-xs text-slate-600"
                  data-testid="fraction-visual"
                >
                  <span>Bentuk pecahan:</span>
                  <StackedFraction
                    sign={result.pecahanParts.sign}
                    num={result.pecahanParts.num}
                    den={result.pecahanParts.den}
                    size="sm"
                  />
                  {result.pecahanParts.mixed && (
                    <>
                      <span aria-hidden="true">=</span>
                      <StackedFraction
                        sign={result.pecahanParts.mixed.sign}
                        whole={result.pecahanParts.mixed.whole}
                        num={result.pecahanParts.mixed.num}
                        den={result.pecahanParts.mixed.den}
                        size="sm"
                      />
                    </>
                  )}
                </div>
              )}

              {result && result.pecahanParts.wholeValue && result.pecahanParts.num !== '0' && (
                <div
                  className="mt-3 pt-2.5 border-t border-slate-200/60 flex flex-wrap items-center gap-2 text-xs text-slate-600"
                  data-testid="fraction-visual"
                >
                  <span>Bentuk pecahan:</span>
                  <StackedFraction
                    sign={result.pecahanParts.sign}
                    num={result.pecahanParts.num}
                    den={result.pecahanParts.den}
                    size="sm"
                  />
                  <span>= {result.pecahanParts.wholeValue}</span>
                </div>
              )}
            </div>

            {/* Kolom Desimal */}
            <div
              className={`rounded-2xl p-4 transition-colors duration-150 ${
                result && result.sourceKind !== 'desimal'
                  ? 'bg-[#EEF5FF] ring-1 ring-blue-200/80'
                  : 'bg-[#F8FAFC] ring-1 ring-slate-200/70'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <label
                  htmlFor="input-desimal"
                  className="flex items-center gap-2 text-sm font-semibold text-[#0F2440]"
                >
                  <DecimalShapeIcon className="w-6 h-6 shrink-0" />
                  <span>Desimal</span>
                </label>
                {getFieldStatusLabel('desimal') && (
                  <span
                    className={`text-xs font-medium ${
                      result?.sourceKind === 'desimal'
                        ? 'text-slate-500'
                        : 'text-blue-700'
                    }`}
                  >
                    {getFieldStatusLabel('desimal')}
                  </span>
                )}
              </div>

              <input
                id="input-desimal"
                name="desimal"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={values.desimal}
                onChange={(e) => handleFieldChange('desimal', e.target.value)}
                placeholder="Contoh: 0,75"
                className="w-full min-h-[46px] rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[15px] font-math text-[#0F2440] placeholder:font-sans placeholder:text-sm placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-3 focus:ring-blue-600/15 transition-all duration-150"
              />

              {result && result.desimalApprox && (
                <p className="mt-3 pt-2.5 border-t border-slate-200/60 text-xs text-slate-600">
                  ≈ Hasil pendekatan (maks. 8 angka di belakang koma)
                </p>
              )}
            </div>

            {/* Kolom Persen */}
            <div
              className={`rounded-2xl p-4 transition-colors duration-150 ${
                result && result.sourceKind !== 'persen'
                  ? 'bg-[#EEF5FF] ring-1 ring-blue-200/80'
                  : 'bg-[#F8FAFC] ring-1 ring-slate-200/70'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <label
                  htmlFor="input-persen"
                  className="flex items-center gap-2 text-sm font-semibold text-[#0F2440]"
                >
                  <PercentShapeIcon className="w-6 h-6 shrink-0" />
                  <span>Persen</span>
                </label>
                {getFieldStatusLabel('persen') && (
                  <span
                    className={`text-xs font-medium ${
                      result?.sourceKind === 'persen'
                        ? 'text-slate-500'
                        : 'text-blue-700'
                    }`}
                  >
                    {getFieldStatusLabel('persen')}
                  </span>
                )}
              </div>

              <input
                id="input-persen"
                name="persen"
                type="text"
                inputMode="text"
                autoComplete="off"
                value={values.persen}
                onChange={(e) => handleFieldChange('persen', e.target.value)}
                placeholder="Contoh: 75%"
                className="w-full min-h-[46px] rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[15px] font-math text-[#0F2440] placeholder:font-sans placeholder:text-sm placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-3 focus:ring-blue-600/15 transition-all duration-150"
              />

              {result && result.persenApprox && (
                <p className="mt-3 pt-2.5 border-t border-slate-200/60 text-xs text-slate-600">
                  ≈ Hasil pendekatan (maks. 8 angka di belakang koma)
                </p>
              )}
            </div>
          </div>

          {/* Pesan kesalahan validasi */}
          {error && (
            <div
              role="alert"
              className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
            >
              <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          {/* 4. Tombol Konversi */}
          <div className="mt-6 flex justify-center">
            <button
              type="submit"
              className="w-full sm:w-auto min-w-[200px] min-h-[46px] px-8 py-3 rounded-xl bg-[#1E3A8A] hover:bg-[#172E6E] active:scale-[0.99] text-white text-[15px] font-semibold shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1E3A8A] transition-all duration-150 cursor-pointer whitespace-nowrap"
            >
              Konversi
            </button>
          </div>
        </form>

        {/* 6. Bagian Cara Menghitungnya & 7. Dua dropdown penjelasan sesuai jenis input */}
        {result && (
          <section
            aria-labelledby="cara-menghitung-heading"
            className="mt-9 pt-7 border-t border-slate-100"
          >
            <h2
              id="cara-menghitung-heading"
              className="text-lg font-bold text-[#0F2440] mb-4"
            >
              Cara Menghitungnya
            </h2>

            <div className="space-y-3">
              {result.explanations.map((section) => (
                <ExplanationAccordion
                  key={section.id}
                  section={section}
                  isOpen={Boolean(openIds[section.id])}
                  onToggle={() => toggleAccordion(section.id)}
                />
              ))}
            </div>
          </section>
        )}

        {/* 8. Tombol Reset kecil */}
        <div className="mt-7 flex justify-center">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] rounded-lg text-xs font-medium text-slate-500 hover:text-[#0F2440] hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 transition-colors duration-150 cursor-pointer whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Reset</span>
          </button>
        </div>
      </main>
    </div>
  );
}
