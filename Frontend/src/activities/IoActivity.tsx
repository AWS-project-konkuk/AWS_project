import { useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import styles from './IoActivity.module.css';

const methods = {
  parallel: {
    title: '병렬 데이터 로더',
    action: '여러 worker가 A·B·C 배치를 동시에 읽고 전처리합니다.',
    result: '배치 준비 처리량을 높입니다.',
    Diagram: ParallelDiagram,
  },
  prefetch: {
    title: 'Prefetch',
    action: '같은 열에 있는 준비와 계산이 동시에 진행됩니다.',
    result: 'GPU가 A를 계산하는 동안 로더가 B를 준비해 다음 배치의 대기를 줄입니다.',
    Diagram: PrefetchDiagram,
  },
  cache: {
    title: 'Cache',
    action: '처음 가져온 데이터를 가까운 저장 공간에 둡니다.',
    result: '이 예제에서 원격 읽기는 한 번이고, 이후에는 Cache에서 재사용합니다.',
    Diagram: CacheDiagram,
  },
  sharding: {
    title: 'Sharding',
    action: '같은 양의 데이터를 더 적은 파일로 가져옵니다.',
    result: '예제의 파일 요청은 8회에서 1회로 줄어듭니다.',
    Diagram: ShardingDiagram,
  },
};
type Method = keyof typeof methods;
const methodIds = Object.keys(methods) as Method[];
const batches = ['A', 'B', 'C', 'D'];
const files = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

function ParallelDiagram() {
  return (
    <ul className={styles.parallel} aria-label="같은 시간에 처리하는 세 배치">
      {batches.slice(0, 3).map((batch, index) => (
        <li key={batch}>
          <span className={styles.node}>저장소 · {batch}</span>
          <ArrowRight aria-hidden="true" />
          <span className={styles.signal}>worker {index + 1}</span>
          <ArrowRight aria-hidden="true" />
          <span className={styles.node}>{batch} 준비 완료</span>
        </li>
      ))}
    </ul>
  );
}

function PrefetchDiagram() {
  return (
    <table className={styles.timeline} aria-label="로더와 GPU가 같은 시간에 수행하는 작업">
      <thead>
        <tr>
          <th scope="col">시간</th>
          {batches.map((batch, index) => (
            <th scope="col" key={batch}>
              {index + 1}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        <tr>
          <th scope="row">로더</th>
          {batches.map((batch) => (
            <td key={batch}>
              <span className={styles.signal}>{batch} 준비</span>
            </td>
          ))}
        </tr>
        <tr>
          <th scope="row">GPU</th>
          <td>첫 대기</td>
          {batches.slice(0, 3).map((batch) => (
            <td key={batch}>
              <span className={styles.signal}>{batch} 계산</span>
            </td>
          ))}
        </tr>
      </tbody>
    </table>
  );
}

function CacheDiagram() {
  return (
    <ol className={styles.cache} aria-label="Cache의 첫 읽기와 반복 읽기">
      <li>
        <span className={styles.signal}>원격 저장소</span>
        <small>첫 읽기 · A 가져오기</small>
      </li>
      <li>
        <span className={styles.signal}>가까운 Cache</span>
        <small>A 저장 · 반복 읽기</small>
      </li>
      <li>
        <span className={styles.signal}>GPU</span>
        <small>A를 여러 번 사용</small>
      </li>
    </ol>
  );
}

function ShardingDiagram() {
  return (
    <div className={styles.shards}>
      <div>
        <strong>작은 파일 8개</strong>
        <div className={styles.files} aria-hidden="true">
          {files.map((file) => (
            <span className={styles.signal} key={file}>
              {file}
            </span>
          ))}
        </div>
        <span>요청 8회</span>
      </div>
      <div>
        <strong>큰 Shard 1개</strong>
        <div className={`${styles.files} ${styles.shard} ${styles.signal}`} aria-hidden="true">
          {files.map((file) => (
            <span key={file}>{file}</span>
          ))}
        </div>
        <span>요청 1회</span>
      </div>
    </div>
  );
}

export function IoActivity() {
  const [selected, setSelected] = useState<Method>('parallel');
  const [isPlaying, setIsPlaying] = useState(false);
  const reducedMotion = useReducedMotion();
  const { Diagram, title, action, result } = methods[selected];

  return (
    <div className={styles.activity}>
      <div className={styles.options} role="group" aria-label="I/O 개선 방법">
        {methodIds.map((id) => (
          <button
            key={id}
            type="button"
            aria-pressed={selected === id}
            onClick={() => setSelected(id)}
          >
            {methods[id].title}
          </button>
        ))}
      </div>

      <div className={styles.stage} data-playing={(isPlaying && !reducedMotion) || undefined}>
        <div className={styles.heading}>
          <h4>{title}</h4>
          {!reducedMotion && (
            <button type="button" onClick={() => setIsPlaying(!isPlaying)}>
              {isPlaying ? '일시정지' : '흐름 재생'}
            </button>
          )}
        </div>
        <p>{action}</p>
        <Diagram />
        <p role="status" className={styles.result}>
          {result}
        </p>
      </div>
    </div>
  );
}
