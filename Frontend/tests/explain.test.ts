import { expect, it, vi } from 'vitest';
import { requestExplain } from '../src/api/explain';

const { post } = vi.hoisted(() => ({ post: vi.fn() }));
vi.mock('../src/api/client', () => ({ api: { post } }));

const request = {
  lessonId: 'vm-container',
  question: '컨테이너가 공유하는 것은?',
  options: ['커널', '프로세스 메모리'],
  correct: 0,
  explanation: '컨테이너는 호스트 커널을 공유합니다.',
  selected: 0,
  reason: '호스트의 커널 기능을 이용하기 때문입니다.',
};

it('기존 자유 답변과 서로 맞지 않는 판정·표시를 평가 결과로 받지 않는다', async () => {
  for (const data of [
    { answer: '자유 형식 답변' },
    { status: 'ok', verdict: '오개념', display: 'correct', feedback: '검토 결과' },
    { status: 'fallback', verdict: null, display: null, feedback: '' },
  ]) {
    post.mockResolvedValueOnce({ data });
    await expect(requestExplain(request)).rejects.toThrow('올바르지 않습니다');
  }
});
