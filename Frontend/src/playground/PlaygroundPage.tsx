import { runPlayground, type PipelineResult } from './pipeline';
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useMutation } from '@tanstack/react-query';
import { getPostWorkflow, isPostId, postError } from '../api/posts';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ArrowRight, Boxes, CheckCircle2, Plus, Trash2 } from 'lucide-react';
import { ResourceCanvas } from '../console/ResourceCanvas';
import { NodeEditor } from '../nodes/NodeEditor';
import { workflowNodes, topicNodes } from '../nodes/catalog';
import {
  resourceDefaults,
  serviceById,
  type ResourceConfig,
  type Service,
} from '../console/resources';
import {
  playgroundCanvas,
  playgroundSignature,
  validatePlayground,
  type PlaygroundIssue,
} from './model';
import { usePlayground } from './usePlayground';
import styles from './Playground.module.css';

export function PlaygroundPage() {
  const { data, setData, blocked, status, reset } = usePlayground();
  const [editorState, setEditorState] = useState<{ id: string; draft: ResourceConfig } | null>(
    null,
  );
  const [report, setReport] = useState<{ signature: string; issues: PlaygroundIssue[] } | null>(
    null,
  );
  const [searchParams] = useSearchParams();
  const [workflowId, setWorkflowId] = useState(searchParams.get('workflow') ?? '');
  const [imported, setImported] = useState(false);
  const loadWorkflow = useMutation({
    mutationFn: (id: string) => {
      if (!isPostId(id)) throw new Error('게시판에서 복사한 워크플로우 ID를 입력해 주세요.');
      return getPostWorkflow(id);
    },
    onSuccess: (workflow) => {
      setData(workflow);
      setExecution(null);
      setReport(null);
      setEditorState(null);
      setConnectionMessage('');
      setImported(true);
    },
  });
  const [execution, setExecution] = useState<{
    signature: string;
    result: PipelineResult;
    cursor: number;
  } | null>(null);
  const [feedbackEdge, setFeedbackEdge] = useState(false);
  const [connectionMessage, setConnectionMessage] = useState('');
  const [search, setSearch] = useState('');
  const canvas = playgroundCanvas(data);
  const signature = playgroundSignature(data);
  const currentReport = report?.signature === signature ? report : undefined;
  const palette = [...workflowNodes, ...topicNodes];
  const currentExecution = execution?.signature === signature ? execution : undefined;
  const start = (service: Service) => {
    let index = 1;
    while (
      data.resources.some(
        (resource) =>
          resource.config.service === service &&
          resource.config.name === `${serviceById[service].name} ${index}`,
      )
    )
      index++;
    const id = crypto.randomUUID();
    const config = resourceDefaults(service, `${serviceById[service].name} ${index}`);
    setData((current) => ({
      ...current,
      resources: [
        ...current.resources,
        {
          id,
          position: {
            x: 30 + (current.resources.length % 2) * 245,
            y: 35 + Math.floor(current.resources.length / 2) * 175,
          },
          config,
        },
      ],
    }));
  };
  const save = (config: ResourceConfig) => {
    const existing = editorState?.id;
    if (!existing) return;
    setData((current) => ({
      ...current,
      resources: current.resources.map((resource) =>
        resource.id === existing ? { ...resource, config } : resource,
      ),
    }));
    setEditorState(null);
  };
  return (
    <main className={styles.page}>
      <header className={styles.heading}>
        <div>
          <h1>Playground</h1>
          <span>노드로 만드는 학습 흐름</span>
          <p>노드를 추가하고 연결하며 MLOps의 흐름을 구성해 보세요.</p>
        </div>
        <div className={styles.actions}>
          <button
            data-primary
            onClick={() => setExecution({ signature, result: runPlayground(data), cursor: 0 })}
          >
            실행 시작
          </button>
          <button
            disabled={
              !currentExecution || currentExecution.cursor >= currentExecution.result.stages.length
            }
            onClick={() => setExecution((e) => (e ? { ...e, cursor: e.cursor + 1 } : e))}
          >
            다음 단계
          </button>
          <button
            onClick={() => setExecution({ signature, result: runPlayground(data), cursor: 99 })}
          >
            전체 실행
          </button>
          <button disabled={!currentExecution} onClick={() => setExecution(null)}>
            중단
          </button>
          <button onClick={() => setReport({ signature, issues: validatePlayground(data) })}>
            구성 확인
          </button>
          <button onClick={reset}>{blocked ? '저장 초기화' : '초기화'}</button>
        </div>
      </header>
      <div className="flex flex-wrap items-center gap-2 px-4 py-2">
        <form
          className="flex flex-wrap items-center gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (loadWorkflow.isPending || blocked) return;
            const id = workflowId.trim();
            if (
              isPostId(id) &&
              data.resources.length &&
              !window.confirm('현재 Playground를 불러온 워크플로우로 바꿀까요?')
            )
              return;
            setImported(false);
            loadWorkflow.mutate(id);
          }}
        >
          <Input
            aria-label="워크플로우 ID"
            placeholder="워크플로우 ID"
            value={workflowId}
            onChange={(event) => setWorkflowId(event.target.value)}
            required
            disabled={blocked || loadWorkflow.isPending}
          />
          <Button type="submit" disabled={blocked || loadWorkflow.isPending}>
            {loadWorkflow.isPending ? '불러오는 중' : '불러오기'}
          </Button>
        </form>
        <Button asChild className="no-underline">
          <Link to="/board/new">게시판에 공유</Link>
        </Button>
        {loadWorkflow.isError && (
          <span role="alert" className="text-ui-error">
            {postError(loadWorkflow.error)}
          </span>
        )}
        {imported && (
          <span role="status" className="text-ui-success">
            워크플로우를 불러왔습니다.
          </span>
        )}
      </div>
      <div className={styles.status} role="status">
        {blocked
          ? '저장 데이터를 읽지 못했습니다. 원본을 보존하며 자동 저장을 중지했습니다.'
          : status}
        <span>브라우저 안에서만 구성하는 학습용 환경</span>
      </div>
      <div className={styles.workspace}>
        <aside className={styles.services} aria-label="노드 목록">
          <header>
            <strong>노드 추가</strong>
            <span>{palette.length}개</span>
          </header>
          <input
            aria-label="노드 검색"
            placeholder="데이터셋, 학습, 평가…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          {[...new Set(palette.map((s) => s.category))].map((category) => {
            const items = palette.filter(
              (service) =>
                service.category === category &&
                `${service.name} ${service.id}`.toLowerCase().includes(search.toLowerCase()),
            );
            return (
              items.length > 0 && (
                <section key={category}>
                  <h2>{category}</h2>
                  {items.map((service) => (
                    <button
                      key={service.id}
                      onClick={() => start(service.id)}
                      data-testid={`create-${service.id}`}
                    >
                      <Boxes size={16} />
                      <span>{service.name}</span>
                      <Plus size={13} />
                    </button>
                  ))}
                </section>
              )
            );
          })}
        </aside>
        <section
          className={styles.canvas}
          aria-label="Playground 캔버스"
          data-testid="playground-canvas"
        >
          <ResourceCanvas
            nodes={canvas.nodes}
            edges={canvas.edges}
            onNodesChange={(changes) => {
              const positions = changes.filter((change) => change.type === 'position');
              if (positions.length)
                setData((current) => ({
                  ...current,
                  resources: current.resources.map((resource) => {
                    const change = positions.find((change) => change.id === resource.id);
                    return change?.type === 'position' && change.position
                      ? { ...resource, position: change.position }
                      : resource;
                  }),
                }));
            }}
            onEdgesChange={(changes) => {
              const removed = new Set(
                changes.filter((change) => change.type === 'remove').map((change) => change.id),
              );
              if (removed.size)
                setData((current) => ({
                  ...current,
                  edges: current.edges.filter(
                    (edge) => !removed.has(`${edge.source}->${edge.target}`),
                  ),
                }));
            }}
            onConnect={(connection) => {
              if (connection.source === connection.target) {
                setConnectionMessage('자기 자신과는 연결할 수 없습니다.');
                return;
              }
              setConnectionMessage('');
              setData((current) =>
                current.edges.some(
                  (edge) => edge.source === connection.source && edge.target === connection.target,
                )
                  ? current
                  : {
                      ...current,
                      edges: [
                        ...current.edges,
                        {
                          source: connection.source,
                          target: connection.target,
                          ...(feedbackEdge ? { relation: 'feedback' as const } : {}),
                        },
                      ],
                    },
              );
            }}
            onNodeDoubleClick={(_, node) => {
              const resource = data.resources.find((resource) => resource.id === node.id);
              if (resource) setEditorState({ id: resource.id, draft: resource.config });
            }}
          />
          {!data.resources.length && (
            <div className={styles.empty}>
              <Boxes size={35} />
              <h2>첫 노드를 추가하세요</h2>
              <p>
                노드 목록에서 필요한 단계를 누르면
                <br />
                바로 캔버스에 추가됩니다.
              </p>
              <button onClick={() => start('dataset')}>데이터셋 추가</button>
            </div>
          )}
          <span className={styles.canvasHint}>
            노드 두 번 클릭: 이름·학습 설정 · 출력 → 입력: 연결
          </span>
        </section>
        <aside className={styles.inspector} aria-label="구성 목록">
          <label className="feedback-toggle">
            <input
              type="checkbox"
              checked={feedbackEdge}
              onChange={(e) => setFeedbackEdge(e.target.checked)}
            />
            다음 연결을 개선 피드백으로 표시
          </label>
          <section className={styles.report} data-testid="pipeline-result" aria-live="polite">
            {currentExecution ? (
              <>
                <h2>{currentExecution.result.headline}</h2>
                {currentExecution.result.issues.map((i, n) => (
                  <p key={n}>{i.message}</p>
                ))}
                {currentExecution.result.stages.slice(0, currentExecution.cursor).map((stage) => (
                  <p key={stage.id}>
                    <strong>
                      {stage.name} ·{' '}
                      {stage.status === 'success'
                        ? '완료'
                        : stage.status === 'failed'
                          ? '실패'
                          : '차단'}
                    </strong>
                    <br />
                    {stage.artifact}
                  </p>
                ))}
                {currentExecution.result.observations.map((o, i) => (
                  <p key={i}>{o}</p>
                ))}
              </>
            ) : (
              <p>
                {execution
                  ? '구성이 바뀌어 이전 결과를 무효화했습니다.'
                  : '실행을 시작하면 단계별 전달 결과를 확인할 수 있습니다.'}
              </p>
            )}
          </section>
          <h2>
            노드 <span>{data.resources.length}</span>
          </h2>
          {editorState && data.resources.some((resource) => resource.id === editorState.id) && (
            <NodeEditor
              key={editorState.id}
              initial={editorState.draft}

              others={data.resources
                .filter((resource) => resource.id !== editorState.id)
                .map((resource) => resource.config)}
              onClose={() => setEditorState(null)}
              onSave={save}
            />
          )}

          {data.resources.map((resource) => (
            <section className={styles.resourceRow} key={resource.id}>
              <small>{serviceById[resource.config.service].name}</small>
              <strong>{resource.config.name}</strong>
              <p>{serviceById[resource.config.service].description}</p>
              <div>
                <button
                  aria-label={`${resource.config.name} 노드 설정`}
                  onClick={() => setEditorState({ id: resource.id, draft: resource.config })}
                >
                  노드 설정
                </button>
                <button
                  aria-label={`${resource.config.name} 삭제`}
                  onClick={() =>
                    setData((current) => ({
                      ...current,
                      resources: current.resources.filter((item) => item.id !== resource.id),
                      edges: current.edges.filter(
                        (edge) => edge.source !== resource.id && edge.target !== resource.id,
                      ),
                    }))
                  }
                >
                  <Trash2 size={13} />
                  삭제
                </button>
              </div>
            </section>
          ))}
          <h2>
            연결 <span>{data.edges.length}</span>
          </h2>
          {data.edges.map((edge) => (
            <div className={styles.edge} key={`${edge.source}->${edge.target}`}>
              <span>
                {data.resources.find((resource) => resource.id === edge.source)?.config.name}
                <ArrowRight size={12} />
                {data.resources.find((resource) => resource.id === edge.target)?.config.name}
              </span>
              <button
                aria-label="Playground 연결 삭제"
                onClick={() =>
                  setData((current) => ({
                    ...current,
                    edges: current.edges.filter((item) => item !== edge),
                  }))
                }
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
          <section className={styles.report} aria-live="polite" data-testid="playground-report">
            {connectionMessage && <p>{connectionMessage}</p>}
            {currentReport ? (
              currentReport.issues.length ? (
                <>
                  <h2>확인할 항목 {currentReport.issues.length}개</h2>
                  <ul>
                    {currentReport.issues.map((issue, index) => (
                      <li key={index}>{issue.message}</li>
                    ))}
                  </ul>
                </>
              ) : (
                <>
                  <h2>
                    <CheckCircle2 size={16} />
                    구성 확인 완료
                  </h2>
                  <p>이 Playground의 연결 규칙에 맞는 구성입니다.</p>
                </>
              )
            ) : (
              <p>
                {report
                  ? '구성이 바뀌었습니다. 다시 확인하세요.'
                  : '구성 확인을 눌러 연결 관계를 점검하세요.'}
              </p>
            )}
            <small>
              데이터 이동·자원 관계를 설명하는 도식입니다. 실제 모델 학습·배포 또는 인프라 전체를
              검증하지 않습니다.
            </small>
          </section>
        </aside>
      </div>
    </main>
  );
}
