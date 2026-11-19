import { defineMdxLesson } from '../../defineLesson';
import { createChoiceActivity } from './git-large.lesson';

export const Activity = createChoiceActivity({
  title: '큰 모델 파일은 어디에 있을까요?',
  context: '1GB 모델 파일 하나를 팀원에게 전달하는 상황입니다.',
  note: '크기는 설명을 위한 예시입니다. LFS 저장소에도 실제 파일과 접근 권한이 필요합니다.',
  choices: [
    {
      label: '일반 Git',
      result: 'Git이 모델 파일 내용까지 보관합니다.',
      cards: [
        { title: 'Git 이력', value: '모델 내용', detail: '큰 파일도 Git 객체로 저장' },
        { title: '팀원 작업 폴더', value: '모델 파일', detail: '받은 내용을 사용' },
      ],
      reason: '큰 파일이 자주 바뀌면 Git 이력과 전송 부담이 커집니다.',
    },
    {
      label: 'Git LFS',
      result: 'Git에는 이름표, LFS에는 실제 모델이 있습니다.',
      cards: [
        { title: 'Git 이력', value: '작은 포인터', detail: '어떤 파일인지 적은 이름표' },
        { title: 'LFS 저장소', value: '1GB 모델', detail: '실제 파일을 별도로 보관' },
        { title: '팀원 작업 폴더', value: '모델 파일', detail: 'LFS에서 가져와 사용' },
      ],
      reason: '포인터는 파일을 찾는 정보입니다. 실제 파일의 저장 공간은 여전히 필요합니다.',
    },
    {
      label: '파일 다운로드 실패',
      result: '이름표만으로 모델을 실행할 수는 없습니다.',
      cards: [
        { title: 'Git 이력', value: '포인터 있음', detail: '찾아야 할 파일은 알 수 있음' },
        { title: '작업 폴더', value: '실제 모델 없음', detail: '다운로드와 권한 확인 필요' },
      ],
      reason: 'Git 코드를 받았더라도 LFS 파일을 받지 못하면 모델을 사용할 수 없습니다.',
    },
  ],
});

// 강의 설정과 실습 구성입니다. 본문은 같은 이름의 .mdx에서 작성합니다.
export default defineMdxLesson({
  id: 'git-lfs',
  unit: 3,
  order: 2,
  title: 'Git LFS: 포인터와 실제 파일 분리',
  summary: '작은 이름표와 실제 모델 파일을 나누어 보관하는 방법을 알아봅니다.',
  scenario:
    '대용량 모델 파일을 Git과 비슷한 사용 흐름으로 버전 관리하되 저장소 이력은 작게 유지하려고 합니다. 포인터와 실제 파일이 각각 어디에 저장되는지 구분해 보세요.',
  concepts: ['LFS 포인터', 'LFS 객체 저장소', 'checkout', 'DVC와의 역할 비교'],
  assessment: {
    question: 'Git LFS를 쓰면 실제 대용량 파일은?',
    options: ['포인터로 바뀌며 내용이 필요 없어지는 것이다', '별도 저장소에 보관된다'],
    correct: 1,
    explanation: '포인터는 파일의 식별 정보이며 실제 내용을 대체하는 데이터 자체는 아닙니다.',
  },
  advanced: [
    {
      title: '심화 · Git LFS와 DVC의 경계',
      body: 'Git LFS는 Git 사용 흐름 안에서 큰 파일을 포인터로 바꾸는 데 초점을 둡니다. DVC는 데이터 내용 식별과 캐시·데이터 원격뿐 아니라 dvc.yaml의 파이프라인 의존성까지 다룹니다. 어느 도구를 쓰더라도 실제 파일의 저장 용량, 접근 권한, 보존 정책은 별도로 필요합니다.',
    },
  ],
  caution: '포인터는 파일의 식별 정보이며 실제 내용을 대체하는 데이터 자체는 아닙니다.',
  reflection: 'Git LFS를 쓰면 실제 대용량 파일은?',
  references: [
    {
      title: '원문 · MLOps 5주차 · 실제 도구 실습',
      url: 'https://www.notion.so/ea3ebb1cb38a827a91d381487e388ad4',
    },
    {
      title: 'Git LFS 공식',
      url: 'https://git-lfs.com/',
    },
  ],
  sourceWeek: 5,
  mapStages: ['data', 'training', 'evaluation'],
  activity: {
    kind: 'lfs',
    fields: [
      {
        id: 'size',
        label: '파일 크기 (MiB)',
        initial: 100,
        min: 10,
        max: 1000,
        step: 1,
        help: '실제 데이터는 별도 저장소에 남습니다.',
      },
      {
        id: 'versions',
        label: '버전 수',
        initial: 5,
        min: 1,
        max: 20,
        step: 1,
        help: 'Git 포인터와 실물 데이터 용량을 구분합니다.',
      },
    ],
    question: 'Git LFS를 쓰면 실제 대용량 파일은?',
    options: [
      {
        value: 'b',
        label: '포인터로 바뀌며 내용이 필요 없어지는 것이다',
      },
      {
        value: 'a',
        label: '별도 저장소에 보관된다',
      },
    ],
    correct: 'a',
    explanation: '포인터는 파일의 식별 정보이며 실제 내용을 대체하는 데이터 자체는 아닙니다.',
    task: '이력 크기를 바꾸며 포인터·파일 위치를 확인하세요.',
  },
  practice: 'interactive',
  experiment: '흐름 확인',
  nodes: [
    {
      id: 'n0',
      title: 'Git 포인터',
      detail: '어떤 큰 파일을 받을지 적힌 작은 이름표입니다.',
      tone: '#b49b70',
    },
    {
      id: 'n1',
      title: 'LFS 저장소',
      detail: '실제 큰 파일을 보관합니다.',
      tone: '#b49b70',
    },
    {
      id: 'n2',
      title: '실제 파일',
      detail: '내려받아 사용할 모델이나 데이터입니다.',
      tone: '#b49b70',
    },
  ],
  initialEdges: [
    ['n0', 'n1'],
    ['n1', 'n2'],
  ],
  fields: [
    {
      id: 'size',
      label: '파일 크기 (MiB)',
      initial: 100,
      min: 10,
      max: 1000,
      step: 1,
      help: '실제 데이터는 별도 저장소에 남습니다.',
    },
    {
      id: 'versions',
      label: '버전 수',
      initial: 5,
      min: 1,
      max: 20,
      step: 1,
      help: 'Git 포인터와 실물 데이터 용량을 구분합니다.',
    },
  ],
  flow: [
    ['n0', 'n1'],
    ['n1', 'n2'],
  ],
});
