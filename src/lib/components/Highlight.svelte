<script lang="ts">
	import '#lib/styles/highlight/styles/github.min.css';
	// highlight.js 11.2 exposes its declarations outside the package exports map.
	// @ts-expect-error
	import hljs from 'highlight.js';

	interface Props {
		/** Исходный текст. Передавайте его через code, чтобы Svelte не разбирал фигурные скобки как выражения. */
		code: string;
		/** Язык highlight.js; по умолчанию — обычный текст. */
		lang?: string;
		/** Имя темы из src/lib/styles/highlight/styles; по умолчанию github. */
		theme?: string;
	}

	const themeLoaders = import.meta.glob('../styles/highlight/styles/*.css', {
		query: '?raw',
		import: 'default'
	}) as Record<string, () => Promise<string>>;

	let { code, lang = 'plaintext', theme = 'github' }: Props = $props();
	let scopedTheme = $state('');

	const safeLang = $derived(/^[\w+-]+$/.test(lang) ? lang : 'plaintext');
	const themeName = $derived.by(() => {
		const requested = theme.toLowerCase() === 'arduino' ? 'arduino-light' : theme.toLowerCase();
		return themeLoaders[`../styles/highlight/styles/${requested}.css`] ? requested : 'github';
	});
	const themeKey = $derived(`../styles/highlight/styles/${themeName}.css`);

	function escapeHtml(value: string) {
		return value.replace(/[&<>"']/g, (char) => {
			const entities: Record<string, string> = {
				'&': '&amp;',
				'<': '&lt;',
				'>': '&gt;',
				'"': '&quot;',
				"'": '&#x27;'
			};
			return entities[char];
		});
	}

	const highlightedCode = $derived.by(() => {
		try {
			return hljs.highlight(code, { language: safeLang }).value;
		} catch {
			return escapeHtml(code);
		}
	});

	function scopeTheme(css: string, name: string) {
		const scope = `[data-highlight-theme="${name}"]`;
		const source = css.replace(/\/\*[\s\S]*?\*\//g, '');

		function scopeRules(rules: string): string {
			let output = '';
			let cursor = 0;

			while (cursor < rules.length) {
				const open = rules.indexOf('{', cursor);
				if (open === -1) return output + rules.slice(cursor);

				let depth = 1;
				let close = open + 1;
				while (close < rules.length && depth > 0) {
					if (rules[close] === '{') depth++;
					if (rules[close] === '}') depth--;
					close++;
				}

				const prelude = rules.slice(cursor, open);
				const body = rules.slice(open + 1, close - 1);
				const selectorGroup = prelude.trim();
				if (selectorGroup.startsWith('@')) {
					output += `${prelude}{${scopeRules(body)}}`;
				} else {
					const scopedSelectors = selectorGroup
						.split(',')
						.map((selector) => `${scope} ${selector.trim()}`)
						.join(', ');
					output += `${scopedSelectors} {${body}}`;
				}
				cursor = close;
			}

			return output;
		}

		return scopeRules(source);
	}

	$effect(() => {
		let cancelled = false;
		const load = themeLoaders[themeKey] ?? themeLoaders['../styles/highlight/styles/github.css'];

		if (!load) {
			scopedTheme = '';
			return;
		}

		load().then((css) => {
			if (!cancelled) scopedTheme = `<style>${scopeTheme(css, themeName)}</style>`;
		});

		return () => {
			cancelled = true;
		};
	});
</script>

<svelte:head>{@html scopedTheme}</svelte:head>

<div class="highlight" data-highlight-theme={themeName}>
	<pre><code class="hljs language-{safeLang}">{@html highlightedCode}</code></pre>
</div>

<style>
	.highlight :global(pre) {
		margin-block: 1rem;
	}

	.highlight :global(code) {
		white-space: pre;
	}
</style>