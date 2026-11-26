import React from 'react';
import { ChevronDown } from 'lucide-react';
import type { ExplanationSection } from '../utils/mathConverter';
import { MathTokenRenderer } from './FractionDisplay';

interface ExplanationAccordionProps {
  section: ExplanationSection;
  isOpen: boolean;
  onToggle: () => void;
}

export const ExplanationAccordion: React.FC<ExplanationAccordionProps> = ({
  section,
  isOpen,
  onToggle,
}) => {
  const panelId = `panel-${section.id}`;

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden transition-colors duration-150">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={panelId}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-slate-50/80 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-blue-700 transition-colors duration-150 cursor-pointer"
      >
        <span className="text-[15px] font-semibold text-[#0F2440]">{section.title}</span>
        <ChevronDown
          className={`w-5 h-5 text-slate-500 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-blue-700' : ''
          }`}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <div
          id={panelId}
          className="px-5 pb-5 pt-2 border-t border-slate-100 space-y-4"
        >
          <ol className="space-y-3">
            {section.steps.map((step, index) => (
              <li key={index} className="flex items-start gap-3 text-[15px] leading-relaxed text-slate-700">
                <span className="font-semibold text-blue-800 tabular-nums shrink-0 mt-0.5">
                  {index + 1}.
                </span>
                <div className="space-y-2 flex-1 min-w-0">
                  <p>{step.text}</p>
                  {step.formula && step.formula.length > 0 && (
                    <div className="bg-[#F4F8FD] rounded-xl px-4 py-2.5 overflow-x-auto">
                      <MathTokenRenderer tokens={step.formula} />
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ol>

          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2 text-[15px]">
            <span className="font-semibold text-[#0F2440]">Kesimpulan:</span>
            <span className="font-medium text-[#0F2440]">
              <MathTokenRenderer tokens={section.conclusion} />
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
