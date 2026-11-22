import { Copy, FolderOpen, Pencil, Save, Trash2, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { Link } from 'react-router';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { signature } from '../systemLab/lab';
import { playgroundLab } from '../systemLab/labs';
import { labStore } from '../systemLab/store';
import { usePlaygroundLibrary, type SavedPlayground } from './library';
import { hasNodes } from './workflow';

const dateText = (time: number) =>
  new Date(time).toLocaleString('ko-KR', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

/** 브라우저에 저장한 내 Playground를 만들고 불러오고 정리한다. */
export function PlaygroundLibrary() {
  const [shown, show] = useState(false);
  // 버튼이 화면 오른쪽에 있으면 패널을 왼쪽으로 펼쳐 화면 밖으로 나가지 않게 한다.
  const [alignRight, setAlignRight] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const [name, setName] = useState('');
  const store = labStore(playgroundLab);
  const graph = store((state) => state.saved.graph);
  const { items, openId, warning, saveAs, overwrite, rename, duplicate, remove, open } =
    usePlaygroundLibrary();
  const opened = items.find((item) => item.id === openId);
  const filled = hasNodes(graph);
  const changed = opened ? signature(opened.graph) !== signature(graph) : filled;

  const load = (item: SavedPlayground) => {
    if (changed && !window.confirm('저장하지 않은 변경이 사라집니다. 불러올까요?')) return;
    store.getState().load(structuredClone(item.graph));
    open(item.id);
  };
  return (
    <div className="relative">
      <Button
        ref={trigger}
        type="button"
        aria-expanded={shown}
        onClick={() => {
          const left = trigger.current?.getBoundingClientRect().left ?? 0;
          setAlignRight(left + 416 + 16 > window.innerWidth);
          show(!shown);
        }}
      >
        <FolderOpen size={15} /> 내 Playground ({items.length})
      </Button>
      {shown && (
        <section
          aria-label="내 Playground"
          className={
            (alignRight ? 'right-0' : 'left-0') +
            ' absolute z-30 mt-1.5 grid w-[min(26rem,calc(100vw-2rem))] gap-3 rounded-lg border border-solid border-ui-rule-2 bg-ui-paper p-3 shadow-(--shadow-card)'
          }
        >
          <form
            className="grid gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              if (!filled) return;
              if (saveAs(name || '내 Playground', graph)) setName('');
            }}
          >
            <p className="m-0 text-xs text-ui-muted">
              {opened
                ? '열어 둔 구성: ' + opened.name + (changed ? ' · 저장하지 않은 변경 있음' : '')
                : '저장하지 않은 구성입니다.'}
            </p>
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="저장할 이름"
              aria-label="저장할 이름"
              maxLength={40}
            />
            <div className="flex flex-wrap gap-1.5">
              <Button type="submit" disabled={!filled}>
                <Save size={15} /> 새로 저장
              </Button>
              {opened && (
                <Button
                  type="button"
                  disabled={!changed || !filled}
                  onClick={() => overwrite(opened.id, graph)}
                >
                  <Save size={15} /> 덮어쓰기
                </Button>
              )}
              <Button asChild className="no-underline" aria-disabled={!filled}>
                <Link
                  to="/board/new?attach=current"
                  onClick={(event) => !filled && event.preventDefault()}
                >
                  <Upload size={15} /> 게시판에 올리기
                </Link>
              </Button>
            </div>
          </form>
          {warning && (
            <p role="alert" className="m-0 text-xs text-ui-error">
              {warning}
            </p>
          )}
          {items.length === 0 ? (
            <p className="m-0 text-sm text-ui-muted">저장한 Playground가 없습니다.</p>
          ) : (
            <ul className="m-0 grid max-h-72 list-none gap-1.5 overflow-auto p-0">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="grid gap-1 rounded-md border border-solid border-ui-rule-2 px-2.5 py-2 data-[open=true]:border-ui-accent"
                  data-open={item.id === openId}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <strong className="min-w-0 truncate text-sm">{item.name}</strong>
                    <span className="shrink-0 text-xs text-ui-muted">
                      {dateText(item.updatedAt)}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <Button
                      type="button"
                      size="small"
                      aria-label={item.name + ' 불러오기'}
                      onClick={() => load(item)}
                    >
                      불러오기
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      aria-label={item.name + ' 복제'}
                      title="복제"
                      onClick={() => duplicate(item.id)}
                    >
                      <Copy size={14} />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      aria-label={item.name + ' 이름 변경'}
                      title="이름 변경"
                      onClick={() => {
                        const next = window.prompt('새 이름', item.name);
                        if (next?.trim()) rename(item.id, next);
                      }}
                    >
                      <Pencil size={14} />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      aria-label={item.name + ' 삭제'}
                      title="삭제"
                      onClick={() => {
                        if (window.confirm('"' + item.name + '"을(를) 삭제할까요?'))
                          remove(item.id);
                      }}
                    >
                      <Trash2 size={14} />
                    </Button>
                    <Button asChild size="small" className="no-underline">
                      <Link to={'/board/new?attach=' + item.id}>
                        <Upload size={14} /> 올리기
                      </Link>
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
