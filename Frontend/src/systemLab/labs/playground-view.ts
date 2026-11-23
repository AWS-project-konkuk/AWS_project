import {
  BadgeCheck,
  Cpu,
  Database,
  FileCode,
  FileText,
  FlaskConical,
  FolderOpen,
  GitCommitHorizontal,
  Library,
  Rocket,
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
    '단원 실습에서 쓴 서비스와 노드를 자유롭게 연결해 보세요. `입력 소스`에서 자료를 내보내고, 학습·평가·`등록`·서빙·`모니터링`까지 이어 실행하면 연결된 노드가 모두 실행됩니다. 순환 연결도 만들 수 있으며, 순환이 있으면 3번 반복해 앞선 반복의 결과가 다시 입력됩니다.',
  ariaLabel: 'MLOps 플레이그라운드',
  entry: '서비스 안에 노드를 추가하고, 출력에서 같은 자료 타입의 입력으로 연결하세요.',
  panels: {},
  hints: {
    root: '서비스를 선택해 노드를 추가하세요. 연결이 하나라도 있는 노드는 모두 실행됩니다.',
    sources:
      '단원 실습의 "시작"이 보내던 자료를 내보내는 곳입니다. 필요한 입력 소스를 추가해 파이프라인의 출발점으로 쓰세요.',
    registry:
      '평가를 통과한 모델의 버전과 단계(Staging/Production)를 관리합니다. 학습한 모델은 등록해 두어야 추적하고 되돌릴 수 있습니다.',
    input:
      '단원 실습의 "시작"이 보내던 자료를 내보냅니다. 내보낼 자료를 고르면 출력 포트가 바뀌며, 포트는 직접 추가·삭제할 수도 있습니다.',
    versioned:
      '코드 저장소의 커밋(코드·데이터 포인터)이나 데이터 파일 버전을 내보냅니다. 항목을 고르면 출력 포트가 바뀝니다.',
    storageOp:
      '저장소에서 하는 일을 고릅니다. 원본 읽기·모델 저장은 객체 저장소(S3), 색인·검색은 Vector DB 유형에서만 동작합니다.',
    feature:
      '공통 피처 정의를 만들거나, 정의와 조회 요청으로 학습·추론용 피처 값을 계산합니다. 같은 정의를 두 시각에 쓰면 학습·추론 피처가 어긋나지 않습니다.',
    publish:
      '평가 승인을 받은 모델을 레지스트리에 등록하거나, Production으로 등록한 모델을 서비스에 배포합니다. Staging 모델은 배포를 차단합니다.',
    serve:
      '요청을 배포된 모델로 처리하거나, 질문과 검색 근거로 답변을 만듭니다. 답변은 실제 LLM이 아닌 고정 응답입니다.',
    observe:
      '모델 응답을 운영 보고로 모으거나, 서비스 지표와 정답 표본으로 품질 신호를 만듭니다. 품질 신호는 재학습 트리거의 입력입니다.',
    validateData:
      '학습 전에 표본의 중복과 최소 개수를 검사합니다. 기준에 못 미치면 학습으로 보내지 않고 막습니다.',
    trackExperiment:
      '학습 결과에 데이터와 에폭 같은 설정을 붙여 기록합니다. 어떤 설정으로 만든 모델인지 나중에 재현할 수 있게 합니다.',
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
    input: Upload,
    versioned: GitCommitHorizontal,
    storageOp: Database,
    feature: FileCode,
    publish: Rocket,
    serve: Cpu,
    observe: FileText,
    validateData: ShieldCheck,
    trackExperiment: FlaskConical,
    trigger: Timer,
  },
  materialIcons: { ...base.materialIcons, 'registered-model': BadgeCheck },
  tones: { ...base.tones, 'registered-model': tone.purple },
  kindColors: {
    ...base.kindColors,
    sources: kindClass.green,
    input: kindClass.green,
    registry: kindClass.purple,
    publish: kindClass.purple,
    versioned: kindClass.slate,
    storageOp: kindClass.gold,
    feature: kindClass.teal,
    serve: kindClass.pink,
    observe: kindClass.blue,
    validateData: kindClass.teal,
    trackExperiment: kindClass.olive,
    trigger: kindClass.blue,
  },
};
