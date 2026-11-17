import { beforeEach, expect, it, vi } from 'vitest';
const { post } = vi.hoisted(() => ({ post: vi.fn() }));
vi.mock('axios', () => ({ default: { create: () => ({ post }), isAxiosError: () => false } }));
import { requestChat } from '../src/api/chat';
beforeEach(() => post.mockReset());
it('백엔드 계약대로 전송하고 한글 응답과 줄바꿈을 보존한다', async () => {
  post.mockResolvedValue({ data: { answer: '한글 답변\n두 번째 줄' } });
  const controller = new AbortController();
  await expect(requestChat('선택한 이유', controller.signal)).resolves.toBe(
    '한글 답변\n두 번째 줄',
  );
  expect(post).toHaveBeenCalledWith(
    '/chat',
    { message: '선택한 이유' },
    { signal: controller.signal, timeout: 130_000 },
  );
});
it('공백과 32,000자 초과 요청은 전송하지 않는다', async () => {
  await expect(requestChat('  ')).rejects.toThrow('32,000자');
  await expect(requestChat('가'.repeat(32001))).rejects.toThrow('32,000자');
  expect(post).not.toHaveBeenCalled();
});
it('32,000자 경계 요청을 허용한다', async () => {
  post.mockResolvedValue({ data: { answer: '검토 결과' } });
  await expect(requestChat('가'.repeat(32000))).resolves.toBe('검토 결과');
});
it('빈 답변과 잘못된 응답 형식을 거절한다', async () => {
  for (const data of [null, {}, { answer: ' ' }, { answer: 42 }]) {
    post.mockResolvedValue({ data });
    await expect(requestChat('검토 요청')).rejects.toThrow('올바르지');
  }
});
