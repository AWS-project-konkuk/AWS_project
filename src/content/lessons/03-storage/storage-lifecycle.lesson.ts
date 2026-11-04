import { defineMdxLesson } from '../../defineLesson';

// 강의 설정과 실습 구성입니다. 본문은 같은 이름의 .mdx에서 작성합니다.
export default defineMdxLesson({
  id: 'storage-lifecycle',
  unit: 2,
  order: 1,
  title: '파일의 수명과 공유 조건 판단하기',
  summary:
    '같은 Pod의 컨테이너 재시작에서는 남던 파일이 Pod를 삭제하자 사라졌습니다. hostPath로 옮겼더니 다른 노드에서 보이지 않습니다.',
  scenario:
    '같은 Pod의 컨테이너 재시작에서는 남던 파일이 Pod를 삭제하자 사라졌습니다. hostPath로 옮겼더니 다른 노드에서 보이지 않습니다.',
  concepts: ['데이터를 보존하고 공급하기', '파일의 수명과 공유 조건 판단하기'],
  assessment: {
    question: '학습 워커들이 같은 데이터를 읽기만 한다면?',
    options: [
      '읽기 요구와 저장소 지원을 확인하며 ROX 등 가능한 구성을 비교한다',
      '분산 학습이므로 무조건 RWX만 가능하다',
    ],
    correct: 0,
    explanation:
      'PVC는 용량·접근 모드·StorageClass 등의 요청이고 PV는 연결할 저장소 리소스입니다. 동적 프로비저닝에서는 StorageClass와 프로비저너가 저장소 생성에 관여합니다. RWO는 단일 노드 읽기·쓰기이며 같은 노드의 여러 Pod가 사용할 수도 있습니다. 여러 노드의 읽기 전용 요구와 동시 쓰기 요구를 나눠 ROX·RWX와 실제 드라이버 지원을 판단합니다.',
  },
  advanced: [
    {
      title: '심화 · CSI와 JuiceFS',
      body: 'CSI는 저장소 플러그인이 볼륨 생성·연결·마운트 등을 구현하는 표준 인터페이스입니다. JuiceFS는 파일 메타데이터 엔진, 객체 저장소의 데이터, 클라이언트 캐시를 결합합니다. 캐시 적중과 최초 읽기를 구분하며 용량·일관성·장애 복구 비용도 함께 판단합니다.',
    },
  ],
  caution:
    '영구 볼륨은 백업이 아닙니다. 공유 읽기만 필요한지 동시 쓰기도 필요한지 판단하고 저장소·드라이버의 지원을 확인합니다. 캐시는 반복 읽기를 돕지만 최초 읽기나 잘못된 데이터 자체를 해결하지 않습니다.',
  reflection: '학습 워커들이 같은 데이터를 읽기만 한다면?',
  references: [
    {
      title: '원문 · MLOps 4주차 · 실제 도구 실습',
      url: 'https://www.notion.so/02eebb1cb38a82a5b14d811093182c3f',
    },
    {
      title: '공식 자료 · 원리와 적용 조건',
      url: 'https://kubernetes.io/docs/concepts/storage/persistent-volumes/',
    },
  ],
  sourceWeek: 4,
  mapStages: ['data', 'training'],
});
