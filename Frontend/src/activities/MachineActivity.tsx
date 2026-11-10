import { useState } from 'react';
import machine from './MachineActivity.module.css';

type Program = 'idle' | 'running' | 'interrupted' | 'complete';
interface MachineState {
  powered: boolean;
  program: Program;
  batches: number;
  saved: boolean;
  interrupted: boolean;
  restarted: boolean;
  message: string;
}
const initial: MachineState = {
  powered: false,
  program: 'idle',
  batches: 0,
  saved: false,
  interrupted: false,
  restarted: false,
  message: 'EC2가 꺼져 있습니다. 먼저 EC2를 시작하세요.',
};
const programLabels: Record<Program, string> = {
  idle: '실행 안 함',
  running: '실행 중',
  interrupted: '중단됨 · 메모리의 진행 상태 소실',
  complete: '완료',
};

export function MachineActivity() {
  const [state, setState] = useState<MachineState>(initial);
  const start = () =>
    setState((s) =>
      s.powered
        ? s
        : {
            ...s,
            powered: true,
            program: 'idle',
            batches: 0,
            restarted: s.interrupted,
            message: s.interrupted
              ? 'EC2를 다시 켰지만 프로그램은 실행되지 않습니다. 이전 계산도 복원되지 않았습니다. 프로그램을 직접 다시 실행하세요.'
              : 'EC2는 켜졌지만 프로그램은 아직 실행되지 않았습니다. 이제 학습 프로그램 실행을 누르세요.',
          },
    );
  const run = () =>
    setState((s) =>
      !s.powered || s.program === 'running'
        ? s
        : {
            ...s,
            program: 'running',
            batches: 0,
            message:
              '학습 프로그램을 새로 실행했습니다. 계산 한 단계 진행을 눌러 리뷰 묶음을 처리하세요.',
          },
    );
  const advance = () =>
    setState((s) => {
      if (!s.powered || s.program !== 'running') return s;
      const batches = s.batches + 1;
      return {
        ...s,
        batches,
        program: batches === 4 ? 'complete' : 'running',
        saved: s.saved || batches === 4,
        message:
          batches === 4
            ? '네 묶음의 계산을 마치고 model.bin을 EBS 디스크에 저장했습니다. 이제 EC2를 중지해도 저장된 파일은 남습니다.'
            : `${batches}/4 묶음을 계산했습니다. ${s.interrupted ? '계속 진행해 결과 파일을 만들어 보세요.' : '지금 EC2 중지를 눌러 실행 중인 프로그램에 어떤 일이 생기는지 확인하세요.'}`,
      };
    });
  const stop = () =>
    setState((s) => {
      if (!s.powered) return s;
      const wasRunning = s.program === 'running';
      return {
        ...s,
        powered: false,
        program: wasRunning ? 'interrupted' : 'idle',
        batches: 0,
        interrupted: s.interrupted || wasRunning,
        message: wasRunning
          ? `EC2를 중지해 프로그램이 중단됐습니다. 메모리에 있던 ${s.batches}/4 묶음의 진행 상태는 사라졌습니다. EC2를 다시 시작해 보세요.`
          : s.saved
            ? 'EC2와 프로그램은 꺼졌지만 EBS 디스크에 저장한 model.bin은 남아 있습니다.'
            : 'EC2를 중지했습니다. 프로그램을 완료하지 않았으므로 결과 파일은 없습니다.',
      };
    });
  return (
    <>
      <p className={machine.note}>
        계산 한 단계 진행 버튼을 누를 때마다 리뷰 한 묶음을 계산합니다.
      </p>
      <ol className={machine.instructions}>
        <li>EC2를 켜고, 프로그램도 실행 중인지 확인하세요.</li>
        <li>학습 프로그램을 실행하고 계산을 한 단계 진행한 뒤, EC2를 중지하세요.</li>
        <li>EC2를 다시 켜서 프로그램과 진행 상태를 확인하세요.</li>
        <li>프로그램을 다시 실행하고 네 단계를 마친 뒤, 중지해도 결과 파일이 남는지 확인하세요.</li>
      </ol>
      <dl className={machine.states}>
        <div>
          <dt>EC2 컴퓨터</dt>
          <dd>{state.powered ? '켜짐 · 실행 가능' : '꺼짐 · 실행 불가'}</dd>
        </div>
        <div>
          <dt>학습 프로그램</dt>
          <dd>{programLabels[state.program]}</dd>
        </div>
        <div>
          <dt>메모리의 진행 상태</dt>
          <dd>{state.batches}/4 묶음</dd>
        </div>
        <div>
          <dt>EBS 디스크의 결과 파일</dt>
          <dd>{state.saved ? 'model.bin 보관 중' : '없음 · 계산 완료 후 저장'}</dd>
        </div>
      </dl>
      <div className={machine.controls}>
        <button type="button" onClick={start} disabled={state.powered}>
          EC2 시작
        </button>
        <button
          type="button"
          onClick={run}
          disabled={!state.powered || state.program === 'running'}
        >
          학습 프로그램 실행
        </button>
        <button
          type="button"
          onClick={advance}
          disabled={!state.powered || state.program !== 'running'}
        >
          계산 한 단계 진행
        </button>
        <button type="button" onClick={stop} disabled={!state.powered}>
          EC2 중지
        </button>
      </div>
      <p className={machine.message} role="status">
        {state.message}
      </p>
      {state.interrupted && state.restarted && state.saved && !state.powered && (
        <p>
          <strong>확인했습니다.</strong> 컴퓨터 시작과 프로그램 실행은 별개이며, 메모리의 계산
          상태와 디스크에 저장한 파일도 다릅니다.
        </p>
      )}
      <p className={machine.note}>
        실행 환경과 입력 파일이 준비된 EBS 기반 인스턴스를 가정합니다. 자동 실행·체크포인트
        복원·최대 절전은 설정하지 않았습니다. 일반 중지와 재시작을 다룹니다.
      </p>
      <button type="button" onClick={() => setState(initial)}>
        처음부터 다시 해보기
      </button>
    </>
  );
}
