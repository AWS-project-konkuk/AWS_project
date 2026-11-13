import { Link } from 'react-router';
import type { Lesson } from '../curriculum/types';
import styles from './LessonLayout.module.css';

const lanes = [
  {
    title: '학습 · 자료 전달',
    stages: [
      ['data', '데이터 준비', '버전이 있는 학습·평가 자료', 'storage-compare'],
      ['training', '학습', '코드·환경·파라미터 → 모델', 'cpu-gpu'],
      ['evaluation', '평가', '별도 평가 자료 → 채택 판단', 'pipeline-capstone'],
      ['registry', '모델 등록', '채택한 모델·환경·버전', 'pipeline-capstone'],
    ],
  },
  {
    title: '추론 · 사용자 요청',
    stages: [
      ['serving', '사용자 요청 → 추론 → 응답', '등록한 모델을 서버에 로딩해 사용', 'serving-modes'],
      ['monitoring', '운영 관측', '지연·오류·입력 분포·정답 표본', 'model-drift'],
    ],
  },
  {
    title: '선택 확장 · 문서 검색',
    stages: [
      [
        'retrieval',
        '문서 준비 → 색인 / 질문 → 검색 → 생성',
        '검색한 근거를 응답에 전달하는 별도 흐름',
        'rag',
      ],
    ],
  },
];
export function WorkflowMap({ lesson }: { lesson: Lesson }) {
  return (
    <section className={styles.workflowMap} aria-label="전체 워크플로우 지도">
      <h2>전체 흐름에서 지금 배우는 곳</h2>
      <p>강조한 단계가 이 강의와 연결됩니다. 각 단계를 선택하면 관련 설명으로 이동합니다.</p>
      {lanes.map((lane) => (
        <div key={lane.title}>
          <h3>{lane.title}</h3>
          <ol>
            {lane.stages.map(([id, title, detail, target]) => (
              <li key={id} data-current={lesson.mapStages?.includes(id)}>
                <Link to={`/learn/${target}`}>
                  <strong>{title}</strong>
                  <span>{detail}</span>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      ))}
      <p>
        <strong>개선 피드백:</strong> 운영 관측 → 원인 조사 → 데이터·피처·환경 검토 → 재평가 → 배포
        판단. 현재 실행을 자동으로 순환시키는 연결이 아닙니다.
      </p>
    </section>
  );
}
