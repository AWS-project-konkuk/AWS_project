import { afterEach, describe, expect, it, vi } from 'vitest';
import { newId } from '../src/ids';

const uuidV4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('newId', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('UUID v4 형식이다', () => {
    for (let i = 0; i < 200; i++) expect(newId()).toMatch(uuidV4);
  });

  it('많이 만들어도 겹치지 않는다', () => {
    const ids = new Set(Array.from({ length: 20000 }, newId));
    expect(ids.size).toBe(20000);
  });

  it('randomUUID가 없는 HTTP 환경에서도 getRandomValues만으로 만든다', () => {
    // HTTP(보안 컨텍스트가 아닌 환경)에는 randomUUID와 subtle이 없고 getRandomValues만 있다.
    vi.stubGlobal('crypto', { getRandomValues: crypto.getRandomValues.bind(crypto) });
    expect(globalThis.crypto.randomUUID).toBeUndefined();
    expect(newId()).toMatch(uuidV4);
  });

  it('난수를 그대로 쓰되 버전·변형 비트만 고정한다', () => {
    vi.stubGlobal('crypto', {
      getRandomValues: (bytes: Uint8Array) => bytes.fill(0xff),
    });
    expect(newId()).toBe('ffffffff-ffff-4fff-bfff-ffffffffffff');
    vi.stubGlobal('crypto', {
      getRandomValues: (bytes: Uint8Array) => bytes.fill(0x00),
    });
    expect(newId()).toBe('00000000-0000-4000-8000-000000000000');
  });
});
