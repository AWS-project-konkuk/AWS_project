import type { Lesson } from './types';
import { node, edge, answer, select, reading, lesson, devopsSources } from './definition';

export const foundationLessons: Lesson[] = [
  lesson({
    id: 'aws-ec2-ebs',
    week: 0,
    title: 'EC2·AMI·EBS의 역할 구분하기',
    minutes: 10,
    summary: '모델 코드를 실행할 컴퓨터, 시작 이미지, 작업 디스크를 구분합니다.',
    concepts: ['EC2', 'AMI', 'EBS'],
    reading: [
      reading(
        '학습 코드가 실행될 컴퓨터',
        'EC2 인스턴스는 AWS에서 빌려 쓰는 가상 컴퓨터입니다. CPU와 메모리, 필요한 경우 GPU를 선택하고 그 위에서 코드를 실행합니다. 인스턴스를 만들 때는 운영체제 등을 담은 시작 이미지인 AMI를 지정합니다.\n\nAMI는 실행 중인 서버 자체가 아닙니다. 같은 AMI에서 여러 인스턴스를 시작해 비슷한 환경을 만들 수 있지만, 실행 중의 메모리 상태까지 복제한다는 뜻은 아닙니다.',
      ),
      reading(
        '작업 디스크와 메모리는 다릅니다',
        'EBS는 인스턴스에 연결하는 블록 저장소입니다. 운영체제나 작업 파일을 디스크에 보관하며 RAM 내용을 자동으로 저장해 주지는 않습니다. 작업 결과를 남기려면 코드가 파일을 쓰도록 해야 합니다.',
        {
          columns: ['서비스', '맡는 역할', 'MLOps에서의 예'],
          rows: [
            ['EC2', '코드 실행', '전처리·학습 작업'],
            ['AMI', '시작 환경 제공', '운영체제와 기본 소프트웨어'],
            ['EBS', '블록 디스크', '작업 파일·체크포인트'],
          ],
        },
      ),
      reading(
        '다시 시작할 때 남겨 둘 것',
        '이번 실습에서는 EC2 종료 후에도 데이터 EBS를 보존하도록 설정합니다. 보존한 볼륨을 다른 호환 인스턴스에 다시 연결하면 디스크 파일을 읽을 수 있습니다. 실제 구성에서는 볼륨의 가용 영역, 연결 조건과 DeleteOnTermination 설정을 확인해야 합니다.',
      ),
    ],
    caution:
      '실행 중 메모리와 디스크 파일을 구분하세요. 이 실습은 같은 AZ의 데이터 볼륨을 보존하는 조건입니다.',
    scenario:
      'AMI로 시작한 EC2가 체크포인트를 EBS에 기록하고, 인스턴스를 종료해도 데이터 볼륨을 보존하도록 구성하세요.',
    nodes: [
      node('ami', 'AMI', '시작 이미지'),
      node('ec2', 'EC2', '코드 실행'),
      node('ebs', '데이터 EBS', 'checkpoint.pt'),
    ],
    initialEdges: [['ami', 'ec2']],
    fields: [
      select(
        'volume',
        'EC2 종료 시 데이터 EBS',
        'delete',
        [
          ['delete', '함께 삭제'],
          ['retain', '볼륨 보존'],
        ],
        '실험에서는 데이터 볼륨의 종료 시 삭제 여부만 바꿉니다.',
      ),
    ],
    goals: [
      edge('ec2', 'ebs', '체크포인트를 데이터 EBS에 기록', 'EC2 → 데이터 EBS를 연결하세요.'),
      answer(
        'volume',
        'retain',
        'EC2 종료 후 데이터 볼륨 보존',
        '데이터 EBS의 종료 시 삭제를 해제하는 조건입니다.',
      ),
    ],
    experiment: 'EC2 종료 후 파일 확인',
    reflection: 'AMI와 EBS 중 작업 중에 생성한 체크포인트를 직접 보관하는 것은 무엇일까요?',
    references: [
      devopsSources.identity,
      { title: 'AWS · AMI', url: 'https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/AMIs.html' },
      {
        title: 'AWS · 종료 시 데이터 보존',
        url: 'https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/preserving-volumes-on-termination.html',
      },
    ],
  }),
  lesson({
    id: 'aws-s3-versions',
    week: 0,
    title: 'S3에 모델 파일과 버전 남기기',
    minutes: 10,
    summary: '버킷·객체 키·버전 ID를 이해하고 덮어쓰기 이후의 복구를 확인합니다.',
    concepts: ['S3', 'Bucket', 'Object Key', 'Versioning'],
    reading: [
      reading(
        '모델 파일을 어디에 보관할까요?',
        '학습이 끝나면 다른 작업에서도 모델 파일을 가져갈 수 있어야 합니다. S3는 파일 내용을 객체로 보관하고 API로 읽고 쓰는 저장소입니다. 객체를 담는 공간을 버킷, 버킷 안에서 객체를 가리키는 이름을 키라고 합니다.\n\n예를 들어 ml-artifacts 버킷의 models/model.pt는 하나의 객체 키입니다. models/는 키의 접두사이며 일반 디스크의 폴더 구조와 동일하게 동작하지는 않습니다.',
      ),
      reading(
        '같은 키에 새 모델을 올린다면',
        '버전 관리를 미리 켜 두면 같은 키에 다시 쓸 때 새 버전 ID가 생기고 이전 내용도 보관됩니다. 이 실습에서는 v1을 올리기 전에 버전 관리를 설정하고 v2로 덮어쓴 뒤 v1을 다시 조회합니다.\n\n버전 ID를 지정하지 않은 일반 읽기는 최신 내용을 가져옵니다. 과거 모델을 읽으려면 해당 버전 ID를 선택해야 합니다.',
        {
          columns: ['조회 조건', '읽는 내용'],
          rows: [
            ['버전 ID 생략', '최신 모델 v2'],
            ['v1의 버전 ID 지정', '이전에 저장한 모델 v1'],
          ],
        },
      ),
    ],
    caution:
      'S3 버전 관리는 파일 이력입니다. 코드·파라미터·데이터까지 묶은 실험 재현과는 구분해야 합니다.',
    scenario:
      '첫 업로드 전 버전 관리를 켜고, model.pt를 v2로 덮어쓴 뒤에도 모델 v1을 읽을 수 있도록 구성하세요.',
    nodes: [
      node('upload', '모델 업로드', 'v1 → v2 순서'),
      node('bucket', 'S3 버킷', 'models/model.pt'),
      node('restore', '버전 지정 조회', '모델 v1 필요'),
    ],
    initialEdges: [['upload', 'bucket']],
    fields: [
      select(
        'versioning',
        '첫 업로드 전 버전 관리',
        'off',
        [
          ['off', '사용 안 함'],
          ['on', '사용'],
        ],
        'v1 업로드 이전의 설정입니다.',
      ),
      select(
        'version',
        '읽을 객체 버전',
        'latest',
        [
          ['latest', '버전 ID 생략 · 최신'],
          ['v1', 'v1의 버전 ID 지정'],
        ],
        '최신 모델과 실험에 사용한 과거 모델을 구분하세요.',
      ),
    ],
    goals: [
      edge(
        'bucket',
        'restore',
        'S3 객체를 버전 조회에 연결',
        'S3 버킷 → 버전 지정 조회를 연결하세요.',
      ),
      answer(
        'versioning',
        'on',
        '업로드 이전부터 이력 보관',
        '첫 객체를 저장하기 전에 버전 관리를 켜세요.',
      ),
      answer('version', 'v1', '과거 버전 ID로 조회', '버전 ID를 생략하면 최신 v2를 읽습니다.'),
    ],
    experiment: '덮어쓴 모델의 과거 버전 읽기',
    reflection: 'S3 파일 버전만 있으면 학습 코드를 바꾼 이유까지 재현할 수 있을까요?',
    references: [
      devopsSources.storage,
      {
        title: 'AWS · S3 버전 관리',
        url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/Versioning.html',
      },
    ],
  }),
  lesson({
    id: 'aws-vpc-security',
    week: 0,
    title: 'VPC 안에서 필요한 요청만 허용하기',
    minutes: 12,
    summary: '서브넷·경로·보안 그룹·IAM이 해결하는 문제를 구분합니다.',
    concepts: ['VPC', 'Subnet', 'Security Group', 'IAM'],
    reading: [
      reading(
        '네트워크 공간과 경로',
        'VPC는 AWS 자원을 배치하는 가상 네트워크이고, 서브넷은 그 안의 주소 범위를 나눈 공간입니다. 자원이 어디에 있는지와 요청이 어디로 이동할 수 있는지는 구분해서 봐야 합니다. 라우팅 테이블은 목적지에 따라 사용할 경로를 결정합니다.\n\n프라이빗 서브넷이라는 이름만으로 모든 통신이 차단되는 것은 아닙니다. 실제 경로와 접속 대상, 보안 설정을 함께 확인합니다.',
      ),
      reading(
        '도달 가능한 요청 중 무엇을 받을까요?',
        '보안 그룹은 연결된 자원의 인바운드·아웃바운드 트래픽을 허용하는 규칙입니다. 서비스가 8080번 포트에서 실행되더라도 허용 규칙이 맞지 않으면 요청을 받을 수 없습니다.\n\n이번에는 ALB에서 오는 요청만 서비스에 도달해야 합니다. 출발지를 모든 인터넷 주소로 넓히는 대신 ALB의 보안 그룹을 지정합니다.',
        {
          columns: ['점검 대상', '확인할 질문'],
          rows: [
            ['라우팅', '목적지로 갈 경로가 있는가?'],
            ['보안 그룹', '해당 출발지·포트의 통신을 허용하는가?'],
            ['IAM', '이 자격으로 해당 API 작업을 해도 되는가?'],
          ],
        },
      ),
    ],
    caution:
      '보안 그룹을 열어도 S3 API 읽기 권한이 생기지는 않습니다. 이번 실험에서는 라우팅과 ALB 설정이 준비되어 있다고 가정합니다.',
    scenario:
      '추론 EC2는 8080번에서 대기합니다. 준비된 ALB에서 오는 요청만 받아야 합니다. 서비스의 보안 그룹을 맞추세요.',
    nodes: [
      node('alb', 'ALB', 'ALB 보안 그룹'),
      node('sg', '서비스 보안 그룹', '허용 규칙'),
      node('service', '추론 EC2', 'TCP 8080'),
    ],
    initialEdges: [['alb', 'sg']],
    fields: [
      select(
        'source',
        '인바운드 허용 출발지',
        'none',
        [
          ['none', '허용 안 함'],
          ['internet', '모든 인터넷 주소'],
          ['alb', 'ALB 보안 그룹'],
        ],
        '요청이 실제로 오는 출발지만 허용합니다.',
      ),
      select(
        'port',
        '서비스 허용 포트',
        '22',
        [
          ['22', 'TCP 22 · SSH'],
          ['8080', 'TCP 8080 · 추론 서비스'],
        ],
        '관리 접속 포트와 서비스 포트는 다릅니다.',
      ),
    ],
    goals: [
      edge(
        'sg',
        'service',
        '보안 그룹을 추론 서비스에 연결',
        '서비스 보안 그룹 → 추론 EC2를 연결하세요.',
      ),
      answer('source', 'alb', 'ALB 출발지만 허용', '전체 인터넷 대신 ALB 보안 그룹을 허용하세요.'),
      answer('port', '8080', '서비스 포트 허용', '이번 추론 코드는 TCP 8080에서 대기합니다.'),
    ],
    experiment: 'ALB에서 추론 요청 보내기',
    reflection: '연결 시간 초과와 S3 AccessDenied는 같은 설정에서 해결할 수 있을까요?',
    references: [
      devopsSources.network,
      {
        title: 'AWS · 보안 그룹',
        url: 'https://docs.aws.amazon.com/vpc/latest/userguide/vpc-security-groups.html',
      },
    ],
  }),
  lesson({
    id: 'aws-container-services',
    week: 0,
    title: '이미지 보관과 컨테이너 실행 구분하기',
    minutes: 10,
    summary: 'ECR·ECS·EKS·Fargate를 각각의 역할에 맞춰 이해합니다.',
    concepts: ['ECR', 'ECS', 'EKS', 'Fargate'],
    reading: [
      reading(
        '이미지를 올렸다고 실행되는 것은 아닙니다',
        '모델 추론 코드를 이미지로 묶은 뒤 ECR에 보관할 수 있습니다. ECR은 이미지를 배포하고 가져오는 레지스트리이며, 그 자체가 추론 요청을 처리하는 실행 환경은 아닙니다.',
      ),
      reading(
        '컨테이너를 어디서 관리할까요?',
        'ECS와 EKS는 컨테이너를 실행·배치·관리하는 선택지입니다. ECS는 AWS의 컨테이너 오케스트레이션, EKS는 관리형 Kubernetes 서비스입니다. 기존 Kubernetes 구성이나 관련 요구가 없다면 MLOps를 시작할 때 반드시 EKS부터 사용할 필요는 없습니다.',
        {
          columns: ['서비스', '핵심 역할'],
          rows: [
            ['ECR', '컨테이너 이미지 보관'],
            ['ECS', 'AWS 방식으로 컨테이너 관리'],
            ['EKS', 'Kubernetes 기반으로 컨테이너 관리'],
            ['Fargate', '서버 관리 부담을 줄인 컨테이너 컴퓨팅'],
          ],
        },
      ),
      reading(
        '관리 방식과 컴퓨팅은 다른 선택입니다',
        'ECS를 고른 뒤에도 컨테이너가 사용할 컴퓨팅을 정해야 합니다. 예를 들어 EC2 기반 용량과 Fargate를 검토할 수 있습니다. 이번 과제는 작은 CPU 추론 서비스이며 Kubernetes 기능과 호스트 직접 관리가 필요하지 않은 조건입니다.',
      ),
    ],
    caution:
      'EKS가 모든 MLOps 프로젝트의 필수 서비스는 아닙니다. GPU·네트워크·운영 요구가 달라지면 컴퓨팅 선택도 다시 검토합니다.',
    scenario:
      'ECR의 이미지를 작은 CPU 추론 서비스로 실행하세요. 이 과제에서는 Kubernetes를 요구하지 않고 서버 직접 관리를 줄이려 하므로 ECS와 Fargate를 선택합니다.',
    nodes: [
      node('ecr', 'ECR', '추론 이미지 보관'),
      node('runtime', '컨테이너 관리', '실행 방식 선택'),
      node('endpoint', '추론 서비스', 'CPU 요청 처리'),
    ],
    initialEdges: [['ecr', 'runtime']],
    fields: [
      select(
        'orchestrator',
        '컨테이너 관리 서비스',
        'ecr',
        [
          ['ecr', 'ECR'],
          ['ecs', 'ECS'],
          ['eks', 'EKS'],
        ],
        '이미지 저장소와 컨테이너 관리 서비스를 구분하세요.',
      ),
      select(
        'compute',
        '컴퓨팅 방식',
        'ec2',
        [
          ['ec2', '직접 관리하는 EC2 용량'],
          ['fargate', 'Fargate'],
        ],
        '이 과제는 CPU 서비스이며 호스트 직접 관리가 필요하지 않습니다.',
      ),
    ],
    goals: [
      edge(
        'runtime',
        'endpoint',
        '이미지의 실행 결과를 서비스로 연결',
        '컨테이너 관리 → 추론 서비스를 연결하세요.',
      ),
      answer(
        'orchestrator',
        'ecs',
        '과제 조건에 맞는 ECS 선택',
        '이번 과제는 Kubernetes 구성이 필요하지 않습니다.',
      ),
      answer(
        'compute',
        'fargate',
        '호스트 관리 부담을 줄인 컴퓨팅 선택',
        '주어진 CPU 서비스 조건에서 Fargate를 선택하세요.',
      ),
    ],
    experiment: '이미지에서 서비스 실행하기',
    reflection: 'ECR의 이미지 태그만 확인해도 실행 중인 컨테이너 수를 알 수 있을까요?',
    references: [
      devopsSources.container,
      {
        title: 'AWS · ECS 개요',
        url: 'https://docs.aws.amazon.com/AmazonECS/latest/developerguide/Welcome.html',
      },
    ],
  }),
  lesson({
    id: 'aws-alb-health',
    week: 0,
    title: 'ALB로 준비된 추론 서버에 요청 보내기',
    minutes: 12,
    summary: '로드 밸런서의 경로·헬스 체크와 모델 품질을 구분합니다.',
    concepts: ['ALB', 'Target Group', 'Health Check'],
    reading: [
      reading(
        '고정된 입구 뒤에 서버를 둡니다',
        'ALB는 HTTP·HTTPS 요청을 받고 규칙에 맞는 대상 그룹으로 전달합니다. 서버가 바뀌더라도 사용자는 같은 진입점으로 요청할 수 있습니다. 대상 그룹에는 요청을 받을 서버와 헬스 체크 조건이 연결됩니다.',
      ),
      reading(
        '서비스가 실제로 준비됐는지 확인합니다',
        '헬스 체크는 정해진 경로·포트로 요청을 보내 서버의 상태를 확인합니다. 이번 예제의 준비 상태 경로는 /ready이고, 모델 로딩이 끝난 뒤 200을 반환합니다. 잘못된 /health 경로는 404를 반환하므로 경로부터 맞춰야 합니다.\n\n실제 ALB는 성공·실패 횟수와 주기를 사용해 상태를 바꿉니다. 여기서는 이 대기 시간을 줄여, 체크 결과와 요청 대상의 관계만 확인합니다.',
      ),
      reading(
        '좋은 예측인지는 별도로 확인합니다',
        '200 응답은 준비 상태 검사를 통과했다는 뜻입니다. 모델 정확도나 입력 데이터의 적절성까지 보장하지는 않습니다. 시스템 가용성과 모델 품질을 함께 보는 관점은 7주차 운영 강의로 이어집니다.',
      ),
    ],
    caution:
      '이 실험은 준비 상태 경로의 응답만 비교합니다. 실제 ALB에서 모든 대상이 비정상이면 fail-open 동작도 고려해야 합니다.',
    scenario:
      '등록된 추론 서버가 /ready에서만 200을 반환합니다. ALB의 대상 그룹과 헬스 체크 경로를 연결하고 정상 대상에 요청을 전달하세요.',
    nodes: [
      node('alb', 'ALB', 'HTTP 요청 진입'),
      node('target', '대상 그룹', '헬스 체크 설정'),
      node('server', '추론 서버', '/ready → 200'),
    ],
    initialEdges: [['alb', 'target']],
    fields: [
      select(
        'healthPath',
        '헬스 체크 경로',
        '/health',
        [
          ['/health', '/health · 404 반환'],
          ['/ready', '/ready · 200 반환'],
        ],
        '서버가 실제 제공하는 준비 상태 경로를 확인하세요.',
      ),
    ],
    goals: [
      edge(
        'target',
        'server',
        '추론 서버를 대상 그룹에 연결',
        '대상 그룹 → 추론 서버를 연결하세요.',
      ),
      answer(
        'healthPath',
        '/ready',
        '준비 상태 검사 경로 일치',
        '등록된 서버의 /ready 경로가 200을 반환합니다.',
      ),
    ],
    experiment: '헬스 체크와 요청 전달 확인',
    reflection: '추론 서버가 200을 반환하는데 예측 정확도가 낮다면 ALB 경로만 바꾸면 될까요?',
    references: [
      devopsSources.availability,
      {
        title: 'AWS · ALB 헬스 체크',
        url: 'https://docs.aws.amazon.com/elasticloadbalancing/latest/application/target-group-health-checks.html',
      },
    ],
  }),
];
