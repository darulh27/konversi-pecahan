import React from 'react';
import type { MathToken } from '../utils/mathConverter';

interface StackedFractionProps {
  sign?: '-' | '';
  whole?: string;
  num: string;
  den: string;
  size?: 'sm' | 'md';
}

export const StackedFraction: React.FC<StackedFractionProps> = ({
  sign = '',
  whole,
  num,
  den,
  size = 'sm',
}) => {
  const numDenClass =
    size === 'md'
      ? 'text-sm leading-tight px-1.5 font-semibold'
      : 'text-xs leading-tight px-1 font-medium';

  return (
    <span className="inline-flex items-center gap-1 align-middle font-math text-slate-900">
      {sign ? <span aria-hidden="true">-</span> : null}
      {whole ? <span className={size === 'md' ? 'text-base font-semibold' : 'text-sm font-semibold'}>{whole}</span> : null}
      <span
        className="inline-flex flex-col items-center justify-center text-center"
        aria-label={`${sign}${whole ? `${whole} ` : ''}${num} per ${den}`}
      >
        <span className={numDenClass}>{num}</span>
        <span className="w-full border-t border-slate-700 my-[1px]" aria-hidden="true" />
        <span className={numDenClass}>{den}</span>
      </span>
    </span>
  );
};

interface MathTokenRendererProps {
  tokens: MathToken[];
}

export const MathTokenRenderer: React.FC<MathTokenRendererProps> = ({ tokens }) => {
  return (
    <span className="inline-flex flex-wrap items-center gap-x-1 gap-y-1.5 leading-relaxed">
      {tokens.map((token, idx) => {
        if (token.type === 'text') {
          return (
            <span key={idx} className="font-math text-[14px] text-slate-800 whitespace-pre-wrap">
              {token.text}
            </span>
          );
        }
        if (token.type === 'mixed') {
          return (
            <StackedFraction
              key={idx}
              sign={token.sign}
              whole={token.whole}
              num={token.num ?? ''}
              den={token.den ?? ''}
              size="sm"
            />
          );
        }
        return (
          <StackedFraction
            key={idx}
            sign={token.sign}
            num={token.num ?? ''}
            den={token.den ?? ''}
            size="sm"
          />
        );
      })}
    </span>
  );
};
