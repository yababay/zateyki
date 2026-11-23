<script lang="ts">
	import '#lib/styles/widget.scss';

	interface Props {
		slide?: number;
		cursor?: number;
		showReadout?: boolean;
	}

	let { slide = $bindable(1), cursor = $bindable(1), showReadout = true }: Props = $props();

	// Запоминаем стартовые значения для сброса по двойному клику
	const initialSlide = slide;
	const initialCursor = cursor;

	const W = 1200;
	const H = 290;
	const PAD_X = 65;
	const SCALE_W = W - PAD_X * 2;

	// Разрешаем движку ходить от 0.1 (сдвиг влево -1) до 10 (сдвиг вправо +1)
	const valToPosSlide = (v: number) => Math.log10(Math.max(0.1, Math.min(10, v)));
	const valToPosD = (v: number) => Math.log10(Math.max(1, Math.min(10, v)));
	const posToValD = (p: number) => Math.pow(10, Math.max(0, Math.min(1, p)));

	let slideOffset = $state(valToPosSlide(slide));
	let cursorPos = $state(valToPosD(cursor));

	$effect(() => {
		slideOffset = valToPosSlide(slide);
	});
	$effect(() => {
		cursorPos = valToPosD(cursor);
	});

	function resetState() {
		slide = initialSlide;
		cursor = initialCursor;
	}

	interface Tick {
		pos: number;
		len: number;
		label?: string;
		isMajor?: boolean;
	}

	function buildDecadeTicks(offset = 0, span = 1): Array<Tick> {
		const ticks = new Array<Tick>();
		const add = (val: number, len: number, label?: string, isMajor = false) => {
			const pos = offset + Math.log10(val) * span;
			ticks.push({ pos, len, label, isMajor });
		};

		for (let i = 1; i <= 10; i++) {
			add(i, 16, i === 10 ? '1' : String(i), true);
			if (i === 10) break;

			for (let j = 1; j < 10; j++) {
				const v = i + j * 0.1;
				const isHalf = j === 5;
				const subLabel = i === 1 ? String(j) : undefined;
				add(v, isHalf ? 12 : 9, subLabel);

				const step = i < 2 ? 0.02 : i < 4 ? 0.05 : 0.1;
				if (step < 0.1) {
					for (let k = step; k < 0.099; k += step) {
						add(v + k, 5);
					}
				}
			}
		}
		return ticks;
	}

	function buildSquareTicks(): Array<Tick> {
		const ticks = new Array<Tick>();
		for (let dec = 0; dec < 2; dec++) {
			const baseOffset = dec * 0.5;
			for (let i = 1; i <= 10; i++) {
				if (dec === 0 && i === 10) continue;
				const label = dec === 1 && i === 10 ? '100' : String(i * (dec === 1 ? 10 : 1));
				ticks.push({
					pos: baseOffset + Math.log10(i) * 0.5,
					len: 14,
					label: i === 1 || i === 2 || i === 5 || i === 10 ? label : String(i),
					isMajor: true
				});
				if (i === 10) break;
				for (let j = 1; j < 10; j++) {
					const v = i + j * 0.1;
					ticks.push({
						pos: baseOffset + Math.log10(v) * 0.5,
						len: j === 5 ? 10 : 6
					});
				}
			}
		}
		return ticks;
	}

	function buildCubeTicks(): Array<Tick> {
		const ticks = new Array<Tick>();
		for (let dec = 0; dec < 3; dec++) {
			const baseOffset = dec / 3;
			for (let i = 1; i <= 10; i++) {
				if (dec < 2 && i === 10) continue;
				const mult = Math.pow(10, dec);
				const label =
					i === 1 || i === 2 || i === 5 || (dec === 2 && i === 10) ? String(i * mult) : String(i);
				ticks.push({
					pos: baseOffset + Math.log10(i) / 3,
					len: 14,
					label,
					isMajor: true
				});
				if (i === 10) break;
				const subStep = i < 3 ? 0.2 : 0.5;
				for (let j = subStep; j < 0.99; j += subStep) {
					ticks.push({
						pos: baseOffset + Math.log10(i + j) / 3,
						len: 7
					});
				}
			}
		}
		return ticks;
	}

	function buildLL3Ticks(): Array<Tick> {
		const points = Array.of(
			2.72, 3, 3.5, 4, 4.5, 5, 6, 7, 8, 9, 10, 12, 15, 20, 25, 30, 40, 50, 70, 100, 150, 200, 300,
			500, 1000, 2000, 5000, 10000, 20000
		);
		const labeled = new Set(Array.of(3, 4, 5, 6, 8, 10, 15, 20, 30, 50, 100, 200, 500, 1000, 5000, 20000));
		return points.map((v) => ({
			pos: Math.log10(Math.log(v)),
			len: labeled.has(v) ? 14 : 8,
			label: labeled.has(v) ? (v >= 1000 ? `${v / 1000}k` : String(v)) : undefined,
			isMajor: labeled.has(v)
		}));
	}

	const ticksK = buildCubeTicks();
	const ticksA = buildSquareTicks();
	const ticksD = buildDecadeTicks();
	const ticksLL3 = buildLL3Ticks();

	let svgEl: SVGSVGElement | undefined = $state();
	let dragging: 'slide' | 'cursor' | null = $state(null);
	let dragStartX = 0;
	let initialOffset = 0;

	function clientToSvgDelta(clientX: number): number {
		if (!svgEl) return 0;
		const rect = svgEl.getBoundingClientRect();
		const svgDeltaX = ((clientX - dragStartX) / rect.width) * W;
		return svgDeltaX / SCALE_W;
	}

	function onPointerDown(target: 'slide' | 'cursor', e: PointerEvent) {
		e.stopPropagation();
		(e.currentTarget as Element).setPointerCapture(e.pointerId);
		dragging = target;
		dragStartX = e.clientX;
		initialOffset = target === 'slide' ? slideOffset : cursorPos;
	}

	function onPointerMove(e: PointerEvent) {
		if (!dragging) return;
		e.stopPropagation();
		const delta = clientToSvgDelta(e.clientX);
		if (dragging === 'slide') {
			slideOffset = Math.max(-0.95, Math.min(0.95, initialOffset + delta));
			slide = Number(Math.pow(10, slideOffset).toFixed(3));
		} else {
			cursorPos = Math.max(0, Math.min(1, initialOffset + delta));
			cursor = Number(posToValD(cursorPos).toFixed(3));
		}
	}

	function onPointerUp(e: PointerEvent) {
		if (!dragging) return;
		e.stopPropagation();
		dragging = null;
	}

	function onSliderKeyDown(target: 'slide' | 'cursor', e: KeyboardEvent) {
		const current = target === 'slide' ? slideOffset : cursorPos;
		const min = target === 'slide' ? -0.95 : 0;
		const max = target === 'slide' ? 0.95 : 1;
		const step = e.shiftKey ? 0.1 : 0.01;
		let next = current;

		if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') next -= step;
		else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') next += step;
		else if (e.key === 'Home') next = min;
		else if (e.key === 'End') next = max;
		else return;

		e.preventDefault();
		next = Math.max(min, Math.min(max, next));
		if (target === 'slide') {
			slideOffset = next;
			slide = Number(Math.pow(10, next).toFixed(3));
		} else {
			cursorPos = next;
			cursor = Number(posToValD(next).toFixed(3));
		}
	}

	const readD = $derived(posToValD(cursorPos));
	const readK = $derived(Math.pow(10, cursorPos * 3));
	const readA = $derived(Math.pow(10, cursorPos * 2));
	const readLL3 = $derived(Math.exp(readD));

	const posOnSlide = $derived(cursorPos - slideOffset);
	const readC = $derived(
		posOnSlide >= -0.001 && posOnSlide <= 1.001
			? Math.pow(10, ((posOnSlide % 1) + 1) % 1)
			: null
	);

	function applyPreset(s: number, c: number) {
		slide = s;
		cursor = c;
	}
</script>
<figure class="z-widget sr-wrapper" aria-label="Интерактивная логарифмическая линейка">
	<div class="z-widget-toolbar sr-toolbar">
		<span class="sr-hint">Тяните <b>движок</b> или стеклянный <b>визир</b> мышкой / пальцем</span>
		<div class="z-widget-group sr-presets">
			<button type="button" class="z-widget-btn" onclick={() => applyPreset(1, 3.4)}>Пик Планка (3.4³)</button>
			<button type="button" class="z-widget-btn" onclick={() => applyPreset(1.474, 3.4)}>1.474 × 3.4</button>
			<button type="button" class="z-widget-btn" onclick={() => applyPreset(1, 2.81)}>e^2.81 ≈ 16.6</button>
			<button type="button" class="z-widget-btn" onclick={() => applyPreset(1, 4.55)}>e^4.55 ≈ 94.6</button>
		</div>
	</div>

	<svg
		bind:this={svgEl}
		viewBox="0 0 {W} {H}"
		class="z-widget-svg sr-svg"
		role="application"
		aria-label="Шкалы логарифмической линейки. Двойной щелчок сбрасывает положение."
		ondblclick={resetState}
		onpointermove={onPointerMove}
		onpointerup={onPointerUp}
		onpointercancel={onPointerUp}
	>
		<defs>
			<linearGradient id="bodyGrad" x1="0" y1="0" x2="0" y2="1">
				<stop offset="0%" stop-color="#f7f3e8" />
				<stop offset="50%" stop-color="#efe8d5" />
				<stop offset="100%" stop-color="#e3d9c1" />
			</linearGradient>
			<linearGradient id="slideGrad" x1="0" y1="0" x2="0" y2="1">
				<stop offset="0%" stop-color="#fffdf7" />
				<stop offset="100%" stop-color="#f3ecda" />
			</linearGradient>
			<filter id="shadow" x="-5%" y="-5%" width="110%" height="115%">
				<feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-opacity="0.22" />
			</filter>
		</defs>

		<!-- ВЕРХНИЙ СТАТОР (K и A) -->
		<rect x="10" y="15" width={W - 20} height="86" rx="6" fill="url(#bodyGrad)" stroke="#b8ad94" stroke-width="1.5" />

		<text x="26" y="42" class="scale-name">K</text>
		<text x={W - 38} y="42" class="scale-desc">x³</text>
		<line x1={PAD_X} y1="52" x2={PAD_X + SCALE_W} y2="52" class="baseline" />
		{#each ticksK as t}
			{@const x = PAD_X + t.pos * SCALE_W}
			<line x1={x} y1={52 - t.len} x2={x} y2="52" class="tick" class:major={t.isMajor} />
			{#if t.label}
				<text {x} y="34" class="tick-label">{t.label}</text>
			{/if}
		{/each}

		<text x="26" y="92" class="scale-name">A</text>
		<text x={W - 38} y="92" class="scale-desc">x²</text>
		<line x1={PAD_X} y1="100" x2={PAD_X + SCALE_W} y2="100" class="baseline" />
		{#each ticksA as t}
			{@const x = PAD_X + t.pos * SCALE_W}
			<line x1={x} y1={100 - t.len} x2={x} y2="100" class="tick" class:major={t.isMajor} />
			{#if t.label}
				<text {x} y="82" class="tick-label">{t.label}</text>
			{/if}
		{/each}

		<!-- ПОДВИЖНЫЙ ДВИЖОК (B и C) -->
		<g
			transform="translate({slideOffset * SCALE_W}, 0)"
			class="draggable"
			role="slider"
			tabindex="0"
			aria-label="Сдвиг подвижных шкал B и C"
			aria-valuemin="-0.95"
			aria-valuemax="0.95"
			aria-valuenow={slideOffset}
			aria-valuetext={`Сдвиг ${slide.toFixed(3)}`}
			onpointerdown={(e) => onPointerDown('slide', e)}
			onkeydown={(e) => onSliderKeyDown('slide', e)}
		>
			<rect x="10" y="102" width={W - 20} height="86" rx="3" fill="url(#slideGrad)" stroke="#9e9278" stroke-width="1.5" />

			<text x="26" y="128" class="scale-name">B</text>
			<line x1={PAD_X} y1="103" x2={PAD_X + SCALE_W} y2="103" class="baseline" />
			{#each ticksA as t}
				{@const x = PAD_X + t.pos * SCALE_W}
				<line x1={x} y1="103" x2={x} y2={103 + t.len} class="tick" class:major={t.isMajor} />
				{#if t.label}
					<text {x} y="130" class="tick-label">{t.label}</text>
				{/if}
			{/each}

			<text x="26" y="178" class="scale-name">C</text>
			<line x1={PAD_X} y1="187" x2={PAD_X + SCALE_W} y2="187" class="baseline" />
			{#each ticksD as t}
				{@const x = PAD_X + t.pos * SCALE_W}
				<line x1={x} y1={187 - t.len} x2={x} y2="187" class="tick" class:major={t.isMajor} />
				{#if t.label}
					<text {x} y="168" class="tick-label">{t.label}</text>
				{/if}
			{/each}
		</g>

		<!-- НИЖНИЙ СТАТОР (D и LL3) -->
		<rect x="10" y="189" width={W - 20} height="86" rx="6" fill="url(#bodyGrad)" stroke="#b8ad94" stroke-width="1.5" />

		<text x="26" y="215" class="scale-name">D</text>
		<text x={W - 38} y="215" class="scale-desc">x</text>
		<line x1={PAD_X} y1="190" x2={PAD_X + SCALE_W} y2="190" class="baseline" />
		{#each ticksD as t}
			{@const x = PAD_X + t.pos * SCALE_W}
			<line x1={x} y1="190" x2={x} y2={190 + t.len} class="tick" class:major={t.isMajor} />
			{#if t.label}
				<text {x} y="218" class="tick-label">{t.label}</text>
			{/if}
		{/each}

		<text x="22" y="266" class="scale-name">LL3</text>
		<text x={W - 38} y="266" class="scale-desc">eˣ</text>
		<line x1={PAD_X} y1="242" x2={PAD_X + SCALE_W} y2="242" class="baseline" />
		{#each ticksLL3 as t}
			{@const x = PAD_X + t.pos * SCALE_W}
			<line x1={x} y1="242" x2={x} y2={242 + t.len} class="tick" class:major={t.isMajor} />
			{#if t.label}
				<text {x} y="268" class="tick-label">{t.label}</text>
			{/if}
		{/each}

		<!-- СТЕКЛЯННЫЙ ВИЗИР (БЕГУНОК) -->
		<g
			transform="translate({PAD_X + cursorPos * SCALE_W}, 0)"
			class="draggable cursor-group"
			role="slider"
			tabindex="0"
			aria-label="Положение стеклянного визира"
			aria-valuemin="1"
			aria-valuemax="10"
			aria-valuenow={cursor}
			aria-valuetext={cursor.toFixed(3)}
			onpointerdown={(e) => onPointerDown('cursor', e)}
			onkeydown={(e) => onSliderKeyDown('cursor', e)}
		>
			<rect x="-44" y="6" width="88" height="12" rx="3" fill="#4a5568" filter="url(#shadow)" />
			<rect x="-44" y={H - 18} width="88" height="12" rx="3" fill="#4a5568" filter="url(#shadow)" />
			<rect
				x="-42"
				y="18"
				width="84"
				height={H - 36}
				fill="rgba(186, 230, 253, 0.22)"
				stroke="rgba(56, 189, 248, 0.65)"
				stroke-width="1.5"
			/>
			<line x1="0" y1="16" x2="0" y2={H - 16} stroke="#dc2626" stroke-width="1.6" />
		</g>
	</svg>

	{#if showReadout}
		<figcaption class="z-widget-footer mono sr-readout">
			<span>Под визиром:</span>
			<span><b>D (x):</b> {readD.toFixed(3)}</span>
			<span><b>C:</b> {readC !== null ? readC.toFixed(3) : '—'}</span>
			<span><b>K (x³):</b> {readK.toFixed(2)}</span>
			<span><b>LL3 (eˣ):</b> {readLL3 > 1000 ? readLL3.toExponential(2) : readLL3.toFixed(2)}</span>
		</figcaption>
	{/if}
</figure>

<style lang="scss">
	.sr-wrapper {
		padding: 0.75rem;
		touch-action: pan-y;
	}

	.sr-toolbar {
		gap: 0.5rem;
		margin-bottom: 0.6rem;
		font-size: 0.85rem;
	}

	.sr-hint {
		color: var(--w-text-muted);
	}

	.sr-presets {
		gap: 0.35rem;
	}

	.sr-svg {
		overflow: hidden;
		border-radius: 6px;
	}

	.draggable {
		cursor: grab;

		&:active {
			cursor: grabbing;
		}
	}

	.baseline {
		stroke: #2c2821;
		stroke-width: 1.1;
	}

	.tick {
		stroke: #2c2821;
		stroke-width: 0.9;

		&.major {
			stroke-width: 1.35;
		}
	}

	.tick-label {
		fill: #1f1c16;
		font-family: 'JetBrains Mono', 'Fira Code', monospace;
		font-size: 11px;
		text-anchor: middle;
	}

	.scale-name {
		fill: #8b261d;
		font-family: sans-serif;
		font-size: 13px;
		font-weight: 700;
	}

	.scale-desc {
		fill: #5c5343;
		font-family: serif;
		font-style: italic;
		font-size: 13px;
	}

	.sr-readout {
		gap: 1rem;
		font-size: 0.82rem;
	}
</style>

