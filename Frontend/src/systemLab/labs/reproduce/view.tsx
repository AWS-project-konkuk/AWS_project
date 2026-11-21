import {
  ArchiveRestore,
  CircleCheck,
  CirclePlay,
  FileDown,
  FileText,
  GitBranch,
  GitCommitHorizontal,
  Layers,
  Package,
  Server,
  Cloud,
} from 'lucide-react';
import type { LabView } from '../../labContext';
import { kindClass, tone } from '../palette';

export const reproduceView: LabView = {
  title: '과거 실험 재현 실습',
  description:
    '코드와 데이터를 모두 v1으로 되돌리세요. Git만 옮긴 실행, 캐시로 복원한 실행, 원격에서 가져와 복원한 실행의 결과를 비교합니다.',
  ariaLabel: '과거 실험 재현 시스템 실습',
  entry:
    'Git만 이동한 실행, 캐시 적중 복원, 원격에서 가져온 복원을 차례로 실행하고 코드와 데이터가 모두 v1이 되는 결과를 확인하세요.',
  icons: {
    root: Layers,
    github: GitBranch,
    s3: Cloud,
    ec2: Server,
    start: CirclePlay,
    end: CircleCheck,
    'git-read': GitCommitHorizontal,
    's3-files': FileDown,
    restore: ArchiveRestore,
  },
  materialIcons: {
    version: GitBranch,
    workdata: Package,
    code: FileText,
    file: FileDown,
    restored: CircleCheck,
  },
  tones: {
    version: tone.blue,
    workdata: tone.orange,
    code: tone.teal,
    file: tone.gold,
    restored: tone.green,
  },
  kindColors: {
    github: kindClass.slate,
    s3: kindClass.gold,
    ec2: kindClass.orange,
    start: kindClass.green,
    end: kindClass.slate,
    'git-read': kindClass.teal,
    's3-files': kindClass.gold,
    restore: kindClass.blue,
  },
  hints: {
    root: '서비스를 선택하면 아래에서 만들 수 있는 작업 노드를 볼 수 있습니다.',
    github: '코드와 데이터 포인터(.dvc)를 보관하는 저장소입니다.',
    s3: '버전별 실제 데이터 파일을 보관하는 원격 저장소입니다.',
    ec2: '코드와 데이터를 작업 공간에 복원하고 버전을 검사하는 실행 환경입니다.',
    start: '재현할 실험 v1 지정과 현재 작업 폴더의 데이터 v2를 각각의 출력으로 제공합니다.',
    end: '복원된 코드와 작업 데이터의 버전이 모두 v1인지 검사합니다.',
    'git-read': '선택한 버전의 코드와 데이터 포인터를 읽습니다. 큰 파일은 포함하지 않습니다.',
    's3-files': '선택한 버전의 실제 데이터 파일을 제공합니다. 캐시가 없을 때 가져올 원본입니다.',
    restore:
      '코드·포인터와 현재 작업 데이터를 받아 복원합니다. 복원 작업과 캐시 상태에 따라 데이터의 출처가 달라집니다.',
  },
  panels: {
    start: () => (
      <section className="py-2 leading-[1.55] [&_h4]:m-0 [&_ol]:ps-5 [&_li+li]:mt-1.5">
        <h4>제공 데이터</h4>
        <ol>
          <li>
            <strong>실험 버전 출력</strong> · 재현할 실험 <code>v1</code>을 지정합니다.
          </li>
          <li>
            <strong>작업 데이터 출력</strong> · 지금 작업 폴더에 있는 데이터 <code>v2</code>를
            제공합니다.
          </li>
        </ol>
      </section>
    ),
    end: () => (
      <section className="py-2 leading-[1.55] [&_h4]:m-0 [&_ol]:ps-5 [&_li+li]:mt-1.5">
        <h4>복원 결과 입력 · 완료 조건</h4>
        <ol>
          <li>코드와 작업 데이터의 버전이 같아야 합니다.</li>
          <li>둘 다 지정한 실험 v1이어야 합니다.</li>
          <li>캐시를 쓴 복원은 원격 읽기 없이 완료되어야 합니다.</li>
        </ol>
        <p>실행 성공 뒤 결과 패널의 이해 확인과 남은 관찰을 완료하세요.</p>
      </section>
    ),
  },
};
