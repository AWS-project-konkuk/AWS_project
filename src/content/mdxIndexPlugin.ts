import type { Root } from 'mdast';
import type { Program } from 'estree';
import { toString } from 'mdast-util-to-string';
import type { Reading } from '../curriculum/types.ts';

interface JsxNode {
  type: string;
  name?: string;
  attributes?: { type: string; name?: string; value?: unknown }[];
  children?: JsxNode[];
}
/** MDX 본문은 그대로 컴파일하고 검색·기존 계산용 목차만 함께 추출합니다. */
export default function mdxIndexPlugin() {
  return (tree: Root) => {
    const reading: Reading[] = [];
    const features = { nodeExamples: false, activities: false, quiz: false };
    let section: Reading | undefined;
    const ensure = () =>
      section ?? ((section = { title: '본문', body: '' }), reading.push(section), section);
    const attribute = (node: JsxNode, name: string) => {
      const value = node.attributes?.find((attr) => attr.name === name)?.value;
      return typeof value === 'string' ? value : undefined;
    };
    const inspect = (node: JsxNode) => {
      if (node.name === 'NodeExample') features.nodeExamples = true;
      if (['Activity', 'WorkflowLab', 'Question'].includes(node.name ?? ''))
        features.activities = true;
      if (node.name === 'Quiz') features.quiz = true;
      for (const child of node.children ?? []) inspect(child as JsxNode);
    };
    for (const node of tree.children) {
      inspect(node as JsxNode);
      if (node.type === 'heading' && node.depth === 2) {
        section = { title: toString(node), body: '' };
        reading.push(section);
      } else if (node.type === 'code') {
        ensure().code ??= { language: node.lang ?? 'text', text: node.value };
      } else if (node.type === 'table') {
        const rows = node.children.map((row) => row.children.map((cell) => toString(cell)));
        ensure().table ??= { columns: rows[0] ?? [], rows: rows.slice(1) };
      } else if (node.type === 'paragraph' || node.type === 'list' || node.type === 'blockquote') {
        const current = ensure();
        const text = toString(node);
        current.body += (current.body && text ? '\n\n' : '') + text;
        if (node.type === 'paragraph')
          for (const child of node.children)
            if (child.type === 'image')
              current.image ??= {
                src: child.url,
                alt: child.alt ?? '',
                ...(child.title ? { caption: child.title } : {}),
              };
      } else if (node.type === 'mdxJsxFlowElement') {
        const jsx = node as JsxNode;
        if (jsx.name === 'Figure') {
          const src = attribute(jsx, 'src'),
            alt = attribute(jsx, 'alt');
          if (src && alt)
            ensure().image ??= {
              src,
              alt,
              ...(attribute(jsx, 'caption') ? { caption: attribute(jsx, 'caption') } : {}),
            };
        } else if (['LessonSummary', 'Callout', 'Reveal'].includes(jsx.name ?? '')) {
          const text = toString(node);
          if (text) {
            const current = ensure();
            current.body += (current.body ? '\n\n' : '') + text;
          }
        }
      }
    }
    if (!reading.length) reading.push({ title: '본문', body: '' });
    const exports = { readingIndex: reading, contentFeatures: features };
    const estree: Program = {
      type: 'Program',
      sourceType: 'module',
      body: Object.entries(exports).map(([name, value]): Program['body'][number] => ({
        type: 'ExportNamedDeclaration',
        specifiers: [],
        source: null,
        attributes: [],
        declaration: {
          type: 'VariableDeclaration',
          kind: 'const',
          declarations: [
            {
              type: 'VariableDeclarator',
              id: { type: 'Identifier', name },
              init: {
                type: 'CallExpression',
                callee: {
                  type: 'MemberExpression',
                  object: { type: 'Identifier', name: 'JSON' },
                  property: { type: 'Identifier', name: 'parse' },
                  computed: false,
                  optional: false,
                },
                arguments: [{ type: 'Literal', value: JSON.stringify(value) }],
                optional: false,
              },
            },
          ],
        },
      })),
    };
    tree.children.push({ type: 'mdxjsEsm', value: '', data: { estree } });
  };
}
