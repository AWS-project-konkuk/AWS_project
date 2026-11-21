import type { LabView } from '../labContext';
import { viewFrom } from './catalog/view';

type WorkflowView = Pick<LabView, 'title' | 'description' | 'entry' | 'hints'>;

function workflowView(view: WorkflowView) {
  return viewFrom({ ...view, ariaLabel: view.title + ' 시스템 실습', panels: {} });
}

export const workflowViews = {
  'intro-workflow': workflowView({
    title: 'EC2·저장소·Git 첫 연결 실습',
    description:
      '`Git`의 실행 코드와 `저장소`의 입력 파일을 `EC2`의 코드 실행에 연결하세요. 실행해서 리뷰 3건을 확인하세요.',
    entry: '준비된 노드의 출력을 알맞은 입력에 연결하고 첫 실습을 실행하세요.',
    hints: {
      start: '저장소에서 읽을 reviews.csv를 지정합니다.',
      git: '코드와 버전을 보관하는 저장소입니다.',
      repo: '커밋 a1b2c3d에서 리뷰 수를 세는 코드를 제공합니다.',
      storage: 'EC2가 읽을 입력 파일을 보관합니다.',
      readObjects: 'reviews.csv를 저장소에서 읽습니다. 출력을 EC2 코드 실행의 입력 파일에 연결하세요.',
      executeCode: 'Git의 코드와 저장소의 파일을 모두 받으면 리뷰 수를 셉니다.',
      end: 'EC2에서 보낸 작업 결과를 표시합니다.',
    },
  }),
  'week3-workflow': workflowView({
    title: 'GPU 데이터 공급 실습',
    description:
      '`원본 읽기`에서 `모델 저장`까지 연결하세요. Pod 교체 뒤에도 캐시를 보존하고, GPU 공급량을 `80배치/초` 이상으로 높이세요.',
    entry:
      '저장소의 원본을 EC2의 배치 준비와 학습에 전달하세요. 파일 묶음 읽기와 유지 볼륨을 적용해 다시 실행하세요.',
    hints: {
      start: '저장소에서 읽을 원본 이미지 목록과 GPU 학습 요청을 보냅니다.',
      train: '준비된 배치로 모델을 학습하고 공급량과 캐시 상태를 결과에 남깁니다.',
      end: '저장된 모델, 80배치/초 이상의 공급량, Pod 교체 후 캐시 보존을 확인합니다.',
    },
  }),
  'feature-workflow': workflowView({
    title: '학습·추론 피처 일치 실습',
    description:
      '`학습 피처`만 연결했을 때 빠진 결과를 확인하세요. `조회`를 하나 더 만들고, 같은 정의를 학습 기준 시각과 현재 시각에 각각 적용하세요.',
    entry:
      '학습 기준 시각의 조회를 먼저 연결한 뒤, 현재 시각의 조회를 추가해 추론 피처도 전달하세요.',
    hints: {
      start: '고객 A의 클릭 이력과 학습 기준 10:00, 현재 시각 11:15를 보냅니다.',
      end: '두 피처가 같은 정의를 쓰고 학습 값에서 기준 시각 이후의 클릭이 빠졌는지 확인합니다.',
    },
  }),
  'week6-workflow': workflowView({
    title: '사용자 응답을 지키는 모델 전환 실습',
    description:
      '응답을 처리하는 동안 단 한 번도 멈추면 안 됩니다. `모델 처리`를 하나 추가하고, 배포 전략을 바꿔 요청 `100건`에 응답하세요.',
    entry:
      '신규 모델 경로를 만든 뒤 중단 배포와 Blue-Green의 누락을 확인하고, Canary 또는 Shadow로 응답을 유지하세요.',
    hints: {
      start: '번호가 붙은 사용자 요청 100건과 기존·신규 모델을 보냅니다.',
      end: '모든 사용자 요청이 한 번씩 응답을 받았는지, 신규 응답과 비교 로그가 분배 내역과 일치하는지 확인합니다.',
    },
  }),
  'week7-workflow': workflowView({
    title: '경고에서 검증된 개선까지 실습',
    description:
      '`지표 수집` 노드를 추가해 품질 저하의 단서를 찾으세요. `피처 갱신 주기`를 바꿔 평가 정확도가 개선되는지 확인하세요.',
    entry: '지표와 정답 표본을 수집한 뒤, 갱신 지연을 줄였을 때의 평가 결과를 비교하세요.',
    hints: {
      start: 'HTTP 지표, 정답 표본 100건, 현재 모델을 보냅니다.',
      end: '독립 평가에서 정확도 0.85 이상이고 승인을 받아 배포한 모델인지 확인합니다.',
    },
  }),
  'pipeline-capstone': workflowView({
    title: '전체 파이프라인 실습',
    description:
      '`평가용 데이터`를 연결하고 기준 `0.90`과 `0.80`을 비교하세요. 승인된 모델을 등록하고 서빙한 뒤 운영 보고를 확인하세요.',
    entry:
      '학습용과 평가용 데이터의 차이를 확인하세요. 평가 승인, 등록 모델 ID, 사용자 응답, 운영 보고가 모두 도착하도록 연결하세요.',
    hints: {
      start: '원본 100개와 등록된 모델이 응답해야 할 사용자 요청 10건을 보냅니다.',
      end: '평가 승인과 등록 모델, 그 모델이 처리한 응답 10건 및 운영 보고를 확인합니다.',
    },
  }),
};
