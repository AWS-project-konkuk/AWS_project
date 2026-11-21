import type { Root } from 'hast';
import { refractor } from 'refractor/all';
import { visit } from 'unist-util-visit';

export default function rehypeCodeHighlight() {
  return (tree: Root) => {
    visit(tree, 'element', (element, _index, parent) => {
      if (element.tagName !== 'code' || parent?.type !== 'element' || parent.tagName !== 'pre')
        return;

      const source = element.children[0];
      if (element.children.length !== 1 || source.type !== 'text') return;

      // MDX adds a final newline to fenced code. Preserve the original snippet when copying.
      source.value = source.value.replace(/\n$/, '');
      const classes = element.properties.className;
      const language = Array.isArray(classes)
        ? classes.find((name) => typeof name === 'string' && name.startsWith('language-'))
        : undefined;
      const id =
        typeof language === 'string' ? language.slice('language-'.length).toLowerCase() : '';
      if (id && refractor.registered(id)) {
        element.children = refractor
          .highlight(source.value, id)
          .children.filter((token) => token.type === 'element' || token.type === 'text');
      }
    });
  };
}
