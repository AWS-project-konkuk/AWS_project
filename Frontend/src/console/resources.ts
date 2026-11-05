import { workflowNodes, topicNodes } from '../nodes/catalog';
export type Service =
  | 'monitoring'
  | 'gpu'
  | 'sync'
  | 'image'
  | 'container'
  | 'pod'
  | 'pvc'
  | 'pv'
  | 'git-meta'
  | 'cache'
  | 'vector-db'
  | 'context'
  | 'generation'
  | 'router'
  | 'old-model'
  | 'new-model'
  | 'dataset'
  | 'preprocess'
  | 'training'
  | 'evaluation'
  | 'registry'
  | 'serving'
  | 'ec2'
  | 'ami'
  | 'ebs'
  | 's3'
  | 'iam'
  | 'security-group'
  | 'route-table'
  | 'alb'
  | 'target-group'
  | 'ecr'
  | 'ecs';
export interface ResourceConfig {
  service: Service;
  name: string;
  settings: Record<string, string | number>;
}
export interface ConsoleField {
  id: string;
  title: string;
  label: string;
  help: string;
  initial: string | number;
  options?: { value: string; label: string }[];
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}
export interface ServiceSpec {
  id: Service;
  name: string;
  category: string;
  description: string;
  fields: ConsoleField[];
}
const pick = (
  id: string,
  title: string,
  label: string,
  initial: string,
  choices: [string, string][],
  help: string,
): ConsoleField => ({
  id,
  title,
  label,
  initial,
  options: choices.map(([value, label]) => ({ value, label })),
  help,
});
const size = (
  id: string,
  label: string,
  initial: number,
  min: number,
  max: number,
): ConsoleField => ({
  id,
  title: '스토리지 구성',
  label,
  initial,
  min,
  max,
  help: `실습에서는 ${min}~${max} 사이의 정수를 사용합니다.`,
});
export const services: ServiceSpec[] = [
  ...workflowNodes,
  ...topicNodes,
  {
    id: 'ec2',
    name: 'EC2 인스턴스',
    category: '컴퓨팅',
    description: '이미지와 인스턴스 유형을 선택해 코드를 실행할 컴퓨터를 준비합니다.',
    fields: [
      pick(
        'image',
        '애플리케이션 및 OS 이미지',
        '머신 이미지 (AMI)',
        'ubuntu',
        [
          ['ubuntu', 'Ubuntu Server'],
          ['al2023', 'Amazon Linux 2023'],
          ['dlami', 'Deep Learning AMI · 예시'],
        ],
        '운영체제와 기본 소프트웨어가 담긴 시작 이미지입니다.',
      ),
      pick(
        'instance',
        '인스턴스 유형',
        '인스턴스 유형',
        't3.medium',
        [
          ['t3.medium', 't3.medium · 범용 CPU'],
          ['t3.large', 't3.large · 범용 CPU'],
          ['g4dn.xlarge', 'g4dn.xlarge · GPU'],
        ],
        '이번 실습에서는 인스턴스 유형의 역할을 비교합니다.',
      ),
      pick(
        'subnet',
        '네트워크 설정',
        '서브넷',
        'private-a',
        [
          ['private-a', '프라이빗 서브넷 A'],
          ['public-a', '퍼블릭 서브넷 A'],
        ],
        '준비된 학습용 VPC의 서브넷입니다.',
      ),
      size('disk', '루트 볼륨 크기 (GiB)', 30, 8, 1024),
    ],
  },
  {
    id: 'ami',
    name: 'AMI',
    category: '컴퓨팅',
    description: '인스턴스를 시작할 소프트웨어 템플릿입니다.',
    fields: [
      pick(
        'image',
        '이미지 설정',
        '이미지 기반',
        'ubuntu',
        [
          ['ubuntu', 'Ubuntu Server'],
          ['al2023', 'Amazon Linux 2023'],
          ['dlami', 'Deep Learning AMI · 예시'],
        ],
        '실행 중 메모리 상태와는 다릅니다.',
      ),
    ],
  },
  {
    id: 'ebs',
    name: 'EBS 볼륨',
    category: '스토리지',
    description: '작업 파일과 체크포인트를 담을 디스크를 준비합니다.',
    fields: [
      size('capacity', '볼륨 크기 (GiB)', 20, 1, 1024),
      pick(
        'deletion',
        '볼륨 수명',
        '인스턴스 종료 시',
        'delete',
        [
          ['delete', '함께 삭제'],
          ['retain', '볼륨 보존'],
        ],
        '실습의 데이터 볼륨 삭제 설정입니다.',
      ),
    ],
  },
  {
    id: 's3',
    name: 'S3 버킷',
    category: '스토리지',
    description: '데이터셋과 모델 파일을 객체로 보관합니다.',
    fields: [
      pick(
        'versioning',
        '버킷 버전 관리',
        '버전 관리',
        'off',
        [
          ['off', '사용 안 함'],
          ['on', '사용'],
        ],
        '같은 객체 키의 이전 내용을 보관할지 선택합니다.',
      ),
    ],
  },
  {
    id: 'iam',
    name: 'IAM 역할',
    category: '권한·네트워크',
    description: '작업이 사용할 권한을 설정합니다.',
    fields: [
      pick(
        'policy',
        '권한 정책',
        'S3 권한',
        'none',
        [
          ['none', '권한 없음'],
          ['read', '대상 데이터 읽기'],
          ['admin', '전체 관리자 권한 · 비교용'],
        ],
        '실습용 정책 예시이며 실제 IAM 평가 전체를 재현하지 않습니다.',
      ),
    ],
  },
  {
    id: 'security-group',
    name: '보안 그룹',
    category: '권한·네트워크',
    description: '서비스가 받을 요청의 출발지와 포트를 설정합니다.',
    fields: [
      pick(
        'source',
        '인바운드 규칙',
        '허용 출발지',
        'none',
        [
          ['none', '허용 안 함'],
          ['internet', '모든 인터넷 주소'],
          ['alb', 'ALB 보안 그룹'],
        ],
        '준비된 ALB 보안 그룹을 출발지로 선택할 수 있습니다.',
      ),
      pick(
        'port',
        '서비스 포트',
        '허용 포트',
        '22',
        [
          ['22', 'TCP 22 · SSH'],
          ['8080', 'TCP 8080 · 추론 서비스'],
        ],
        '관리 접속과 서비스 요청의 포트를 구분합니다.',
      ),
    ],
  },
  {
    id: 'route-table',
    name: '라우팅 테이블',
    category: '권한·네트워크',
    description: '프라이빗 작업의 S3 목적지 경로를 비교합니다.',
    fields: [
      pick(
        'target',
        'S3 목적지의 경로',
        '경로 대상',
        'none',
        [
          ['none', '경로 없음'],
          ['igw', 'Internet Gateway'],
          ['endpoint', 'S3 Gateway Endpoint'],
        ],
        '학습용 게이트웨이와 엔드포인트가 준비된 조건입니다.',
      ),
    ],
  },
  {
    id: 'alb',
    name: 'Application Load Balancer',
    category: '권한·네트워크',
    description: '추론 요청을 받을 고정된 진입점입니다.',
    fields: [
      pick(
        'scheme',
        '로드 밸런서 구성',
        '체계',
        'internet',
        [
          ['internet', '인터넷 연결'],
          ['internal', '내부 전용'],
        ],
        '접근 주체에 맞는 진입점을 구분합니다.',
      ),
      pick(
        'listener',
        '리스너',
        '리스너 포트',
        '80',
        [
          ['80', 'HTTP 80'],
          ['443', 'HTTPS 443 · 인증서 준비 가정'],
        ],
        '실습에서는 인증서 발급을 다루지 않습니다.',
      ),
    ],
  },
  {
    id: 'target-group',
    name: '대상 그룹',
    category: '권한·네트워크',
    description: '요청을 받을 대상과 준비 상태 검사 조건입니다.',
    fields: [
      pick(
        'healthPath',
        '상태 검사',
        '헬스 체크 경로',
        '/health',
        [
          ['/health', '/health'],
          ['/ready', '/ready'],
        ],
        '대상 서버가 제공하는 경로와 일치해야 합니다.',
      ),
    ],
  },
  {
    id: 'ecr',
    name: 'ECR 리포지토리',
    category: '컨테이너',
    description: '컨테이너 이미지를 보관할 저장소입니다.',
    fields: [
      pick(
        'tag',
        '이미지 버전',
        '이미지 태그',
        'v1',
        [
          ['v1', 'v1'],
          ['v2', 'v2'],
        ],
        '태그는 학습용 버전 구분입니다.',
      ),
    ],
  },
  {
    id: 'ecs',
    name: 'ECS 서비스',
    category: '컨테이너',
    description: '이미지를 가져와 컨테이너 실행을 관리합니다.',
    fields: [
      pick(
        'compute',
        '컴퓨팅 구성',
        '실행 방식',
        'ec2',
        [
          ['ec2', 'EC2 기반 용량'],
          ['fargate', 'Fargate'],
        ],
        '이 실습은 작은 CPU 서비스입니다.',
      ),
    ],
  },
];
export const serviceById = Object.fromEntries(
  services.map((service) => [service.id, service]),
) as Record<Service, ServiceSpec>;
export function isService(value: unknown): value is Service {
  return typeof value === 'string' && Object.hasOwn(serviceById, value);
}
export function resourceDefaults(service: Service, name: string): ResourceConfig {
  return {
    service,
    name,
    settings: Object.fromEntries(
      serviceById[service].fields.map((field) => [field.id, field.initial]),
    ),
  };
}
export function resourceErrors(resource: ResourceConfig, others: ResourceConfig[] = []): string[] {
  const errors: string[] = [];
  if (!isService(resource.service)) return ['알 수 없는 서비스입니다.'];
  if (!resource.name.trim() || resource.name.length > 63)
    errors.push('이름은 1~63자로 입력하세요.');
  if (resource.service === 's3' && !/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/.test(resource.name))
    errors.push('실습용 버킷 이름은 3~63자의 영문 소문자·숫자·하이픈을 사용하세요.');
  if (
    others.some(
      (other) => other.service === resource.service && other.name === resource.name.trim(),
    )
  )
    errors.push('이 구성에서 같은 서비스의 이름을 중복 사용할 수 없습니다.');
  return [...errors, ...settingErrors(resource)];
}
export function settingErrors(resource: ResourceConfig): string[] {
  const errors: string[] = [];
  for (const field of serviceById[resource.service].fields) {
    const value = resource.settings[field.id];
    if (
      field.options
        ? !field.options.some((option) => option.value === value)
        : typeof value !== 'number' ||
          !Number.isFinite(value) ||
          ((field.step ?? 1) === 1 && !Number.isSafeInteger(value)) ||
          value < field.min! ||
          value > field.max!
    )
      errors.push(`${field.label} 값을 확인하세요.`);
  }
  return errors;
}
export function parseResource(value: unknown): ResourceConfig {
  if (
    !value ||
    typeof value !== 'object' ||
    !('service' in value) ||
    !isService(value.service) ||
    !('name' in value) ||
    typeof value.name !== 'string' ||
    !('settings' in value) ||
    !value.settings ||
    typeof value.settings !== 'object' ||
    Array.isArray(value.settings)
  )
    throw new Error('리소스 설정을 읽을 수 없습니다.');
  const resource = {
    service: value.service,
    name: value.name,
    settings: { ...value.settings },
  } as ResourceConfig;
  if (resourceErrors(resource).length) throw new Error('리소스 설정이 유효하지 않습니다.');
  return resource;
}
export function resourceSummary(resource: ResourceConfig): string {
  return serviceById[resource.service].fields
    .slice(0, 2)
    .map(
      (field) =>
        field.options?.find((option) => option.value === resource.settings[field.id])?.label ??
        `${resource.settings[field.id]} GiB`,
    )
    .join(' · ');
}
