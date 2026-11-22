<script lang="ts">
	import type { Snippet } from 'svelte';

	type DiagramType = 'vertex' | 'scattering' | 'annihilation' | 'box' | 'loop' | 'triplet';

	interface Props {
		/** Встроенный пресет (теперь тоже рендерится через сетку иконок) */
		type?: DiagramType;
		/** Пользовательская псевдографика */
		ascii?: string;
		/** Заголовок карточки */
		title?: string;
		/** Бейдж с «налогом» */
		tax?: string;
		caption?: Snippet;
		children?: Snippet;
	}

	let { type = 'vertex', ascii, title, tax, caption, children }: Props = $props();

	const hasCaption = $derived(Boolean(caption || children));

	// Встроенные пресеты в формате той же псевдографики для 100% единого стиля
	const PRESETS: Record<DiagramType, string> = {
		vertex: [
			'e-     g ',
			' \\    ~  ',
			'  ↖  ~   ',
			'   *     ',
			'  ↗      ',
			' /       ',
			'e-       '
		].join('\n'),

		scattering: [
			'e-         e-',
			' \\         / ',
			'  ↖       ↗  ',
			'   *~~~~~*   ',
			'  ↗       ↖  ',
			' /         \\ ',
			'e-         e-'
		].join('\n'),

		annihilation: [
			'e-       e+',
			' \\       / ',
			'  ↖     ↙  ',
			'   *   *   ',
			'    \\ /    ',
			'     *     ',
			'     :     ',
			'     *     ',
			'    / \\    ',
			'   *   *   ',
			'  ↗     ↘  ',
			' /       \\ ',
			'e-       e+'
		].join('\n'),

		box: [
			'g           g',
			' ~         ~ ',
			'  *-- > --*  ',
			'  |       |  ',
			'  ^       v  ',
			'  |       |  ',
			'  *-- < --*  ',
			' ~         ~ ',
			'g           g'
		].join('\n'),

		loop: [
			'  e-      ',
			'  |       ',
			'  ^       ',
			'  |       ',
			'  * ~ ~   ',
			'  |    :  ',
			'  ^  g :  ',
			'  |    :  ',
			'  * ~ ~   ',
			'  |       ',
			'  ^       ',
			'  |       ',
			'  e-      '
		].join('\n'),

		triplet: [
			'g     g     g',
			' ~    :    ~ ',
			'  *---*---*  ',
			'   \\     /   ',
			'    ↗   ↘    ',
			'     \\ /     ',
			'     e-e+    '
		].join('\n')
	};

	interface GridCell {
		kind: 'empty' | 'icon' | 'label';
		iconClass?: string;
		rotate?: number;
		colorClass?: string;
		text?: string;
	}

	const gridData = $derived.by(() => {
		const source = (ascii ?? PRESETS[type] ?? PRESETS.vertex).replace(/^\n+|\n+$/g, '');
		const rawLines = source.split('\n');
		const rows = rawLines.length;
		const cols = Math.max(...rawLines.map((l) => l.length), 1);

		const cells = new Array<GridCell>();

		for (let r = 0; r < rows; r++) {
			const line = rawLines[r];
			for (let c = 0; c < cols; c++) {
				const ch = line[c] ?? ' ';
				const next = line[c + 1] ?? '';

				// Двухсимвольные обозначения частиц: e-, e+, m-, m+
				if ((ch === 'e' || ch === 'm') && (next === '-' || next === '+')) {
					const isPos = next === '+';
					const base = ch === 'm' ? 'μ' : 'e';
					cells.push({
						kind: 'label',
						text: `${base}${isPos ? '⁺' : '⁻'}`,
						colorClass: isPos ? 'c-positron' : 'c-electron'
					});
					// Следующую ячейку занимаем пустышкой, чтобы сохранить сетку
					cells.push({ kind: 'empty' });
					c++;
					continue;
				}

				if (ch === 'g' || ch === 'γ') {
					cells.push({ kind: 'label', text: 'γ', colorClass: 'c-photon' });
				} else if (ch === '|') {
					cells.push({ kind: 'icon', iconClass: 'bi-dash-lg', rotate: 90, colorClass: 'c-electron' });
				} else if (ch === '-') {
					cells.push({ kind: 'icon', iconClass: 'bi-dash-lg', rotate: 0, colorClass: 'c-electron' });
				} else if (ch === '/') {
					cells.push({ kind: 'icon', iconClass: 'bi-dash-lg', rotate: -45, colorClass: 'c-electron' });
				} else if (ch === '\\') {
					cells.push({ kind: 'icon', iconClass: 'bi-dash-lg', rotate: 45, colorClass: 'c-electron' });
				} else if (ch === '~') {
					cells.push({ kind: 'icon', iconClass: 'bi-soundwave', rotate: 0, colorClass: 'c-photon' });
				} else if (ch === ':') {
					cells.push({ kind: 'icon', iconClass: 'bi-soundwave', rotate: 90, colorClass: 'c-photon' });
				} else if (ch === '*') {
					cells.push({ kind: 'icon', iconClass: 'bi-circle-fill', rotate: 0, colorClass: 'c-vertex' });
				} else if (ch === '^') {
					cells.push({ kind: 'icon', iconClass: 'bi-arrow-up', rotate: 0, colorClass: 'c-electron' });
				} else if (ch === 'v') {
					cells.push({ kind: 'icon', iconClass: 'bi-arrow-down', rotate: 0, colorClass: 'c-positron' });
				} else if (ch === '>') {
					cells.push({ kind: 'icon', iconClass: 'bi-arrow-right', rotate: 0, colorClass: 'c-electron' });
				} else if (ch === '<') {
					cells.push({ kind: 'icon', iconClass: 'bi-arrow-left', rotate: 0, colorClass: 'c-positron' });
				} else if (ch === '↗' || ch === '1') {
					cells.push({ kind: 'icon', iconClass: 'bi-arrow-up-right', rotate: 0, colorClass: 'c-electron' });
				} else if (ch === '↖' || ch === '2') {
					cells.push({ kind: 'icon', iconClass: 'bi-arrow-up-left', rotate: 0, colorClass: 'c-electron' });
				} else if (ch === '↘' || ch === '3') {
					cells.push({ kind: 'icon', iconClass: 'bi-arrow-down-right', rotate: 0, colorClass: 'c-positron' });
				} else if (ch === '↙' || ch === '4') {
					cells.push({ kind: 'icon', iconClass: 'bi-arrow-down-left', rotate: 0, colorClass: 'c-positron' });
				} else {
					cells.push({ kind: 'empty' });
				}
			}
		}

		return { rows, cols, cells };
	});
</script>

<figure class="fd-card">
	{#if title || tax}
		<header class="fd-header">
			{#if title}
				<span class="fd-title">{title}</span>
			{/if}
			{#if tax}
				<span class="fd-tax">{tax}</span>
			{/if}
		</header>
	{/if}

	<div class="fd-body">
		<div class="fd-visual">
			<span class="fd-time">Время t ↑</span>

			<div
				class="fd-grid"
				style="grid-template-columns: repeat({gridData.cols}, 1fr);"
				role="img"
				aria-label={title ?? 'Диаграмма Фейнмана'}
			>
				{#each gridData.cells as cell}
					<div class="fd-tile">
						{#if cell.kind === 'icon'}
							<i
								class="bi {cell.iconClass} {cell.colorClass}"
								style={cell.rotate ? `transform: rotate(${cell.rotate}deg);` : undefined}
							></i>
						{:else if cell.kind === 'label'}
							<span class="fd-lbl {cell.colorClass}">{cell.text}</span>
						{/if}
					</div>
				{/each}
			</div>
		</div>

	</div>

	{#if hasCaption}
		<figcaption class="feynman-caption">
			{#if caption}
				{@render caption()}
			{:else if children}
				{@render children()}
			{/if}
		</figcaption>
	{/if}
</figure>

<style lang="scss">
	.fd-card {
		margin: 1.75rem 0;
		padding: 1rem 1.15rem;
		border-radius: 10px;
		background: #23211d;
		border: 1px solid #3a352d;
		color: #f3efe6;
	}

	.fd-header {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.85rem;
		padding-bottom: 0.55rem;
		border-bottom: 1px solid #3a352d;
	}

	.fd-title {
		font-weight: 700;
		font-size: 0.98rem;
		color: #f59e0b;
	}

	.fd-tax {
		padding: 0.18rem 0.55rem;
		border-radius: 4px;
		background: #332f28;
		border: 1px solid #5c5343;
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.78rem;
		color: #cbbba0;
	}

	.fd-body {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.fd-visual {
		position: relative;
		display: flex;
		justify-content: center;
		align-items: center;
		width: 100%;
		background: #181613;
		border-radius: 8px;
		border: 1px solid #2e2a24;
		padding: 1.1rem 0.75rem;
		box-sizing: border-box;
		overflow-x: auto;
	}

	.fd-time {
		position: absolute;
		top: 0.5rem;
		left: 0.75rem;
		color: #786e5c;
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.75rem;
		pointer-events: none;
	}

	.fd-grid {
		display: grid;
		gap: 0;
		width: max-content;
		max-width: 100%;
	}

	.fd-tile {
		width: 1.75rem;
		height: 1.75rem;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.45rem;
		line-height: 1;

		@media (max-width: 520px) {
			width: 1.35rem;
			height: 1.35rem;
			font-size: 1.15rem;
		}

		i {
			display: inline-block;
		}
	}

	.fd-lbl {
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.95rem;
		font-weight: 700;
	}

	.c-electron {
		color: #f59e0b;
	}

	.c-positron {
		color: #38bdf8;
	}

	.c-photon {
		color: #e2d8c3;
	}

	.c-vertex {
		color: #ef4444;
		font-size: 0.78rem;
	}

	.feynman-caption {
		font-size: 0.96rem;
		line-height: 1.6;
		color: #e2d8c3;

		:global(p:first-child) {
			margin-top: 0;
		}

		:global(p:last-child) {
			margin-bottom: 0;
		}

		:global(.katex svg) {
			width: auto;
			height: inherit;
			display: inline;
		}
	}
</style>
