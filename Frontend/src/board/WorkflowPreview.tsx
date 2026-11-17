import { useEffect, useRef } from 'react';
import { serviceById } from '../console/resources';
import type { PlaygroundData } from '../playground/model';

export function WorkflowPreview({
  workflow,
  detailed = false,
}: {
  workflow: PlaygroundData | null;
  detailed?: boolean;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const element = canvas.current;
    if (!element || !workflow) return;
    const draw = () => {
      const ctx = element.getContext('2d');
      const { clientWidth: width, clientHeight: height } = element;
      if (!ctx || !width || !height) return;
      const pixelRatio = window.devicePixelRatio || 1;
      element.width = width * pixelRatio;
      element.height = height * pixelRatio;
      const styles = getComputedStyle(element);
      const color = (name: string) => styles.getPropertyValue('--color-' + name).trim();
      const nodes = workflow.resources;
      const byId = new Map(nodes.map((node) => [node.id, node.position]));
      const left = Math.min(...nodes.map((node) => node.position.x));
      const top = Math.min(...nodes.map((node) => node.position.y));
      const spanX = Math.max(...nodes.map((node) => node.position.x)) - left + 148;
      const spanY = Math.max(...nodes.map((node) => node.position.y)) - top + 52;
      const padding = detailed ? 28 : 12;
      const scale = Math.min(1.2, (width - 2 * padding) / spanX, (height - 2 * padding) / spanY);
      if (!Number.isFinite(scale) || scale <= 0) return;
      ctx.scale(pixelRatio, pixelRatio);
      ctx.translate((width - spanX * scale) / 2, (height - spanY * scale) / 2);
      ctx.scale(scale, scale);
      ctx.translate(-left, -top);
      ctx.lineWidth = 1.7;
      ctx.strokeStyle = color('accent');
      for (const edge of workflow.edges) {
        const source = byId.get(edge.source);
        const target = byId.get(edge.target);
        if (!source || !target) continue;
        const backwards = target.x < source.x;
        const x1 = source.x + (backwards ? 0 : 148);
        const x2 = target.x + (backwards ? 148 : 0);
        const bend = (x1 + x2) / 2;
        ctx.setLineDash(edge.relation === 'feedback' ? [5, 4] : []);
        ctx.beginPath();
        ctx.moveTo(x1, source.y + 26);
        ctx.bezierCurveTo(bend, source.y + 26, bend, target.y + 26, x2, target.y + 26);
        ctx.stroke();
      }
      ctx.setLineDash([]);
      for (const {
        position: { x, y },
        config,
      } of nodes) {
        ctx.beginPath();
        ctx.roundRect(x, y, 148, 52, 7);
        ctx.fillStyle = color('paper');
        ctx.fill();
        ctx.strokeStyle = color('rule-2');
        ctx.stroke();
        ctx.fillStyle = color('ink');
        ctx.font = '600 14px Pretendard, sans-serif';
        ctx.fillText(config.name, x + 10, y + 21, 128);
        ctx.fillStyle = color('muted');
        ctx.font = '12px Pretendard, sans-serif';
        ctx.fillText(serviceById[config.service].name, x + 10, y + 39, 128);
      }
    };
    const size = new ResizeObserver(draw);
    const theme = new MutationObserver(draw);
    size.observe(element);
    theme.observe(document.documentElement, { attributeFilter: ['data-theme'] });
    draw();
    return () => {
      size.disconnect();
      theme.disconnect();
    };
  }, [workflow, detailed]);

  const height = detailed ? 'h-[clamp(19rem,52vh,34rem)]' : 'aspect-[16/10]';
  return (
    <div
      className={height + ' relative grid w-full place-items-center overflow-hidden bg-ui-paper-2'}
    >
      {workflow?.resources.length ? (
        <canvas
          ref={canvas}
          className="absolute inset-0 h-full w-full"
          role="img"
          aria-label={
            detailed
              ? workflow.resources.map((node) => node.config.name).join(', ')
              : '워크플로우 미리보기'
          }
        />
      ) : (
        <span className="px-3 text-center text-xs text-ui-muted">
          표시할 워크플로우가 없습니다.
        </span>
      )}
    </div>
  );
}
