<script lang="ts">
	import type { Snippet } from 'svelte';
	import '#lib/styles/widget.scss';

	type DiagramType = 'vertex' | 'scattering' | 'annihilation' | 'box' | 'loop' | 'triplet';
	type ParticleRole = 'electron' | 'positron' | 'photon';

	interface Props {
		type?: DiagramType;
		ascii?: string;
		title?: string;
		tax?: string;
		caption?: Snippet;
		children?: Snippet;
	}

	let { type = 'vertex', ascii, title, tax, caption, children }: Props = $props();

	const hasCaption = $derived(Boolean(caption || children));

	// Встроенные пресеты на новой бесшовной сетке
	const PRESETS: Record<DiagramType, string> = {
		vertex: [
			'e-    g ',
			' \\   z  ',
			'  ↖ z   ',
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
			' x         z ',
			'  *---<---*  ',
			'  |       |  ',
			'  ^       v  ',
			'  |       |  ',
			'  *--->---*  ',
			' z         x ',
			'g           g'
		].join('\n'),

		loop: [
			'  e-      ',
			'  |       ',
			'  ^       ',
			'  |       ',
			'  *~~~    ',
			'  |   :   ',
			'  ^ g :   ',
			'  |   :   ',
			'  *~~~     ',
			'  |       ',
			'  ^       ',
			'  |       ',
			'  e-      '
		].join('\n'),

		triplet: [
			'g     g     g',
			' x    :    z ',
			'  *---*---*  ',
			'   \\     /   ',
			'    ↗   ↘    ',
			'     \\ /     ',
			'     e-e+    '
		].join('\n')
	};

	// Ориентация отрезка в клетке: 'v' (|), 'h' (-), 'd1' (/), 'd2' (\)
	type Orient = 'v' | 'h' | 'd1' | 'd2';

	interface Stub {
		dx: number;
		dy: number;
		isPhoton: boolean;
		role: ParticleRole;
	}

	interface GridCell {
		r: number;
		c: number;
		kind: 'empty' | 'fermion' | 'photon' | 'vertex' | 'label';
		orient?: Orient;
		arrowAngle?: number; // угол стрелки в градусах (0 = вправо, -90 = вверх, 90 = вниз)
		role: ParticleRole;
		text?: string;
		stubs?: Array<Stub>;
	}

	// Проверяем, стыкуется ли клетка с направлением (dx, dy)
	function connectsTo(cell: GridCell | undefined, dx: number, dy: number): boolean {
		if (!cell) return false;
		if (cell.kind === 'vertex' || cell.kind === 'label') return true;
		if (cell.kind === 'fermion' || cell.kind === 'photon') {
			if (cell.orient === 'v') return dx === 0 && dy !== 0;
			if (cell.orient === 'h') return dy === 0 && dx !== 0;
			if (cell.orient === 'd1') return (dx === 1 && dy === -1) || (dx === -1 && dy === 1); // '/'
			if (cell.orient === 'd2') return (dx === -1 && dy === -1) || (dx === 1 && dy === 1); // '\'
		}
		return false;
	}

	const gridData = $derived.by(() => {
		const source = (ascii ?? PRESETS[type] ?? PRESETS.vertex).replace(/^\n+|\n+$/g, '');
		const rawLines = source.split('\n');
		const rows = rawLines.length;
		const cols = Math.max(...rawLines.map((l) => l.length), 1);

		const matrix = new Array<Array<GridCell>>();

		for (let r = 0; r < rows; r++) {
			const rowArr = new Array<GridCell>();
			const line = rawLines.at(r) ?? '';

			for (let c = 0; c < cols; c++) {
				const ch = line.at(c) ?? ' ';
				const next = line.at(c + 1) ?? '';

				// Двухсимвольные метки частиц: e-, e+, m-, m+
				if ((ch === 'e' || ch === 'm') && (next === '-' || next === '+')) {
					const isPos = next === '+';
					const base = ch === 'm' ? 'μ' : 'e';
					rowArr.push({
						r,
						c,
						kind: 'label',
						role: isPos ? 'positron' : 'electron',
						text: `${base}${isPos ? '⁺' : '⁻'}`
					});
					rowArr.push({ r, c: c + 1, kind: 'empty', role: 'electron' });
					c++;
					continue;
				}

				if (ch === 'g' || ch === 'γ') {
					rowArr.push({ r, c, kind: 'label', role: 'photon', text: 'γ' });
				} else if (ch === '*') {
					rowArr.push({ r, c, kind: 'vertex', role: 'electron', stubs: new Array<Stub>() });
				} else if (ch === '|') {
					rowArr.push({ r, c, kind: 'fermion', orient: 'v', role: 'electron' });
				} else if (ch === '-') {
					rowArr.push({ r, c, kind: 'fermion', orient: 'h', role: 'electron' });
				} else if (ch === '/') {
					rowArr.push({ r, c, kind: 'fermion', orient: 'd1', role: 'electron' });
				} else if (ch === '\\') {
					rowArr.push({ r, c, kind: 'fermion', orient: 'd2', role: 'electron' });
				} else if (ch === '^') {
					rowArr.push({ r, c, kind: 'fermion', orient: 'v', arrowAngle: -90, role: 'electron' });
				} else if (ch === 'v') {
					rowArr.push({ r, c, kind: 'fermion', orient: 'v', arrowAngle: 90, role: 'positron' });
				} else if (ch === '>') {
					rowArr.push({ r, c, kind: 'fermion', orient: 'h', arrowAngle: 0, role: 'electron' });
				} else if (ch === '<') {
					rowArr.push({ r, c, kind: 'fermion', orient: 'h', arrowAngle: 180, role: 'positron' });
				} else if (ch === '↗' || ch === '1') {
					rowArr.push({ r, c, kind: 'fermion', orient: 'd1', arrowAngle: -45, role: 'electron' });
				} else if (ch === '↖' || ch === '2') {
					rowArr.push({ r, c, kind: 'fermion', orient: 'd2', arrowAngle: -135, role: 'electron' });
				} else if (ch === '↘' || ch === '3') {
					rowArr.push({ r, c, kind: 'fermion', orient: 'd2', arrowAngle: 45, role: 'positron' });
				} else if (ch === '↙' || ch === '4') {
					rowArr.push({ r, c, kind: 'fermion', orient: 'd1', arrowAngle: 135, role: 'positron' });
				} else if (ch === '~') {
					rowArr.push({ r, c, kind: 'photon', orient: 'h', role: 'photon' });
				} else if (ch === ':') {
					rowArr.push({ r, c, kind: 'photon', orient: 'v', role: 'photon' });
				} else if (ch === 'z') {
					rowArr.push({ r, c, kind: 'photon', orient: 'd1', role: 'photon' });
				} else if (ch === 'x') {
					rowArr.push({ r, c, kind: 'photon', orient: 'd2', role: 'photon' });
				} else {
					rowArr.push({ r, c, kind: 'empty', role: 'electron' });
				}
			}
			matrix.push(rowArr);
		}

		// Шаг 2: Распространяем голубой цвет позитрона по связанным отрезкам до ближайшего узла '*'
		let changed = true;
		while (changed) {
			changed = false;
			for (let r = 0; r < rows; r++) {
				for (let c = 0; c < cols; c++) {
					const cell = matrix.at(r)?.at(c);
					if (!cell || cell.kind !== 'fermion' || cell.role === 'positron') continue;

					// Проверяем оба конца этого отрезка
					const dirs =
						cell.orient === 'v'
							? Array.of(Array.of(0, -1), Array.of(0, 1))
							: cell.orient === 'h'
								? Array.of(Array.of(-1, 0), Array.of(1, 0))
								: cell.orient === 'd1'
									? Array.of(Array.of(1, -1), Array.of(-1, 1))
									: Array.of(Array.of(-1, -1), Array.of(1, 1));

					for (const d of dirs) {
						const dx = d.at(0) ?? 0;
						const dy = d.at(1) ?? 0;
						const nb = matrix.at(r + dy)?.at(c + dx);
						if (nb && nb.role === 'positron' && (nb.kind === 'fermion' || nb.kind === 'label')) {
							if (connectsTo(nb, -dx, -dy)) {
								cell.role = 'positron';
								changed = true;
								break;
							}
						}
					}
				}
			}
		}

		// Шаг 3: Достраиваем соединительные лучи от красных узлов '*' к соседним линиям
		const allDirs = Array.of(
			Array.of(-1, -1),
			Array.of(0, -1),
			Array.of(1, -1),
			Array.of(-1, 0),
			Array.of(1, 0),
			Array.of(-1, 1),
			Array.of(0, 1),
			Array.of(1, 1)
		);

		for (let r = 0; r < rows; r++) {
			for (let c = 0; c < cols; c++) {
				const cell = matrix.at(r)?.at(c);
				if (!cell || cell.kind !== 'vertex' || !cell.stubs) continue;

				for (const d of allDirs) {
					const dx = d.at(0) ?? 0;
					const dy = d.at(1) ?? 0;
					const nb = matrix.at(r + dy)?.at(c + dx);
					if (nb && (nb.kind === 'fermion' || nb.kind === 'photon' || nb.kind === 'vertex')) {
						if (connectsTo(nb, -dx, -dy)) {
							cell.stubs.push({
								dx,
								dy,
								isPhoton: nb.kind === 'photon',
								role: nb.role
							});
						}
					}
				}
			}
		}

		const flatCells = new Array<GridCell>();
		for (const rowArr of matrix) {
			for (const cell of rowArr) {
				flatCells.push(cell);
			}
		}

		return { rows, cols, cells: flatCells };
	});
</script>

<figure class="z-widget fd-card">
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
		<div class="z-widget-stage fd-visual">
			<span class="fd-time">Время t ↑</span>

			<div
				class="fd-grid"
				style="grid-template-columns: repeat({gridData.cols}, 1fr);"
				role="img"
				aria-label={title ?? 'Диаграмма Фейнмана'}
			>
				{#each gridData.cells as cell}
					<div class="fd-tile">
						{#if cell.kind === 'fermion'}
							<svg viewBox="0 0 100 100" class="tile-svg {cell.role}">
								{#if cell.orient === 'v'}
									<line x1="50" y1="-4" x2="50" y2="104" class="seg" />
								{:else if cell.orient === 'h'}
									<line x1="-4" y1="50" x2="104" y2="50" class="seg" />
								{:else if cell.orient === 'd1'}
									<line x1="-4" y1="104" x2="104" y2="-4" class="seg" />
								{:else if cell.orient === 'd2'}
									<line x1="-4" y1="-4" x2="104" y2="104" class="seg" />
								{/if}

								{#if cell.arrowAngle !== undefined}
									<polygon
										points="68,50 36,33 44,50 36,67"
										class="arrow-head"
										transform="rotate({cell.arrowAngle}, 50, 50)"
									/>
								{/if}
							</svg>
						{:else if cell.kind === 'photon'}
							{@const rot =
								cell.orient === 'v' ? 90 : cell.orient === 'd1' ? -45 : cell.orient === 'd2' ? 45 : 0}
							<svg viewBox="0 0 100 100" class="tile-svg photon">
								<path
									d={cell.orient === 'd1' || cell.orient === 'd2'
										? 'M -21 50 Q -3 26, 15 50 T 50 50 T 85 50 T 121 50'
										: 'M 0 50 Q 12.5 26, 25 50 T 50 50 T 75 50 T 100 50'}
									class="wave"
									transform={rot ? `rotate(${rot}, 50, 50)` : undefined}
								/>
							</svg>
						{:else if cell.kind === 'vertex'}
							<svg viewBox="0 0 100 100" class="tile-svg">
								{#if cell.stubs}
									{#each cell.stubs as st}
										{@const tx = 50 + st.dx * 50}
										{@const ty = 50 + st.dy * 50}
										{#if st.isPhoton}
											{@const ang = (Math.atan2(st.dy, st.dx) * 180) / Math.PI}
											{@const dist = Math.hypot(st.dx, st.dy) * 50}
											<path
												d="M 50 50 Q {50 + dist * 0.25} 30, {50 + dist * 0.5} 50 T {50 + dist} 50"
												class="wave photon"
												transform="rotate({ang}, 50, 50)"
											/>
										{:else}
											<line x1="50" y1="50" x2={tx} y2={ty} class="seg {st.role}" />
										{/if}
									{/each}
								{/if}
								<circle cx="50" cy="50" r="15" class="vertex-dot" />
							</svg>
						{:else if cell.kind === 'label'}
							<span class="fd-lbl {cell.role}">{cell.text}</span>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	</div>

		{#if hasCaption}
			<figcaption class="z-widget-footer feynman-caption">
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
		padding: 1rem 1.15rem;
	}

	.fd-header {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.85rem;
		padding-bottom: 0.55rem;
		border-bottom: 1px solid var(--w-border);
	}

	.fd-title {
		font-weight: 700;
		font-size: 0.98rem;
		color: var(--w-accent);
	}

	.fd-tax {
		padding: 0.18rem 0.55rem;
		border-radius: 4px;
		background: var(--w-bg-btn);
		border: 1px solid var(--w-border-control);
		font-family: var(--w-font-mono);
		font-size: 0.78rem;
		color: var(--w-text-muted);
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
		padding: 1.2rem 0.75rem;
		overflow-x: auto;
		overflow-y: hidden;
	}

	.fd-time {
		position: absolute;
		top: 0.5rem;
		left: 0.75rem;
		color: var(--w-text-dim);
		font-family: var(--w-font-mono);
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
		width: 1.85rem;
		height: 1.85rem;
		display: flex;
		align-items: center;
		justify-content: center;

		@media (max-width: 520px) {
			width: 1.4rem;
			height: 1.4rem;
		}
	}

	.tile-svg {
		width: 100%;
		height: 100%;
		display: block;
		overflow: visible;
		margin: 0;
		padding: 0;
	}

	.seg {
		stroke-width: 8;
		stroke-linecap: butt;
		fill: none;
	}

	.electron .seg,
	.seg.electron {
		stroke: var(--w-accent);
	}

	.positron .seg,
	.seg.positron {
		stroke: var(--w-accent-cold);
	}

	.electron .arrow-head {
		fill: var(--w-accent);
	}

	.positron .arrow-head {
		fill: var(--w-accent-cold);
	}

	.wave {
		stroke: var(--w-text-body);
		stroke-width: 7.5;
		stroke-linecap: round;
		fill: none;
	}

	.vertex-dot {
		fill: var(--w-accent-err);
		stroke: #181613;
		stroke-width: 5;
	}

	.fd-lbl {
		font-family: var(--w-font-mono);
		font-size: 0.95rem;
		font-weight: 700;

		&.electron {
			color: var(--w-accent);
		}

		&.positron {
			color: var(--w-accent-cold);
		}

		&.photon {
			color: var(--w-text-body);
			font-style: italic;
		}
	}

	.feynman-caption {
		font-size: 0.96rem;
		line-height: 1.6;

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
