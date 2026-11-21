<script lang="ts">
	import type { Snippet } from 'svelte';
    import 'katex/dist/katex.min.css'

	type DiagramType = 'vertex' | 'scattering' | 'annihilation' | 'box' | 'loop';

	interface Props {
		/** Встроенный тип SVG-диаграммы */
		type?: DiagramType;
		/** Псевдографика, которая автоматически превратится в векторный SVG */
		ascii?: string;
		/** Заголовок карточки */
		title?: string;
		/** Бейдж с «налогом» */
		tax?: string;
		/** Запасной сниппет для ручного HTML/иконок */
		graphics?: Snippet;
		caption?: Snippet;
		children?: Snippet;
	}

	let { type = 'vertex', ascii, title, tax, graphics, caption, children }: Props = $props();

	const hasCaption = $derived(Boolean(caption || children));

	// Генератор волнистой линии фотона
	function buildPhotonPath(x1: number, y1: number, x2: number, y2: number, waves = 6): string {
		const dx = x2 - x1;
		const dy = y2 - y1;
		const len = Math.hypot(dx, dy);
		if (len === 0) return '';

		const ux = dx / len;
		const uy = dy / len;
		const nx = -uy;
		const ny = ux;
		const amp = 6.5;

		const steps = waves * 16;
		const parts = new Array<string>();
		for (let i = 0; i <= steps; i++) {
			const t = i / steps;
			const offset = Math.sin(t * waves * Math.PI * 2) * amp;
			const px = x1 + dx * t + nx * offset;
			const py = y1 + dy * t + ny * offset;
			parts.push(`${i === 0 ? 'M' : 'L'}${px.toFixed(1)},${py.toFixed(1)}`);
		}
		return parts.join(' ');
	}

	// Дуговой фотон для петли
	function buildArcPhotonPath(x: number, y1: number, y2: number, bulge = 46): string {
		const steps = 80;
		const waves = 6;
		const amp = 5;
		const parts = new Array<string>();
		for (let i = 0; i <= steps; i++) {
			const t = i / steps;
			const baseX = x + Math.sin(t * Math.PI) * bulge;
			const baseY = y1 + (y2 - y1) * t;
			const ripple = Math.sin(t * waves * Math.PI * 2) * amp * Math.sin(t * Math.PI);
			parts.push(`${i === 0 ? 'M' : 'L'}${(baseX + ripple).toFixed(1)},${baseY.toFixed(1)}`);
		}
		return parts.join(' ');
	}

	// --- Парсер псевдографики в векторные примитивы SVG ---
	interface AsciiItem {
		kind: 'line' | 'photon' | 'dot' | 'arrow-up' | 'arrow-down' | 'label';
		x1: number;
		y1: number;
		x2: number;
		y2: number;
		text?: string;
		colorClass?: string;
	}

	const parsedAscii = $derived.by(() => {
		if (!ascii) return null;
		const rawLines = ascii.replace(/^\n+|\n+$/g, '').split('\n');
		const rows = rawLines.length;
		const cols = Math.max(...rawLines.map((l) => l.length), 1);

		const cw = 22;
		const ch = 30;
		const pad = 20;
		const width = cols * cw + pad * 2;
		const height = rows * ch + pad * 2;

		const items = new Array<AsciiItem>();

		for (let r = 0; r < rows; r++) {
			const line = rawLines[r];
			for (let c = 0; c < line.length; c++) {
				const chVal = line[c];
				const cx = pad + c * cw + cw / 2;
				const cy = pad + r * ch + ch / 2;

				// Проверяем двухсимвольные метки e- и e+
				if (chVal === 'e' && (line[c + 1] === '-' || line[c + 1] === '+')) {
					const isPos = line[c + 1] === '+';
					items.push({
						kind: 'label',
						x1: cx + cw * 0.35,
						y1: cy + 4,
						x2: 0,
						y2: 0,
						text: isPos ? 'e⁺' : 'e⁻',
						colorClass: isPos ? 'lbl-p' : 'lbl-e'
					});
					c++;
					continue;
				}

				if (chVal === 'γ' || chVal === 'g') {
					items.push({
						kind: 'label',
						x1: cx,
						y1: cy + 4,
						x2: 0,
						y2: 0,
						text: 'γ',
						colorClass: 'lbl-g'
					});
				} else if (chVal === '/') {
					items.push({
						kind: 'line',
						x1: cx - cw / 2,
						y1: cy + ch / 2,
						x2: cx + cw / 2,
						y2: cy - ch / 2
					});
				} else if (chVal === '\\') {
					items.push({
						kind: 'line',
						x1: cx - cw / 2,
						y1: cy - ch / 2,
						x2: cx + cw / 2,
						y2: cy + ch / 2
					});
				} else if (chVal === '|') {
					items.push({
						kind: 'line',
						x1: cx,
						y1: cy - ch / 2,
						x2: cx,
						y2: cy + ch / 2
					});
				} else if (chVal === '-') {
					items.push({
						kind: 'line',
						x1: cx - cw / 2,
						y1: cy,
						x2: cx + cw / 2,
						y2: cy
					});
				} else if (chVal === '~') {
					items.push({
						kind: 'photon',
						x1: cx - cw / 2,
						y1: cy,
						x2: cx + cw / 2,
						y2: cy
					});
				} else if (chVal === '*') {
					items.push({
						kind: 'dot',
						x1: cx,
						y1: cy,
						x2: 0,
						y2: 0
					});
				} else if (chVal === '^') {
					items.push({
						kind: 'arrow-up',
						x1: cx,
						y1: cy,
						x2: 0,
						y2: 0
					});
				} else if (chVal === 'v') {
					items.push({
						kind: 'arrow-down',
						x1: cx,
						y1: cy,
						x2: 0,
						y2: 0
					});
				}
			}
		}

		return { width, height, items };
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
			{#if parsedAscii}
				<svg
					viewBox="0 0 {parsedAscii.width} {parsedAscii.height}"
					class="fd-svg fd-svg-ascii"
					role="img"
					aria-label={title ?? 'Пользовательская диаграмма Фейнмана'}
				>
					{#each parsedAscii.items as item}
						{#if item.kind === 'line'}
							<line x1={item.x1} y1={item.y1} x2={item.x2} y2={item.y2} class="line-e" />
						{:else if item.kind === 'photon'}
							<path d={buildPhotonPath(item.x1, item.y1, item.x2, item.y2, 2)} class="line-g" />
						{:else if item.kind === 'dot'}
							<circle cx={item.x1} cy={item.y1} r="5.5" class="vertex-dot" />
						{:else if item.kind === 'arrow-up'}
							<polygon
								points="{item.x1},{item.y1 - 7} {item.x1 - 5},{item.y1 + 5} {item.x1 + 5},{item.y1 + 5}"
								fill="#f59e0b"
							/>
						{:else if item.kind === 'arrow-down'}
							<polygon
								points="{item.x1},{item.y1 + 7} {item.x1 - 5},{item.y1 - 5} {item.x1 + 5},{item.y1 - 5}"
								fill="#38bdf8"
							/>
						{:else if item.kind === 'label'}
							<text x={item.x1} y={item.y1} class={item.colorClass} text-anchor="middle">{item.text}</text>
						{/if}
					{/each}
				</svg>
			{:else if graphics}
				<div class="fd-custom-graphics">{@render graphics()}</div>
			{:else}
				<svg viewBox="0 0 600 230" class="fd-svg" role="img" aria-label={title ?? 'Диаграмма Фейнмана'}>
					<defs>
						<marker id="arr-e" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
							<path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#f59e0b" />
						</marker>
						<marker id="arr-p" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
							<path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#38bdf8" />
						</marker>
					</defs>

					<text x="18" y="24" class="fd-time">Время t ↑</text>

					{#if type === 'vertex'}
						<!-- 1. Базовый узел ("Свадьба без невесты") -->
						<line x1="180" y1="205" x2="290" y2="115" class="line-e" />
						<line x1="180" y1="205" x2="235" y2="160" class="line-e" marker-end="url(#arr-e)" />
						<line x1="290" y1="115" x2="235" y2="70" class="line-e" marker-end="url(#arr-e)" />
						<line x1="235" y1="70" x2="180" y2="25" class="line-e" />

						<path d={buildPhotonPath(290, 115, 430, 50, 7)} class="line-g" />

						<text x="156" y="208" class="lbl-e">e⁻</text>
						<text x="156" y="32" class="lbl-e">e⁻</text>
						<text x="440" y="50" class="lbl-g">γ</text>
						<circle cx="290" cy="115" r="6" class="vertex-dot" />

					{:else if type === 'scattering'}
						<!-- 2. Отталкивание двух электронов -->
						<line x1="130" y1="205" x2="220" y2="128" class="line-e" />
						<line x1="130" y1="205" x2="175" y2="166" class="line-e" marker-end="url(#arr-e)" />
						<line x1="220" y1="128" x2="130" y2="25" class="line-e" />
						<line x1="220" y1="128" x2="175" y2="76" class="line-e" marker-end="url(#arr-e)" />

						<line x1="470" y1="205" x2="380" y2="102" class="line-e" />
						<line x1="470" y1="205" x2="425" y2="153" class="line-e" marker-end="url(#arr-e)" />
						<line x1="380" y1="102" x2="470" y2="25" class="line-e" />
						<line x1="380" y1="102" x2="425" y2="63" class="line-e" marker-end="url(#arr-e)" />

						<path d={buildPhotonPath(220, 128, 380, 102, 7)} class="line-g" />

						<text x="106" y="208" class="lbl-e">e⁻</text>
						<text x="482" y="208" class="lbl-e">e⁻</text>
						<text x="300" y="96" class="lbl-g" text-anchor="middle">γ</text>
						<circle cx="220" cy="128" r="6" class="vertex-dot" />
						<circle cx="380" cy="102" r="6" class="vertex-dot" />

					{:else if type === 'annihilation'}
						<!-- 3. Аннигиляция и рождение пары -->
						<line x1="170" y1="208" x2="300" y2="155" class="line-e" />
						<line x1="170" y1="208" x2="235" y2="181" class="line-e" marker-end="url(#arr-e)" />
						<line x1="430" y1="208" x2="300" y2="155" class="line-p" />
						<line x1="300" y1="155" x2="365" y2="181" class="line-p" marker-end="url(#arr-p)" />

						<path d={buildPhotonPath(300, 155, 300, 75, 5)} class="line-g" />

						<line x1="300" y1="75" x2="170" y2="22" class="line-e" />
						<line x1="300" y1="75" x2="235" y2="48" class="line-e" marker-end="url(#arr-e)" />
						<line x1="300" y1="75" x2="430" y2="22" class="line-p" />
						<line x1="430" y1="22" x2="365" y2="48" class="line-p" marker-end="url(#arr-p)" />

						<text x="146" y="210" class="lbl-e">e⁻</text>
						<text x="440" y="210" class="lbl-p">e⁺</text>
						<text x="318" y="120" class="lbl-g">γ</text>
						<circle cx="300" cy="155" r="6" class="vertex-dot" />
						<circle cx="300" cy="75" r="6" class="vertex-dot" />

					{:else if type === 'box'}
						<!-- 4. Рассеяние света на свете (квадрат из 4 вершин) -->
						<path d={buildPhotonPath(140, 208, 235, 160, 5)} class="line-g" />
						<path d={buildPhotonPath(460, 208, 365, 160, 5)} class="line-g" />
						<path d={buildPhotonPath(235, 70, 140, 22, 5)} class="line-g" />
						<path d={buildPhotonPath(365, 70, 460, 22, 5)} class="line-g" />

						<line x1="235" y1="160" x2="235" y2="70" class="line-e" />
						<line x1="235" y1="160" x2="235" y2="112" class="line-e" marker-end="url(#arr-e)" />
						<line x1="235" y1="70" x2="365" y2="70" class="line-e" />
						<line x1="235" y1="70" x2="304" y2="70" class="line-e" marker-end="url(#arr-e)" />
						<line x1="365" y1="70" x2="365" y2="160" class="line-p" />
						<line x1="365" y1="70" x2="365" y2="118" class="line-p" marker-end="url(#arr-p)" />
						<line x1="365" y1="160" x2="235" y2="160" class="line-p" />
						<line x1="365" y1="160" x2="296" y2="160" class="line-p" marker-end="url(#arr-p)" />

						<text x="120" y="210" class="lbl-g">γ</text>
						<text x="470" y="210" class="lbl-g">γ</text>
						<circle cx="235" cy="160" r="5.5" class="vertex-dot" />
						<circle cx="235" cy="70" r="5.5" class="vertex-dot" />
						<circle cx="365" cy="70" r="5.5" class="vertex-dot" />
						<circle cx="365" cy="160" r="5.5" class="vertex-dot" />

					{:else if type === 'loop'}
						<!-- 5. "Самовлюблённый электрон" (петля собственной энергии) -->
						<line x1="270" y1="212" x2="270" y2="18" class="line-e" />
						<line x1="270" y1="212" x2="270" y2="186" class="line-e" marker-end="url(#arr-e)" />
						<line x1="270" y1="162" x2="270" y2="112" class="line-e" marker-end="url(#arr-e)" />
						<line x1="270" y1="68" x2="270" y2="38" class="line-e" marker-end="url(#arr-e)" />

						<path d={buildArcPhotonPath(270, 162, 68, 65)} class="line-g" />

						<text x="245" y="210" class="lbl-e">e⁻</text>
						<text x="348" y="120" class="lbl-g">γ</text>
						<circle cx="270" cy="162" r="6" class="vertex-dot" />
						<circle cx="270" cy="68" r="6" class="vertex-dot" />
					{/if}
				</svg>
			{/if}
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
		display: flex;
		justify-content: center;
		align-items: center;
		width: 100%;
		background: #181613;
		border-radius: 8px;
		border: 1px solid #2e2a24;
		padding: 0.75rem;
		box-sizing: border-box;
	}

	.fd-svg {
		width: 100%;
		height: auto;
		display: block;

		&.fd-svg-ascii {
			max-height: 260px;
		}
	}

	.fd-custom-graphics {
		width: 100%;
		display: flex;
		justify-content: center;
		align-items: center;
		font-size: 1.5rem;
		color: #f59e0b;
	}

	.fd-time {
		fill: #786e5c;
		font-family: 'JetBrains Mono', monospace;
		font-size: 12px;
	}

	.line-e {
		stroke: #f59e0b;
		stroke-width: 2.5;
		stroke-linecap: round;
		fill: none;
	}

	.line-p {
		stroke: #38bdf8;
		stroke-width: 2.5;
		stroke-linecap: round;
		fill: none;
	}

	.line-g {
		stroke: #e2d8c3;
		stroke-width: 2.2;
		stroke-linecap: round;
		fill: none;
	}

	.vertex-dot {
		fill: #ef4444;
		stroke: #181613;
		stroke-width: 1.5;
	}

	.lbl-e {
		fill: #f59e0b;
		font-family: 'JetBrains Mono', monospace;
		font-size: 15px;
		font-weight: 700;
	}

	.lbl-p {
		fill: #38bdf8;
		font-family: 'JetBrains Mono', monospace;
		font-size: 15px;
		font-weight: 700;
	}

	.lbl-g {
		fill: #e2d8c3;
		font-family: 'JetBrains Mono', monospace;
		font-size: 15px;
		font-style: italic;
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
	}
	.feynman-caption {
		:global(.katex svg) {
			width: auto;
			height: inherit;
			display: inline;
	}
}</style>
