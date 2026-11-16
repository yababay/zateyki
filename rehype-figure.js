import { visit } from 'unist-util-visit';
import { h } from 'hastscript';

export default function rehypeFigure(option) {
	const className = (option && option.className) || 'rehype-figure';

	function buildFigure({ properties }) {
		const src =
			typeof properties.src === 'string'
				? properties.src.replace(/\.png$/i, '.webp')
				: properties.src;

		const children = [h('img', { ...properties, src })];
		if (properties.alt && properties.alt.trim().length > 0) {
			children.push(h('figcaption', properties.alt));
		}
		return h('figure', { class: className }, children);
	}

	return function (tree) {
		visit(tree, { tagName: 'p' }, (node, index, parent) => {
			if (!parent || index == null) return;

			// Преобразуем только абзацы, целиком состоящие из картинок,
			// чтобы не терять текст и не задеть разметку KaTeX.
			const meaningful = node.children.filter(
				(n) => !(n.type === 'text' && n.value.trim() === '')
			);
			const images = meaningful.filter((n) => n.tagName === 'img');
			if (images.length === 0 || images.length !== meaningful.length) return;

			const figures = images.map(buildFigure);
			parent.children[index] =
				figures.length === 1
					? figures[0]
					: h('div', { class: `${className}-container` }, figures);
		});
	};
}