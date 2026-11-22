import {
  BadgeCheck,
  Database,
  FileSearch,
  FlaskConical,
  FolderOpen,
  Gauge,
  Library,
  MessageSquareText,
  MousePointerClick,
  Rocket,
  ScrollText,
  ShieldCheck,
  Timer,
  Upload,
} from 'lucide-react';
import type { LabView } from '../labContext';
import { kindClass, tone } from './palette';
import { viewFrom } from './catalog/view';

/** 플레이그라운드 화면. 공통 아이콘·색에 입력 소스와 MLOps 단계 노드를 더한다. */
const base = viewFrom({
  title: 'MLOps 플레이그라운드',
  description:
    '단원 실습에서 쓴 서비스와 노드를 자유롭게 연결해 보세요. `입력 소스`에서 자료를 내보내고, 학습·평가·`등록`·서빙·`모니터링`까지 이어 실행하면 연결된 노드가 모두 실행됩니다.',
  ariaLabel: 'MLOps 플레이그라운드',
  entry: '서비스 안에 노드를 추가하고, 출력에서 같은 자료 타입의 입력으로 연결하세요.',
  panels: {},
  hints: {
    root: '서비스를 선택해 노드를 추가하세요. 연결이 하나라도 있는 노드는 모두 실행됩니다.',
    sources:
      '단원 실습의 "시작"이 보내던 자료를 내보내는 곳입니다. 필요한 입력 소스를 추가해 파이프라인의 출발점으로 쓰세요.',
    registry:
      '평가를 통과한 모델의 버전과 단계(Staging/Production)를 관리합니다. 학습한 모델은 등록해 두어야 추적하고 되돌릴 수 있습니다.',
    rawData:
      '저장소의 원본 목록(raw/train.csv, 표본 100개)을 내보냅니다. 원본 읽기의 입력으로 연결하세요.',
    trainJob:
      '학습 작업과 필요한 메모리를 내보냅니다. 16GiB를 넘기면 학습 실행이 OOM으로 실패하므로 분할이 필요합니다.',
    textInput:
      '문서 또는 질문 텍스트를 내보냅니다. 임베딩이나 API 요청 처리의 입력으로 연결하세요.',
    requestStream: '번호가 붙은 사용자 요청을 내보냅니다. 요청 분배나 모델 응답에 연결하세요.',
    clickLog: '고객의 클릭 이력을 내보냅니다. 공통 피처 정의의 입력으로 연결하세요.',
    featureQuery: '학습 기준 시각 또는 현재 시각의 피처 조회 요청을 내보냅니다.',
    workspace:
      '지금 작업 폴더에 있는 데이터 버전을 내보냅니다. 복원·검증의 작업 데이터 입력입니다.',
    opsLog: '서비스 지표와 정답 표본을 내보냅니다. 지표 수집의 입력으로 연결하세요.',
    validateData:
      '학습 전에 표본의 중복과 최소 개수를 검사합니다. 기준에 못 미치면 학습으로 보내지 않고 막습니다.',
    trackExperiment:
      '학습 결과에 데이터와 에폭 같은 설정을 붙여 기록합니다. 어떤 설정으로 만든 모델인지 나중에 재현할 수 있게 합니다.',
    registerModel:
      '평가 승인을 받은 모델을 레지스트리에 등록합니다. 등록 단계가 Production이어야 배포할 수 있습니다.',
    deployModel: '등록된 모델을 서비스에 배포합니다. Production 단계가 아니면 차단합니다.',
    trigger:
      '품질 신호의 정확도가 기준보다 낮을 때만 재학습 경로로 신호를 보냅니다. 기준 이상이면 의도적으로 멈춥니다.',
    diagnose:
      '품질 신호와 현재 모델을 보고 원인을 가려 재학습용 작업과 별도 평가 표본을 만듭니다. 피처 갱신 주기를 바꿔 개선 효과를 비교하세요.',
    storage:
      '데이터를 보관하는 서비스입니다. 저장소 유형을 Vector DB로 바꾸면 색인·검색을, 객체 저장소(S3)로 두면 원본 읽기와 모델 저장을 쓸 수 있습니다.',
    train:
      '받은 작업을 GPU 한 장(16GiB)에서 계산합니다. 분할을 쓰면 설정에서 출력·입력 타입을 분할 방식에 맞게 바꾸세요(데이터 병렬: 기울기, 모델 병렬: 활성값, 텐서 병렬: 부분 결과).',
  },
});

export const playgroundView: LabView = {
  ...base,
  icons: {
    ...base.icons,
    sources: FolderOpen,
    registry: Library,
    rawData: Database,
    trainJob: Gauge,
    textInput: MessageSquareText,
    requestStream: Upload,
    clickLog: MousePointerClick,
    featureQuery: FileSearch,
    workspace: FolderOpen,
    opsLog: ScrollText,
    validateData: ShieldCheck,
    trackExperiment: FlaskConical,
    registerModel: Library,
    deployModel: Rocket,
    trigger: Timer,
  },
  materialIcons: { ...base.materialIcons, 'registered-model': BadgeCheck },
  tones: { ...base.tones, 'registered-model': tone.purple },
  kindColors: {
    ...base.kindColors,
    sources: kindClass.green,
    rawData: kindClass.green,
    trainJob: kindClass.green,
    textInput: kindClass.green,
    requestStream: kindClass.green,
    clickLog: kindClass.green,
    featureQuery: kindClass.green,
    workspace: kindClass.green,
    opsLog: kindClass.green,
    registry: kindClass.purple,
    registerModel: kindClass.purple,
    validateData: kindClass.teal,
    trackExperiment: kindClass.olive,
    deployModel: kindClass.pink,
    trigger: kindClass.blue,
  },
};
