import { useState } from 'react';
import { Database, FolderOpen, HardDrive } from 'lucide-react';
import styles from './StorageActivity.module.css';

const storageActivity = {
  scenarios: [
    {
      label: '서버에 디스크가 필요해요',
      need: '한 서버에서 운영체제와 프로그램 파일을 읽고 쓰려고 합니다.',
      match: 'block',
      reason:
        '서버에 디스크 장치를 연결해 사용하는 Block을 검토합니다. 그 위에 파일 시스템을 만들어 파일을 저장할 수 있습니다.',
    },
    {
      label: '여러 Pod가 폴더를 공유해요',
      need: '서로 다른 노드의 Pod들이 /data 경로에서 같은 파일들을 읽어야 합니다.',
      match: 'file',
      reason:
        '공통 파일 경로가 필요한 상황이므로 File을 검토합니다. 여러 노드의 접근을 지원하는지 확인해야 합니다.',
    },
    {
      label: '완성된 모델을 보관해요',
      need: '학습 서버를 종료한 뒤에도 배포 작업이 모델 파일을 키로 가져와야 합니다.',
      match: 'object',
      reason:
        '서버와 독립된 보관소에 객체를 저장하는 Object를 검토합니다. 배포 작업은 버킷과 키로 모델을 가져옵니다.',
    },
  ],
  cards: {
    block: {
      icon: HardDrive,
      title: 'Block',
      meaning: '내 서버에 꽂는 새 SSD',
      access: '디스크 연결 → 파일 시스템 → 파일',
      example: '한 서버의 운영체제 · 데이터베이스',
      service: 'AWS 예: EBS',
      check: '다른 노드에 자동으로 공유되지는 않아요',
    },
    file: {
      icon: FolderOpen,
      title: 'File',
      meaning: '여럿이 여는 공용 폴더',
      access: '/data/train.csv 같은 공통 파일 경로',
      example: '여러 Pod의 공통 데이터 폴더',
      service: 'AWS 예: EFS · FSx',
      check: '같은 파일을 동시에 쓸 때 충돌을 확인해요',
    },
    object: {
      icon: Database,
      title: 'Object',
      meaning: '이름표로 찾는 보관 창고',
      access: '버킷 + 객체 키 → GET / PUT',
      example: '데이터셋 · 체크포인트 · 완성 모델',
      service: 'AWS 예: S3',
      check: '파일 경로 대신 키와 API로 접근해요',
    },
  },
} as const;

export function StorageActivity() {
  const [scenario, setScenario] = useState<(typeof storageActivity.scenarios)[number]>(
    storageActivity.scenarios[0],
  );
  const recommended = storageActivity.cards[scenario.match];

  return (
    <div className={styles.content}>
      <div className={styles.choices} role="group" aria-label="사용 상황 선택">
        {storageActivity.scenarios.map((item) => (
          <button
            type="button"
            key={item.match}
            aria-pressed={scenario.match === item.match}
            onClick={() => setScenario(item)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div role="status" className={styles.reason}>
        <strong>이 상황에 맞는 방식 · {recommended.title}</strong>
        <p>
          {scenario.need} {scenario.reason}
        </p>
      </div>

      <div className={styles.cards}>
        {Object.values(storageActivity.cards).map((card) => {
          const Icon = card.icon;
          return (
            <article
              key={card.title}
              className={styles.card}
              data-match={card === recommended || undefined}
            >
              <Icon size={24} aria-hidden="true" />
              <h4>{card.title}</h4>
              <p>{card.meaning}</p>
              <dl>
                <dt>찾는 방법</dt>
                <dd>{card.access}</dd>
                <dt>사용 예</dt>
                <dd>{card.example}</dd>
              </dl>
              <strong>{card.service}</strong>
              <p>{card.check}</p>
            </article>
          );
        })}
      </div>

      <p>
        접근 방식으로 고르는 예시입니다. 실제 선택에서는 파일 수명, 공유 조건과 성능도 함께
        확인하세요.
      </p>
    </div>
  );
}
