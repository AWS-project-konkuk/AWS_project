/**
 * 겹치지 않는 ID(UUID v4 형식)를 만든다.
 *
 * `crypto.randomUUID()`와 `crypto.subtle`은 HTTPS(또는 localhost)에서만 있어서 HTTP로 배포한 환경에서는
 * 호출하면 오류가 난다. `crypto.getRandomValues()`는 HTTP에서도 쓸 수 있으므로 이것으로 만든다.
 * 노드·실행 ID는 비밀 값이 아니라 서로 겹치지만 않으면 된다.
 */
export function newId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  // UUID v4: 일곱 번째 바이트 상위 4비트는 버전(4), 아홉 번째 바이트 상위 2비트는 변형(10)
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0'));
  return [
    hex.slice(0, 4).join(''),
    hex.slice(4, 6).join(''),
    hex.slice(6, 8).join(''),
    hex.slice(8, 10).join(''),
    hex.slice(10).join(''),
  ].join('-');
}
