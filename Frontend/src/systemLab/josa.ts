const finalDigits = new Set('013678');
const rieulDigits = new Set('178');
const finalLatin = new Set('lmnrLMNR');
const rieulLatin = new Set('lrLR');
/** 마지막 글자의 받침 정보. 한글, 숫자, 영문은 읽는 소리 기준으로 본다. */
function finalSound(word: string): { has: boolean; rieul: boolean } {
  const last = word.trim().at(-1) ?? '';
  const code = last.charCodeAt(0);
  if (code >= 0xac00 && code <= 0xd7a3) {
    const final = (code - 0xac00) % 28;
    return { has: final !== 0, rieul: final === 8 };
  }
  if (/[0-9]/.test(last)) return { has: finalDigits.has(last), rieul: rieulDigits.has(last) };
  return { has: finalLatin.has(last), rieul: rieulLatin.has(last) };
}
/** 받침에 맞는 조사를 붙인다. 예: josa('기울기', '을/를') → '기울기를' */
export function josa(
  word: string,
  pair: '을/를' | '이/가' | '은/는' | '과/와' | '으로/로',
): string {
  const [withFinal, without] = pair.split('/');
  const { has, rieul } = finalSound(word);
  return word + (has && !(pair === '으로/로' && rieul) ? withFinal : without);
}
