import type { LabField } from '../curriculum/types';
import type { Material, Port, Stage, Scenario, Wire } from './types';
const p = (id: string, label: string, material: Material, required = true): Port => ({
  id,
  label,
  material,
  required,
});
const node = (
  id: string,
  title: string,
  purpose: string,
  lane: string,
  x: number,
  y: number,
  inputs: Port[],
  outputs: Port[],
  fields: string[] = [],
): Stage => ({ id, title, purpose, lane, x, y, inputs, outputs, fields });
export const wire = (
  source: string,
  sourceHandle: string,
  target: string,
  targetHandle: string,
): Wire => ({ source, sourceHandle, target, targetHandle });
const n = (
  id: string,
  label: string,
  initial: number,
  min: number,
  max: number,
  help: string,
  step = 1,
): LabField => ({ id, label, initial, min, max, step, help });
const s = (
  id: string,
  label: string,
  initial: string,
  choices: [string, string][],
  help: string,
): LabField => ({
  id,
  label,
  initial,
  options: choices.map(([value, label]) => ({ value, label })),
  help,
});
const w = wire;
const scenarios: Scenario[] = [
  {
    id: 'week1-workflow',
    week: 1,
    title: 'GPU 두 장으로 큰 모델 학습하기',
    problem:
      '학습 상태가 24GiB인 모델을 16GiB GPU 두 장에서 실행하려 합니다. 데이터 병렬로 나누었는데도 OOM이 발생합니다.',
    task: '모델·데이터를 할당하고 워커의 출력을 연결하세요. 데이터 병렬의 실패를 관찰한 뒤 레이어 또는 텐서 분할로 메모리를 맞추고 통신 비용을 비교하세요.',
    takeaway:
      'GPU 수의 합계와 한 장에 필요한 메모리는 다릅니다. 무엇을 분할하고 어떤 결과를 주고받는지가 전략을 결정합니다.',
    fields: [
      s(
        'strategy',
        '분산 전략',
        'data',
        [
          ['data', '데이터 병렬'],
          ['model', '모델 병렬 · 레이어 분할'],
          ['tensor', '텐서 병렬'],
        ],
        '전략을 바꾸면 워커가 주고받아야 할 자료와 연결도 달라집니다.',
      ),
      n('vram', 'GPU당 VRAM (GiB)', 16, 4, 48, '각 워커 한 장의 용량입니다.'),
      n(
        'model',
        '모델 학습 상태 (GiB)',
        24,
        4,
        64,
        '가중치·기울기·옵티마이저 등을 합친 예시입니다.',
      ),
      n(
        'communication',
        '장치 간 통신 비용',
        4,
        0,
        24,
        '상대 시간이며 실제 성능 측정치가 아닙니다.',
      ),
    ],
    nodes: [
      node(
        'data',
        '학습 데이터',
        '64개 표본을 워커에 할당합니다.',
        '입력',
        0,
        40,
        [],
        [p('batch', '64개 표본', 'data')],
      ),
      node(
        'model',
        '초기 모델',
        '학습 상태를 복제하거나 분할합니다.',
        '입력',
        0,
        245,
        [],
        [p('weights', '모델 상태', 'model')],
      ),
      node(
        'split',
        '작업 할당',
        '전략에 따라 데이터·레이어·행렬을 분할합니다.',
        '분할',
        290,
        130,
        [p('batch', '데이터', 'data'), p('weights', '모델', 'model')],
        [p('a', '워커 1 작업', 'task'), p('b', '워커 2 작업', 'task')],
        ['strategy', 'model'],
      ),
      node(
        'gpu1',
        'GPU 워커 1',
        '할당된 부분을 계산하고 결과를 전달합니다.',
        '연산',
        590,
        35,
        [p('job', '할당 작업', 'task')],
        [p('result', '기울기', 'gradient')],
        ['vram'],
      ),
      node(
        'gpu2',
        'GPU 워커 2',
        '두 번째 장치의 실제 입력을 확인하세요.',
        '연산',
        590,
        285,
        [p('job', '할당 작업', 'task')],
        [p('result', '기울기', 'gradient')],
        ['vram'],
      ),
      node(
        'merge',
        '결과 동기화',
        '기울기 평균 또는 부분 결과를 결합합니다.',
        '결합',
        900,
        130,
        [p('a', '워커 1 결과', 'gradient'), p('b', '워커 2 결과', 'gradient')],
        [p('trained', '갱신된 모델', 'model')],
        ['communication'],
      ),
      node(
        'save',
        '체크포인트',
        '완료한 모델 상태를 보관합니다.',
        '저장',
        1200,
        130,
        [p('trained', '학습 모델', 'model')],
        [p('saved', 'checkpoint-v1', 'checkpoint')],
      ),
    ],
    wires: [
      w('data', 'batch', 'split', 'batch'),
      w('model', 'weights', 'split', 'weights'),
      w('split', 'a', 'gpu1', 'job'),
      w('split', 'b', 'gpu2', 'job'),
      w('gpu1', 'result', 'merge', 'a'),
      w('gpu2', 'result', 'merge', 'b'),
      w('merge', 'trained', 'save', 'trained'),
    ],
    starter: [
      w('data', 'batch', 'split', 'batch'),
      w('model', 'weights', 'split', 'weights'),
      w('split', 'a', 'gpu1', 'job'),
    ],
    question: 'GPU를 두 장으로 늘렸는데 데이터 병렬에서 OOM이 계속 난 이유는?',
    options: [
      '각 GPU에 전체 모델 학습 상태를 복제했기 때문이다.',
      'GPU 두 장의 메모리는 언제나 자동으로 한 덩어리가 되기 때문이다.',
    ],
    explanation:
      '일반 데이터 병렬은 모델을 복제합니다. 모델·텐서 병렬은 모델 내부를 나누지만 전송·동기화 비용도 고려해야 합니다.',
  },
  {
    id: 'week2-workflow',
    week: 2,
    title: '학습된 모델을 Pod 안에서 서비스하기',
    problem:
      '학습과 평가를 마친 리뷰 분류 모델을 사용자가 호출할 수 있는 서비스로 만들려 합니다. 모델 파일, 실행 환경, Pod 관리, 요청 경로를 연결하세요.',
    task: '서빙 이미지와 검증된 모델을 두 Pod에 연결하고, Deployment의 관리 선언과 Service의 사용자 요청을 구분해 예측 응답까지 추적하세요.',
    takeaway:
      '컨테이너는 서빙 앱을 실행하고, Pod는 그 컨테이너가 실행되는 Kubernetes의 단위입니다. 모델을 읽은 앱이 추론하며 Deployment와 Service는 실행 유지와 요청 접근을 돕습니다.',
    fields: [
      s(
        'image',
        '서빙 이미지 태그',
        'v1',
        [
          ['v1', 'v1'],
          ['v2', 'v2'],
        ],
        '빌드 결과와 배포에 지정한 태그를 비교하세요.',
      ),
      s(
        'deployment',
        'Deployment 이미지 태그',
        'v1',
        [
          ['v1', 'v1'],
          ['v2', 'v2'],
        ],
        'Deployment는 이미지를 빌드하지 않고 사용할 버전을 지정합니다.',
      ),
      s(
        'healing',
        '장애 뒤 복제본 복구',
        'on',
        [
          ['off', '복구 사용 안 함'],
          ['on', '원하는 복제본 2개로 복구'],
        ],
        '기본 실습은 사용 상태로 둡니다. 확장에서 사용 안 함으로 바꾸면 Pod 1 장애를 복구하지 않는 경우를 비교합니다.',
      ),
    ],
    nodes: [
      node(
        'model',
        '검증된 모델 model-v1',
        '학습과 평가를 마친 모델 파일입니다. 이 실습에서 새로 학습하지 않습니다.',
        '모델 준비',
        0,
        0,
        [],
        [p('model', '검증된 모델 파일', 'model')],
      ),
      node(
        'image',
        '서빙 컨테이너 이미지',
        '추론 코드·Python·라이브러리를 담은 실행 템플릿입니다. 모델은 별도 입력으로 읽습니다.',
        '실행 환경',
        0,
        220,
        [],
        [p('image', '실행 이미지', 'image')],
        ['image'],
      ),
      node(
        'controller',
        'Deployment',
        '두 복제본과 이미지 버전을 선언합니다.',
        '관리',
        0,
        440,
        [],
        [p('desired', '원하는 상태', 'control')],
        ['deployment', 'healing'],
      ),
      node(
        'requests',
        '요청 10건',
        '예측 요청이 Service에 도착합니다.',
        '요청',
        0,
        680,
        [],
        [p('request', '사용자 요청', 'request')],
      ),
      node(
        'service',
        'Service',
        '요청을 두 Pod 경로로 분배합니다.',
        '전달',
        290,
        680,
        [p('request', '사용자 요청', 'request')],
        [p('a', '요청 1~5', 'request'), p('b', '요청 6~10', 'request')],
      ),
      node(
        'pod1',
        'Pod 1 · 서빙 컨테이너',
        '이 Pod 안의 컨테이너가 앱을 실행하고 model-v1을 읽어 추론합니다.',
        '실행',
        600,
        50,
        [
          p('image', '실행 환경 이미지', 'image'),
          p('model', '로딩할 모델 파일', 'model'),
          p('desired', '관리 선언', 'control'),
          p('request', '요청', 'request'),
        ],
        [p('response', '예측 응답', 'prediction')],
      ),
      node(
        'pod2',
        'Pod 2 · 서빙 컨테이너',
        '같은 이미지와 모델을 사용하는 별도 실행본입니다. 메모리 상태는 공유하지 않습니다.',
        '실행',
        600,
        350,
        [
          p('image', '실행 환경 이미지', 'image'),
          p('model', '로딩할 모델 파일', 'model'),
          p('desired', '관리 선언', 'control'),
          p('request', '요청', 'request'),
        ],
        [p('response', '예측 응답', 'prediction')],
      ),
      node(
        'response',
        '사용자 응답',
        '두 복제본의 처리 결과를 확인합니다.',
        '결과',
        920,
        200,
        [p('a', 'Pod 1 응답', 'prediction'), p('b', 'Pod 2 응답', 'prediction')],
        [p('result', '10건 처리', 'prediction')],
      ),
    ],
    wires: [
      w('model', 'model', 'pod1', 'model'),
      w('model', 'model', 'pod2', 'model'),
      w('requests', 'request', 'service', 'request'),
      w('image', 'image', 'pod1', 'image'),
      w('image', 'image', 'pod2', 'image'),
      w('controller', 'desired', 'pod1', 'desired'),
      w('controller', 'desired', 'pod2', 'desired'),
      w('service', 'a', 'pod1', 'request'),
      w('service', 'b', 'pod2', 'request'),
      w('pod1', 'response', 'response', 'a'),
      w('pod2', 'response', 'response', 'b'),
    ],
    starter: [
      w('model', 'model', 'pod1', 'model'),
      w('requests', 'request', 'service', 'request'),
      w('image', 'image', 'pod1', 'image'),
      w('image', 'image', 'pod2', 'image'),
    ],
    question: '사용자의 새 리뷰를 실제로 예측하는 곳과 Kubernetes의 역할을 올바르게 연결하면?',
    options: [
      'Pod 안의 서빙 컨테이너가 모델로 추론하고, Kubernetes는 그 실행 상태와 접근 구성을 관리한다.',
      'Service가 모델을 학습하고 Deployment가 모든 리뷰의 예측을 계산한다.',
    ],
    explanation:
      '이미지는 앱 실행 환경, 컨테이너는 실행본, Pod는 Kubernetes의 실행 단위입니다. 실제 추론은 모델을 로딩한 앱이 수행하며, Deployment는 실행본 관리, Service는 요청 접근을 담당합니다.',
  },
  {
    id: 'week3-workflow',
    week: 3,
    title: 'GPU까지 끊기지 않는 데이터 공급',
    problem:
      'GPU는 초당 100배치를 소비하지만 작은 객체 읽기는 초당 30배치만 공급합니다. Pod 교체 후 캐시 파일까지 사라집니다.',
    task: '원본 객체·읽기 경로·PVC·GPU를 구분해 연결하세요. 데이터 대기와 임시 캐시 손실을 확인한 뒤 공급과 보존을 개선하세요.',
    takeaway:
      'Object Storage는 원본 보관, 로더·캐시는 공급 최적화, PV·PVC는 실행 단위 밖의 저장 연결을 담당합니다.',
    fields: [
      s(
        'cache',
        '반복 읽기 캐시',
        'off',
        [
          ['off', '사용 안 함'],
          ['on', '사용 · 공급 2배 예시'],
        ],
        '캐시를 켜도 첫 읽기 비용과 실제 성능은 별도 측정이 필요합니다.',
      ),
      s(
        'shard',
        '작은 파일 묶음 읽기',
        'off',
        [
          ['off', '개별 객체 읽기'],
          ['on', '샤딩 · 공급 2배 예시'],
        ],
        '요청 개수와 지연 부담을 줄이는 예시입니다.',
      ),
      s(
        'persistent',
        '캐시 보관 경로',
        'temporary',
        [
          ['temporary', 'Pod 임시 공간'],
          ['volume', 'PVC로 연결한 볼륨'],
        ],
        'Pod를 교체한 뒤 cache.bin이 남는지 확인합니다.',
      ),
    ],
    nodes: [
      node(
        'objects',
        'Object Storage',
        '원본 이미지 데이터셋의 공통 보관소입니다.',
        '원본',
        0,
        0,
        [],
        [p('objects', '원본 객체', 'data')],
      ),
      node(
        'pv',
        'PV 볼륨',
        'Pod와 독립적으로 존재하는 저장 자원입니다.',
        '저장',
        0,
        250,
        [],
        [p('volume', '볼륨', 'volume')],
      ),
      node(
        'pvc',
        'PVC 요청',
        '필요한 저장 조건을 PV에 결합합니다.',
        '저장',
        300,
        250,
        [p('volume', '볼륨 자원', 'volume')],
        [p('mount', '볼륨 연결', 'claim')],
      ),
      node(
        'loader',
        '데이터 로더',
        '원본을 읽고 배치를 만들어 공급합니다.',
        '공급',
        610,
        100,
        [p('data', '원본 데이터', 'data'), p('cache', '캐시 경로', 'claim')],
        [p('batch', '준비된 배치', 'data')],
        ['cache', 'shard', 'persistent'],
      ),
      node(
        'gpu',
        'GPU 학습',
        '배치가 준비되지 않으면 기다립니다.',
        '연산',
        920,
        100,
        [p('batch', '학습 배치', 'data')],
        [p('model', '학습 모델', 'model')],
      ),
      node(
        'artifact',
        '모델 보관',
        '완료한 모델 파일을 객체로 보관합니다.',
        '결과',
        1230,
        100,
        [p('model', '모델 파일', 'model')],
        [p('saved', '모델 객체', 'model')],
      ),
    ],
    wires: [
      w('objects', 'objects', 'loader', 'data'),
      w('pv', 'volume', 'pvc', 'volume'),
      w('pvc', 'mount', 'loader', 'cache'),
      w('loader', 'batch', 'gpu', 'batch'),
      w('gpu', 'model', 'artifact', 'model'),
    ],
    starter: [w('objects', 'objects', 'loader', 'data'), w('loader', 'batch', 'gpu', 'batch')],
    question: '원본을 Object Storage에 두면 GPU의 I/O 대기가 자동으로 없어질까요?',
    options: [
      '아니요. 읽기·전처리·캐시 등 공급 병목을 별도로 개선해야 한다.',
      '네. 객체 저장소를 사용하면 데이터 공급은 언제나 GPU보다 빠르다.',
    ],
    explanation: '보관 효율과 학습 중 공급 성능은 다른 조건이며, PVC는 백업 기능이 아닙니다.',
  },
  {
    id: 'week4-workflow',
    week: 4,
    title: '과거 실험의 코드와 데이터 되찾기',
    problem:
      'Git은 v1로 이동했지만 작업 공간의 데이터는 v2입니다. 캐시에 v1이 없을 때 어느 경로로 복원해야 할까요?',
    task: 'Git 메타데이터와 실제 데이터 경로를 나눠 연결하세요. Git 이동만으로 생긴 불일치를 관찰한 뒤 캐시·원격에서 v1을 복원하세요.',
    takeaway:
      'Git은 코드·포인터를, DVC 캐시·원격은 실제 데이터 내용을 관리합니다. 포인터 변경과 복원은 다른 동작입니다.',
    fields: [
      s(
        'version',
        '재현할 실험 버전',
        'v1',
        [
          ['v1', 'v1'],
          ['v2', 'v2'],
        ],
        '코드와 데이터가 같은 버전이어야 합니다.',
      ),
      s(
        'local',
        '로컬 캐시의 v1',
        'missing',
        [
          ['missing', '캐시에 없음'],
          ['present', '캐시에 있음'],
        ],
        '없을 때는 원격에서 가져와야 합니다.',
      ),
      s(
        'operation',
        '복원 작업',
        'git',
        [
          ['git', 'Git 이동만'],
          ['checkout', 'dvc checkout'],
          ['pull', 'dvc pull 후 복원'],
        ],
        '현재 작업 데이터는 v2라고 가정합니다.',
      ),
    ],
    nodes: [
      node(
        'git',
        'Git 커밋',
        '코드와 .dvc 포인터를 선택합니다.',
        '메타데이터',
        0,
        0,
        [],
        [p('meta', '코드·포인터', 'metadata')],
        ['version'],
      ),
      node(
        'remote',
        'DVC 원격',
        '실제 v1·v2 데이터가 보관되어 있습니다.',
        '실제 파일',
        0,
        260,
        [],
        [p('blob', '실제 데이터', 'data')],
      ),
      node(
        'cache',
        '로컬 캐시',
        '내용 식별자에 맞는 파일을 찾거나 가져옵니다.',
        '복원',
        320,
        260,
        [p('blob', '원격 데이터', 'data')],
        [p('data', '캐시 파일', 'data')],
        ['local', 'operation'],
      ),
      node(
        'workspace',
        '작업 공간 복원',
        '포인터가 가리키는 데이터로 맞춥니다.',
        '복원',
        640,
        100,
        [p('meta', '선택 메타데이터', 'metadata'), p('data', '실제 파일', 'data')],
        [p('snapshot', '실험 입력', 'data')],
        ['operation'],
      ),
      node(
        'reproduce',
        '실험 재현 확인',
        '코드와 데이터 버전이 일치하는지 검사합니다.',
        '검증',
        960,
        100,
        [p('snapshot', '복원된 입력', 'data')],
        [p('model', '재현 모델', 'model')],
      ),
    ],
    wires: [
      w('git', 'meta', 'workspace', 'meta'),
      w('remote', 'blob', 'cache', 'blob'),
      w('cache', 'data', 'workspace', 'data'),
      w('workspace', 'snapshot', 'reproduce', 'snapshot'),
    ],
    starter: [w('git', 'meta', 'workspace', 'meta')],
    question: 'Git 포인터 v1과 실제 데이터 v2가 함께 있다면?',
    options: [
      '실험 재료가 불일치하므로 필요한 데이터 버전을 복원해야 한다.',
      '포인터가 v1이므로 실제 데이터도 이미 v1이다.',
    ],
    explanation:
      '캐시에 있으면 checkout, 없으면 원격에서 가져온 뒤 복원합니다. 실행 환경·난수 등도 실제 재현에 영향을 줍니다.',
  },
  {
    id: 'week5-workflow',
    week: 5,
    title: '피처와 검색 근거로 상품 상담 만들기',
    problem:
      '상담 문맥에 1시간 기준 피처와 24시간 기준 피처가 섞였고, 질문과 무관한 문서까지 들어갑니다.',
    task: '피처 정의에서 온라인·오프라인 경로를 분리하고, 문서 인덱스에서 검색 근거를 전달하세요. 두 경로가 문맥에서 어떤 역할을 하는지 확인하세요.',
    takeaway:
      'Feature Store는 피처의 일관된 제공, 벡터 검색은 관련 문서 조회, RAG는 근거를 생성 문맥에 전달하는 역할입니다. 서로 같은 기능이 아닙니다.',
    fields: [
      s(
        'window',
        '온라인 집계 시간',
        'day',
        [
          ['day', '최근 24시간'],
          ['hour', '최근 1시간 · 학습과 일치'],
        ],
        '오프라인 학습 정의는 최근 1시간입니다.',
      ),
      s(
        'embedding',
        '질문 임베딩 공간',
        'other',
        [
          ['other', '다른 모델의 벡터 공간'],
          ['same', '저장 문서와 같은 벡터 공간'],
        ],
        '차원이 같아도 모델 공간이 다르면 호환되지 않을 수 있습니다.',
      ),
      s(
        'retrieval',
        '전달할 검색 근거',
        'irrelevant',
        [
          ['irrelevant', '무관한 날씨 문서'],
          ['relevant', '상품 반품 정책 문서'],
        ],
        '질문: 구매한 상품을 반품할 수 있나요?',
      ),
    ],
    nodes: [
      node(
        'source',
        '상품·행동 원천',
        '행동 이벤트와 상품 문서를 분리합니다.',
        '원천',
        0,
        130,
        [],
        [p('events', '행동 이벤트', 'data'), p('docs', '상품 문서', 'document')],
      ),
      node(
        'definition',
        '공통 피처 정의',
        '최근 1시간 클릭 집계 정의를 관리합니다.',
        '피처',
        300,
        0,
        [p('events', '이벤트', 'data')],
        [p('definition', '피처 정의', 'metadata')],
      ),
      node(
        'offline',
        '오프라인 피처',
        '학습에 사용한 이력과 정의를 제공합니다.',
        '피처',
        610,
        0,
        [p('definition', '공통 정의', 'metadata')],
        [p('feature', '학습 피처 정의', 'metadata')],
      ),
      node(
        'online',
        '온라인 피처',
        '실시간 조회용 피처를 제공합니다.',
        '피처',
        610,
        240,
        [p('definition', '공통 정의', 'metadata')],
        [p('feature', '현재 사용자 피처', 'metadata')],
        ['window'],
      ),
      node(
        'index',
        '문서 임베딩·인덱스',
        '문서를 같은 공간의 벡터로 보관합니다.',
        '검색',
        300,
        470,
        [p('docs', '문서', 'document')],
        [p('vectors', '문서 벡터', 'vector')],
      ),
      node(
        'search',
        '질문 유사도 검색',
        '질문과 가까운 문서를 찾습니다.',
        '검색',
        610,
        470,
        [p('vectors', '문서 벡터', 'vector')],
        [p('evidence', '검색 문서', 'document')],
        ['embedding', 'retrieval'],
      ),
      node(
        'context',
        '상담 문맥 조립',
        '피처 정의 일치와 검색 근거를 확인합니다.',
        '통합',
        930,
        150,
        [
          p('offline', '학습 피처 정의', 'metadata'),
          p('online', '현재 사용자 피처', 'metadata'),
          p('evidence', '관련 문서', 'document'),
        ],
        [p('context', '근거·피처 문맥', 'context')],
      ),
      node(
        'answer',
        '응답 예시',
        '검증한 문맥에 근거한 고정 응답을 확인합니다.',
        '결과',
        1250,
        150,
        [p('context', '생성 문맥', 'context')],
        [p('answer', '상담 응답', 'prediction')],
      ),
    ],
    wires: [
      w('source', 'events', 'definition', 'events'),
      w('definition', 'definition', 'offline', 'definition'),
      w('definition', 'definition', 'online', 'definition'),
      w('source', 'docs', 'index', 'docs'),
      w('index', 'vectors', 'search', 'vectors'),
      w('offline', 'feature', 'context', 'offline'),
      w('online', 'feature', 'context', 'online'),
      w('search', 'evidence', 'context', 'evidence'),
      w('context', 'context', 'answer', 'context'),
    ],
    starter: [
      w('source', 'events', 'definition', 'events'),
      w('source', 'docs', 'index', 'docs'),
      w('definition', 'definition', 'offline', 'definition'),
    ],
    question: '검색한 문서가 있어도 응답의 정확성이 보장되지 않는 이유는?',
    options: [
      '피처의 일관성·근거의 관련성과 최신성·생성 내용을 따로 확인해야 해서',
      'Vector DB가 있으면 검증 없이 어떤 피처와 문서도 사용할 수 있어서',
    ],
    explanation:
      '벡터 DB는 검색 구성 요소이며 RAG가 환각 제거를 보장하지 않습니다. 이 활동은 고정 문서·고정 응답을 사용합니다.',
  },
  {
    id: 'week6-workflow',
    week: 6,
    title: '사용자 응답을 지키며 모델 전환하기',
    problem:
      '신규 모델이 아직 준비되지 않았습니다. 전환 비율과 Shadow 복제 비율을 혼동하면 어떤 요청이 영향을 받을까요?',
    task: '요청 경로·사용자 응답·비교 로그를 각각 연결하세요. 중단 배포 실패와 안전한 전략을 비교하고 신규 모델의 실제 응답 수를 확인하세요.',
    takeaway:
      'Canary의 신규 응답은 사용자에게 전달됩니다. Shadow는 복제 요청을 비교하지만 사용자에게는 기존 모델의 응답을 전달합니다.',
    fields: [
      s(
        'strategy',
        '배포 전략',
        'recreate',
        [
          ['recreate', '중단 배포'],
          ['bluegreen', 'Blue·Green'],
          ['canary', 'Canary'],
          ['shadow', 'Shadow'],
        ],
        '실제 요청 100건을 고정적으로 분배하는 예시입니다.',
      ),
      n(
        'traffic',
        '신규 또는 복제 비율 (%)',
        10,
        0,
        100,
        'Canary는 실제 신규 응답, Shadow는 복제 요청의 비율입니다.',
      ),
      s(
        'ready',
        '신규 모델 준비',
        'no',
        [
          ['no', '준비되지 않음'],
          ['yes', '준비 확인 완료'],
        ],
        '새 버전을 활성화하기 전 상태를 확인합니다.',
      ),
      s(
        'phase',
        'Blue·Green 전환',
        'prepare',
        [
          ['prepare', '준비 · 기존 경로 유지'],
          ['switch', '신규로 전환'],
          ['rollback', '기존으로 롤백'],
        ],
        'Blue·Green 전략일 때 사용합니다.',
      ),
    ],
    nodes: [
      node(
        'requests',
        '사용자 요청',
        '100개 실제 요청이 들어옵니다.',
        '입력',
        0,
        140,
        [],
        [p('request', '100건 요청', 'request')],
      ),
      node(
        'router',
        '요청 라우터',
        '실제 트래픽과 복제 트래픽을 구분합니다.',
        '분배',
        300,
        140,
        [p('request', '사용자 요청', 'request')],
        [p('old', '기존 경로', 'request'), p('new', '신규·복제 경로', 'request')],
        ['strategy', 'traffic', 'phase'],
      ),
      node(
        'old',
        '기존 모델',
        '운영 버전에서 요청을 처리합니다.',
        '실행',
        620,
        0,
        [p('request', '기존 요청', 'request')],
        [p('actual', '실제 응답', 'prediction'), p('log', '관측 로그', 'metrics')],
      ),
      node(
        'new',
        '신규 모델',
        '준비 상태와 신규 요청의 의미를 확인합니다.',
        '실행',
        620,
        300,
        [p('request', '신규·복제 요청', 'request')],
        [p('actual', '실제 응답', 'prediction'), p('log', '비교 로그', 'metrics')],
        ['ready'],
      ),
      node(
        'response',
        '사용자에게 전달',
        '실제 응답 수·실패 수를 계산합니다.',
        '결과',
        960,
        0,
        [p('old', '기존 응답', 'prediction'), p('new', '신규 응답', 'prediction')],
        [p('response', '사용자 결과', 'prediction')],
      ),
      node(
        'observe',
        '배포 관측',
        '실제 응답과 Shadow 비교 결과를 따로 봅니다.',
        '관측',
        960,
        300,
        [p('old', '기존 로그', 'metrics'), p('new', '신규 로그', 'metrics')],
        [p('decision', '확대·롤백 판단', 'decision')],
      ),
    ],
    wires: [
      w('requests', 'request', 'router', 'request'),
      w('router', 'old', 'old', 'request'),
      w('router', 'new', 'new', 'request'),
      w('old', 'actual', 'response', 'old'),
      w('new', 'actual', 'response', 'new'),
      w('old', 'log', 'observe', 'old'),
      w('new', 'log', 'observe', 'new'),
    ],
    starter: [
      w('requests', 'request', 'router', 'request'),
      w('router', 'old', 'old', 'request'),
      w('old', 'actual', 'response', 'old'),
    ],
    question: 'Shadow에서 새 모델로 복제 요청 100건을 보냈다면 신규 사용자 응답 수는?',
    options: [
      '0건. 사용자 응답은 기존 모델이 담당한다.',
      '100건. 복제 비율이 사용자 응답 비율과 같다.',
    ],
    explanation:
      '요청 복제와 사용자 응답 전환은 다른 관계입니다. 관측 후 승격 여부를 별도로 결정합니다.',
  },
  {
    id: 'week7-workflow',
    week: 7,
    title: '모델 품질 경고에서 검증된 개선까지',
    problem:
      '서버는 정상 응답하지만 모델 품질이 낮아졌습니다. 알림만 보고 새 모델을 바로 배포해도 될까요?',
    task: '정답 피드백·지표 수집·조사·개선·평가 경로를 연결하세요. 평가 없는 갱신을 실패로 확인한 뒤 기준을 통과한 모델만 배포하세요.',
    takeaway:
      'Prometheus는 계측한 지표를 수집합니다. 품질의 정답을 만들어 주지 않으며 알림은 원인 조사와 평가를 시작하는 신호입니다.',
    fields: [
      s(
        'decision',
        '알림 이후 판단',
        'immediate',
        [
          ['immediate', '조사 없이 즉시 갱신'],
          ['investigate', '원인 조사 후 개선'],
        ],
        '입력 변화와 모델 품질 저하를 함께 확인합니다.',
      ),
      n('quality', '후보 모델 정확도', 0.78, 0.5, 1, '예시 검증 기준은 0.85입니다.', 0.01),
      s(
        'labels',
        '정답 피드백',
        'available',
        [
          ['available', '검증한 정답 표본 있음'],
          ['missing', '정답 표본 없음'],
        ],
        '정답이 없으면 품질 저하를 확정해 표시하지 않습니다.',
      ),
    ],
    nodes: [
      node(
        'service',
        '운영 모델',
        '정상 HTTP 응답과 예측 로그를 냅니다.',
        '운영',
        0,
        0,
        [],
        [p('metrics', '운영 지표', 'metrics')],
      ),
      node(
        'truth',
        '정답 피드백',
        '검증 표본의 실제 정답을 제공합니다.',
        '근거',
        0,
        250,
        [],
        [p('labels', '정답 표본', 'data')],
        ['labels'],
      ),
      node(
        'prom',
        '관측·Prometheus',
        '시스템과 품질 지표를 계측해 수집합니다.',
        '관측',
        300,
        120,
        [p('metrics', '운영 지표', 'metrics'), p('labels', '정답 표본', 'data')],
        [p('alert', '품질 경고', 'metrics')],
      ),
      node(
        'review',
        '원인 조사',
        '데이터·정답·모델을 검토합니다.',
        '판단',
        610,
        120,
        [p('alert', '관측 신호', 'metrics')],
        [p('plan', '개선 계획', 'decision')],
        ['decision'],
      ),
      node(
        'candidate',
        '모델 개선',
        '조사에 근거해 후보를 만듭니다.',
        '개선',
        920,
        120,
        [p('plan', '개선 계획', 'decision')],
        [p('model', '후보 모델', 'model')],
        ['quality'],
      ),
      node(
        'evaluate',
        '재평가',
        '후보 모델을 기준 0.85와 비교합니다.',
        '검증',
        1230,
        120,
        [p('model', '후보 모델', 'model')],
        [p('approved', '승인 모델', 'approval')],
      ),
      node(
        'release',
        '안전한 재배포',
        '평가를 통과한 모델만 반영합니다.',
        '반영',
        1540,
        120,
        [p('approved', '평가 승인', 'approval')],
        [p('feedback', '다음 관측', 'feedback', false)],
      ),
    ],
    wires: [
      w('service', 'metrics', 'prom', 'metrics'),
      w('truth', 'labels', 'prom', 'labels'),
      w('prom', 'alert', 'review', 'alert'),
      w('review', 'plan', 'candidate', 'plan'),
      w('candidate', 'model', 'evaluate', 'model'),
      w('evaluate', 'approved', 'release', 'approved'),
    ],
    starter: [
      w('service', 'metrics', 'prom', 'metrics'),
      w('truth', 'labels', 'prom', 'labels'),
      w('prom', 'alert', 'review', 'alert'),
    ],
    question: '서버 지연과 오류율이 정상인데도 품질 관측이 필요한 이유는?',
    options: [
      '시스템 정상과 모델 예측의 정확성은 서로 다른 조건이기 때문이다.',
      'HTTP가 200이면 모델의 예측도 언제나 정확하기 때문이다.',
    ],
    explanation:
      '정답·피드백이 있어야 품질을 판단할 수 있습니다. 관측→조사→개선→재평가→배포가 하나의 반복 과정입니다.',
  },
  {
    id: 'pipeline-capstone',
    week: 8,
    title: '전체 파이프라인: 자료를 따라 끝까지',
    problem:
      '학습은 끝났지만 평가용 데이터 경로가 빠져 있습니다. 모델과 데이터가 어디에서 만나고 언제 배포가 차단되어야 할까요?',
    task: '학습용·평가용 데이터와 모델의 흐름을 분리해 완성하세요. 평가 기준 0.90 실패와 0.80 성공을 비교하고 운영 피드백을 확인하세요.',
    takeaway: '단계 이름의 나열보다 각 단계의 입력·출력과 승인 조건을 이해하는 것이 중요합니다.',
    fields: [n('threshold', '평가 통과 기준', 0.9, 0, 1, '예시 모델 정확도는 0.85입니다.', 0.01)],
    nodes: [
      node(
        'data',
        '원본 데이터',
        '버전이 고정된 100개 표본을 제공합니다.',
        '데이터',
        0,
        0,
        [],
        [p('raw', '원본 100개', 'data')],
      ),
      node(
        'prep',
        '전처리·분할',
        '학습 80개와 평가 20개로 나눕니다.',
        '데이터',
        300,
        0,
        [p('raw', '원본', 'data')],
        [p('train', '학습용 80개', 'data'), p('test', '평가용 20개', 'data')],
      ),
      node(
        'train',
        '모델 학습',
        '학습용 데이터만 사용합니다.',
        '학습',
        610,
        0,
        [p('data', '학습용 데이터', 'data')],
        [p('model', '학습 모델', 'model')],
      ),
      node(
        'eval',
        '모델 평가',
        '모델과 학습에 쓰지 않은 평가용 데이터를 비교합니다.',
        '평가',
        920,
        0,
        [p('model', '학습 모델', 'model'), p('data', '평가용 데이터', 'data')],
        [p('approved', '평가 승인', 'approval')],
        ['threshold'],
      ),
      node(
        'registry',
        '모델 등록',
        '승인 모델의 버전을 기록합니다.',
        '등록',
        1230,
        0,
        [p('approved', '승인 모델', 'approval')],
        [p('model', '등록 모델', 'model')],
      ),
      node(
        'serve',
        '모델 서빙',
        '등록 모델로 예측을 제공합니다.',
        '서빙',
        1540,
        0,
        [p('model', '등록 모델', 'model')],
        [p('metrics', '응답·운영 지표', 'metrics')],
      ),
      node(
        'monitor',
        '모니터링',
        '운영·품질을 관찰해 다음 개선에 연결합니다.',
        '관측',
        1850,
        0,
        [p('metrics', '운영 지표', 'metrics')],
        [p('feedback', '개선 피드백', 'feedback', false)],
      ),
    ],
    wires: [
      w('data', 'raw', 'prep', 'raw'),
      w('prep', 'train', 'train', 'data'),
      w('prep', 'test', 'eval', 'data'),
      w('train', 'model', 'eval', 'model'),
      w('eval', 'approved', 'registry', 'approved'),
      w('registry', 'model', 'serve', 'model'),
      w('serve', 'metrics', 'monitor', 'metrics'),
    ],
    starter: [w('data', 'raw', 'prep', 'raw'), w('prep', 'train', 'train', 'data')],
    question: '평가에 필요한 입력 두 가지는 무엇인가요?',
    options: ['학습한 모델과 별도로 확보한 평가용 데이터', '등록된 모델 이름과 화면의 노드 위치'],
    explanation:
      '학습용과 평가용 데이터의 경로를 구분하고 평가 승인을 받은 모델만 등록·서빙합니다.',
  },
];
// 공통 예제를 피처 제공과 문서 검색의 독립된 과제로 투영한다.
const combined = scenarios.find((s) => s.id === 'week5-workflow')!;
for (const mode of ['feature', 'rag'] as const) {
  const keep = new Set(
    mode === 'feature'
      ? ['source', 'definition', 'offline', 'online', 'context', 'answer']
      : ['source', 'index', 'search', 'context', 'answer'],
  );
  const nodes = combined.nodes
    .filter((n) => keep.has(n.id))
    .map((n) => ({
      ...n,
      inputs:
        n.id === 'context'
          ? n.inputs.filter((p) => (mode === 'feature' ? p.id !== 'evidence' : p.id === 'evidence'))
          : n.inputs,
      outputs:
        n.id === 'source'
          ? n.outputs.filter((p) => (mode === 'feature' ? p.id === 'events' : p.id === 'docs'))
          : n.outputs,
      title:
        n.id === 'context'
          ? mode === 'feature'
            ? '학습·추론 피처 비교'
            : '검색 근거 조립'
          : n.id === 'answer' && mode === 'feature'
            ? '피처 확인 결과'
            : n.title,
    }));
  if (mode === 'rag') {
    nodes.push(
      node(
        'query',
        '질문 임베딩',
        '사용자 질문을 문서와 같은 공간으로 변환합니다.',
        '요청',
        300,
        700,
        [],
        [p('query', '질문 벡터', 'vector')],
      ),
    );
    nodes.find((n) => n.id === 'search')!.inputs = [
      ...nodes.find((n) => n.id === 'search')!.inputs,
      p('query', '질문 벡터', 'vector'),
    ];
  }
  const wires = combined.wires.filter((w) => keep.has(w.source) && keep.has(w.target));
  if (mode === 'rag') wires.push(w('query', 'query', 'search', 'query'));
  scenarios.push({
    ...combined,
    id: `${mode}-workflow`,
    nodes,
    wires,
    starter: wires.slice(0, 1),
    title: mode === 'feature' ? '학습과 추론의 두 피처 경로' : '문서 준비와 질문 응답의 두 경로',
    problem:
      mode === 'feature'
        ? '학습 집계는 1시간인데 온라인 집계는 24시간입니다.'
        : '문서와 질문의 임베딩 공간이 다르고 무관한 근거가 검색됩니다.',
    task:
      mode === 'feature'
        ? '공통 정의에서 두 저장소로 분기하고 정의 차이를 수정하세요.'
        : '문서 준비와 질문 검색을 연결하고 검색 근거가 응답에 미치는 영향을 설명하세요.',
    fields: combined.fields.filter((f) =>
      mode === 'feature' ? f.id === 'window' : f.id !== 'window',
    ),
    question:
      mode === 'feature' ? '온라인·오프라인 경로에서 일치시켜야 하는 것은?' : combined.question,
    options:
      mode === 'feature'
        ? ['피처 정의와 사용 시점의 의미', '모든 저장소의 물리적 저장 형식']
        : combined.options,
    explanation:
      mode === 'feature'
        ? '대량 과거 조회와 실시간 조회의 저장 방식은 달라도 피처 의미와 시점 기준을 관리해야 합니다.'
        : combined.explanation,
  });
}
export const scenarioById = Object.fromEntries(scenarios.map((s) => [s.id, s])) as Record<
  string,
  Scenario
>;
export function resolveScenario(id: string, answers: Record<string, unknown>): Scenario {
  const base = scenarioById[id];
  if (base.week !== 1) return base;
  const strategy = answers.strategy ?? 'data',
    material: Material =
      strategy === 'data' ? 'gradient' : strategy === 'model' ? 'activation' : 'partial';
  const nodes = base.nodes.map((n) => ({
    ...n,
    inputs: n.inputs.map((port) =>
      n.id === 'gpu2' && strategy === 'model'
        ? { ...port, material: 'activation' as const, label: 'GPU 1 중간 활성값' }
        : n.id === 'merge'
          ? { ...port, material, required: strategy !== 'model' || port.id === 'b' }
          : port,
    ),
    outputs: n.outputs.map((port) =>
      n.id === 'gpu1' || n.id === 'gpu2'
        ? {
            ...port,
            material,
            label:
              strategy === 'data'
                ? '기울기'
                : strategy === 'model'
                  ? '중간 활성값'
                  : '부분 행렬 결과',
          }
        : port,
    ),
  }));
  const wires =
    strategy === 'model'
      ? base.wires
          .filter(
            (e) =>
              !(e.source === 'split' && e.target === 'gpu2') &&
              !(e.source === 'gpu1' && e.target === 'merge'),
          )
          .concat(w('gpu1', 'result', 'gpu2', 'job'))
      : base.wires;
  return { ...base, nodes, wires };
}
