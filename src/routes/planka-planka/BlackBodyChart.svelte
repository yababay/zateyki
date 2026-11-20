<script lang="ts">
	interface Props {
		temperature?: number;
		showCatastrophe?: boolean;
		showWien?: boolean;
	}

	let {
		temperature = $bindable(5800),
		showCatastrophe = $bindable(true),
		showWien = $bindable(true)
	}: Props = $props();

	const initialTemp = temperature;
	const initialCatastrophe = showCatastrophe;
	const initialWien = showWien;

	// Физические константы (СИ)
	const h = 6.62607015e-34;
	const c = 2.99792458e8;
	const k = 1.380649e-23;

	// Геометрия графика
	const W = 900;
	const H = 400;
	const PAD_L = 68;
	const PAD_R = 28;
	const PAD_T = 28;
	const PAD_B = 52;
	const PLOT_W = W - PAD_L - PAD_R;
	const PLOT_H = H - PAD_T - PAD_B;

	// Диапазон частот: 0 .. 1600 ТГц
	const MAX_FREQ_THZ = 1600;
	const MAX_Y = 4.2e-8;

	// 1. Формула Планка B(nu, T)
	function planck(freqThz: number, T: number): number {
		if (freqThz <= 0) return 0;
		const nu = freqThz * 1e12;
		const x = (h * nu) / (k * T);
		if (x > 500) return 0;
		return ((2 * h * Math.pow(nu, 3)) / (c * c)) * (1 / (Math.exp(x) - 1));
	}

	// 2. Классический закон Рэлея — Джинса (работает слева, взрывается справа)
	function rayleighJeans(freqThz: number, T: number): number {
		if (freqThz <= 0) return 0;
		const nu = freqThz * 1e12;
		return (2 * Math.pow(nu, 2) * k * T) / (c * c);
	}

	// 3. Приближение Вина (работает справа, занижает слева и на пике)
	function wien(freqThz: number, T: number): number {
		if (freqThz <= 0) return 0;
		const nu = freqThz * 1e12;
		const x = (h * nu) / (k * T);
		if (x > 500) return 0;
		return ((2 * h * Math.pow(nu, 3)) / (c * c)) * Math.exp(-x);
	}

	const freqToX = (f: number) => PAD_L + (f / MAX_FREQ_THZ) * PLOT_W;
	const valToY = (v: number) => PAD_T + PLOT_H - (Math.min(v, MAX_Y * 1.15) / MAX_Y) * PLOT_H;

	// Кривая Планка
	const planckPath = $derived.by(() => {
		const steps = 160;
		const parts = new Array<string>();
		for (let i = 0; i <= steps; i++) {
			const f = (i / steps) * MAX_FREQ_THZ;
			const x = freqToX(f).toFixed(1);
			const y = valToY(planck(f, temperature)).toFixed(1);
			parts.push(`${i === 0 ? 'M' : 'L'}${x},${y}`);
		}
		return parts.join(' ');
	});

	const planckAreaPath = $derived(
		`${planckPath} L${freqToX(MAX_FREQ_THZ).toFixed(1)},${(PAD_T + PLOT_H).toFixed(1)} L${PAD_L},${(PAD_T + PLOT_H).toFixed(1)} Z`
	);

	// Кривая Рэлея — Джинса
	const rjPath = $derived.by(() => {
		const steps = 120;
		const parts = new Array<string>();
		for (let i = 0; i <= steps; i++) {
			const f = (i / steps) * MAX_FREQ_THZ;
			const val = rayleighJeans(f, temperature);
			if (val > MAX_Y * 1.18) break;
			const x = freqToX(f).toFixed(1);
			const y = valToY(val).toFixed(1);
			parts.push(`${i === 0 ? 'M' : 'L'}${x},${y}`);
		}
		return parts.join(' ');
	});

	// Кривая Вина
	const wienPath = $derived.by(() => {
		const steps = 160;
		const parts = new Array<string>();
		for (let i = 0; i <= steps; i++) {
			const f = (i / steps) * MAX_FREQ_THZ;
			const x = freqToX(f).toFixed(1);
			const y = valToY(wien(f, temperature)).toFixed(1);
			parts.push(`${i === 0 ? 'M' : 'L'}${x},${y}`);
		}
		return parts.join(' ');
	});

	const peakFreqThz = $derived((58.789e9 * temperature) / 1e12);
	const peakVal = $derived(planck(peakFreqThz, temperature));

	let hoverFreq: number | null = $state(null);
	let svgEl: SVGSVGElement | undefined = $state();

	function handlePointerMove(e: PointerEvent) {
		if (!svgEl) return;
		const rect = svgEl.getBoundingClientRect();
		const svgX = ((e.clientX - rect.left) / rect.width) * W;
		const f = ((svgX - PAD_L) / PLOT_W) * MAX_FREQ_THZ;
		if (f >= 0 && f <= MAX_FREQ_THZ) {
			hoverFreq = f;
		} else {
			hoverFreq = null;
		}
	}

	function resetState() {
		temperature = initialTemp;
		showCatastrophe = initialCatastrophe;
		showWien = initialWien;
		hoverFreq = null;
	}

	function getBandLabel(fThz: number): string {
		if (fThz < 400) return 'Инфракрасное тепло';
		if (fThz < 480) return 'Видимый: красный';
		if (fThz < 510) return 'Видимый: оранжевый';
		if (fThz < 530) return 'Видимый: жёлтый';
		if (fThz < 600) return 'Видимый: зелёный';
		if (fThz < 670) return 'Видимый: голубой / синий';
		if (fThz <= 790) return 'Видимый: фиолетовый';
		return 'Ультрафиолет';
	}

	const xTicks = Array.of(0, 200, 400, 600, 800, 1000, 1200, 1400, 1600);
	const yTicks = Array.of(0, 1e-8, 2e-8, 3e-8, 4e-8);
</script>

<figure class="bb-wrapper" aria-label="Интерактивный график излучения абсолютно чёрного тела">
	<div class="bb-controls">
		<div class="bb-slider-group">
			<label for="bb-temp">
				Температура печи: <b>{temperature} K</b>
				<span class="bb-celsius">({temperature - 273} °C)</span>
			</label>
			<input id="bb-temp" type="range" min="2500" max="7000" step="50" bind:value={temperature} />
		</div>

		<div class="bb-presets">
			<button type="button" onclick={() => (temperature = 2800)}>Лампа (2800 K)</button>
			<button type="button" onclick={() => (temperature = 4500)}>Печь (4500 K)</button>
			<button type="button" onclick={() => (temperature = 5800)}>Солнце (5800 K)</button>
			<button type="button" onclick={() => (temperature = 6800)}>Горячая звезда (6800 K)</button>
		</div>

		<div class="bb-toggles">
			<label class="bb-checkbox wien">
				<input type="checkbox" bind:checked={showWien} />
				<span>Закон Вина (занижает слева)</span>
			</label>

			<label class="bb-checkbox rj">
				<input type="checkbox" bind:checked={showCatastrophe} />
				<span>Рэлей — Джинс (взрывается справа)</span>
			</label>
		</div>
	</div>

	<svg
		bind:this={svgEl}
		viewBox="0 0 {W} {H}"
		class="bb-svg"
		role="application"
		aria-label="Спектр абсолютно чёрного тела. Двойной щелчок сбрасывает параметры."
		ondblclick={resetState}
		onpointermove={handlePointerMove}
		onpointerleave={() => (hoverFreq = null)}
	>
		<defs>
			<linearGradient id="visibleSpectrum" x1="0" y1="0" x2="1" y2="0">
				<stop offset="0%" stop-color="#ef4444" stop-opacity="0.32" />
				<stop offset="22%" stop-color="#f97316" stop-opacity="0.32" />
				<stop offset="35%" stop-color="#eab308" stop-opacity="0.32" />
				<stop offset="52%" stop-color="#22c55e" stop-opacity="0.32" />
				<stop offset="75%" stop-color="#3b82f6" stop-opacity="0.32" />
				<stop offset="100%" stop-color="#a855f7" stop-opacity="0.32" />
			</linearGradient>

			<linearGradient id="planckFill" x1="0" y1="0" x2="0" y2="1">
				<stop offset="0%" stop-color="#f59e0b" stop-opacity="0.42" />
				<stop offset="100%" stop-color="#f59e0b" stop-opacity="0.03" />
			</linearGradient>

			<clipPath id="plotClip">
				<rect x={PAD_L} y={PAD_T} width={PLOT_W} height={PLOT_H} />
			</clipPath>
		</defs>

		<rect x={PAD_L} y={PAD_T} width={PLOT_W} height={PLOT_H} fill="#181613" rx="4" />

		<rect
			x={freqToX(400)}
			y={PAD_T}
			width={freqToX(790) - freqToX(400)}
			height={PLOT_H}
			fill="url(#visibleSpectrum)"
		/>
		<text x={freqToX(595)} y={PAD_T + 18} class="band-title">Видимый свет</text>
		<text x={freqToX(200)} y={PAD_T + 18} class="band-sub">ИК-область</text>
		<text x={freqToX(1180)} y={PAD_T + 18} class="band-sub">Ультрафиолет</text>

		{#each yTicks as yt}
			{@const y = valToY(yt)}
			<line x1={PAD_L} y1={y} x2={PAD_L + PLOT_W} y2={y} class="grid-line" />
			<text x={PAD_L - 8} y={y + 4} class="axis-label y-label">
				{yt === 0 ? '0' : (yt * 1e8).toFixed(0)}
			</text>
		{/each}

		{#each xTicks as xt}
			{@const x = freqToX(xt)}
			<line x1={x} y1={PAD_T} x2={x} y2={PAD_T + PLOT_H} class="grid-line" />
			<text {x} y={PAD_T + PLOT_H + 18} class="axis-label x-label">{xt}</text>
		{/each}

		<g clip-path="url(#plotClip)">
			<!-- Кривая Планка -->
			<path d={planckAreaPath} fill="url(#planckFill)" />
			<path d={planckPath} fill="none" stroke="#f59e0b" stroke-width="3" />

			<!-- Кривая Вина -->
			{#if showWien}
				<path d={wienPath} fill="none" stroke="#38bdf8" stroke-width="2.2" stroke-dasharray="5 4" />
			{/if}

			<!-- Кривая Рэлея — Джинса -->
			{#if showCatastrophe}
				<path d={rjPath} fill="none" stroke="#ef4444" stroke-width="2.2" stroke-dasharray="7 5" />
			{/if}

			{#if peakFreqThz <= MAX_FREQ_THZ && peakVal <= MAX_Y * 1.1}
				<circle cx={freqToX(peakFreqThz)} cy={valToY(peakVal)} r="4.5" fill="#fbbf24" stroke="#181613" stroke-width="1.5" />
			{/if}

			{#if hoverFreq !== null}
				{@const hx = freqToX(hoverFreq)}
				{@const hVal = planck(hoverFreq, temperature)}
				<line x1={hx} y1={PAD_T} x2={hx} y2={PAD_T + PLOT_H} stroke="#e2d8c3" stroke-width="1" stroke-dasharray="3 3" />
				{#if hVal <= MAX_Y * 1.1}
					<circle cx={hx} cy={valToY(hVal)} r="5" fill="#fff" stroke="#f59e0b" stroke-width="2" />
				{/if}
			{/if}
		</g>

		<rect x={PAD_L} y={PAD_T} width={PLOT_W} height={PLOT_H} fill="none" stroke="#5c5343" stroke-width="1.2" />
		<text x={PAD_L + PLOT_W / 2} y={H - 10} class="axis-title">Частота излучения ν, ТГц (10¹² Гц)</text>
		<text
			x="18"
			y={PAD_T + PLOT_H / 2}
			class="axis-title"
			transform="rotate(-90, 18, {PAD_T + PLOT_H / 2})"
		>
			Яркость B(ν, T), ×10⁻⁸ Вт/(м²·Гц·ср)
		</text>
	</svg>

	<figcaption class="bb-footer">
		{#if hoverFreq !== null && hoverFreq > 0}
			<span><b>ν:</b> {hoverFreq.toFixed(0)} ТГц ({getBandLabel(hoverFreq)})</span>
			<span><b>Планк:</b> {planck(hoverFreq, temperature).toExponential(2)}</span>
			{#if showWien}
				<span style="color:#7dd3fc"><b>Вин:</b> {wien(hoverFreq, temperature).toExponential(2)}</span>
			{/if}
			{#if showCatastrophe}
				<span style="color:#fca5a5"><b>Рэлей:</b> {rayleighJeans(hoverFreq, temperature).toExponential(2)}</span>
			{/if}
		{:else}
			<span>Пик «горба» при <b>{temperature} K</b>: <b>{peakFreqThz.toFixed(0)} ТГц</b> ({getBandLabel(peakFreqThz)}). Наведите на график или дважды щёлкните для сброса.</span>
		{/if}
	</figcaption>
</figure>

<style lang="scss">
	.bb-wrapper {
		margin: 1.75rem 0;
		padding: 0.85rem;
		border-radius: 10px;
		background: #23211d;
		color: #f3efe6;
		user-select: none;
	}

	.bb-controls {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 0.75rem;
		font-size: 0.85rem;
	}

	.bb-slider-group {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		min-width: 210px;

		b {
			color: #f59e0b;
		}

		.bb-celsius {
			color: #a89f8d;
			font-size: 0.8rem;
		}

		input[type='range'] {
			accent-color: #f59e0b;
			cursor: pointer;
		}
	}

	.bb-presets {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;

		button {
			padding: 0.28rem 0.55rem;
			border: 1px solid #5c5343;
			border-radius: 5px;
			background: #332f28;
			color: #f3efe6;
			font-size: 0.78rem;
			cursor: pointer;
			transition: background 0.15s;

			&:hover {
				background: #4b4439;
			}
		}
	}

	.bb-toggles {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
	}

	.bb-checkbox {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		font-size: 0.8rem;
		cursor: pointer;

		&.wien {
			color: #7dd3fc;
			input {
				accent-color: #38bdf8;
			}
		}

		&.rj {
			color: #fca5a5;
			input {
				accent-color: #ef4444;
			}
		}
	}

	.bb-svg {
		display: block;
		width: 100%;
		height: auto;
		border-radius: 6px;
		cursor: crosshair;
	}

	.grid-line {
		stroke: #2e2a24;
		stroke-width: 1;
	}

	.axis-label {
		fill: #a89f8d;
		font-family: 'JetBrains Mono', monospace;
		font-size: 11px;
	}

	.y-label {
		text-anchor: end;
	}

	.x-label {
		text-anchor: middle;
	}

	.axis-title {
		fill: #cbbba0;
		font-family: sans-serif;
		font-size: 12px;
		text-anchor: middle;
	}

	.band-title {
		fill: #f3efe6;
		font-family: sans-serif;
		font-size: 11px;
		font-weight: 600;
		text-anchor: middle;
	}

	.band-sub {
		fill: #8c8270;
		font-family: sans-serif;
		font-size: 11px;
		text-anchor: middle;
	}

	.bb-footer {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		margin-top: 0.6rem;
		padding-top: 0.5rem;
		border-top: 1px solid #3a352d;
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.8rem;
		color: #e2d8c3;

		b {
			color: #f59e0b;
		}
	}
</style>
