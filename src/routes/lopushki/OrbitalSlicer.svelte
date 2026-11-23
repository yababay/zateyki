<script lang="ts">
	import '#lib/styles/widget.scss'

	type OrbitalKind = '1s' | '2s' | '2p' | '3d-clover' | '3d-ring';

	interface Props {
		orbital?: OrbitalKind;
		autoplay?: boolean;
	}

	let { orbital = $bindable('2p'), autoplay = false }: Props = $props();

	const initialOrbital = orbital;

	let isPlaying = $state(false);
	let showNodal = $state(true);
	let phase = $state(0);

	$effect(() => {
		isPlaying = autoplay;
	});

	$effect(() => {
		if (!isPlaying) return;
		let frameId: number;
		let lastTime = performance.now();

		const tick = (now: number) => {
			const dt = (now - lastTime) / 1000;
			lastTime = now;
			phase = (phase + dt * 3.6) % (Math.PI * 2);
			frameId = requestAnimationFrame(tick);
		};

		frameId = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(frameId);
	});

	// Генерируем полярный контур r(theta) для лепестков и оболочек
	function buildPolarLobe(
		fn: (theta: number) => number,
		scale: number,
		tStart = 0,
		tEnd = Math.PI * 2
	): string {
		const steps = 180;
		const parts = new Array<string>();
		for (let i = 0; i <= steps; i++) {
			const t = tStart + (i / steps) * (tEnd - tStart);
			const r = Math.max(0, fn(t) * scale);
			const x = r * Math.sin(t); // угол t отсчитываем от вертикальной оси Z (вверх)
			const y = -r * Math.cos(t);
			parts.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`);
		}
		return `${parts.join(' ')} Z`;
	}

	// Угол конуса для d_z^2 ("спасательный круг"): cos^2(theta) = 1/3 => theta ≈ 54.735°
	const MAGIC_ANGLE = Math.acos(1 / Math.sqrt(3)); // ~0.9553 рад (54.7°)

	// Предвычисленные контуры лепестков (при максимальной амплитуде)
	const pathPTop = buildPolarLobe((t) => Math.cos(t), 132, -Math.PI / 2, Math.PI / 2);
	const pathPBot = buildPolarLobe((t) => -Math.cos(t), 132, Math.PI / 2, (3 * Math.PI) / 2);

	const pathClover1 = buildPolarLobe((t) => Math.sin(2 * t), 138, 0, Math.PI / 2);
	const pathClover2 = buildPolarLobe((t) => -Math.sin(2 * t), 138, Math.PI / 2, Math.PI);
	const pathClover3 = buildPolarLobe((t) => Math.sin(2 * t), 138, Math.PI, (3 * Math.PI) / 2);
	const pathClover4 = buildPolarLobe((t) => -Math.sin(2 * t), 138, (3 * Math.PI) / 2, Math.PI * 2);

	// Для d_z^2: |3 cos^2(t) - 1| / 2
	const pathRingTop = buildPolarLobe(
		(t) => (3 * Math.cos(t) * Math.cos(t) - 1) / 2,
		136,
		-MAGIC_ANGLE,
		MAGIC_ANGLE
	);
	const pathRingBot = buildPolarLobe(
		(t) => (3 * Math.cos(t) * Math.cos(t) - 1) / 2,
		136,
		Math.PI - MAGIC_ANGLE,
		Math.PI + MAGIC_ANGLE
	);
	// Правая и левая половинки экваториального «спасательного круга» в разрезе
	const pathRingRight = buildPolarLobe(
		(t) => (1 - 3 * Math.cos(t) * Math.cos(t)) / 2,
		155,
		MAGIC_ANGLE,
		Math.PI - MAGIC_ANGLE
	);
	const pathRingLeft = buildPolarLobe(
		(t) => (1 - 3 * Math.cos(t) * Math.cos(t)) / 2,
		155,
		Math.PI + MAGIC_ANGLE,
		Math.PI * 2 - MAGIC_ANGLE
	);

	interface ModeMeta {
		id: OrbitalKind;
		btn: string;
		title: string;
		desc: string;
	}

	const modes: Array<ModeMeta> = Array.of(
		{
			id: '1s',
			btn: '1s · Шар (0 петель)',
			title: 's-орбиталь (ноль петель тишины)',
			desc: 'Сплошной желейный шар без перетяжек. Максимальная плотность электронного поля находится прямо в центре — волна свободно проходит сквозь атомное ядро.'
		},
		{
			id: '2s',
			btn: '2s · Матрёшка',
			title: '2s-орбиталь (сферическая прослойка тишины)',
			desc: 'Вокруг плотного центрального ядрышка возникает сферическая зона тишины (пунктир), а снаружи её охватывает внешний пузырь в противофазе.'
		},
		{
			id: '2p',
			btn: '2p · Гантель (1 петля)',
			title: 'p-орбиталь (одна стягивающая петля по экватору)',
			desc: 'Нитка перетягивает шар ровно пополам, выдавливая две капли вверх и вниз. При запуске анимации гель перекачивается из одной капли в другую в противофазе.'
		},
		{
			id: '3d-clover',
			btn: '3d · Лопух (2 петли)',
			title: 'd-орбиталь (две петли крест-накрест)',
			desc: 'Две перпендикулярные стяжки пережимают шар на четыре лепестка-лопуха. Соседние лепестки всегда дышат в противофазе (янтарный и голубой).'
		},
		{
			id: '3d-ring',
			btn: '3d · Бублик (тропики)',
			title: 'd-орбиталь со «спасательным кругом» (две тропические петли)',
			desc: 'Две петли-удавки на северном и южном тропиках (угол 54,7°) вырезают конусы песочных часов и выдавливают лишнее желе по экватору в упругий бублик.'
		}
	);

	const currentMeta = $derived(modes.find((m) => m.id === orbital) ?? modes[0]);

	function resetState() {
		orbital = initialOrbital;
		isPlaying = autoplay;
		showNodal = true;
		phase = 0;
	}

    const pulse = $derived(isPlaying ? Math.cos(phase) : 1);
	const posScale = $derived(0.86 + 0.14 * pulse);
	const negScale = $derived(0.86 - 0.14 * pulse);
	const posOpacity = $derived(0.34 + 0.22 * pulse);
	const negOpacity = $derived(0.34 - 0.22 * pulse);
</script>
<figure class="z-widget" aria-label="Интерактивный конструктор атомных орбиталей">
	<div class="z-widget-toolbar">
		<div class="z-widget-group">
			{#each modes as m}
				<button
					type="button"
					class="z-widget-btn"
					class:active={orbital === m.id}
					onclick={() => (orbital = m.id)}
				>
					{m.btn}
				</button>
			{/each}
		</div>

		<div class="z-widget-group">
			<label class="z-widget-check">
				<input type="checkbox" bind:checked={showNodal} />
				<span>Петли тишины</span>
			</label>

			<button type="button" class="z-widget-btn play-btn" onclick={() => (isPlaying = !isPlaying)}>
				{isPlaying ? 'Пауза' : 'Пуск'}
			</button>
		</div>
	</div>

	<div class="z-widget-stage with-sidebar" role="application" ondblclick={resetState}>
		<svg viewBox="-175 -165 350 330" class="z-widget-svg os-svg">
			<defs>
				<radialGradient id="sCoreGrad" cx="50%" cy="50%" r="50%">
					<stop offset="0%" stop-color="#f59e0b" stop-opacity="0.85" />
					<stop offset="55%" stop-color="#f59e0b" stop-opacity="0.32" />
					<stop offset="100%" stop-color="#f59e0b" stop-opacity="0.02" />
				</radialGradient>
				<radialGradient id="sNegGrad" cx="50%" cy="50%" r="50%">
					<stop offset="0%" stop-color="#38bdf8" stop-opacity="0.85" />
					<stop offset="55%" stop-color="#38bdf8" stop-opacity="0.32" />
					<stop offset="100%" stop-color="#38bdf8" stop-opacity="0.02" />
				</radialGradient>
			</defs>

			<circle cx="0" cy="0" r="132" class="ghost-sphere" />

			{#if orbital === '1s'}
				<circle
					cx="0"
					cy="0"
					r={130 * posScale}
					fill={pulse >= 0 ? 'url(#sCoreGrad)' : 'url(#sNegGrad)'}
					stroke={pulse >= 0 ? '#f59e0b' : '#38bdf8'}
					stroke-width="2"
					stroke-opacity="0.65"
				/>

			{:else if orbital === '2s'}
				<circle
					cx="0"
					cy="0"
					r={136 * negScale}
					fill={pulse >= 0 ? '#38bdf8' : '#f59e0b'}
					fill-opacity="0.22"
					stroke={pulse >= 0 ? '#38bdf8' : '#f59e0b'}
					stroke-width="2"
				/>
				{#if showNodal}
					<circle cx="0" cy="0" r="68" class="nodal-line" />
				{/if}
				<circle
					cx="0"
					cy="0"
					r={56 * posScale}
					fill={pulse >= 0 ? 'url(#sCoreGrad)' : 'url(#sNegGrad)'}
					stroke={pulse >= 0 ? '#f59e0b' : '#38bdf8'}
					stroke-width="2"
				/>

			{:else if orbital === '2p'}
				<path
					d={pathPTop}
					fill="#f59e0b"
					fill-opacity={posOpacity}
					stroke="#f59e0b"
					stroke-width="2.4"
					transform="scale({posScale})"
				/>
				<path
					d={pathPBot}
					fill="#38bdf8"
					fill-opacity={negOpacity}
					stroke="#38bdf8"
					stroke-width="2.4"
					transform="scale({negScale})"
				/>
				{#if showNodal}
					<line x1="-155" y1="0" x2="155" y2="0" class="nodal-line" />
				{/if}

			{:else if orbital === '3d-clover'}
				<path
					d={pathClover1}
					fill="#f59e0b"
					fill-opacity={posOpacity}
					stroke="#f59e0b"
					stroke-width="2.2"
					transform="scale({posScale})"
				/>
				<path
					d={pathClover3}
					fill="#f59e0b"
					fill-opacity={posOpacity}
					stroke="#f59e0b"
					stroke-width="2.2"
					transform="scale({posScale})"
				/>
				<path
					d={pathClover2}
					fill="#38bdf8"
					fill-opacity={negOpacity}
					stroke="#38bdf8"
					stroke-width="2.2"
					transform="scale({negScale})"
				/>
				<path
					d={pathClover4}
					fill="#38bdf8"
					fill-opacity={negOpacity}
					stroke="#38bdf8"
					stroke-width="2.2"
					transform="scale({negScale})"
				/>
				{#if showNodal}
					<line x1="-155" y1="0" x2="155" y2="0" class="nodal-line" />
					<line x1="0" y1="-150" x2="0" y2="150" class="nodal-line" />
				{/if}

			{:else if orbital === '3d-ring'}
				<path
					d={pathRingTop}
					fill="#f59e0b"
					fill-opacity={posOpacity}
					stroke="#f59e0b"
					stroke-width="2.2"
					transform="scale({posScale})"
				/>
				<path
					d={pathRingBot}
					fill="#f59e0b"
					fill-opacity={posOpacity}
					stroke="#f59e0b"
					stroke-width="2.2"
					transform="scale({posScale})"
				/>
				<path
					d={pathRingRight}
					fill="#38bdf8"
					fill-opacity={negOpacity}
					stroke="#38bdf8"
					stroke-width="2.2"
					transform="scale({negScale})"
				/>
				<path
					d={pathRingLeft}
					fill="#38bdf8"
					fill-opacity={negOpacity}
					stroke="#38bdf8"
					stroke-width="2.2"
					transform="scale({negScale})"
				/>
				{#if showNodal}
					{@const cx = 155 * Math.sin(MAGIC_ANGLE)}
					{@const cy = 155 * Math.cos(MAGIC_ANGLE)}
					<line x1={-cx} y1={-cy} x2={cx} y2={cy} class="nodal-line" />
					<line x1={cx} y1={-cy} x2={-cx} y2={cy} class="nodal-line" />
				{/if}
			{/if}

			<circle cx="0" cy="0" r="5.5" class="nucleus" />
		</svg>

		<div class="os-info">
			<div class="os-info-title">{currentMeta.title}</div>
			<p class="os-info-desc">{currentMeta.desc}</p>
			<div class="os-legend">
				<span><i class="dot pos"></i> Фаза «+»</span>
				<span><i class="dot neg"></i> Фаза «−»</span>
				<span><i class="dash"></i> Петля тишины</span>
			</div>
		</div>
	</div>

	<figcaption class="z-widget-footer">
		Разрез объёмного желейного шара с «петлями тишины». Нажмите <b>«Пуск»</b>, чтобы увидеть, как электронный гель перекачивается между лепестками в противофазе (двойной щелчок сбрасывает вид).
	</figcaption>
</figure>

<style lang="scss">
	.os-svg {
		max-width: 310px;
	}

	.ghost-sphere {
		fill: none;
		stroke: var(--w-border-subtle);
		stroke-width: 1.2;
		stroke-dasharray: 3 3;
	}

	.nodal-line {
		fill: none;
		stroke: var(--w-text-body);
		stroke-width: 1.5;
		stroke-opacity: 0.65;
		stroke-dasharray: 5 4;
	}

	.nucleus {
		fill: var(--w-accent-err);
		stroke: #fff;
		stroke-width: 1.5;
	}

	.os-info {
		display: flex;
		flex-direction: column;
		gap: 0.55rem;
		padding: 0.65rem;
		border-radius: 6px;
		background: var(--w-bg-card);
		border: 1px solid #332f28;
	}

	.os-info-title {
		font-weight: 700;
		font-size: 0.88rem;
		color: var(--w-accent);
		line-height: 1.3;
	}

	.os-info-desc {
		margin: 0;
		font-size: 0.81rem;
		line-height: 1.48;
		color: var(--w-text-muted);
	}

	.os-legend {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		margin-top: 0.25rem;
		padding-top: 0.45rem;
		border-top: 1px solid #332f28;
		font-size: 0.75rem;
		color: var(--w-text-dim);

		span {
			display: flex;
			align-items: center;
			gap: 0.3rem;
		}

		.dot {
			width: 9px;
			height: 9px;
			border-radius: 50%;
			display: inline-block;

			&.pos {
				background: var(--w-accent);
			}

			&.neg {
				background: var(--w-accent-cold);
			}
		}

		.dash {
			width: 14px;
			height: 0;
			border-top: 2px dashed var(--w-text-body);
			display: inline-block;
		}
	}
</style>
