import test from 'node:test';
import assert from 'node:assert/strict';
import {
  convertNumbers,
  INVALID_INPUT_MESSAGE,
  parseDecimalInput,
  parseFractionInput,
  parsePercentInput,
} from './mathConverter';

test('converts decimal 0,75 to 3/4 and 75% with accurate explanations', () => {
  const res = convertNumbers({ pecahan: '', desimal: '0,75', persen: '' });
  assert.ok(!('error' in res));
  assert.equal(res.sourceKind, 'desimal');
  assert.equal(res.pecahanText, '3/4');
  assert.equal(res.desimalText, '0,75');
  assert.equal(res.persenText, '75%');
  assert.equal(res.explanations.length, 2);
  assert.equal(res.explanations[0].title, 'Desimal ke Pecahan');
  assert.equal(res.explanations[1].title, 'Desimal ke Persen');
  assert.match(res.explanations[0].steps[0].text, /2 angka di belakang koma/);
  assert.match(res.explanations[0].steps[2].text, /FPB, yaitu 25/);
});

test('converts simple fraction 3/4 to 0,75 and 75%', () => {
  const res = convertNumbers({ pecahan: '3/4', desimal: '', persen: '' });
  assert.ok(!('error' in res));
  assert.equal(res.sourceKind, 'pecahan');
  assert.equal(res.pecahanText, '3/4');
  assert.equal(res.desimalText, '0,75');
  assert.equal(res.desimalApprox, false);
  assert.equal(res.persenText, '75%');
  assert.equal(res.persenApprox, false);
  assert.equal(res.explanations[0].title, 'Pecahan ke Desimal');
  assert.equal(res.explanations[1].title, 'Pecahan ke Persen');
});

test('converts mixed negative fraction -1 1/2 to -1,5 and -150%', () => {
  const res = convertNumbers({ pecahan: '-1 1/2', desimal: '', persen: '' });
  assert.ok(!('error' in res));
  assert.equal(res.pecahanText, '-1 1/2');
  assert.equal(res.desimalText, '-1,5');
  assert.equal(res.persenText, '-150%');
  assert.equal(res.pecahanParts.sign, '-');
  assert.equal(res.pecahanParts.num, '3');
  assert.equal(res.pecahanParts.den, '2');
});

test('converts mixed positive fraction 2 3/4 to 2,75 and 275%', () => {
  const res = convertNumbers({ pecahan: '2 3/4', desimal: '', persen: '' });
  assert.ok(!('error' in res));
  assert.equal(res.desimalText, '2,75');
  assert.equal(res.persenText, '275%');
});

test('converts repeating fraction 1/3 with max 8 decimal places and approx flag', () => {
  const res = convertNumbers({ pecahan: '1/3', desimal: '', persen: '' });
  assert.ok(!('error' in res));
  assert.equal(res.desimalText, '0,33333333');
  assert.equal(res.desimalApprox, true);
  assert.equal(res.persenText, '33,33333333%');
  assert.equal(res.persenApprox, true);
});

test('converts repeating fraction 2/3 with proper rounding at 8th digit', () => {
  const res = convertNumbers({ pecahan: '2/3', desimal: '', persen: '' });
  assert.ok(!('error' in res));
  assert.equal(res.desimalText, '0,66666667');
  assert.equal(res.desimalApprox, true);
  assert.equal(res.persenText, '66,66666667%');
  assert.equal(res.persenApprox, true);
});

test('converts percent > 100% (125%) accurately', () => {
  const res = convertNumbers({ pecahan: '', desimal: '', persen: '125%' });
  assert.ok(!('error' in res));
  assert.equal(res.sourceKind, 'persen');
  assert.equal(res.pecahanText, '5/4');
  assert.equal(res.pecahanParts.mixed?.whole, '1');
  assert.equal(res.pecahanParts.mixed?.num, '1');
  assert.equal(res.pecahanParts.mixed?.den, '4');
  assert.equal(res.desimalText, '1,25');
  assert.equal(res.explanations[0].title, 'Persen ke Pecahan');
  assert.equal(res.explanations[1].title, 'Persen ke Desimal');
});

test('converts decimal percent 12,5% and negative percent -25%', () => {
  const res1 = convertNumbers({ pecahan: '', desimal: '', persen: '12,5%' });
  assert.ok(!('error' in res1));
  assert.equal(res1.pecahanText, '1/8');
  assert.equal(res1.desimalText, '0,125');

  const res2 = convertNumbers({ pecahan: '', desimal: '', persen: '-25%' });
  assert.ok(!('error' in res2));
  assert.equal(res2.pecahanText, '-1/4');
  assert.equal(res2.desimalText, '-0,25');
});

test('strips unnecessary trailing zeros on decimals and supports dot input', () => {
  const res = convertNumbers({ pecahan: '', desimal: '0.500', persen: '' });
  assert.ok(!('error' in res));
  assert.equal(res.pecahanText, '1/2');
  assert.equal(res.persenText, '50%');

  const res2 = convertNumbers({ pecahan: '6/4', desimal: '', persen: '' });
  assert.ok(!('error' in res2));
  assert.equal(res2.desimalText, '1,5');
  assert.equal(res2.persenText, '150%');
});

test('handles zero correctly across all inputs', () => {
  const r1 = convertNumbers({ pecahan: '0/5', desimal: '', persen: '' });
  assert.ok(!('error' in r1));
  assert.equal(r1.desimalText, '0');
  assert.equal(r1.persenText, '0%');

  const r2 = convertNumbers({ pecahan: '', desimal: '0', persen: '' });
  assert.ok(!('error' in r2));
  assert.equal(r2.pecahanText, '0');
  assert.equal(r2.persenText, '0%');

  const r3 = convertNumbers({ pecahan: '', desimal: '', persen: '0%' });
  assert.ok(!('error' in r3));
  assert.equal(r3.pecahanText, '0');
  assert.equal(r3.desimalText, '0');
});

test('validates zero, multiple, zero-denominator, and invalid inputs', () => {
  assert.deepEqual(convertNumbers({ pecahan: '', desimal: '', persen: '' }), {
    error: INVALID_INPUT_MESSAGE,
  });
  assert.deepEqual(convertNumbers({ pecahan: '1/2', desimal: '0,5', persen: '' }), {
    error: INVALID_INPUT_MESSAGE,
  });
  assert.deepEqual(convertNumbers({ pecahan: '3/0', desimal: '', persen: '' }), {
    error: INVALID_INPUT_MESSAGE,
  });
  assert.deepEqual(convertNumbers({ pecahan: '1 1/0', desimal: '', persen: '' }), {
    error: INVALID_INPUT_MESSAGE,
  });
  assert.deepEqual(convertNumbers({ pecahan: '-1 -1/2', desimal: '', persen: '' }), {
    error: INVALID_INPUT_MESSAGE,
  });
  assert.deepEqual(convertNumbers({ pecahan: '', desimal: 'abc', persen: '' }), {
    error: INVALID_INPUT_MESSAGE,
  });
  assert.deepEqual(convertNumbers({ pecahan: '', desimal: '0,7,5', persen: '' }), {
    error: INVALID_INPUT_MESSAGE,
  });
  assert.deepEqual(convertNumbers({ pecahan: '', desimal: '', persen: '75%%' }), {
    error: INVALID_INPUT_MESSAGE,
  });

  assert.equal(parseFractionInput('0,75'), null);
  assert.equal(parseDecimalInput('3/4'), null);
  assert.equal(parsePercentInput('1/2'), null);
});
