import { useState } from 'react';
import styles from './VirtualActivity.module.css';

export function VirtualActivity() {
  const [count, setCount] = useState(1);
  const apps = Array.from({ length: count }, (_, index) => index + 1);
  return (
    <div className={styles.lab}>
      <p className={styles.introduction}>
        앱마다 실행 환경을 하나씩 분리합니다. VM 한 개 또는 컨테이너 한 개에 앱 하나를 넣는
        비교입니다.
      </p>
      <div className={styles.controls} role="group" aria-label="비교할 앱 수 조절">
        <button
          type="button"
          disabled={count === 1}
          onClick={() => setCount((n) => Math.max(1, n - 1))}
        >
          앱 하나 제거
        </button>
        <strong>앱 {count}개</strong>
        <button
          type="button"
          disabled={count === 3}
          onClick={() => setCount((n) => Math.min(3, n + 1))}
        >
          앱 하나 추가
        </button>
      </div>
      <p className={styles.legend}>
        파란 영역이 커널입니다. 앱을 3개까지 추가하고 파란 영역의 개수를 비교하세요.
      </p>
      <div className={styles.comparison}>
        <section className={styles.diagram} aria-label={`VM ${count}개: 각 VM에 별도 게스트 커널`}>
          <h4>VM</h4>
          <p className={styles.caption}>가상 컴퓨터마다 운영체제를 실행</p>
          <div
            className={styles.instances}
            style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}
          >
            {apps.map((number) => (
              <div className={styles.boundary} key={number}>
                <strong className={styles.instanceName}>VM {number}</strong>
                <div className={styles.app}>
                  앱 {number}
                  <span>라이브러리</span>
                </div>
                <div className={styles.guest}>
                  게스트 OS<div className={styles.kernel}>커널 {number}</div>
                </div>
              </div>
            ))}
          </div>
          <div className={styles.platform}>
            하이퍼바이저<span>각 VM에 가상 하드웨어 제공</span>
          </div>
          <div className={styles.hardware}>물리 하드웨어 · CPU / 메모리</div>
          <p className={styles.conclusion}>
            게스트 OS·커널 <strong>{count}개</strong>
          </p>
        </section>
        <section
          className={styles.diagram}
          aria-label={`컨테이너 ${count}개: 호스트 커널 1개 공유`}
        >
          <h4>컨테이너</h4>
          <p className={styles.caption}>앱 환경을 나누고 커널은 함께 사용</p>
          <div
            className={styles.instances}
            style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}
          >
            {apps.map((number) => (
              <div className={styles.boundary} key={number}>
                <strong className={styles.instanceName}>컨테이너 {number}</strong>
                <div className={styles.app}>
                  앱 {number}
                  <span>라이브러리</span>
                </div>
              </div>
            ))}
          </div>
          <div className={styles.platform}>
            컨테이너 런타임<span>격리된 실행 환경 관리</span>
          </div>
          <div className={styles.host}>
            호스트 OS<div className={styles.kernel}>모든 앱이 공유하는 커널 1개</div>
          </div>
          <div className={styles.hardware}>물리 하드웨어 · CPU / 메모리</div>
          <p className={styles.conclusion}>
            호스트 커널 <strong>1개 공유</strong>
          </p>
        </section>
      </div>
      <div className={styles.explanation} role="status" aria-live="polite" aria-atomic="true">
        <strong>
          {count === 1 ? '지금은 양쪽 모두 앱 1개입니다.' : `앱을 ${count}개로 늘렸습니다.`}
        </strong>
        <p>
          {count === 1
            ? '앱 하나만 보면 커널 개수의 차이가 드러나지 않습니다. 앱 하나 추가를 눌러 보세요.'
            : `VM 쪽은 앱마다 별도 OS를 실행해 게스트 커널도 ${count}개입니다. 컨테이너 쪽은 앱 환경만 ${count}개가 되고, 아래의 호스트 커널은 여전히 1개입니다.`}
        </p>
      </div>
      <table className={styles.summary}>
        <caption>현재 그림에서 직접 세어 볼 것</caption>
        <thead>
          <tr>
            <th scope="col">비교 대상</th>
            <th scope="col">VM 방식</th>
            <th scope="col">컨테이너 방식</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">앱 실행 환경</th>
            <td>{count}개</td>
            <td>{count}개</td>
          </tr>
          <tr>
            <th scope="row">앱들이 사용하는 커널</th>
            <td>게스트 커널 {count}개</td>
            <td>호스트 커널 1개 공유</td>
          </tr>
        </tbody>
      </table>
      <p className={styles.note}>
        구조 비교를 위한 교육용 모형입니다. VM마다 앱을 하나씩 배치한 예제이며, 실제로는 한 VM에서도
        여러 앱을 실행할 수 있습니다. 각 패널은 같은 하드웨어를 서로 다른 방식으로 구성한
        경우입니다. 그림의 크기는 메모리 사용량이나 속도를 뜻하지 않습니다.
      </p>
    </div>
  );
}
