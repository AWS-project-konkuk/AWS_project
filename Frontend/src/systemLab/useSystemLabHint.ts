import { useEffect, useRef, useState } from 'react';
import { chatErrorMessage } from '../api/chat';
import { requestHint, type HintResponse } from '../api/hint';
import { buildHintRequest, canRequestHint, type HintRun } from './hint';
import { signature, type Graph } from './model';

export function useSystemLabHint(
  lesson: Parameters<typeof buildHintRequest>[0],
  graph: Graph,
  run: HintRun | null,
) {
  const canRequest = canRequestHint(lesson.id, graph, run);
  const key = JSON.stringify([lesson.id, run?.result.id, signature(graph), canRequest]);
  const active = useRef<AbortController | null>(null);
  const [result, setResult] = useState<{
    key: string;
    loading: boolean;
    advice: HintResponse | null;
    error: string;
  }>({ key: '', loading: false, advice: null, error: '' });

  useEffect(() => {
    return () => {
      active.current?.abort();
      active.current = null;
    };
  }, [key]);

  const visible = result.key === key ? result : { loading: false, advice: null, error: '' };
  async function request() {
    if (!canRequest || active.current || visible.advice?.status === 'ok') return;
    const controller = new AbortController();
    active.current = controller;
    setResult({ key, loading: true, advice: null, error: '' });
    try {
      const advice = await requestHint(buildHintRequest(lesson, graph, run), controller.signal);
      if (!controller.signal.aborted) setResult({ key, loading: false, advice, error: '' });
    } catch (error) {
      if (!controller.signal.aborted)
        setResult({ key, loading: false, advice: null, error: chatErrorMessage(error) });
    } finally {
      if (active.current === controller) active.current = null;
    }
  }
  return { ...visible, canRequest, request };
}
