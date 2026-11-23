<script lang="ts">
	interface Props {
		/** Целое число длин волн для «правильной» орбиты (слева) */
		validN?: number;
		/** Дробное число длин волн для «недоромашки» (справа) */
		invalidN?: number;
		/** Запускать ли дыхание волны сразу */
		autoplay?: boolean;
	}

	let {
		validN = $bindable(4),
		invalidN = $bindable(3.4),
		autoplay = false
	}: Props = $props();

	const initValid = validN;
	const initInvalid = invalidN;

	let isPlaying = $state(autoplay);
	let phase = $state(0);

	$effect(() => {
		if (!isPlaying) return;
		let frameId: number;
		let lastTime = performance.now();

		const tick = (now: number) => {
			const dt = (now - lastTime) / 1000;
			lastTime = now;
			phase = (phase + dt * 3.5) % (Math.PI * 2);
			frameId = requestAnimationFrame(tick);
		};

		frameId = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(frameId);
	});

	const R0 = 115;
	const AMP = 21;

	// Замкнутая волна (1 полный оборот 2*pi)
	function buildClosedWave(n: number, currentPhase: number): string {
		const steps = 240;
		const parts = new Array<string>();
		const pulse = isPlaying ? Math.cos(currentPhase) : 1;

		for (let i = 0; i <= steps; i++) {
			const theta = (i / steps) * Math.PI * 2;
			const r = R0 + AMP * Math.sin(n * theta) * pulse;
			const x = r * Math.cos(theta);
			const y = r * Math.sin(theta);
			parts.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`);
		}
		return `${parts.join(' ')} Z`;
	}

	// Незамкнутая волна (1.6 оборота, чтобы виден был разрыв и нахлёст)
	function buildOpenWave(n: number, currentPhase: number): string {
		const turns = 1.65;
		const steps = 320;
		const parts = new Array<string>();
		const pulse = isPlaying ? Math.cos(currentPhase) : 1;

		for (let i = 0; i <= steps; i++) {
			const theta = (i / steps) * Math.PI * 2 * turns;
			const r = R0 + AMP * Math.sin(n * theta) * pulse;
			const x = r * Math.cos(theta);
			const y = r * Math.sin(theta);
			parts.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`);
		}
		return parts.join(' ');
	}

	// Точки начала (0) и конца первого оборота (2*pi) на правой схеме
	const mismatchPoints = $derived.by(() => {
		const pulse = isPlaying ? Math.cos(phase) : 1;
		const rStart = R0; // при theta = 0, sin(0) = 0
		const rEnd = R0 + AMP * Math.sin(invalidN * Math.PI * 2) * pulse;
		return { rStart, rEnd };
	});

	const validOptions = Array.of(2, 3, 4, 5, 6, 7);
	const invalidOptions = Array.of(2.4, 3.4, 4.6, 5.3);

	function resetState() {
		validN = initValid;
		invalidN = initInvalid;
		isPlaying = autoplay;
		phase = 0;
	}
</script>

<figure class="db-wrapper" aria-label="Сравнение замкнутой и разомкнутой волн де Бройля">
	<div class="db-toolbar">
		<div class="db-group">
			<span class="db-lbl">Ромашка (целое n):</span>
			{#each validOptions as n}
				<button type="button" class:active={validN === n} onclick={() => (validN = n)}>
					{n}λ
				</button>
			{/each}
		</div>

		<div class="db-group">
			<span class="db-lbl">Недоромашка:</span>
			{#each invalidOptions as n}
				<button type="button" class:active-err={invalidN === n} onclick={() => (invalidN = n)}>
					{n}λ
				</button>
			{/each}
		</div>

		<button type="button" class="db-play" onclick={() => (isPlaying = !isPlaying)}>
			{isPlaying ? 'Пауза' : 'Пуск'}
		</button>
	</div>

	<div class="db-stage" role="application" ondblclick={resetState}>
		<!-- Левая карточка: Разрешённая орбита -->
		<div class="db-pane">
			<div class="db-pane-title ok">2πR = {validN}λ (стоячая волна)</div>
			<svg viewBox="-165 -165 330 330" class="db-svg">
				<!-- Базовая окружность орбиты -->
				<circle cx="0" cy="0" r={R0} class="orbit-guide" />
				<!-- Замкнутая волна де Бройля -->
				<path d={buildClosedWave(validN, phase)} class="wave-ok" />
				<!-- Точка идеального стыка -->
				<circle cx={R0} cy="0" r="5" fill="#22c55e" stroke="#181613" stroke-width="1.5" />
				<!-- Атомное ядро -->
				<circle cx="0" cy="0" r="11" class="nucleus" />
				<text x="0" y="25" class="nuc-lbl">Ядро</text>
			</svg>
		</div>

		<!-- Правая карточка: Запрещённая орбита -->
		<div class="db-pane">
			<div class="db-pane-title err">2πR = {invalidN}λ (разрыв фазы)</div>
			<svg viewBox="-165 -165 330 330" class="db-svg">
				<circle cx="0" cy="0" r={R0} class="orbit-guide" />
				<!-- Несовпадающая волна -->
				<path d={buildOpenWave(invalidN, phase)} class="wave-err" />

				<!-- Красный перечёркивающий крест на всю схему -->
				<line x1="-138" y1="-138" x2="138" y2="138" class="strike-cross" />
				<line x1="138" y1="-138" x2="-138" y2="138" class="strike-cross" />

				<!-- Точки расхождения начала и конца первого круга -->
				<circle cx={mismatchPoints.rStart} cy="0" r="4.5" fill="#f59e0b" />
				<circle cx={mismatchPoints.rEnd} cy="0" r="5" fill="#ef4444" stroke="#fff" stroke-width="1.2" />

				<circle cx="0" cy="0" r="11" class="nucleus" />
				<text x="0" y="25" class="nuc-lbl">Ядро</text>
			</svg>
		</div>
	</div>

	<figcaption class="db-footer">
		Слева длина окружности вмещает ровно <b>{validN}</b> {validN < 5 ? 'волны' : 'волн'} — гребень попадает на гребень, энергия не теряется. Справа при <b>{invalidN}λ</b> волна после полного оборота не попадает в своё начало и гасит сама себя (двойной щелчок сбрасывает настройки).
	</figcaption>
</figure>

<style lang="scss">
	.db-wrapper {
		margin: 1.75rem 0;
		padding: 0.9rem;
		border-radius: 10px;
		background: #23211d;
		border: 1px solid #3a352d;
		color: #f3efe6;
		user-select: none;
	}

	.db-toolbar {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		align-items: center;
		gap: 0.6rem;
		margin-bottom: 0.75rem;
		font-size: 0.8rem;
	}

	.db-group {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.3rem;

		.db-lbl {
			color: #cbbba0;
			margin-right: 0.2rem;
		}

		button {
			padding: 0.22rem 0.48rem;
			border: 1px solid #5c5343;
			border-radius: 5px;
			background: #332f28;
			color: #f3efe6;
			font-family: 'JetBrains Mono', monospace;
			font-size: 0.75rem;
			cursor: pointer;
			transition: background 0.15s;

			&:hover {
				background: #4b4439;
			}

			&.active {
				background: #f59e0b;
				border-color: #f59e0b;
				color: #181613;
				font-weight: 700;
			}

			&.active-err {
				background: #ef4444;
				border-color: #ef4444;
				color: #fff;
				font-weight: 700;
			}
		}
	}

	.db-play {
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

	.db-stage {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.75rem;

		@media (max-width: 600px) {
			grid-template-columns: 1fr;
		}
	}

	.db-pane {
		background: #181613;
		border-radius: 8px;
		border: 1px solid #2e2a24;
		padding: 0.65rem;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.db-pane-title {
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.8rem;
		font-weight: 700;
		margin-bottom: 0.25rem;

		&.ok {
			color: #f59e0b;
		}

		&.err {
			color: #fca5a5;
		}
	}

	.db-svg {
		width: 100%;
		max-width: 270px;
		height: auto;
		margin: 0;
		display: block;
	}

	.orbit-guide {
		fill: none;
		stroke: #443e34;
		stroke-width: 1.5;
		stroke-dasharray: 5 5;
	}

	.wave-ok {
		fill: rgba(245, 158, 11, 0.08);
		stroke: #f59e0b;
		stroke-width: 3;
		stroke-linejoin: round;
	}

	.wave-err {
		fill: none;
		stroke: #38bdf8;
		stroke-width: 2.3;
		stroke-opacity: 0.85;
	}

	.strike-cross {
		stroke: #ef4444;
		stroke-width: 3.5;
		stroke-opacity: 0.45;
		stroke-linecap: round;
	}

	.nucleus {
		fill: #ef4444;
		stroke: #fca5a5;
		stroke-width: 1.5;
	}

	.nuc-lbl {
		fill: #fca5a5;
		font-family: sans-serif;
		font-size: 11px;
		text-anchor: middle;
	}

	.db-footer {
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
