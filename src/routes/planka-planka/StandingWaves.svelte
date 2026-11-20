<script lang="ts">
	interface Props {
		/** Номер моды (количество полуволн n). Если showAll = true, рисуются 1, 2 и 3 */
		mode?: number;
		/** Показывать сразу первые три моды (как на классическом рисунке) */
		showAll?: boolean;
		/** Запускать ли анимацию автоматически при загрузке */
		autoplay?: boolean;
		/** Показывать ли магнитную составляющую B (сдвинутую по фазе) */
		showMagnetic?: boolean;
	}

	let {
		mode = $bindable(1),
		showAll = $bindable(true),
		autoplay = false,
		showMagnetic = $bindable(false)
	}: Props = $props();

	const initialMode = mode;
	const initialShowAll = showAll;
	const initialShowMagnetic = showMagnetic;

	let isPlaying = $state(autoplay);
	let showForbidden = $state(false);
	let phase = $state(0);

	$effect(() => {
		if (!isPlaying) return;
		let frameId: number;
		let lastTime = performance.now();

		const tick = (now: number) => {
			const dt = (now - lastTime) / 1000;
			lastTime = now;
			phase = (phase + dt * 3.2) % (Math.PI * 2);
			frameId = requestAnimationFrame(tick);
		};

		frameId = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(frameId);
	});

	const W = 900;
	const H = 310;
	const WALL_L = 85;
	const WALL_R = W - 85;
	const CAVITY_W = WALL_R - WALL_L;
	const CENTER_Y = H / 2 + 6;
	const AMP = 88;

	// Электрическое поле E: sin(n * pi * u) * cos(phase) — узлы на стенках
	function buildElectricPath(n: number, currentPhase: number, ampScale = 1): string {
		const steps = 140;
		const parts = new Array<string>();
		const timeFactor = Math.cos(currentPhase);

		for (let i = 0; i <= steps; i++) {
			const u = i / steps;
			const x = WALL_L + u * CAVITY_W;
			const y = CENTER_Y - AMP * ampScale * Math.sin(n * Math.PI * u) * timeFactor;
			parts.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`);
		}
		return parts.join(' ');
	}

	// Магнитное поле B: cos(n * pi * u) * sin(phase + pi/4) — пучности (максимумы) на стенках!
	// При phase = 0 (на стоп-кадре) добавляем небольшой сдвиг, чтобы обе волны были хорошо видны разом
	function buildMagneticPath(n: number, currentPhase: number, ampScale = 0.85): string {
		const steps = 140;
		const parts = new Array<string>();
		const timeFactor = isPlaying ? Math.sin(currentPhase) : 0.85;

		for (let i = 0; i <= steps; i++) {
			const u = i / steps;
			const x = WALL_L + u * CAVITY_W;
			const y = CENTER_Y - AMP * ampScale * Math.cos(n * Math.PI * u) * timeFactor;
			parts.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`);
		}
		return parts.join(' ');
	}

	function getNodes(n: number): Array<number> {
		const nodes = new Array<number>();
		for (let k = 0; k <= n; k++) {
			nodes.push(WALL_L + (k / n) * CAVITY_W);
		}
		return nodes;
	}

	const modesList = Array.of(1, 2, 3, 4, 5, 6, 7, 8);

	function getModeColor(n: number): string {
		switch (n) {
			case 1:
				return '#f59e0b';
			case 2:
				return '#38bdf8';
			case 3:
				return '#34d399';
			case 4:
				return '#a78bfa';
			case 5:
				return '#fb7185';
			case 6:
				return '#fbbf24';
			case 7:
				return '#60a5fa';
			default:
				return '#4ade80';
		}
	}

	function selectSingleMode(n: number) {
		showAll = false;
		showForbidden = false;
		mode = n;
	}

	function resetState() {
		mode = initialMode;
		showAll = initialShowAll;
		showMagnetic = initialShowMagnetic;
		showForbidden = false;
		isPlaying = autoplay;
		phase = 0;
	}
</script>

<figure class="sw-wrapper" aria-label="Интерактивная модель стоячих волн в полости">
	<div class="sw-controls">
		<div class="sw-buttons">
			<button
				type="button"
				class:active={showAll && !showForbidden}
				onclick={() => {
					showAll = true;
					showForbidden = false;
				}}
			>
				Моды 1–3 вместе
			</button>

			{#each modesList as n}
				<button
					type="button"
					class:active={!showAll && !showForbidden && mode === n}
					onclick={() => selectSingleMode(n)}
				>
					n = {n}
				</button>
			{/each}
		</div>

		<div class="sw-actions">
			<label class="sw-checkbox mag">
				<input
					type="checkbox"
					bind:checked={showMagnetic}
					onchange={() => {
						if (showMagnetic && showAll) {
							showAll = false;
							mode = 1;
						}
						if (showMagnetic) showForbidden = false;
					}}
				/>
				<span>Магнитное поле B</span>
			</label>

			<label class="sw-checkbox err">
				<input
					type="checkbox"
					bind:checked={showForbidden}
					onchange={() => {
						if (showForbidden) {
							showAll = false;
							showMagnetic = false;
						}
					}}
				/>
				<span>Некратная (n = 2.4)</span>
			</label>

			<button type="button" class="sw-play" onclick={() => (isPlaying = !isPlaying)}>
				{isPlaying ? 'Пауза' : 'Пуск'}
			</button>
		</div>
	</div>

	<svg
		viewBox="0 0 {W} {H}"
		class="sw-svg"
		role="application"
		aria-label="Стоячие волны между стенками полости. Двойной щелчок сбрасывает вид."
		ondblclick={resetState}
	>
		<rect x={WALL_L} y="26" width={CAVITY_W} height={H - 52} fill="#181613" />
		<line x1={WALL_L} y1={CENTER_Y} x2={WALL_R} y2={CENTER_Y} stroke="#3a352d" stroke-dasharray="5 5" />

		<!-- Стенки полости -->
		<rect x={WALL_L - 18} y="22" width="18" height={H - 44} rx="3" fill="#443e34" stroke="#786e5c" />
		<rect x={WALL_R} y="22" width="18" height={H - 44} rx="3" fill="#443e34" stroke="#786e5c" />
		<text x={WALL_L - 28} y={CENTER_Y} class="wall-label" transform="rotate(-90, {WALL_L - 28}, {CENTER_Y})">
			Стенка печи
		</text>
		<text x={WALL_R + 30} y={CENTER_Y} class="wall-label" transform="rotate(90, {WALL_R + 30}, {CENTER_Y})">
			Стенка печи
		</text>

		{#if showAll && !showForbidden}
			<path d={buildElectricPath(1, phase, 1)} fill="none" stroke="#f59e0b" stroke-width="3" />
			<path d={buildElectricPath(2, phase + 0.6, 0.78)} fill="none" stroke="#38bdf8" stroke-width="2.5" />
			<path d={buildElectricPath(3, phase + 1.2, 0.6)} fill="none" stroke="#34d399" stroke-width="2.2" />

			<circle cx={WALL_L} cy={CENTER_Y} r="5" fill="#ef4444" />
			<circle cx={WALL_R} cy={CENTER_Y} r="5" fill="#ef4444" />
		{:else if showForbidden}
			<path d={buildElectricPath(2.4, phase, 0.9)} fill="none" stroke="#ef4444" stroke-width="2.6" stroke-dasharray="6 4" />
			<circle cx={WALL_L} cy={CENTER_Y} r="5" fill="#ef4444" />
			{@const hitY = CENTER_Y - AMP * 0.9 * Math.sin(2.4 * Math.PI) * Math.cos(phase)}
			<circle cx={WALL_R} cy={hitY} r="6.5" fill="#ef4444" stroke="#fff" stroke-width="1.5" />
			<text x={WALL_R - 14} y={hitY - 12} class="error-tag">Не ноль! Волна гасит сама себя</text>
		{:else}
			{@const color = getModeColor(mode)}
			<!-- Огибающие электрического поля -->
			<path d={buildElectricPath(mode, 0, 1)} fill="none" stroke={color} stroke-opacity="0.2" stroke-width="1.5" stroke-dasharray="4 4" />
			<path d={buildElectricPath(mode, Math.PI, 1)} fill="none" stroke={color} stroke-opacity="0.2" stroke-width="1.5" stroke-dasharray="4 4" />

			<!-- Магнитное поле B (пучности на стенках!) -->
			{#if showMagnetic}
				<path d={buildMagneticPath(mode, phase, 0.85)} fill="none" stroke="#38bdf8" stroke-width="2.4" stroke-dasharray="7 4" />
				{@const magFactor = isPlaying ? Math.sin(phase) : 0.85}
				{@const leftMagY = CENTER_Y - AMP * 0.85 * magFactor}
				{@const rightMagY = CENTER_Y - AMP * 0.85 * Math.cos(mode * Math.PI) * magFactor}
				<circle cx={WALL_L} cy={leftMagY} r="5" fill="#38bdf8" stroke="#181613" stroke-width="1.5" />
				<circle cx={WALL_R} cy={rightMagY} r="5" fill="#38bdf8" stroke="#181613" stroke-width="1.5" />
			{/if}

			<!-- Электрическое поле E (узлы на стенках) -->
			<path d={buildElectricPath(mode, phase, 1)} fill="none" stroke={color} stroke-width="3.2" />

			{#each getNodes(mode) as nx}
				<circle cx={nx} cy={CENTER_Y} r="5" fill="#ef4444" stroke="#181613" stroke-width="1.5" />
			{/each}
		{/if}
	</svg>

	<figcaption class="sw-footer">
		{#if showAll && !showForbidden}
			<span>
				Показаны первые три моды электрического поля E: <b style="color:#f59e0b">n = 1</b>,
				<b style="color:#38bdf8">n = 2</b> и <b style="color:#34d399">n = 3</b>. Красные точки — неподвижные узлы на стенках.
			</span>
		{:else if showForbidden}
			<span>
				При <b>n = 2.4</b> между стенками укладывается нецелое число полуволн — на правой стенке поле не зануляется, и при отражении волна уничтожает сама себя.
			</span>
		{:else if showMagnetic}
			<span>
				Мода <b>n = {mode}</b>: сплошная линия — электрическое поле <b>E</b> (нули на стенках), голубой пунктир — магнитное поле <b style="color:#38bdf8">B</b> (максимумы на стенках!). Нажмите «Пуск», чтобы увидеть, как они перетекают друг в друга.
			</span>
		{:else}
			<span>
				Мода <b>n = {mode}</b>: между стенками укладывается ровно <b>{mode}</b> {mode === 1 ? 'полуволна' : mode < 5 ? 'полуволны' : 'полуволн'}
				(λ = 2L / {mode}). Неподвижных узлов: <b>{mode + 1}</b>.
			</span>
		{/if}
	</figcaption>
</figure>

<style lang="scss">
	.sw-wrapper {
		margin: 1.75rem 0;
		padding: 0.85rem;
		border-radius: 10px;
		background: #23211d;
		color: #f3efe6;
		user-select: none;
	}

	.sw-controls {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		align-items: center;
		gap: 0.6rem;
		margin-bottom: 0.7rem;
		font-size: 0.82rem;
	}

	.sw-buttons {
		display: flex;
		flex-wrap: wrap;
		gap: 0.3rem;

		button {
			padding: 0.25rem 0.5rem;
			border: 1px solid #5c5343;
			border-radius: 5px;
			background: #332f28;
			color: #f3efe6;
			font-family: 'JetBrains Mono', monospace;
			font-size: 0.76rem;
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

	.sw-actions {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.75rem;
	}

	.sw-checkbox {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		font-size: 0.8rem;
		cursor: pointer;

		&.mag {
			color: #7dd3fc;
			input {
				accent-color: #38bdf8;
			}
		}

		&.err {
			color: #fca5a5;
			input {
				accent-color: #ef4444;
			}
		}
	}

	.sw-play {
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

	.sw-svg {
		display: block;
		width: 100%;
		height: auto;
		border-radius: 6px;
	}

	.wall-label {
		fill: #a89f8d;
		font-family: sans-serif;
		font-size: 11px;
		text-anchor: middle;
	}

	.error-tag {
		fill: #fca5a5;
		font-family: sans-serif;
		font-size: 11px;
		font-weight: 600;
		text-anchor: end;
	}

	.sw-footer {
		margin-top: 0.6rem;
		padding-top: 0.5rem;
		border-top: 1px solid #3a352d;
		font-size: 0.82rem;
		line-height: 1.4;
		color: #e2d8c3;

		b {
			color: #f59e0b;
		}
	}
</style>
