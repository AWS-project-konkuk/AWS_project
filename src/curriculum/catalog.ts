import type { Lesson } from './types';
import { node, edge, answer, select, number, reading, lesson, devopsSources } from './definition';
import { foundationLessons } from './foundations';

export const legacyWeeks = [
  {
    title: 'MLOps와 AWS의 첫 연결',
    summary: '리소스, 권한, 네트워크와 학습 작업의 관계',
    color: '#627eab',
  },
  {
    title: '컨테이너로 이해하는 실행 환경',
    summary: '이미지부터 추론 서비스의 복구와 확장까지',
    color: '#738d65',
  },
  {
    title: 'GPU를 낭비하지 않는 방법',
    summary: '메모리, 스케줄링과 분산 학습의 기본 원리',
    color: '#a28659',
  },
  {
    title: '데이터가 머무르는 곳',
    summary: '스토리지, 영구 볼륨과 데이터 공급 병목',
    color: '#a1798c',
  },
  { title: '같은 실험으로 돌아가기', summary: 'DVC, 데이터 버전과 레이크하우스', color: '#668e91' },
  {
    title: '모델에 필요한 데이터를 연결하기',
    summary: 'Feature Store, 임베딩과 RAG 검색 흐름',
    color: '#8f7fa9',
  },
  { title: '서비스 이후의 MLOps', summary: '서빙, 안전한 배포와 모델 품질 관찰', color: '#a07d66' },
];
export const legacyChapters = [
  {
    week: 0,
    title: 'MLOps를 위한 AWS·DevOps 기초',
    summary: '처음 만나는 서비스의 역할부터 필요한 만큼',
    color: '#9b8bec',
  },
  ...legacyWeeks.map((week, index) => ({ ...week, week: index + 1 })),
];
export const legacyChapterLabel = (week: number) => (week === 0 ? '필수 기초' : `${week}주차`);
const official = {
  mlops: { title: 'AWS · MLOps 개요', url: 'https://aws.amazon.com/what-is/mlops/' },
  iam: {
    title: 'AWS · EC2에서 IAM 역할 사용',
    url: 'https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_use_switch-role-ec2.html',
  },
  network: {
    title: 'AWS · S3 Gateway Endpoint',
    url: 'https://docs.aws.amazon.com/vpc/latest/privatelink/vpc-endpoints-s3.html',
  },
  spot: {
    title: 'AWS · Spot 중단 처리',
    url: 'https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/spot-interruptions.html',
  },
  docker: {
    title: 'Docker · 컨테이너 이미지',
    url: 'https://docs.docker.com/get-started/docker-concepts/the-basics/what-is-an-image/',
  },
  deployment: {
    title: 'Kubernetes · Deployment',
    url: 'https://kubernetes.io/docs/concepts/workloads/controllers/deployment/',
  },
  hpa: {
    title: 'Kubernetes · Horizontal Pod Autoscaling',
    url: 'https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/',
  },
  gpu: {
    title: 'PyTorch · 혼합 정밀도',
    url: 'https://docs.pytorch.org/tutorials/recipes/recipes/amp_recipe.html',
  },
  scheduling: {
    title: 'Kubernetes · Taint와 Toleration',
    url: 'https://kubernetes.io/docs/concepts/scheduling-eviction/taint-and-toleration/',
  },
  parallel: {
    title: 'PyTorch · 분산 학습 개요',
    url: 'https://docs.pytorch.org/tutorials/beginner/dist_overview.html',
  },
  volumes: {
    title: 'Kubernetes · Persistent Volumes',
    url: 'https://kubernetes.io/docs/concepts/storage/persistent-volumes/',
  },
  io: { title: 'PyTorch · DataLoader', url: 'https://docs.pytorch.org/docs/stable/data.html' },
  dvc: { title: 'DVC · 데이터 버전 관리', url: 'https://doc.dvc.org/start' },
  iceberg: {
    title: 'Apache Iceberg · 스키마 진화',
    url: 'https://iceberg.apache.org/docs/latest/evolution/',
  },
  feast: {
    title: 'Feast · Feature Store 아키텍처',
    url: 'https://docs.feast.dev/getting-started/architecture/overview',
  },
  vector: {
    title: 'Chroma · 임베딩 함수',
    url: 'https://docs.trychroma.com/docs/embeddings/embedding-functions',
  },
  rag: {
    title: 'AWS · RAG란?',
    url: 'https://aws.amazon.com/what-is/retrieval-augmented-generation/',
  },
  serving: {
    title: 'Google · MLOps 파이프라인과 서빙',
    url: 'https://docs.cloud.google.com/architecture/mlops-continuous-delivery-and-automation-pipelines-in-machine-learning',
  },
  prometheus: {
    title: 'Prometheus · 개요',
    url: 'https://prometheus.io/docs/introduction/overview/',
  },
};
export const legacyLessons: Lesson[] = [
  ...foundationLessons,
  lesson({
    id: 'aws-mlops-map',
    week: 1,
    title: '데이터·연산·모델의 자리 찾기',
    summary: 'S3와 EC2를 연결해 MLOps의 자원 지도를 만듭니다.',
    concepts: ['MLOps', 'S3', 'EC2', 'Region / AZ'],
    reading: [
      reading(
        '모델을 만드는 일, 운영하는 일',
        'MLOps는 데이터 준비부터 학습·검증·배포·관찰을 반복 가능하게 만드는 활동입니다. 먼저 데이터가 어디 있고 연산은 어디서 일어나는지 구분해 봅시다.',
      ),
      reading(
        'AWS 자원과 역할 매핑',
        'S3는 데이터셋과 모델 파일을 저장하는 객체 저장소이고, EC2는 코드를 실행할 연산 자원입니다. 같은 서비스가 여러 역할에 쓰일 수 있으므로 저장 위치와 작업 목적을 함께 표시합니다.',
      ),
      reading(
        'Region과 AZ',
        'Region은 지역 단위, AZ는 Region 안의 서로 분리된 가용 영역입니다. 이 강의에서는 관계를 익히며, 실제 구성에서는 위치·권한·데이터 전송도 검토합니다.',
      ),
    ],
    caution: 'MLOps를 하려면 반드시 Kubernetes를 사용해야 하는 것은 아닙니다.',
    scenario:
      '원본 데이터는 S3에 있습니다. EC2 학습 작업이 데이터를 읽고 결과 모델을 S3에 남기도록 연결하세요.',
    nodes: [
      node('data', '데이터 S3', 'dataset:v1'),
      node('compute', '학습 EC2', '모델 생성 작업'),
      node('artifact', '모델 S3', 'model:v1'),
    ],
    initialEdges: [],
    fields: [],
    goals: [
      edge(
        'data',
        'compute',
        '데이터 S3 → 학습 EC2 연결',
        '학습 작업이 읽을 데이터의 출발점을 연결하세요.',
      ),
      edge(
        'compute',
        'artifact',
        '학습 EC2 → 모델 S3 연결',
        '작업 결과가 연산 자원 밖에 저장되어야 합니다.',
      ),
    ],
    experiment: '데이터와 모델의 이동 관찰',
    reflection: '연산 인스턴스를 종료해도 모델을 다시 사용할 수 있는 이유는 무엇일까요?',
    references: [official.mlops, devopsSources.identity],
    devops: 'AWS 자원과 연산·저장의 역할 구분',
  }),
  lesson({
    id: 'iam-access',
    week: 1,
    title: '학습 작업의 S3 접근 권한 고치기',
    summary: '장기 키를 넣는 대신 역할과 읽기 권한을 연결합니다.',
    concepts: ['IAM Role', 'Policy', '최소 권한'],
    reading: [
      reading(
        '역할과 정책은 다릅니다',
        'IAM Role은 서비스 등이 맡을 수 있는 자격의 주체이고, Policy는 허용할 작업과 대상을 정의합니다. EC2는 인스턴스 프로파일의 역할을 통해 임시 자격 증명을 사용할 수 있습니다.',
      ),
      reading(
        '접근 거부를 읽는 순서',
        '대상 데이터에 대한 읽기 권한이 없으면 학습 코드는 데이터를 읽지 못합니다. 이 실습은 같은 계정의 단순한 권한 조건만 모델링합니다. 실제로는 버킷 정책과 명시적 거부 등도 확인해야 합니다.',
      ),
    ],
    caution:
      '여기서 선택하는 정책은 개념 실습입니다. 실제 AWS 정책 평가를 완전히 재현하지 않습니다.',
    scenario:
      'S3 데이터 읽기가 AccessDenied로 실패합니다. 학습 작업에 역할을 연결하고 필요한 읽기 권한을 설정하세요.',
    nodes: [
      node('job', '학습 EC2', 'S3 접근 필요'),
      node('role', '학습용 IAM Role', '임시 자격 증명'),
      node('s3', '데이터 S3', '읽기 대상'),
    ],
    initialEdges: [['job', 'role']],
    fields: [
      select(
        'policy',
        '역할의 S3 권한',
        'none',
        [
          ['none', '권한 없음'],
          ['read', '대상 데이터 읽기'],
          ['admin', '전체 관리자 권한'],
        ],
        '학습 데이터를 읽는 데 필요한 범위만 선택하세요.',
      ),
    ],
    goals: [
      edge('role', 's3', '역할이 접근할 데이터 연결', 'IAM Role → 데이터 S3를 연결하세요.'),
      answer(
        'policy',
        'read',
        '최소 범위의 데이터 읽기 권한 부여',
        '전체 관리자 권한 없이 대상 데이터 읽기를 허용할 수 있습니다.',
      ),
    ],
    experiment: 'S3 읽기 요청 관찰',
    reflection: '역할을 연결했는데도 AccessDenied라면 무엇을 더 확인해야 할까요?',
    references: [official.iam, devopsSources.identity],
    devops: 'Role·Policy와 최소 권한',
  }),
  lesson({
    id: 'private-network',
    week: 1,
    title: '프라이빗 서브넷에서 데이터 읽기',
    summary: '권한과 네트워크 경로를 구분해 봅니다.',
    concepts: ['VPC', 'Subnet', 'Route Table', 'S3 Endpoint'],
    reading: [
      reading(
        '권한과 경로는 별개입니다',
        'S3를 읽을 권한이 있어도 네트워크 경로가 없으면 접근할 수 없습니다. 프라이빗 서브넷의 작업이 S3에 접근하는 경로를 살펴봅니다.',
      ),
      reading(
        'S3 Gateway Endpoint',
        'S3 Gateway Endpoint를 라우팅 테이블에 연결하면 NAT나 Internet Gateway를 거치지 않고 S3에 접근할 수 있습니다. 보안 그룹·NACL·엔드포인트 정책과 IAM 권한도 허용되어야 합니다.',
      ),
    ],
    caution: 'S3 Endpoint가 일반 인터넷이나 pip 저장소까지 연결해 주지는 않습니다.',
    scenario:
      '인터넷에 공개하지 않는 학습 EC2에서 S3 데이터를 읽으세요. 이 과제에서는 IAM 권한과 보안 규칙은 이미 허용되어 있습니다.',
    nodes: [
      node('ec2', 'Private EC2', '퍼블릭 IP 없음'),
      node('route', '라우팅 테이블', 'S3 경로 설정'),
      node('s3', '데이터 S3', '같은 Region'),
    ],
    initialEdges: [['ec2', 'route']],
    fields: [
      select(
        'route',
        'S3 접근 경로',
        'none',
        [
          ['none', '경로 없음'],
          ['igw', 'IGW만 연결'],
          ['endpoint', 'S3 Gateway Endpoint'],
        ],
        '과제는 NAT를 사용하지 않는 프라이빗 접근입니다.',
      ),
    ],
    goals: [
      edge(
        'route',
        's3',
        '라우팅 테이블 → S3 경로 연결',
        '데이터를 향하는 경로를 캔버스에 표현하세요.',
      ),
      answer(
        'route',
        'endpoint',
        '프라이빗 S3 접근 경로 설정',
        'S3 Gateway Endpoint는 S3 전용 경로를 제공합니다.',
      ),
    ],
    experiment: '네트워크 경로 따라가기',
    reflection: 'S3는 되는데 외부 패키지 설치가 안 되는 이유는 무엇일까요?',
    references: [official.network, devopsSources.network],
    devops: '서브넷·라우팅과 접근 권한의 차이',
  }),
  lesson({
    id: 'spot-checkpoint',
    week: 1,
    title: '중단되어도 다시 시작하는 학습',
    summary: 'Spot 중단 상황에서 체크포인트의 역할을 확인합니다.',
    concepts: ['Spot', 'Checkpoint', '복구'],
    reading: [
      reading(
        '연산 자원은 사라질 수 있습니다',
        'Spot 인스턴스는 중단될 수 있으므로 작업이 언제나 끝까지 실행된다고 가정하지 않습니다. 중간 상태를 외부에 저장하는 전략이 필요합니다.',
      ),
      reading(
        '체크포인트는 모델 파일만이 아닙니다',
        '학습을 이어가려면 모델 파라미터뿐 아니라 옵티마이저와 진행 상태 등도 필요할 수 있습니다. 인스턴스 로컬에만 저장하면 자원 회수 시 복구에 사용할 수 없을 수 있습니다.',
      ),
    ],
    caution:
      '체크포인트 저장 주기·저장 성공 여부와 복원 코드는 실제 환경에서 따로 검증해야 합니다.',
    scenario:
      '진행률 60%에서 학습 인스턴스가 중단됩니다. 최근 체크포인트 50%를 외부에 남겨 복구하세요.',
    nodes: [
      node('job', 'Spot 학습 작업', '진행률 60%'),
      node('checkpoint', '체크포인트', '진행률 50%'),
      node('s3', '외부 S3', '자원 회수 후에도 보관'),
    ],
    initialEdges: [['job', 'checkpoint']],
    fields: [
      select(
        'save',
        '체크포인트 저장 위치',
        'local',
        [
          ['local', '인스턴스 로컬'],
          ['external', '외부 S3'],
        ],
        '작업이 실행되는 컴퓨터와 저장 수명을 분리해 보세요.',
      ),
    ],
    goals: [
      edge(
        'checkpoint',
        's3',
        '체크포인트를 외부 저장소에 연결',
        '체크포인트 → 외부 S3를 연결하세요.',
      ),
      answer(
        'save',
        'external',
        '인스턴스 밖에 상태 보관',
        '중단된 자원에만 의존하지 않도록 저장 위치를 바꾸세요.',
      ),
    ],
    experiment: 'Spot 중단 발생시키기',
    reflection: '60%까지 진행했어도 50%부터 재개하는 이유는 무엇일까요?',
    references: [official.spot],
  }),
  lesson({
    id: 'container-image',
    week: 2,
    title: '코드가 실행 환경이 되기까지',
    summary: 'Docker 이미지, ECR, 컨테이너를 구분합니다.',
    concepts: ['Dockerfile', 'Image', 'Container', 'ECR', 'Namespace / cgroup'],
    reading: [
      reading(
        '이미지는 실행 중인 프로세스가 아닙니다',
        'Dockerfile은 이미지 생성 지침, 이미지는 코드와 의존성을 담은 패키지, 컨테이너는 그 이미지를 기반으로 실행한 환경입니다. 이미지 저장소인 ECR은 컨테이너를 실행하지 않습니다.',
      ),
      reading(
        'VM과 컨테이너의 경계',
        'VM은 별도 게스트 OS 커널을 실행할 수 있고, Linux 컨테이너는 호스트 커널을 공유합니다. Namespace는 자원의 보이는 범위를, cgroup은 자원 사용량을 관리합니다. 격리되었다고 자원이 무제한인 것은 아닙니다.',
      ),
    ],
    caution: '컨테이너의 이식성에도 CPU 아키텍처·드라이버 같은 호스트 조건이 영향을 줍니다.',
    scenario: '서빙 코드의 이미지를 ECR에서 가져와 컨테이너로 실행하도록 구성하세요.',
    nodes: [
      node('image', '서빙 이미지', 'model-api:v1'),
      node('ecr', 'ECR', '이미지 저장소'),
      node('container', '서빙 컨테이너', '실행되는 프로세스'),
    ],
    initialEdges: [['image', 'ecr']],
    fields: [
      select(
        'kernel',
        'Linux 컨테이너의 커널',
        'guest',
        [
          ['guest', '컨테이너마다 게스트 커널'],
          ['host', '호스트 커널 공유'],
        ],
        'VM과 Linux 컨테이너의 차이를 골라 보세요.',
      ),
    ],
    goals: [
      edge('ecr', 'container', 'ECR 이미지로 컨테이너 실행', 'ECR → 서빙 컨테이너를 연결하세요.'),
      answer(
        'kernel',
        'host',
        '컨테이너와 VM의 차이 구분',
        '컨테이너는 호스트 커널을 공유하면서 프로세스와 자원을 격리합니다.',
      ),
    ],
    experiment: '이미지에서 컨테이너 실행 관찰',
    reflection: '같은 이미지를 쓰면 모든 하드웨어에서 완전히 같은 조건일까요?',
    references: [official.docker, devopsSources.container],
    devops: 'Docker Image → ECR → 실행 환경',
  }),
  lesson({
    id: 'deployment-service',
    week: 2,
    title: '추론 Pod와 고정된 진입점',
    summary: 'Deployment 복제본과 Service selector를 맞춥니다.',
    concepts: ['Pod', 'Deployment', 'ReplicaSet', 'Service'],
    reading: [
      reading(
        '원하는 상태를 선언합니다',
        'Deployment는 ReplicaSet을 통해 원하는 Pod 수와 업데이트를 관리합니다. Pod는 교체될 수 있으므로 개별 Pod의 주소에만 의존하는 접근은 취약합니다.',
      ),
      reading(
        'Service가 고르는 대상',
        'Service는 selector와 일치하는 라벨을 가진 Pod들을 대상으로 접근점을 제공합니다. Service 자체가 Pod를 생성하거나 복제본을 늘리지는 않습니다.',
      ),
    ],
    caution:
      'Deployment만으로 부하 기반 자동 확장이 되는 것은 아닙니다. 다음 강의에서 HPA를 구분합니다.',
    scenario: 'app=predictor 라벨을 가진 추론 Pod 3개를 유지하고 Service로 접근하세요.',
    nodes: [
      node('deployment', 'Deployment', '원하는 상태'),
      node('pods', '추론 Pod', 'app=predictor'),
      node('service', 'Service', '고정 진입점'),
    ],
    initialEdges: [['deployment', 'pods']],
    fields: [
      number('replicas', '원하는 Pod 수', 1, '과제는 세 개의 복제본을 요구합니다.', 1, 8),
      select(
        'selector',
        'Service selector',
        'web',
        [
          ['web', 'app=web'],
          ['predictor', 'app=predictor'],
        ],
        'Pod 라벨과 selector를 비교하세요.',
      ),
    ],
    goals: [
      edge('service', 'pods', 'Service의 대상 Pod 연결', 'Service → 추론 Pod를 연결하세요.'),
      answer('replicas', 3, '추론 Pod 3개 유지', 'Deployment의 원하는 수를 3으로 설정하세요.'),
      answer('selector', 'predictor', 'Service selector 일치', 'Pod 라벨은 app=predictor입니다.'),
    ],
    experiment: '요청 대상과 복제본 확인',
    reflection: 'Pod가 교체되어도 Service를 통해 접근하는 이유는 무엇일까요?',
    references: [official.deployment, devopsSources.availability],
    devops: '고정 진입점과 부하 분산',
  }),
  lesson({
    id: 'healing-autoscaling',
    week: 2,
    title: '복구와 자동 확장은 다른 일',
    summary: 'Pod 삭제 후 복구와 부하에 따른 확장을 관찰합니다.',
    concepts: ['Self-healing', 'HPA', 'Metrics'],
    reading: [
      reading(
        '복구는 원하는 수로 돌아가는 과정',
        '복제본 하나가 사라지면 컨트롤러가 원하는 개수를 다시 맞춥니다. 이것은 트래픽에 맞추어 원하는 수를 바꾸는 자동 확장과 다릅니다.',
      ),
      reading(
        'HPA는 지표를 보고 판단합니다',
        'HPA는 CPU 등의 지표에 따라 워크로드의 원하는 복제본 수를 조정합니다. CPU 사용률 기반 실습에는 지표 수집과 적절한 CPU request가 전제됩니다.',
      ),
    ],
    caution: '노드 자원이 부족하면 복제본 목표를 올려도 모든 Pod가 실행되지는 않을 수 있습니다.',
    scenario:
      '지표 수집과 CPU request는 준비되어 있습니다. HPA를 연결하고 최대 복제본을 6으로 설정한 뒤, Pod 삭제와 부하 증가를 관찰하세요.',
    nodes: [
      node('hpa', 'HPA', '부하에 따라 목표 조정'),
      node('deployment', 'Deployment', '기본 복제본 3'),
      node('pods', '추론 Pod', '삭제 후 대체'),
    ],
    initialEdges: [['deployment', 'pods']],
    fields: [number('max', 'HPA 최대 복제본', 3, '부하 시 예시 목표는 6개입니다.', 3, 10)],
    goals: [
      edge('hpa', 'deployment', 'HPA가 Deployment 목표 조정', 'HPA → Deployment를 연결하세요.'),
      answer('max', 6, '부하를 위한 최대 복제본 설정', '이 실습의 부하 목표인 6개까지 허용하세요.'),
    ],
    experiment: 'Pod 삭제 + 부하 증가',
    reflection: 'Pod 복구가 되는데도 부하 시 수가 늘지 않는다면 무엇을 확인할까요?',
    references: [official.hpa, devopsSources.availability],
    devops: '복구·확장과 관측 지표의 차이',
  }),
  lesson({
    id: 'gpu-memory',
    week: 3,
    title: 'GPU 메모리 안에 학습 넣기',
    summary: '배치 크기와 정밀도를 바꾸며 OOM을 해결합니다.',
    concepts: ['GPU / CPU', 'CUDA', 'VRAM', 'Mixed Precision', 'Gradient Accumulation'],
    reading: [
      reading(
        '병렬 연산과 소프트웨어 계층',
        'GPU는 많은 연산을 병렬로 처리하도록 설계되었습니다. 프레임워크는 CUDA 런타임·라이브러리와 드라이버를 통해 NVIDIA GPU를 사용합니다. CUDA가 없는 하드웨어나 다른 런타임에는 다른 조건이 필요합니다.',
      ),
      reading(
        '메모리는 여러 요소가 함께 사용합니다',
        '파라미터, 활성값, 그래디언트와 옵티마이저 상태가 VRAM을 사용합니다. 배치를 줄이거나 혼합 정밀도를 적용하면 사용량을 줄일 수 있고, 기울기 누적은 작은 마이크로배치로 유효 배치를 구성하는 방법입니다.',
      ),
    ],
    caution:
      '아래 VRAM 수치는 8GiB GPU를 가정한 교육용 계산입니다. 실제 AMP 절감률이나 속도를 보장하지 않습니다.',
    scenario:
      '8GiB GPU에서 실행 가능한 설정을 찾아보세요. 이 예제는 batch=8, 혼합 정밀도 설정을 목표로 합니다.',
    nodes: [
      node('framework', 'PyTorch', '학습 코드'),
      node('cuda', 'CUDA', '런타임·라이브러리'),
      node('gpu', 'GPU', 'VRAM 8GiB'),
    ],
    initialEdges: [
      ['framework', 'cuda'],
      ['cuda', 'gpu'],
    ],
    fields: [
      number(
        'batch',
        '마이크로배치 크기',
        32,
        '배치가 클수록 이 예제의 활성값 메모리가 늘어납니다.',
        1,
        64,
      ),
      select(
        'precision',
        '연산 정밀도',
        'fp32',
        [
          ['fp32', 'FP32'],
          ['amp', '혼합 정밀도 (AMP)'],
        ],
        '모든 상태가 단순히 절반으로 줄어드는 것은 아닙니다.',
      ),
    ],
    goals: [
      answer(
        'batch',
        8,
        '마이크로배치를 8로 조정',
        '큰 배치가 필요한 경우 누적 전략을 추가로 고려할 수 있습니다.',
      ),
      answer(
        'precision',
        'amp',
        '혼합 정밀도 적용',
        '민감한 연산에는 높은 정밀도를 유지할 수 있습니다.',
      ),
    ],
    experiment: 'VRAM 사용량 비교',
    reflection: '마이크로배치를 줄이면서 유효 배치를 유지하려면 어떻게 할까요?',
    references: [official.gpu],
  }),
  lesson({
    id: 'gpu-scheduling',
    week: 3,
    title: 'GPU 작업을 알맞은 노드에 배치하기',
    summary: 'GPU 요청, nodeSelector와 toleration을 함께 봅니다.',
    concepts: ['GPU request', 'nodeSelector', 'Taint', 'Toleration'],
    reading: [
      reading(
        '있는 자원만 요청할 수 있습니다',
        '노드에 드라이버와 GPU device plugin 등이 준비되어 있어야 Kubernetes가 GPU 자원을 인식할 수 있습니다. GPU를 요청한 작업은 그 자원이 있는 노드에만 배치될 수 있습니다.',
      ),
      reading(
        '허용과 지정의 차이',
        'Toleration은 taint가 있는 노드에 배치될 수 있도록 허용하지만 그 노드로 배치하도록 강제하지 않습니다. nodeSelector나 affinity로 노드 조건을 별도로 지정합니다.',
      ),
    ],
    caution: '이 실습의 GPU 노드는 필요한 드라이버·device plugin이 준비된 상태입니다.',
    scenario:
      'gpu=true 라벨과 gpu=true:NoSchedule taint가 있는 노드에 GPU 1개를 쓰는 작업을 배치하세요.',
    nodes: [
      node('pod', 'GPU 학습 Pod', '처음에는 Pending'),
      node('node', 'GPU Worker', 'gpu=true · NoSchedule'),
    ],
    initialEdges: [],
    fields: [
      number('gpu', '요청 GPU 수', 0, '사용 가능한 GPU는 1개입니다.', 0, 4),
      select(
        'selector',
        '노드 선택',
        'cpu',
        [
          ['cpu', 'CPU 노드'],
          ['gpu', 'gpu=true 노드'],
        ],
        'GPU 노드를 선택하세요.',
      ),
      select(
        'toleration',
        'GPU taint 허용',
        'no',
        [
          ['no', '허용 안 함'],
          ['yes', 'gpu=true:NoSchedule 허용'],
        ],
        'Toleration은 배치를 허용하는 조건입니다.',
      ),
    ],
    goals: [
      edge('pod', 'node', '학습 작업을 GPU 노드에 연결', 'Pod → GPU Worker를 연결하세요.'),
      answer('gpu', 1, 'GPU 1개 요청', '해당 노드의 GPU 자원 범위 안에서 요청하세요.'),
      answer('selector', 'gpu', 'GPU 노드 선택', '노드 라벨 조건을 맞추세요.'),
      answer(
        'toleration',
        'yes',
        'GPU taint 허용',
        '이 taint를 허용하지 않으면 Pending 상태가 됩니다.',
      ),
    ],
    experiment: '스케줄링 조건 확인',
    reflection: 'Toleration만 추가하면 반드시 GPU 노드로 갈까요?',
    references: [official.scheduling],
  }),
  lesson({
    id: 'parallelism',
    week: 3,
    title: '무엇을 나누어 학습할까?',
    summary: '데이터 병렬과 모델·텐서 병렬의 목적을 구분합니다.',
    concepts: ['Data Parallelism', 'Model Parallelism', 'Tensor Parallelism', 'NCCL'],
    reading: [
      reading(
        '데이터를 나누는 방법',
        '데이터 병렬은 모델 복제본을 여러 장치에 두고 입력 배치를 나눕니다. 각 장치의 결과를 동기화하므로 통신 비용도 고려해야 합니다.',
      ),
      reading(
        '모델을 나누는 방법',
        '한 장치에 모델을 담을 수 없다면 모델의 부분이나 텐서 연산을 장치에 분산하는 방법을 검토합니다. 어떤 병렬화가 좋은지는 모델 구조와 메모리·통신 조건에 따라 다릅니다.',
      ),
    ],
    caution: 'GPU 개수를 늘렸다고 속도가 같은 비율로 증가하거나 OOM이 자동 해결되지는 않습니다.',
    scenario:
      '모델 전체가 GPU 한 장에 들어갑니다. 서로 다른 미니배치를 처리하고 그래디언트를 동기화하는 구성을 만드세요.',
    nodes: [
      node('data', '미니배치 분할', '서로 다른 데이터'),
      node('workers', '모델 복제본 2개', '각 GPU에 전체 모델'),
      node('sync', '그래디언트 동기화', '통신 필요'),
    ],
    initialEdges: [['data', 'workers']],
    fields: [
      select(
        'strategy',
        '병렬화 전략',
        'model',
        [
          ['model', '모델의 레이어 분할'],
          ['tensor', '텐서 연산 분할'],
          ['data', '데이터 병렬'],
        ],
        '이 과제에서는 모델 전체가 한 GPU에 들어갑니다.',
      ),
    ],
    goals: [
      edge(
        'workers',
        'sync',
        '복제본의 결과 동기화',
        '모델 복제본 → 그래디언트 동기화를 연결하세요.',
      ),
      answer(
        'strategy',
        'data',
        '데이터 병렬 선택',
        '서로 다른 입력을 전체 모델 복제본에 나누는 방식입니다.',
      ),
    ],
    experiment: '분할 대상과 동기화 관찰',
    reflection: '모델 자체가 한 GPU에 들어가지 않는다면 이 전략만으로 충분할까요?',
    references: [official.parallel],
  }),
  lesson({
    id: 'storage-types',
    week: 4,
    title: '데이터에 맞는 저장소 고르기',
    summary: '블록·파일·객체 스토리지의 접근 방식을 구분합니다.',
    concepts: ['EBS', 'EFS', 'S3 / MinIO', 'Artifact'],
    reading: [
      reading(
        '블록·파일·객체의 차이',
        '블록 스토리지는 디스크처럼, 파일 스토리지는 공유 파일 경로처럼, 객체 스토리지는 키를 가진 객체를 API로 읽고 쓰는 방식으로 접근합니다. 비용·지연·공유 조건을 함께 비교해야 합니다.',
      ),
      reading(
        '모델 파일과 메타데이터',
        '큰 모델 파일이나 데이터는 S3·MinIO 같은 객체 저장소에 보관할 수 있습니다. 실험 이름·지표·파일 위치 같은 메타데이터는 별도 데이터베이스 등에서 관리할 수 있습니다.',
      ),
    ],
    caution:
      '모든 모델 메타데이터가 객체 저장소에만 저장되는 것은 아닙니다. 특정 저장소가 항상 가장 빠르거나 저렴한 것도 아닙니다.',
    scenario: '큰 모델 파일을 객체 저장소에, 여러 워커가 공유할 파일을 파일 저장소에 배치하세요.',
    nodes: [
      node('model', '모델 Artifact', 'model.pt'),
      node('s3', 'S3 / MinIO', '객체 API'),
      node('workers', '공유 데이터 워커', '공유 파일 경로'),
    ],
    initialEdges: [],
    fields: [
      select(
        'shared',
        '워커 공유 파일 저장소',
        'block',
        [
          ['block', '단일 노드 블록 디스크'],
          ['file', '공유 파일 스토리지'],
        ],
        '여러 노드가 같은 파일 경로를 사용할 조건입니다.',
      ),
    ],
    goals: [
      edge(
        'model',
        's3',
        '모델 파일을 객체 저장소에 연결',
        '모델 Artifact → S3 / MinIO를 연결하세요.',
      ),
      answer(
        'shared',
        'file',
        '파일 공유 방식 선택',
        '여러 노드에서 공유할 파일 시스템이 필요합니다.',
      ),
    ],
    experiment: '저장 대상과 접근 방식 비교',
    reflection: '모델 파일과 실험 메타데이터를 나누어 관리하는 이유는 무엇일까요?',
    references: [devopsSources.storage, official.volumes],
    devops: 'S3·EBS·EFS의 역할 구분',
  }),
  lesson({
    id: 'persistent-volumes',
    week: 4,
    title: 'Pod가 바뀌어도 체크포인트 남기기',
    summary: 'PVC 요구 조건과 PV 제공 조건을 맞춥니다.',
    concepts: ['PV', 'PVC', 'StorageClass', 'RWO / RWX', 'emptyDir / hostPath'],
    reading: [
      reading(
        '작업과 데이터의 수명을 분리합니다',
        '컨테이너의 쓰기 계층은 교체 시 보존을 기대할 수 없습니다. emptyDir은 같은 Pod 안의 컨테이너 재시작에는 남을 수 있지만 Pod가 제거되면 사라집니다. 영구 저장이 필요하면 외부 볼륨을 사용합니다.',
      ),
      reading(
        '요구 조건을 맞추는 결합',
        'PVC의 용량·접근 모드·StorageClass 등의 조건에 맞는 PV가 필요합니다. 동적 프로비저닝은 StorageClass를 통해 볼륨을 준비할 수 있습니다. RWO는 단일 노드 읽기·쓰기, RWX는 여러 노드 읽기·쓰기를 뜻합니다.',
      ),
    ],
    caution:
      'PVC를 붙였다고 백업이 되지는 않습니다. 볼륨 삭제 정책과 장애·백업 전략도 별도로 필요합니다.',
    scenario:
      '10Gi, RWX가 필요한 공유 체크포인트 저장소를 연결하고 Pod 교체 후 파일을 확인하세요. StorageClass는 일치한다고 가정합니다.',
    nodes: [
      node('pod', '학습 Pod', 'checkpoint.pt'),
      node('pvc', 'PVC', '10Gi · RWX 요청'),
      node('pv', 'PV', '용량·접근 모드 제공'),
    ],
    initialEdges: [['pod', 'pvc']],
    fields: [
      number('capacity', 'PV 용량 (Gi)', 1, '요청량 10Gi 이상을 제공해야 합니다.', 1, 100),
      select(
        'mode',
        'PV 접근 모드',
        'RWO',
        [
          ['RWO', 'ReadWriteOnce'],
          ['RWX', 'ReadWriteMany'],
        ],
        '여러 노드의 읽기·쓰기를 허용하는 예제입니다.',
      ),
    ],
    goals: [
      edge('pvc', 'pv', 'PVC와 PV 결합', 'PVC → PV를 연결하세요.'),
      answer('capacity', 10, '요청량 이상의 용량 제공', '10Gi 이상이 필요합니다.', 'atLeast'),
      answer('mode', 'RWX', '요청 접근 모드 일치', '이 과제의 PVC는 RWX를 요구합니다.'),
    ],
    experiment: 'Pod 교체 후 파일 확인',
    reflection: 'emptyDir에서 컨테이너만 재시작하는 경우와 Pod가 삭제되는 경우는 같을까요?',
    references: [official.volumes, devopsSources.storage],
    devops: '연산 자원과 데이터 수명 분리',
  }),
  lesson({
    id: 'data-loading',
    week: 4,
    title: 'GPU가 데이터를 기다리고 있다면',
    summary: 'DataLoader의 데이터 공급 병목을 살펴봅니다.',
    concepts: ['I/O Bottleneck', 'GPU Starvation', 'num_workers', 'pin_memory', 'Caching'],
    reading: [
      reading(
        '빠른 연산만으로 충분하지 않습니다',
        '저장소에서 읽고 전처리하는 시간이 길면 GPU는 데이터를 기다립니다. 작은 파일을 대량으로 열 때의 메타데이터 비용과 캐시 활용도 살펴볼 수 있습니다.',
      ),
      reading(
        'DataLoader 설정의 역할',
        'num_workers는 로딩 작업의 병렬화를 돕고, pin_memory는 CUDA 전송에 유리한 호스트 메모리 사용을 지원합니다. 워커를 무조건 늘리면 CPU·메모리·스토리지 경쟁 때문에 오히려 느려질 수 있습니다.',
      ),
    ],
    caution:
      '이 실험의 공급률과 GPU 사용률은 병목 원리를 보여주는 예시입니다. 실제 성능 측정값이 아닙니다.',
    scenario:
      'GPU에 데이터를 공급하도록 연결하고, 이 예제 환경에 맞춰 워커 4개와 pin_memory를 설정하세요.',
    nodes: [
      node('storage', '데이터 스토리지', '작은 파일 다수'),
      node('loader', 'DataLoader', '읽기·전처리'),
      node('gpu', '학습 GPU', '데이터 대기'),
    ],
    initialEdges: [['storage', 'loader']],
    fields: [
      number('workers', '로딩 워커 수', 0, '이 예제의 목표 설정은 4개입니다.', 0, 8),
      select(
        'pin',
        'pin_memory',
        'off',
        [
          ['off', '비활성'],
          ['on', '활성'],
        ],
        '호스트 메모리에서 CUDA 전송을 돕는 옵션입니다.',
      ),
    ],
    goals: [
      edge('loader', 'gpu', '데이터 공급 경로 연결', 'DataLoader → 학습 GPU를 연결하세요.'),
      answer('workers', 4, '로딩 작업을 워커 4개로 분산', '이 예제의 워커 수는 4개로 조정합니다.'),
      answer('pin', 'on', '고정 메모리 옵션 확인', 'pin_memory를 활성화해 예시 결과를 비교하세요.'),
    ],
    experiment: '데이터 대기 비중 비교',
    reflection: '워커를 더 늘리기 전에 어떤 지표를 측정해야 할까요?',
    references: [official.io],
  }),
  lesson({
    id: 'dvc-time-travel',
    week: 5,
    title: '과거의 데이터셋으로 돌아가기',
    summary: 'Git 포인터와 실제 데이터 복원을 구분합니다.',
    concepts: ['Git', 'DVC', '.dvc', 'Remote', 'Cache'],
    reading: [
      reading(
        'Git에는 무엇을 남길까요?',
        'DVC는 큰 데이터 파일 대신 데이터의 식별 정보와 파이프라인 메타데이터를 Git으로 추적하도록 돕습니다. 실제 데이터는 캐시나 S3·MinIO 같은 원격 저장소에 보관할 수 있습니다.',
      ),
      reading(
        '포인터와 내용은 함께 맞춰야 합니다',
        'Git에서 과거 .dvc 파일을 복원했다고 작업 공간 데이터까지 자동으로 바뀌는 것은 아닙니다. 필요한 데이터가 캐시나 원격에 있는 상태에서 dvc checkout 등으로 내용을 맞춥니다.',
      ),
    ],
    caution: '원격이나 캐시에 해당 데이터가 없다면 포인터만으로 파일을 복원할 수 없습니다.',
    scenario:
      '코드와 포인터를 v1으로 되돌린 뒤, 데이터도 v1으로 복원하세요. 필요한 데이터는 캐시에 있습니다.',
    nodes: [
      node('git', 'Git 메타데이터', '.dvc 포인터'),
      node('cache', 'DVC 캐시', 'v1 / v2 데이터'),
      node('workspace', '작업 공간', '현재 데이터 v2'),
    ],
    initialEdges: [['git', 'cache']],
    fields: [
      select(
        'pointer',
        'Git에서 선택한 포인터',
        'v2',
        [
          ['v2', 'v2 포인터'],
          ['v1', 'v1 포인터'],
        ],
        '복원하려는 실험은 v1입니다.',
      ),
      select(
        'checkout',
        '데이터 복원 동작',
        'none',
        [
          ['none', 'Git 전환만 수행'],
          ['dvc', 'dvc checkout 수행'],
        ],
        '포인터가 가리키는 실제 데이터를 복원하는 단계입니다.',
      ),
    ],
    goals: [
      edge(
        'cache',
        'workspace',
        '캐시에서 작업 공간으로 복원',
        'DVC 캐시 → 작업 공간을 연결하세요.',
      ),
      answer('pointer', 'v1', '과거 포인터 v1 선택', 'Git의 메타데이터를 v1으로 되돌리세요.'),
      answer(
        'checkout',
        'dvc',
        '실제 데이터 체크아웃',
        'Git 전환만으로는 데이터 파일이 바뀌지 않습니다.',
      ),
    ],
    experiment: '데이터 타임트래블 실행',
    reflection: '같은 데이터여도 전처리 코드 버전이 다르면 같은 실험일까요?',
    references: [official.dvc, devopsSources.storage],
    devops: 'Git과 객체 저장소의 책임 구분',
  }),
  lesson({
    id: 'lakehouse',
    week: 5,
    title: '파일 위에 테이블의 이력 얹기',
    summary: '스냅샷과 스키마 진화를 통해 데이터 상태를 구분합니다.',
    concepts: ['Warehouse / Lake / Lakehouse', 'Iceberg / Delta', 'Snapshot', 'Schema Evolution'],
    reading: [
      reading(
        '저장소와 테이블 형식',
        '데이터 레이크는 다양한 파일을 보관하고, 레이크하우스는 테이블 메타데이터·트랜잭션 등의 기능을 더합니다. 객체 저장소 자체가 모든 테이블 기능을 제공하는 것은 아닙니다.',
      ),
      reading(
        '과거 상태를 가리키는 스냅샷',
        'Iceberg 같은 오픈 테이블 형식은 스냅샷과 스키마 진화를 지원합니다. 과거 실험을 재현할 때는 현재 최신 데이터가 아니라 당시 스냅샷과 코드를 함께 확인해야 합니다.',
      ),
    ],
    caution: '스냅샷과 파일이 정리된 후에도 과거 데이터를 영원히 복원할 수 있는 것은 아닙니다.',
    scenario:
      '현재 테이블은 v2입니다. 테이블 메타데이터와 파일을 연결하고, 과거 실험에 사용한 스냅샷 v1을 조회하세요.',
    nodes: [
      node('query', '실험 재현 쿼리', '과거 데이터 필요'),
      node('metadata', '테이블 메타데이터', '스냅샷·스키마'),
      node('objects', '객체 파일', 'v1 / v2 보관'),
    ],
    initialEdges: [['query', 'metadata']],
    fields: [
      select(
        'snapshot',
        '조회 스냅샷',
        'v2',
        [
          ['v2', '최신 v2 · 컬럼 추가됨'],
          ['v1', '실험 당시 v1'],
        ],
        '이 실습은 두 스냅샷을 모두 보관한 상태입니다.',
      ),
    ],
    goals: [
      edge(
        'metadata',
        'objects',
        '테이블 메타데이터와 파일 연결',
        '테이블 형식은 파일과 메타데이터를 함께 관리합니다.',
      ),
      answer('snapshot', 'v1', '실험 당시 스냅샷 선택', '최신 상태와 재현할 시점을 구분하세요.'),
    ],
    experiment: '스냅샷의 행과 스키마 비교',
    reflection: '파일을 계속 덮어쓰는 방식과 어떤 차이가 있을까요?',
    references: [official.iceberg],
  }),
  lesson({
    id: 'feature-store',
    week: 6,
    title: '학습과 서빙의 피처 맞추기',
    summary: '오프라인·온라인 스토어의 서로 다른 목적을 연결합니다.',
    concepts: ['Training-Serving Skew', 'Offline Store', 'Online Store', 'Materialization'],
    reading: [
      reading(
        '같은 이름, 다른 계산이면?',
        '학습에서는 지난 1시간 클릭 수를 썼는데 서빙에서는 전체 클릭 수를 쓰면 입력의 의미가 달라집니다. Feature Store는 정의와 피처의 재사용·제공을 관리하는 데 도움을 줍니다.',
      ),
      reading(
        '두 저장소의 역할',
        '오프라인 스토어는 과거 데이터와 학습 데이터 생성, 온라인 스토어는 낮은 지연의 최신 피처 조회에 적합합니다. 이력 시점과 계산 정의의 일치, 온라인으로 값을 공급하는 과정도 관리해야 합니다.',
      ),
    ],
    caution:
      'Feature Store를 설치하는 것만으로 시간 누수나 학습-서빙 불일치가 자동으로 사라지지는 않습니다.',
    scenario:
      '학습에는 오프라인 피처를, 실시간 추론에는 온라인 피처를 제공하고 계산 버전을 v1으로 맞추세요.',
    nodes: [
      node('offline', 'Offline Store', '이력 피처'),
      node('train', '학습 작업', '과거 시점 조회'),
      node('online', 'Online Store', '최근 피처'),
      node('serve', '실시간 추론', '낮은 지연 조회'),
    ],
    initialEdges: [['offline', 'train']],
    fields: [
      select(
        'featureVersion',
        '서빙 피처 계산 버전',
        'v2',
        [
          ['v2', 'v2 · 전체 클릭 수'],
          ['v1', 'v1 · 최근 1시간 클릭 수'],
        ],
        '학습은 v1 정의를 사용했습니다.',
      ),
    ],
    goals: [
      edge(
        'online',
        'serve',
        '온라인 피처를 실시간 추론에 연결',
        'Online Store → 실시간 추론을 연결하세요.',
      ),
      answer(
        'featureVersion',
        'v1',
        '학습·서빙 피처 정의 일치',
        '같은 이름뿐 아니라 계산 의미도 같아야 합니다.',
      ),
    ],
    experiment: '피처 조회 경로 비교',
    reflection: '학습 데이터에서 미래 정보를 참조하지 않으려면 무엇이 필요할까요?',
    references: [official.feast],
  }),
  lesson({
    id: 'vector-embedding',
    week: 6,
    title: '같은 벡터 공간에서 검색하기',
    summary: '문서와 질문의 임베딩 모델을 맞춥니다.',
    concepts: ['Embedding', 'Vector DB', 'KNN / ANN', 'HNSW'],
    reading: [
      reading(
        '의미를 좌표로 표현합니다',
        '임베딩은 텍스트 등의 입력을 벡터로 표현합니다. 벡터 간 거리는 사용하는 모델과 거리 척도에 따라 해석해야 합니다.',
      ),
      reading(
        '빠른 근사 검색과 호환성',
        '정확한 최근접 탐색은 모든 후보를 비교할 수 있고, HNSW 같은 근사 방식은 속도와 검색 재현율 사이의 절충을 제공합니다. 차원이 같아도 다른 모델의 벡터가 같은 의미 공간이라고 보장할 수는 없습니다.',
      ),
    ],
    caution:
      '일반 RDBMS도 벡터 확장 등을 통해 벡터 검색을 지원할 수 있습니다. Vector DB만 가능한 기능은 아닙니다.',
    scenario:
      '문서 인덱스는 embed-v1, 384차원으로 만들어졌습니다. 질문도 같은 모델로 변환해 검색하세요.',
    nodes: [
      node('query', '사용자 질문', '관련 문서 검색'),
      node('embed', '질문 임베딩', '모델 선택'),
      node('index', '벡터 인덱스', 'embed-v1 · 384차원'),
    ],
    initialEdges: [['query', 'embed']],
    fields: [
      select(
        'embedding',
        '질문 임베딩 모델',
        'v2',
        [
          ['v2', 'embed-v2 · 768차원'],
          ['v1', 'embed-v1 · 384차원'],
        ],
        '문서 인덱스와 같은 임베딩 모델을 선택하세요.',
      ),
    ],
    goals: [
      edge(
        'embed',
        'index',
        '질문 벡터를 인덱스에 전달',
        '질문 임베딩 → 벡터 인덱스를 연결하세요.',
      ),
      answer(
        'embedding',
        'v1',
        '임베딩 모델과 차원 일치',
        '차원과 모델의 의미 공간을 함께 확인하세요.',
      ),
    ],
    experiment: '질문 벡터 검색',
    reflection: '차원이 같다는 것만 확인하면 충분할까요?',
    references: [official.vector],
  }),
  lesson({
    id: 'rag-retrieval',
    week: 6,
    title: '근거 문서를 답변까지 전달하기',
    summary: '검색과 생성을 구분하고 RAG의 근거 경로를 만듭니다.',
    concepts: ['RAG', 'Retriever', 'Vector DB', 'Context'],
    reading: [
      reading(
        '검색은 생성과 다른 단계입니다',
        'RAG는 질문과 관련된 자료를 검색하고 그 자료를 문맥으로 제공해 답변 생성을 돕습니다. 문서 수집·분할·임베딩·인덱싱은 검색 준비 과정입니다.',
      ),
      reading(
        '검색 결과를 검토해야 합니다',
        '검색한 문서가 관련 없거나 오래되었다면 생성 답변에도 문제가 생길 수 있습니다. 출처와 관련성을 확인하고 근거가 부족하면 부족함을 드러내는 방식이 필요합니다.',
      ),
    ],
    caution:
      'RAG가 환각을 완전히 제거하지는 않습니다. 이 페이지는 예시 문서의 검색·전달을 시각화하며 실제 LLM을 호출하지 않습니다.',
    scenario:
      '“피처 스토어는 왜 필요한가?”라는 질문의 관련 문서를 검색해 답변 생성 단계로 전달하세요.',
    nodes: [
      node('query', '질문 임베딩', '피처 스토어 질문'),
      node('retriever', 'Retriever', '예시 문서 검색'),
      node('context', '검색 근거', '관련 문서 묶음'),
      node('answer', '답변 생성', '근거 문맥 사용'),
    ],
    initialEdges: [
      ['query', 'retriever'],
      ['retriever', 'context'],
    ],
    fields: [
      select(
        'document',
        '답변에 전달할 근거',
        'fruit',
        [
          ['fruit', '사과·바나나 설명'],
          ['feature', '피처 재사용과 온라인 조회 설명'],
        ],
        '질문과 관련된 문서를 선택하세요.',
      ),
    ],
    goals: [
      edge(
        'context',
        'answer',
        '검색 근거를 답변 생성에 연결',
        '검색만 하지 말고 근거를 다음 단계에 전달하세요.',
      ),
      answer(
        'document',
        'feature',
        '질문에 관련된 근거 선택',
        '검색 결과의 주제가 질문과 일치하는지 확인하세요.',
      ),
    ],
    experiment: '검색 근거 전달 확인',
    reflection: '검색 결과가 없을 때 답변 시스템은 어떻게 행동해야 할까요?',
    references: [official.rag],
  }),
  lesson({
    id: 'serving-patterns',
    week: 7,
    title: '요청에 맞는 서빙 방식 선택하기',
    summary: '배치와 실시간 처리, 통신 선택의 조건을 구분합니다.',
    concepts: ['Batch', 'Real-time', 'HTTP / gRPC'],
    reading: [
      reading(
        '즉시 응답이 필요한가요?',
        '매일 밤 대량 결과를 만드는 작업은 배치, 사용자의 현재 행동에 응답하는 작업은 실시간 서빙을 고려합니다. 처리량과 지연·비용의 요구가 다릅니다.',
      ),
      reading(
        '프로토콜은 조건에 맞게 선택합니다',
        'gRPC는 스키마 기반 RPC와 효율적인 바이너리 전송·스트리밍 등을 제공하지만 클라이언트·브라우저 환경과 운영 조건을 고려해야 합니다. HTTP와 gRPC 중 하나가 항상 우월한 것은 아닙니다.',
      ),
    ],
    caution:
      '실시간 서빙이 항상 필요한 것은 아닙니다. 예제의 지연 수치는 실제 성능 보장이 아닙니다.',
    scenario:
      '고객이 접속했을 때 추천 결과를 받도록 요청 경로를 연결하고 실시간 방식을 선택하세요.',
    nodes: [
      node('request', '사용자 접속', '현재 요청'),
      node('endpoint', '추론 엔드포인트', '선택한 모델'),
      node('response', '추천 응답', '사용자에게 반환'),
    ],
    initialEdges: [['request', 'endpoint']],
    fields: [
      select(
        'mode',
        '서빙 방식',
        'batch',
        [
          ['batch', '밤마다 일괄 처리'],
          ['realtime', '요청 시 실시간 처리'],
        ],
        '이 과제는 접속 중인 사용자에게 바로 응답해야 합니다.',
      ),
    ],
    goals: [
      edge(
        'endpoint',
        'response',
        '추론 결과를 사용자에게 반환',
        '추론 엔드포인트 → 추천 응답을 연결하세요.',
      ),
      answer(
        'mode',
        'realtime',
        '요구에 맞는 서빙 방식',
        '매일 밤의 결과가 아니라 현재 요청의 응답이 필요합니다.',
      ),
    ],
    experiment: '사용자 요청 보내기',
    reflection: '매일 새벽 전체 고객의 예측 파일을 만든다면 어떤 방식이 적합할까요?',
    references: [official.serving],
  }),
  lesson({
    id: 'safe-release',
    week: 7,
    title: '새 모델을 조금씩 공개하기',
    summary: 'Blue/Green·Canary·Shadow의 트래픽 차이를 확인합니다.',
    concepts: ['Blue / Green', 'Canary', 'Shadow', 'Rollback'],
    reading: [
      reading(
        '환경 전환과 점진 배포',
        'Blue/Green은 별도 환경을 준비해 활성 경로를 전환하는 방식입니다. Canary는 일부 실제 트래픽을 새 버전으로 보내 지표를 보며 점진적으로 늘립니다.',
      ),
      reading(
        'Shadow는 응답을 바꾸지 않습니다',
        'Shadow는 요청을 새 모델에도 복제하되 사용자는 기존 모델의 응답을 받게 합니다. 부작용이 있는 요청과 개인정보, 추가 비용 등을 검토해야 합니다.',
      ),
    ],
    caution:
      '트래픽 비중만 맞추면 안전한 배포가 되는 것은 아닙니다. 관측 지표와 중단·롤백 조건도 필요합니다.',
    scenario: '새 모델에 실제 사용자 트래픽 10%만 보내는 Canary 배포를 구성하세요.',
    nodes: [
      node('router', '트래픽 라우터', '요청 분배'),
      node('old', '기존 모델 v1', '안정 버전'),
      node('new', '새 모델 v2', '검증 대상'),
    ],
    initialEdges: [['router', 'old']],
    fields: [
      select(
        'strategy',
        '배포 전략',
        'shadow',
        [
          ['bluegreen', 'Blue/Green'],
          ['canary', 'Canary'],
          ['shadow', 'Shadow'],
        ],
        '새 모델의 응답을 일부 실제 사용자에게 제공하려 합니다.',
      ),
      number(
        'traffic',
        '새 모델 실제 응답 비율 (%)',
        100,
        '이번 과제의 초기 Canary 비중은 10%입니다.',
        0,
        100,
      ),
    ],
    goals: [
      edge(
        'router',
        'new',
        '새 모델로 향하는 경로 연결',
        '트래픽 라우터 → 새 모델 v2를 연결하세요.',
      ),
      answer(
        'strategy',
        'canary',
        'Canary 전략 선택',
        'Shadow는 새 모델의 응답을 사용자에게 제공하지 않습니다.',
      ),
      answer('traffic', 10, '새 모델 응답 비율 10%', '기존 모델 90%, 새 모델 10%로 시작하세요.'),
    ],
    experiment: '요청 100건 분배 관찰',
    reflection: '새 모델 오류율이 상승하면 어떤 지표와 조치가 필요할까요?',
    references: [official.serving, devopsSources.availability],
    devops: '로드 밸런싱·헬스 체크와 트래픽 전환',
  }),
  lesson({
    id: 'drift-monitoring',
    week: 7,
    title: '정상 응답과 좋은 예측을 구분하기',
    summary: '시스템 지표와 데이터·모델 품질을 함께 관찰합니다.',
    concepts: ['Data Drift', 'Concept Drift', 'Prometheus', 'Logs / Metrics / Traces'],
    reading: [
      reading(
        '서버가 살아 있어도 모델은 나빠질 수 있습니다',
        'Data Drift는 입력 분포의 변화, Concept Drift는 입력과 정답 사이 관계의 변화입니다. 데이터 분포가 변했다고 반드시 성능이 떨어지는 것은 아니며, 품질 확인에는 정답 관측 지연도 고려해야 합니다.',
      ),
      reading(
        '무엇을 수집하고 어떻게 판단할까요?',
        'Prometheus는 수치 시계열 지표를 수집·질의하는 도구입니다. 요청 지연·오류율 같은 시스템 지표와 평가 가능한 모델 품질 지표를 함께 봅니다. 로그·메트릭·트레이스는 서로 다른 관찰 자료입니다.',
      ),
    ],
    caution:
      '드리프트 탐지와 재학습 결정은 같은 일이 아닙니다. 실제 정답 데이터와 업무 영향을 검토해야 합니다.',
    scenario:
      '응답은 정상이지만 정답이 수집된 표본의 정확도가 0.85에서 0.62로 떨어졌습니다. 모델 품질도 수집하고 조사 대상으로 분류하세요.',
    nodes: [
      node('service', '추론 서비스', 'HTTP 응답 정상'),
      node('metrics', '품질·시스템 지표', '정확도 0.62'),
      node('review', '원인 조사', '데이터·개념 변화 검토'),
    ],
    initialEdges: [['service', 'metrics']],
    fields: [
      select(
        'watch',
        '관찰할 지표 범위',
        'uptime',
        [
          ['uptime', '서비스 가동 여부만'],
          ['quality', '가동 여부 + 모델 품질'],
        ],
        '정상 응답만으로 예측 품질을 알 수 없습니다.',
      ),
      select(
        'decision',
        '관측 후 행동',
        'ignore',
        [
          ['ignore', '정상 응답이므로 무시'],
          ['investigate', '품질 저하와 드리프트 원인 조사'],
        ],
        '자동으로 재학습을 확정하는 단계는 아닙니다.',
      ),
    ],
    goals: [
      edge(
        'metrics',
        'review',
        '지표를 원인 조사로 연결',
        '품질·시스템 지표 → 원인 조사를 연결하세요.',
      ),
      answer('watch', 'quality', '모델 품질도 관찰', '수집 가능한 정답과 예측을 비교해야 합니다.'),
      answer(
        'decision',
        'investigate',
        '조사할 문제로 분류',
        '관측 결과를 바탕으로 데이터와 모델을 검토하세요.',
      ),
    ],
    experiment: '운영 지표와 품질 변화 관찰',
    reflection: '입력 분포 변화만 보고 바로 재학습을 실행해도 될까요?',
    references: [official.prometheus, official.serving],
  }),
];
export const legacyLessonById = Object.fromEntries(
  legacyLessons.map((item) => [item.id, item]),
) as Record<string, Lesson>;

export { weeks, chapters, chapterLabel, lessons, lessonById } from './blockml';
