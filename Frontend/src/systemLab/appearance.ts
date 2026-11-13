import type { Kind, Material } from './model';

export const kindColor: Record<Kind, string> = {
  root: '[--kind-color:var(--color-accent)]',
  ec2: '[--kind-color:light-dark(#984318,#ffb486)]',
  docker: '[--kind-color:light-dark(#00708b,#7bd9f1)]',
  kubernetes: '[--kind-color:light-dark(#305bb0,#a5bcff)]',
  start: '[--kind-color:light-dark(#23694b,#83d9ad)]',
  end: '[--kind-color:light-dark(#525f73,#b8c8dd)]',
  model: '[--kind-color:light-dark(#78468f,#dcb4f1)]',
  image: '[--kind-color:light-dark(#865d17,#f0cf82)]',
  deployment: '[--kind-color:light-dark(#146b65,#83d6cb)]',
  service: '[--kind-color:light-dark(#9b3d6b,#f2a8ce)]',
  pod: '[--kind-color:light-dark(#526813,#bdd988)]',
  container: '[--kind-color:light-dark(#594c9e,#c8b8ff)]',
};

export const materialColor: Record<Material, string> = {
  request: '[--port-color:var(--lab-request)]',
  prediction: '[--port-color:var(--lab-prediction)]',
  model: '[--port-color:var(--lab-model)]',
  image: '[--port-color:var(--lab-image)]',
  control: '[--port-color:var(--lab-control)]',
};

export const hint = 'my-2 text-[13px] leading-[1.45] text-ui-muted';
export const divider = 'border-0 border-b border-solid border-ui-rule';
export const panel = 'flex min-h-0 min-w-0 flex-col bg-ui-paper [contain:size]';
export const panelBody = 'min-h-0 flex-1 overflow-auto overscroll-contain';
export const entityFrame =
  'border border-solid border-ui-rule-2 data-[selected=true]:outline-2 data-[selected=true]:outline-offset-1 data-[selected=true]:outline-ui-accent data-[status=성공]:border-2 data-[status=성공]:border-ui-success data-[status=실패]:border-2 data-[status=실패]:border-ui-error data-[status=차단]:border-2 data-[status=차단]:border-ui-error';
export const entityStatus =
  'group-data-[status=실행_준비]/entity:text-ui-success group-data-[status=성공]/entity:text-ui-success group-data-[status=정지]/entity:text-ui-error group-data-[status=실패]/entity:text-ui-error group-data-[status=차단]/entity:text-ui-error';
export const portHandle =
  'size-7! min-h-7! min-w-7! border-0! bg-transparent! before:absolute before:inset-[6px] before:rounded-full before:border-2 before:border-solid before:border-(--port-color) before:bg-ui-paper before:content-[""] hover:before:bg-(--port-color) [&.connectingfrom]:before:bg-(--port-color) [&.valid]:before:bg-(--port-color) group-data-[connected=true]/port:before:bg-(--port-color)';
