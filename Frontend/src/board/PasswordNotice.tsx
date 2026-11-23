/**
 * HTTP로 접속한 경우에만 비밀번호 안내를 보여 준다. HTTPS(또는 localhost)에서는 전송이 암호화되므로
 * 안내하지 않는다. 배포 환경이 HTTPS로 바뀌면 코드를 고치지 않아도 사라진다.
 */
export function PasswordNotice({ className }: { className?: string }) {
  if (typeof window === 'undefined' || window.isSecureContext) return null;
  return (
    <p role="note" className={'m-0 text-sm text-ui-muted ' + (className ?? '')}>
      이 사이트는 지금 HTTP로 접속 중이라 비밀번호가 암호화되지 않고 전송됩니다. 게시글
      수정·삭제에만 쓰는 값이니, 다른 곳에서 실제로 쓰는 비밀번호는 입력하지 마세요.
    </p>
  );
}
