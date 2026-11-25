/**
 * 텍스트를 클립보드에 복사하고 성공 여부를 돌려준다.
 * navigator.clipboard는 HTTPS나 localhost에서만 있고 권한 정책에 막힐 수도 있어서,
 * 쓸 수 없거나 거부되면 숨은 textarea와 execCommand로 한 번 더 시도한다.
 */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // 아래 대체 방법으로 넘어간다.
  }
  return legacyCopy(text);
}

function legacyCopy(text: string): boolean {
  const field = document.createElement('textarea');
  field.value = text;
  field.readOnly = true;
  field.setAttribute('aria-hidden', 'true');
  Object.assign(field.style, { position: 'fixed', top: '0', left: '-9999px', opacity: '0' });
  const active = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  document.body.append(field);
  try {
    field.select();
    return document.execCommand('copy');
  } catch {
    return false;
  } finally {
    field.remove();
    active?.focus();
  }
}
