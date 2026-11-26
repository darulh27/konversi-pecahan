export type InputKind = 'pecahan' | 'desimal' | 'persen';

export interface Rational {
  num: bigint; // signed numerator
  den: bigint; // positive denominator > 0n
}

export interface MathToken {
  type: 'text' | 'fraction' | 'mixed';
  text?: string;
  sign?: '-' | '';
  whole?: string;
  num?: string;
  den?: string;
}

export interface ExplanationStep {
  text: string;
  formula?: MathToken[];
}

export interface ExplanationSection {
  id: string;
  title: string;
  steps: ExplanationStep[];
  conclusion: MathToken[];
}

export interface ConversionResult {
  sourceKind: InputKind;
  pecahanText: string;
  pecahanParts: {
    sign: '-' | '';
    num: string;
    den: string;
    mixed?: {
      sign: '-' | '';
      whole: string;
      num: string;
      den: string;
    };
    wholeValue?: string;
  };
  desimalText: string;
  desimalApprox: boolean;
  persenText: string;
  persenApprox: boolean;
  explanations: [ExplanationSection, ExplanationSection];
}

export interface ValidationError {
  error: string;
}

export const INVALID_INPUT_MESSAGE = 'Masukkan satu bilangan dengan format yang benar.';

export function absBigInt(n: bigint): bigint {
  return n < 0n ? -n : n;
}

export function gcdBigInt(a: bigint, b: bigint): bigint {
  let x = absBigInt(a);
  let y = absBigInt(b);
  while (y !== 0n) {
    const t = x % y;
    x = y;
    y = t;
  }
  return x === 0n ? 1n : x;
}

export function normalizeRational(num: bigint, den: bigint): Rational {
  if (den === 0n) {
    throw new Error('Denominator cannot be zero');
  }
  if (num === 0n) {
    return { num: 0n, den: 1n };
  }
  const signedNum = den < 0n ? -num : num;
  const posDen = absBigInt(den);
  const g = gcdBigInt(signedNum, posDen);
  return {
    num: signedNum / g,
    den: posDen / g,
  };
}

function isRepeatingDenominator(den: bigint): { repeating: boolean; terminatingPlaces: number } {
  let d = absBigInt(den);
  let p2 = 0;
  let p5 = 0;
  while (d % 2n === 0n) {
    d /= 2n;
    p2++;
  }
  while (d % 5n === 0n) {
    d /= 5n;
    p5++;
  }
  return {
    repeating: d !== 1n,
    terminatingPlaces: Math.max(p2, p5),
  };
}

export function formatRationalAsDecimal(
  r: Rational,
  maxRepeatingPlaces = 8
): { text: string; isApprox: boolean } {
  const norm = normalizeRational(r.num, r.den);
  if (norm.num === 0n) {
    return { text: '0', isApprox: false };
  }

  const isNeg = norm.num < 0n;
  const absNum = absBigInt(norm.num);
  const { repeating, terminatingPlaces } = isRepeatingDenominator(norm.den);

  if (!repeating) {
    const factor = 10n ** BigInt(terminatingPlaces);
    const scaled = (absNum * factor) / norm.den;
    const intPart = scaled / factor;
    const fracPart = scaled % factor;

    if (terminatingPlaces === 0 || fracPart === 0n) {
      return {
        text: `${isNeg ? '-' : ''}${intPart.toString()}`,
        isApprox: false,
      };
    }

    const paddedFrac = fracPart.toString().padStart(terminatingPlaces, '0').replace(/0+$/, '');
    return {
      text: `${isNeg ? '-' : ''}${intPart.toString()},${paddedFrac}`,
      isApprox: false,
    };
  }

  // Repeating decimal: round to maxRepeatingPlaces (8) decimal places
  const scale = 10n ** BigInt(maxRepeatingPlaces);
  const scaledQuotient = (absNum * scale) / norm.den;
  const remainder = (absNum * scale) % norm.den;
  const rounded = remainder * 2n >= norm.den ? scaledQuotient + 1n : scaledQuotient;

  const intPart = rounded / scale;
  const fracPart = rounded % scale;

  if (fracPart === 0n) {
    return {
      text: `${isNeg ? '-' : ''}${intPart.toString()}`,
      isApprox: true,
    };
  }

  const paddedFrac = fracPart.toString().padStart(maxRepeatingPlaces, '0').replace(/0+$/, '');
  return {
    text: `${isNeg ? '-' : ''}${intPart.toString()},${paddedFrac}`,
    isApprox: true,
  };
}

export function formatIndonesianNumberInput(raw: string): string {
  return raw.trim().replace('−', '-').replace('.', ',');
}

interface ParsedFractionInput {
  rational: Rational;
  isMixed: boolean;
  displayInput: string;
  sign: '-' | '';
  whole?: bigint;
  partNum: bigint;
  partDen: bigint;
  improperNum: bigint;
  improperDen: bigint;
  gcdUsed: bigint;
}

export function parseFractionInput(raw: string): ParsedFractionInput | null {
  const normalized = raw.trim().replace(/−/g, '-').replace(/\s+/g, ' ');
  if (!normalized) return null;

  // Mixed fraction: optional sign, whole integer, space, num/den (positive digits for parts)
  const mixedMatch = normalized.match(/^([+-]?)\s*(\d+)\s+(\d+)\s*\/\s*(\d+)$/);
  if (mixedMatch) {
    const signSymbol = mixedMatch[1] === '-' ? '-' : '';
    const whole = BigInt(mixedMatch[2]);
    const partNum = BigInt(mixedMatch[3]);
    const partDen = BigInt(mixedMatch[4]);

    if (partDen === 0n) return null;

    const absImproperNum = whole * partDen + partNum;
    const improperNum = signSymbol === '-' ? -absImproperNum : absImproperNum;
    const rational = normalizeRational(improperNum, partDen);
    const gcdUsed = gcdBigInt(absImproperNum, partDen);

    return {
      rational,
      isMixed: true,
      displayInput: `${signSymbol}${whole.toString()} ${partNum.toString()}/${partDen.toString()}`,
      sign: rational.num < 0n ? '-' : '',
      whole,
      partNum,
      partDen,
      improperNum,
      improperDen: partDen,
      gcdUsed,
    };
  }

  // Simple fraction: optional sign, num/den (also allows negative in denominator like 3/-4)
  const simpleMatch = normalized.match(/^([+-]?)\s*(\d+)\s*\/\s*([+-]?\d+)$/);
  if (simpleMatch) {
    const leadNeg = simpleMatch[1] === '-';
    const rawNum = BigInt(simpleMatch[2]);
    const rawDenStr = simpleMatch[3];
    const denNeg = rawDenStr.startsWith('-');
    const rawDen = absBigInt(BigInt(rawDenStr));

    if (rawDen === 0n) return null;

    const isNegative = leadNeg !== denNeg && rawNum !== 0n;
    const signedNum = isNegative ? -rawNum : rawNum;
    const rational = normalizeRational(signedNum, rawDen);
    const gcdUsed = gcdBigInt(rawNum, rawDen);

    return {
      rational,
      isMixed: false,
      displayInput: `${isNegative ? '-' : ''}${rawNum.toString()}/${rawDen.toString()}`,
      sign: rational.num < 0n ? '-' : '',
      partNum: rawNum,
      partDen: rawDen,
      improperNum: signedNum,
      improperDen: rawDen,
      gcdUsed,
    };
  }

  return null;
}

interface ParsedDecimalInput {
  rational: Rational;
  displayInput: string;
  decimalPlaces: number;
  unsimplifiedNum: bigint;
  unsimplifiedDen: bigint;
  gcdUsed: bigint;
  isNegative: boolean;
}

export function parseDecimalInput(raw: string): ParsedDecimalInput | null {
  const trimmed = raw.trim().replace(/−/g, '-');
  if (!trimmed) return null;

  const match = trimmed.match(/^([+-]?)(\d+)(?:[.,](\d+))?$/);
  if (!match) return null;

  const isNegative = match[1] === '-';
  const intStr = match[2];
  const fracStr = match[3] ?? '';
  const decimalPlaces = fracStr.length;

  const combinedDigits = BigInt(intStr + fracStr);
  const unsimplifiedDen = 10n ** BigInt(decimalPlaces);
  const signedNum = isNegative && combinedDigits !== 0n ? -combinedDigits : combinedDigits;
  const rational = normalizeRational(signedNum, unsimplifiedDen);
  const gcdUsed = gcdBigInt(combinedDigits, unsimplifiedDen);

  const cleanIntStr = BigInt(intStr).toString();
  const displayInput =
    decimalPlaces > 0
      ? `${isNegative && combinedDigits !== 0n ? '-' : ''}${cleanIntStr},${fracStr}`
      : `${isNegative && combinedDigits !== 0n ? '-' : ''}${cleanIntStr}`;

  return {
    rational,
    displayInput,
    decimalPlaces,
    unsimplifiedNum: signedNum,
    unsimplifiedDen,
    gcdUsed,
    isNegative: rational.num < 0n,
  };
}

interface ParsedPercentInput {
  rational: Rational; // value / 100
  percentValueRational: Rational; // value before dividing by 100
  displayValue: string; // without %
  displayInput: string; // with %
  decimalPlacesInPercent: number;
  rawPercentDigitsNum: bigint; // numerator after clearing decimal in percent
  rawPercentDen: bigint; // denominator after clearing decimal in percent (100 * 10^k)
  gcdUsed: bigint;
}

export function parsePercentInput(raw: string): ParsedPercentInput | null {
  const trimmed = raw.trim().replace(/−/g, '-');
  if (!trimmed) return null;

  const match = trimmed.match(/^([+-]?)(\d+)(?:[.,](\d+))?\s*%?$/);
  if (!match) return null;

  const isNegative = match[1] === '-';
  const intStr = match[2];
  const fracStr = match[3] ?? '';
  const decimalPlacesInPercent = fracStr.length;

  const combinedDigits = BigInt(intStr + fracStr);
  const effectiveNeg = isNegative && combinedDigits !== 0n;
  const signedCombined = effectiveNeg ? -combinedDigits : combinedDigits;

  const percentScale = 10n ** BigInt(decimalPlacesInPercent);
  const percentValueRational = normalizeRational(signedCombined, percentScale);

  const rawPercentDen = 100n * percentScale;
  const rational = normalizeRational(signedCombined, rawPercentDen);
  const gcdUsed = gcdBigInt(combinedDigits, rawPercentDen);

  const cleanIntStr = BigInt(intStr).toString();
  const displayValue =
    decimalPlacesInPercent > 0
      ? `${effectiveNeg ? '-' : ''}${cleanIntStr},${fracStr}`
      : `${effectiveNeg ? '-' : ''}${cleanIntStr}`;

  return {
    rational,
    percentValueRational,
    displayValue,
    displayInput: `${displayValue}%`,
    decimalPlacesInPercent,
    rawPercentDigitsNum: signedCombined,
    rawPercentDen,
    gcdUsed,
  };
}

function makeFractionToken(num: bigint, den: bigint): MathToken {
  const sign: '-' | '' = num < 0n ? '-' : '';
  return {
    type: 'fraction',
    sign,
    num: absBigInt(num).toString(),
    den: absBigInt(den).toString(),
  };
}

function makeMixedToken(sign: '-' | '', whole: bigint, num: bigint, den: bigint): MathToken {
  return {
    type: 'mixed',
    sign,
    whole: whole.toString(),
    num: num.toString(),
    den: den.toString(),
  };
}

function textToken(text: string): MathToken {
  return { type: 'text', text };
}

function buildFractionParts(r: Rational): ConversionResult['pecahanParts'] {
  const norm = normalizeRational(r.num, r.den);
  const sign: '-' | '' = norm.num < 0n ? '-' : '';
  const absN = absBigInt(norm.num);

  let mixed: ConversionResult['pecahanParts']['mixed'];
  if (norm.den > 1n && absN > norm.den) {
    const whole = absN / norm.den;
    const rem = absN % norm.den;
    mixed = {
      sign,
      whole: whole.toString(),
      num: rem.toString(),
      den: norm.den.toString(),
    };
  }

  return {
    sign,
    num: absN.toString(),
    den: norm.den.toString(),
    mixed,
    wholeValue: norm.den === 1n ? `${sign}${absN.toString()}` : undefined,
  };
}

function formatFractionText(r: Rational): string {
  const norm = normalizeRational(r.num, r.den);
  if (norm.num === 0n) return '0';
  if (norm.den === 1n) return `${norm.num.toString()}/1`;
  return `${norm.num.toString()}/${norm.den.toString()}`;
}

function simplifiedFractionTokens(r: Rational): MathToken[] {
  const norm = normalizeRational(r.num, r.den);
  if (norm.num === 0n) {
    return [textToken('0')];
  }
  if (norm.den === 1n) {
    return [makeFractionToken(norm.num, 1n), textToken(` (atau ${norm.num.toString()})`)];
  }
  return [makeFractionToken(norm.num, norm.den)];
}

export function convertNumbers(inputs: {
  pecahan: string;
  desimal: string;
  persen: string;
}): ConversionResult | ValidationError {
  const filledEntries: Array<{ kind: InputKind; value: string }> = [];
  if (inputs.pecahan.trim() !== '') filledEntries.push({ kind: 'pecahan', value: inputs.pecahan });
  if (inputs.desimal.trim() !== '') filledEntries.push({ kind: 'desimal', value: inputs.desimal });
  if (inputs.persen.trim() !== '') filledEntries.push({ kind: 'persen', value: inputs.persen });

  if (filledEntries.length !== 1) {
    return { error: INVALID_INPUT_MESSAGE };
  }

  const active = filledEntries[0];

  if (active.kind === 'pecahan') {
    const parsed = parseFractionInput(active.value);
    if (!parsed) return { error: INVALID_INPUT_MESSAGE };

    const r = parsed.rational;
    const dec = formatRationalAsDecimal(r);
    const pctRational = normalizeRational(r.num * 100n, r.den);
    const pct = formatRationalAsDecimal(pctRational);

    const inputToken: MathToken = parsed.isMixed
      ? makeMixedToken(
          parsed.improperNum < 0n ? '-' : '',
          parsed.whole!,
          parsed.partNum,
          parsed.partDen
        )
      : makeFractionToken(parsed.improperNum, parsed.improperDen);

    const improperToken = makeFractionToken(parsed.improperNum, parsed.improperDen);
    const simpToken =
      r.num === 0n ? textToken('0') : makeFractionToken(r.num, r.den);

    // Dropdown 1: Pecahan ke Desimal
    const stepsToDecimal: ExplanationStep[] = [];
    if (parsed.isMixed) {
      const signPrefix = parsed.improperNum < 0n ? '-' : '';
      stepsToDecimal.push({
        text: 'Ubah pecahan campuran menjadi pecahan biasa terlebih dahulu.',
        formula: [
          inputToken,
          textToken(` = ${signPrefix}(${parsed.whole!.toString()} × ${parsed.partDen.toString()} + ${parsed.partNum.toString()})/${parsed.partDen.toString()} = `),
          improperToken,
        ],
      });
    } else if (parsed.gcdUsed > 1n && r.num !== 0n) {
      stepsToDecimal.push({
        text: `Sederhanakan pecahan dengan membagi pembilang dan penyebut menggunakan FPB, yaitu ${parsed.gcdUsed.toString()}.`,
        formula: [improperToken, textToken(' = '), simpToken],
      });
    }

    stepsToDecimal.push({
      text: 'Untuk mengubah pecahan menjadi desimal, bagi pembilang dengan penyebut.',
      formula: [
        r.num === 0n
          ? textToken(`${r.num.toString()} : ${r.den.toString()} = ${dec.text}`)
          : textToken(
              `${r.num.toString()} : ${r.den.toString()} ${dec.isApprox ? '≈' : '='} ${dec.text}`
            ),
      ],
    });

    if (dec.isApprox) {
      stepsToDecimal.push({
        text: 'Pembagian ini menghasilkan desimal berulang, sehingga ditulis maksimal 8 angka di belakang koma sebagai hasil pendekatan.',
      });
    }

    // Dropdown 2: Pecahan ke Persen
    const stepsToPercent: ExplanationStep[] = [];
    if (parsed.isMixed) {
      stepsToPercent.push({
        text: 'Ubah pecahan campuran menjadi pecahan biasa terlebih dahulu.',
        formula: [inputToken, textToken(' = '), improperToken],
      });
    }
    const multNum = r.num * 100n;
    stepsToPercent.push({
      text: 'Untuk mengubah pecahan menjadi persen, kalikan pecahan dengan 100%.',
      formula: [
        r.num === 0n ? textToken('0') : makeFractionToken(r.num, r.den),
        textToken(' × 100% = '),
        makeFractionToken(multNum, r.den),
        textToken(` % ${pct.isApprox ? '≈' : '='} ${pct.text}%`),
      ],
    });

    if (pct.isApprox) {
      stepsToPercent.push({
        text: 'Hasil pembagian berupa desimal berulang sehingga ditulis maksimal 8 angka di belakang koma sebagai nilai pendekatan.',
      });
    }

    return {
      sourceKind: 'pecahan',
      pecahanText: active.value.trim(),
      pecahanParts: buildFractionParts(r),
      desimalText: dec.text,
      desimalApprox: dec.isApprox,
      persenText: `${pct.text}%`,
      persenApprox: pct.isApprox,
      explanations: [
        {
          id: 'pecahan-ke-desimal',
          title: 'Pecahan ke Desimal',
          steps: stepsToDecimal,
          conclusion: [
            inputToken,
            textToken(` ${dec.isApprox ? '≈' : '='} ${dec.text}.`),
          ],
        },
        {
          id: 'pecahan-ke-persen',
          title: 'Pecahan ke Persen',
          steps: stepsToPercent,
          conclusion: [
            inputToken,
            textToken(` ${pct.isApprox ? '≈' : '='} ${pct.text}%.`),
          ],
        },
      ],
    };
  }

  if (active.kind === 'desimal') {
    const parsed = parseDecimalInput(active.value);
    if (!parsed) return { error: INVALID_INPUT_MESSAGE };

    const r = parsed.rational;
    const pctRational = normalizeRational(r.num * 100n, r.den);
    const pct = formatRationalAsDecimal(pctRational);
    const fracText = formatFractionText(r);

    // Dropdown 1: Desimal ke Pecahan
    const stepsToFraction: ExplanationStep[] = [];
    if (parsed.decimalPlaces === 0) {
      stepsToFraction.push({
        text: `Bilangan ${parsed.displayInput} adalah bilangan bulat (tidak memiliki angka di belakang koma).`,
      });
      stepsToFraction.push({
        text: 'Bilangan bulat dapat ditulis sebagai pecahan berpenyebut 1.',
        formula: [
          textToken(`${parsed.displayInput} = `),
          makeFractionToken(r.num, 1n),
        ],
      });
    } else {
      stepsToFraction.push({
        text: `Perhatikan jumlah angka di belakang koma. Pada ${parsed.displayInput} terdapat ${parsed.decimalPlaces} angka di belakang koma.`,
      });
      stepsToFraction.push({
        text: `Ubah menjadi pecahan dengan penyebut ${parsed.unsimplifiedDen.toString()}.`,
        formula: [
          textToken(`${parsed.displayInput} = `),
          r.num === 0n
            ? makeFractionToken(0n, parsed.unsimplifiedDen)
            : makeFractionToken(parsed.unsimplifiedNum, parsed.unsimplifiedDen),
        ],
      });
      if (r.num === 0n) {
        stepsToFraction.push({
          text: 'Karena pembilangnya 0, maka nilai pecahannya adalah 0.',
          formula: [makeFractionToken(0n, parsed.unsimplifiedDen), textToken(' = 0')],
        });
      } else if (parsed.gcdUsed > 1n) {
        stepsToFraction.push({
          text: `Sederhanakan pecahan dengan membagi pembilang dan penyebut menggunakan FPB, yaitu ${parsed.gcdUsed.toString()}.`,
          formula: [
            makeFractionToken(parsed.unsimplifiedNum, parsed.unsimplifiedDen),
            textToken(' = '),
            makeFractionToken(r.num, r.den),
          ],
        });
      } else {
        stepsToFraction.push({
          text: 'FPB dari pembilang dan penyebut adalah 1, sehingga pecahan sudah dalam bentuk paling sederhana.',
        });
      }
    }

    // Dropdown 2: Desimal ke Persen
    const stepsToPercent: ExplanationStep[] = [
      {
        text: 'Untuk mengubah desimal menjadi persen, kalikan bilangan dengan 100%.',
      },
      {
        text: 'Hitung:',
        formula: [textToken(`${parsed.displayInput} × 100% = ${pct.text}%`)],
      },
    ];

    return {
      sourceKind: 'desimal',
      pecahanText: fracText,
      pecahanParts: buildFractionParts(r),
      desimalText: active.value.trim(),
      desimalApprox: false,
      persenText: `${pct.text}%`,
      persenApprox: pct.isApprox,
      explanations: [
        {
          id: 'desimal-ke-pecahan',
          title: 'Desimal ke Pecahan',
          steps: stepsToFraction,
          conclusion: [
            textToken(`${parsed.displayInput} = `),
            ...simplifiedFractionTokens(r),
            textToken('.'),
          ],
        },
        {
          id: 'desimal-ke-persen',
          title: 'Desimal ke Persen',
          steps: stepsToPercent,
          conclusion: [textToken(`${parsed.displayInput} = ${pct.text}%.`)],
        },
      ],
    };
  }

  // active.kind === 'persen'
  const parsed = parsePercentInput(active.value);
  if (!parsed) return { error: INVALID_INPUT_MESSAGE };

  const r = parsed.rational;
  const dec = formatRationalAsDecimal(r);
  const fracText = formatFractionText(r);

  // Dropdown 1: Persen ke Pecahan
  const stepsToFraction: ExplanationStep[] = [
    {
      text: 'Untuk mengubah persen menjadi pecahan, ubah menjadi pecahan berpenyebut 100.',
      formula: [textToken(`${parsed.displayInput} = ${parsed.displayValue}/100`)],
    },
  ];

  if (parsed.decimalPlacesInPercent > 0) {
    const mult = (10n ** BigInt(parsed.decimalPlacesInPercent)).toString();
    stepsToFraction.push({
      text: `Karena pembilang memiliki ${parsed.decimalPlacesInPercent} angka di belakang koma, kalikan pembilang dan penyebut dengan ${mult} agar menjadi bilangan bulat.`,
      formula: [
        textToken(`${parsed.displayValue}/100 = `),
        makeFractionToken(parsed.rawPercentDigitsNum, parsed.rawPercentDen),
      ],
    });
  }

  if (r.num === 0n) {
    stepsToFraction.push({
      text: 'Karena pembilangnya 0, maka nilai pecahannya adalah 0.',
      formula: [makeFractionToken(0n, parsed.rawPercentDen), textToken(' = 0')],
    });
  } else if (parsed.gcdUsed > 1n) {
    stepsToFraction.push({
      text: `Sederhanakan pecahan dengan membagi pembilang dan penyebut menggunakan FPB, yaitu ${parsed.gcdUsed.toString()}.`,
      formula: [
        makeFractionToken(parsed.rawPercentDigitsNum, parsed.rawPercentDen),
        textToken(' = '),
        makeFractionToken(r.num, r.den),
      ],
    });
  } else {
    stepsToFraction.push({
      text: 'FPB dari pembilang dan penyebut adalah 1, sehingga pecahan sudah dalam bentuk paling sederhana.',
    });
  }

  // Dropdown 2: Persen ke Desimal
  const stepsToDecimal: ExplanationStep[] = [
    {
      text: 'Untuk mengubah persen menjadi desimal, bagi nilai persen dengan 100.',
    },
    {
      text: 'Hitung:',
      formula: [textToken(`${parsed.displayValue} : 100 = ${dec.text}`)],
    },
  ];

  return {
    sourceKind: 'persen',
    pecahanText: fracText,
    pecahanParts: buildFractionParts(r),
    desimalText: dec.text,
    desimalApprox: dec.isApprox,
    persenText: active.value.trim(),
    persenApprox: false,
    explanations: [
      {
        id: 'persen-ke-pecahan',
        title: 'Persen ke Pecahan',
        steps: stepsToFraction,
        conclusion: [
          textToken(`${parsed.displayInput} = `),
          ...simplifiedFractionTokens(r),
          textToken('.'),
        ],
      },
      {
        id: 'persen-ke-desimal',
        title: 'Persen ke Desimal',
        steps: stepsToDecimal,
        conclusion: [textToken(`${parsed.displayInput} = ${dec.text}.`)],
      },
    ],
  };
}
