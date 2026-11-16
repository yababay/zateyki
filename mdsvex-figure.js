import { visit, SKIP } from 'unist-util-visit';

const RESERVED = new Set([
	'metadata', 'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger',
	'default', 'delete', 'do', 'else', 'export', 'extends', 'finally', 'for',
	'function', 'if', 'import', 'in', 'instanceof', 'new', 'return', 'super',
	'switch', 'this', 'throw', 'try', 'typeof', 'var', 'void', 'while', 'with',
	'yield', 'let', 'static', 'enum', 'await', 'arguments', 'eval'
]);

/** Относительный путь (не http://, не /static, не data:) — только его импортируем. */
function isRelative(src) {
	return typeof src === 'string' && src.length > 0 && !/^(?:[a-z][a-z0-9+.-]*:|\/\/|\/)/i.test(src);
}

function toSpecifier(src) {
	return src.startsWith('.') ? src : `./${src}`;
}

function swapPngToWebp(specifier) {
	const parts = /^([^?#]*)(.*)$/.exec(specifier);
	return parts[1].replace(/\.png$/i, '.webp') + parts[2];
}

function baseName(specifier) {
	const file = specifier.split(/[?#]/)[0].split('/').pop() || 'image';
	return file.replace(/\.[^.]+$/, '');
}

function makeName(base, used) {
	let name = base.replace(/[^\p{L}\p{N}_$]/gu, '_');
	if (!name || /^\p{N}/u.test(name)) name = `_${name || 'image'}`;
	let unique = name;
	let i = 2;
	while (used.has(unique)) unique = `${name}_${i++}`;
	used.add(unique);
	return unique;
}

/** Экранируем значение атрибута, в том числе фигурные скобки — их Svelte иначе примет за выражения. */
function attr(value) {
	return String(value)
		.replace(/&/g, '&amp;')
		.replace(/"/g, '&quot;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/{/g, '&#123;')
		.replace(/}/g, '&#125;');
}

function encode(payload) {
	return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64');
}

function decode(value) {
	return JSON.parse(Buffer.from(value, 'base64').toString('utf8'));
}

/**
 * rehype-плагин: абзацы, целиком состоящие из картинок, превращаются в <Figure />,
 * а список нужных импортов кладётся в служебный комментарий-маркер.
 */
export function rehypeFigureComponent(options = {}) {
	const {
		component = '#lib/components/Figure.svelte',
		componentName = 'Figure',
		webp = false,
		containerClass = 'rehype-figure-container'
	} = options;

	return function (tree) {
		const imports = new Map();
		const used = new Set(RESERVED);
		used.add(componentName);

		function nameFor(specifier) {
			if (!imports.has(specifier)) imports.set(specifier, makeName(baseName(specifier), used));
			return imports.get(specifier);
		}

		function tagFor(img) {
			const properties = img.properties || {};
			const alt = typeof properties.alt === 'string' ? properties.alt : '';
			const src = typeof properties.src === 'string' ? properties.src : '';

			if (!isRelative(src)) return `<${componentName} caption="${attr(alt)}" src="${attr(src)}" />`;

			let specifier = toSpecifier(src);
			if (webp) specifier = swapPngToWebp(specifier);
			return `<${componentName} caption="${attr(alt)}" src={${nameFor(specifier)}} />`;
		}

		visit(tree, { tagName: 'p' }, (node, index, parent) => {
			if (!parent || index == null) return;

			const meaningful = node.children.filter(
				(n) => !(n.type === 'text' && n.value.trim() === '')
			);
			if (meaningful.length === 0) return;
			if (!meaningful.every((n) => n.type === 'element' && n.tagName === 'img')) return;

			const tags = meaningful.map(tagFor);
			const markup =
				tags.length === 1
					? tags[0]
					: `<div class="${attr(containerClass)}">\n${tags.join('\n')}\n</div>`;

			parent.children[index] = { type: 'raw', value: markup };
			return SKIP;
		});

		if (imports.size === 0) return;

		const payload = {
			component,
			componentName,
			imports: [...imports].map(([path, name]) => ({ path, name }))
		};
		tree.children.unshift({ type: 'raw', value: `<!--mdsvex-figure:${encode(payload)}-->` });
	};
}

/**
 * Препроцессор (ставится ПОСЛЕ mdsvex): разворачивает маркер в импорты
 * и вписывает их в единственную модульную скриптовую секцию компонента.
 */
export function figureImports() {
	return {
		name: 'mdsvex-figure-imports',
		markup({ content, filename }) {
			if (!filename || !/\.(md|svx)$/.test(filename)) return;

			const payloads = [];
			let code = content.replace(/<!--mdsvex-figure:([A-Za-z0-9+/=]*)-->/g, (_, data) => {
				payloads.push(decode(data));
				return '';
			});
			if (payloads.length === 0) return;

			const statements = [];
			for (const payload of payloads) {
				statements.push(`import ${payload.componentName} from ${JSON.stringify(payload.component)};`);
				for (const { name, path } of payload.imports) {
					statements.push(`import ${name} from ${JSON.stringify(path)};`);
				}
			}
			const block = statements.join('\n\t');

			const moduleScript = /<script\b[^>]*\b(?:context\s*=\s*["']module["']|module\b)[^>]*>/i;
			code = moduleScript.test(code)
				? code.replace(moduleScript, (tag) => `${tag}\n\t${block}`)
				: `<script module>\n\t${block}\n</script>\n\n${code}`;

			return { code };
		}
	};
}