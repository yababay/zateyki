<script lang="ts">
	type OrbitalKind = '1s' | '2s' | '2p' | '3d-clover' | '3d-ring';

	interface Props {
		orbital?: OrbitalKind;
		autoplay?: boolean;
	}

	let { orbital = $bindable('2p'), autoplay = false }: Props = $props();

	const initialOrbital = orbital;

	let isPlaying = $state(autoplay);
	let showNodal = $state(true);
	let phase = $state(0);

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

<figure class="os-wrapper" aria-label="Интерактивный конструктор атомных орбиталей">
	<div class="os-toolbar">
		<div class="os-tabs">
			{#each modes as m}
				<button type="button" class:active={orbital === m.id} onclick={() => (orbital = m.id)}>
					{m.btn}
				</button>
			{/each}
		</div>

		<div class="os-actions">
			<label class="os-check">
				<input type="checkbox" bind:checked={showNodal} />
				<span>Петли тишины</span>
			</label>

			<button type="button" class="os-play" onclick={() => (isPlaying = !isPlaying)}>
				{isPlaying ? 'Пауза' : 'Пуск'}
			</button>
		</div>
	</div>

	<div class="os-stage" role="application" ondblclick={resetState}>
		<!-- {@const pulse = isPlaying ? Math.cos(phase) : 1}
		{@const posScale = 0.86 + 0.14 * pulse}
		{@const negScale = 0.86 - 0.14 * pulse}
		{@const posOpacity = 0.34 + 0.22 * pulse}
		{@const negOpacity = 0.34 - 0.22 * pulse} -->

		<svg viewBox="-175 -165 350 330" class="os-svg">
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

			<!-- Исходный контур неперетянутого шара (для ориентира) -->
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
				<!-- Внешний пузырь -->
				<circle
					cx="0"
					cy="0"
					r={136 * negScale}
					fill={pulse >= 0 ? '#38bdf8' : '#f59e0b'}
					fill-opacity="0.22"
					stroke={pulse >= 0 ? '#38bdf8' : '#f59e0b'}
					stroke-width="2"
				/>
				<!-- Сферическая прослойка тишины -->
				{#if showNodal}
					<circle cx="0" cy="0" r="68" class="nodal-line" />
				{/if}
				<!-- Внутреннее плотное ядро шара -->
				<circle
					cx="0"
					cy="0"
					r={56 * posScale}
					fill={pulse >= 0 ? 'url(#sCoreGrad)' : 'url(#sNegGrad)'}
					stroke={pulse >= 0 ? '#f59e0b' : '#38bdf8'}
					stroke-width="2"
				/>

			{:else if orbital === '2p'}
				<!-- Верхняя капля (+) -->
				<path
					d={pathPTop}
					fill="#f59e0b"
					fill-opacity={posOpacity}
					stroke="#f59e0b"
					stroke-width="2.4"
					transform="scale({posScale})"
				/>
				<!-- Нижняя капля (-) -->
				<path
					d={pathPBot}
					fill="#38bdf8"
					fill-opacity={negOpacity}
					stroke="#38bdf8"
					stroke-width="2.4"
					transform="scale({negScale})"
				/>
				<!-- Одна горизонтальная петля тишины -->
				{#if showNodal}
					<line x1="-155" y1="0" x2="155" y2="0" class="nodal-line" />
				{/if}

			{:else if orbital === '3d-clover'}
				<!-- Четыре лепестка в шахматном порядке -->
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
				<!-- Две перпендикулярные петли тишины -->
				{#if showNodal}
					<line x1="-155" y1="0" x2="155" y2="0" class="nodal-line" />
					<line x1="0" y1="-150" x2="0" y2="150" class="nodal-line" />
				{/if}

			{:else if orbital === '3d-ring'}
				<!-- Верхняя и нижняя шапки гантели (+) -->
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
				<!-- Экваториальный спасательный круг / бублик (-) -->
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
				<!-- Двойной конус песочных часов (тропические петли под углом 54.7°) -->
				{#if showNodal}
					{@const cx = 155 * Math.sin(MAGIC_ANGLE)}
					{@const cy = 155 * Math.cos(MAGIC_ANGLE)}
					<line x1={-cx} y1={-cy} x2={cx} y2={cy} class="nodal-line" />
					<line x1={cx} y1={-cy} x2={-cx} y2={cy} class="nodal-line" />
				{/if}
			{/if}

			<!-- Атомное ядро в центре -->
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

	<figcaption class="os-footer">
		Разрез объёмного желейного шара с «петлями тишины». Нажмите <b>«Пуск»</b>, чтобы увидеть, как электронный гель перекачивается между лепестками в противофазе (двойной щелчок сбрасывает вид).
	</figcaption>
</figure>

<style lang="scss">
	.os-wrapper {
		margin: 1.75rem 0;
		padding: 0.9rem;
		border-radius: 10px;
		background: #23211d;
		border: 1px solid #3a352d;
		color: #f3efe6;
		user-select: none;
	}

	.os-toolbar {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		align-items: center;
		gap: 0.6rem;
		margin-bottom: 0.75rem;
		font-size: 0.8rem;
	}

	.os-tabs {
		display: flex;
		flex-wrap: wrap;
		gap: 0.3rem;

		button {
			padding: 0.25rem 0.55rem;
			border: 1px solid #5c5343;
			border-radius: 5px;
			background: #332f28;
			color: #f3efe6;
			font-family: 'JetBrains Mono', monospace;
			font-size: 0.75rem;
			cursor: pointer;
			transition: background 0.15s, border-color 0.15s;

			&:hover {
				background: #4b4439;
			}

			&.active {
				background: #f59e0b;
				border-color: #f59e0b;
				color: #181613;
				font-weight: 700;
			}
		}
	}

	.os-actions {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.os-check {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		color: #e2d8c3;
		font-size: 0.8rem;
		cursor: pointer;

		input {
			accent-color: #f59e0b;
		}
	}

	.os-play {
		padding: 0.25rem 0.65rem;
		border: 1px solid #6b614e;
		border-radius: 5px;
		background: #2b2721;
		color: #e2d8c3;
		font-size: 0.78rem;
		cursor: pointer;

		&:hover {
			background: #3f3930;
		}
	}

	.os-stage {
		display: grid;
		grid-template-columns: 1fr 240px;
		gap: 0.9rem;
		align-items: center;
		background: #181613;
		border-radius: 8px;
		border: 1px solid #2e2a24;
		padding: 0.75rem;

		@media (max-width: 640px) {
			grid-template-columns: 1fr;
		}
	}

	.os-svg {
		width: 100%;
		max-width: 310px;
		height: auto;
		margin: 0 auto;
		display: block;
	}

	.ghost-sphere {
		fill: none;
		stroke: #2e2a24;
		stroke-width: 1.2;
		stroke-dasharray: 3 3;
	}

	.nodal-line {
		fill: none;
		stroke: #e2d8c3;
		stroke-width: 1.5;
		stroke-opacity: 0.65;
		stroke-dasharray: 5 4;
	}

	.nucleus {
		fill: #ef4444;
		stroke: #fff;
		stroke-width: 1.5;
	}

	.os-info {
		display: flex;
		flex-direction: column;
		gap: 0.55rem;
		padding: 0.65rem;
		border-radius: 6px;
		background: #23211d;
		border: 1px solid #332f28;
	}

	.os-info-title {
		font-weight: 700;
		font-size: 0.88rem;
		color: #f59e0b;
		line-height: 1.3;
	}

	.os-info-desc {
		margin: 0;
		font-size: 0.81rem;
		line-height: 1.48;
		color: #cbbba0;
	}

	.os-legend {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		margin-top: 0.25rem;
		padding-top: 0.45rem;
		border-top: 1px solid #332f28;
		font-size: 0.75rem;
		color: #a89f8d;

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
				background: #f59e0b;
			}

			&.neg {
				background: #38bdf8;
			}
		}

		.dash {
			width: 14px;
			height: 0;
			border-top: 2px dashed #e2d8c3;
			display: inline-block;
		}
	}

	.os-footer {
		margin-top: 0.65rem;
		padding-top: 0.55rem;
		border-top: 1px solid #3a352d;
		font-size: 0.83rem;
		line-height: 1.45;
		color: #e2d8c3;

		b {
			color: #f59e0b;
		}
	}
</style>
