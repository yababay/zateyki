<script>
	import { onMount } from 'svelte';
	import '#lib/styles/widget.scss';

	const R_EARTH = 100;
	const H_TOWER = 18;
	const R_START = R_EARTH + H_TOWER;
	const V_CIRC = 7.9;
	const GM = V_CIRC * V_CIRC * R_START;

	let speed = $state(7.9);
	let angleDeg = $state(0);
	let isRunning = $state(false);
	let status = $state('ready');

	let pos = $state({ x: 0, y: -R_START });
	let vel = $state({ vx: 7.9, vy: 0 });
	let trail = $state([]);
	let laps = $state(0);
	let prevAngle = 0;
	let totalAngle = 0;

	let animId = null;

	let rCurrent = $derived(Math.hypot(pos.x, pos.y));
	let vCurrent = $derived(Math.hypot(vel.vx, vel.vy));
	let specificEnergy = $derived(0.5 * vCurrent * vCurrent - GM / rCurrent);

	let orbitType = $derived.by(() => {
		const rad = (angleDeg * Math.PI) / 180;
		const e0 = 0.5 * speed * speed - GM / R_START;
		if (e0 >= 0) {
			return {
				label: 'Побег из системы (гипербола)',
				color: 'var(--w-accent-cold)',
				hint: 'Скорость выше второй космической — налог переплачен, гравитация не удержит.'
			};
		}
		const a = -GM / (2 * e0);
		const h = R_START * speed * Math.cos(rad);
		const eccSq = Math.max(0, 1 + (2 * e0 * h * h) / (GM * GM));
		const ecc = Math.sqrt(eccSq);
		const rPeri = a * (1 - ecc);

		if (rPeri <= R_EARTH) {
			return {
				label: 'Падение на Землю (баллистика)',
				color: 'var(--w-accent-err)',
				hint:
					Math.abs(angleDeg) > 45
						? 'Выстрел почти вертикально: высоты много, а горизонтального разгона не хватило.'
						: 'Недоплата налога: траектория пересекает поверхность планеты.'
			};
		}
		if (ecc < 0.03) {
			return {
				label: 'Круговая орбита («вечное падение»)',
				color: 'var(--cannon-success)',
				hint: 'Идеальный баланс: налог уплачен ровно, спутник падает за горизонт без затрат топлива.'
			};
		}
		return {
			label: `Эллиптическая орбита (e = ${ecc.toFixed(2)})`,
			color: 'var(--w-accent)',
			hint: 'Орбита замкнута: скорость и высота бесплатно перетекают друг в друга.'
		};
	});

	function resetCannon() {
		isRunning = false;
		if (animId) cancelAnimationFrame(animId);
		status = 'ready';
		pos = { x: 0, y: -R_START };
		const rad = (angleDeg * Math.PI) / 180;
		vel = {
			vx: speed * Math.cos(rad),
			vy: -speed * Math.sin(rad)
		};
		trail = [{ x: 0, y: -R_START }];
		laps = 0;
		prevAngle = -Math.PI / 2;
		totalAngle = 0;
	}

	function applyPreset(v, ang) {
		speed = v;
		angleDeg = ang;
		resetCannon();
	}

	function toggleLaunch() {
		if (status === 'crashed' || status === 'escaped') {
			resetCannon();
			isRunning = true;
			status = 'flying';
			return;
		}
		if (status === 'ready') {
			resetCannon();
			status = 'flying';
		}
		isRunning = !isRunning;
	}

	$effect(() => {
		const _s = speed;
		const _a = angleDeg;
		if (status === 'ready') {
			const rad = (_a * Math.PI) / 180;
			vel = {
				vx: _s * Math.cos(rad),
				vy: -_s * Math.sin(rad)
			};
		}
	});

	$effect(() => {
		if (!isRunning) return;

		let lastTime = performance.now();

		function step(now) {
			if (!isRunning) return;
			const dtFrame = Math.min((now - lastTime) / 1000, 0.05);
			lastTime = now;

			const totalDt = dtFrame * 18;
			const subSteps = 20;
			const dt = totalDt / subSteps;

			let { x, y } = pos;
			let { vx, vy } = vel;

			for (let i = 0; i < subSteps; i++) {
				const r2 = x * x + y * y;
				const r = Math.sqrt(r2);

				if (r <= R_EARTH) {
					const scale = R_EARTH / r;
					x *= scale;
					y *= scale;
					pos = { x, y };
					vel = { vx: 0, vy: 0 };
					trail = [...trail, { x, y }];
					isRunning = false;
					status = 'crashed';
					return;
				}

				if (r > 360) {
					pos = { x, y };
					isRunning = false;
					status = 'escaped';
					return;
				}

				const invR3 = -GM / (r2 * r);
				const ax = x * invR3;
				const ay = y * invR3;

				const nx = x + vx * dt + 0.5 * ax * dt * dt;
				const ny = y + vy * dt + 0.5 * ay * dt * dt;

				const nr2 = nx * nx + ny * ny;
				const nr = Math.sqrt(nr2);
				const nInvR3 = -GM / (nr2 * nr);
				const nax = nx * nInvR3;
				const nay = ny * nInvR3;

				vx += 0.5 * (ax + nax) * dt;
				vy += 0.5 * (ay + nay) * dt;
				x = nx;
				y = ny;
			}

			const curAngle = Math.atan2(y, x);
			let dAngle = curAngle - prevAngle;
			if (dAngle > Math.PI) dAngle -= 2 * Math.PI;
			if (dAngle < -Math.PI) dAngle += 2 * Math.PI;
			totalAngle += dAngle;
			prevAngle = curAngle;
			laps = Math.floor(Math.abs(totalAngle) / (2 * Math.PI));

			pos = { x, y };
			vel = { vx, vy };

			const lastPt = trail[trail.length - 1];
			if (!lastPt || Math.hypot(x - lastPt.x, y - lastPt.y) > 2.2) {
				const nextTrail = [...trail, { x, y }];
				trail = nextTrail.length > 420 ? nextTrail.slice(nextTrail.length - 420) : nextTrail;
			}

			animId = requestAnimationFrame(step);
		}

		animId = requestAnimationFrame(step);
		return () => {
			if (animId) cancelAnimationFrame(animId);
		};
	});

	onMount(() => {
		resetCannon();
	});

	let trailPath = $derived(
		trail.length > 1
			? trail.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
			: ''
	);

	let velArrow = $derived.by(() => {
		const vMag = Math.hypot(vel.vx, vel.vy);
		if (vMag < 0.01) return null;
		const len = Math.min(vMag * 5.2, 68);
		const ux = vel.vx / vMag;
		const uy = vel.vy / vMag;
		return {
			x2: pos.x + ux * len,
			y2: pos.y + uy * len
		};
	});

	let gravArrow = $derived.by(() => {
		const r = Math.hypot(pos.x, pos.y);
		if (r < R_EARTH) return null;
		const gScale = (R_START / r) * (R_START / r);
		const len = Math.min(34 * gScale, 46);
		return {
			x2: pos.x - (pos.x / r) * len,
			y2: pos.y - (pos.y / r) * len
		};
	});
</script>

<figure class="z-widget cannon-widget" aria-label="Интерактивная модель пушки Ньютона">
	<div class="z-widget-toolbar z-widget-group cannon-presets">
		<span class="z-widget-label">Сценарии запуска:</span>
		<button
			class="z-widget-btn"
			class:active={speed === 4.8 && angleDeg === 0}
			onclick={() => applyPreset(4.8, 0)}
		>
			Недолёт (4.8 км/с)
		</button>
		<button
			class="z-widget-btn"
			class:active={speed === 8.2 && angleDeg === 75}
			onclick={() => applyPreset(8.2, 75)}
		>
			Почти вертикально (75°)
		</button>
		<button
			class="z-widget-btn"
			class:active={speed === 7.9 && angleDeg === 0}
			onclick={() => applyPreset(7.9, 0)}
		>
			Первый спутник (7.9 км/с)
		</button>
		<button
			class="z-widget-btn"
			class:active={speed === 9.6 && angleDeg === 0}
			onclick={() => applyPreset(9.6, 0)}
		>
			Вытянутый эллипс (9.6 км/с)
		</button>
		<button
			class="z-widget-btn"
			class:active={speed === 11.4 && angleDeg === 0}
			onclick={() => applyPreset(11.4, 0)}
		>
			Улёт в космос (11.4 км/с)
		</button>
	</div>

	<div class="z-widget-toolbar cannon-controls">
		<label class="cannon-slider">
			<span>Скорость: <strong>{speed.toFixed(1)} км/с</strong></span>
			<input
				type="range"
				min="3.0"
				max="12.0"
				step="0.1"
				bind:value={speed}
				disabled={isRunning}
			/>
		</label>

		<label class="cannon-slider">
			<span>Угол ствола: <strong>{angleDeg > 0 ? `+${angleDeg}` : angleDeg}°</strong></span>
			<input
				type="range"
				min="-30"
				max="85"
				step="1"
				bind:value={angleDeg}
				disabled={isRunning}
			/>
		</label>

		<div class="z-widget-group cannon-actions">
			<button type="button" class="z-widget-btn cannon-launch" onclick={toggleLaunch}>
				{#if isRunning}
					Пауза
				{:else if status === 'crashed' || status === 'escaped'}
					Перезарядить
				{:else}
					Выстрел!
				{/if}
			</button>
			{#if status !== 'ready'}
				<button type="button" class="z-widget-btn" onclick={resetCannon}>Сброс</button>
			{/if}
		</div>
	</div>

	<div class="z-widget-stage cannon-stage">
		<svg
			viewBox="-260 -230 520 460"
			class="z-widget-svg cannon-svg"
			ondblclick={resetCannon}
			role="img"
			aria-label="Интерактивная пушка Ньютона"
		>
			<defs>
				<radialGradient id="earthGrad" cx="38%" cy="35%" r="65%">
					<stop offset="0%" stop-color="#3b82f6" />
					<stop offset="65%" stop-color="#1d4ed8" />
					<stop offset="100%" stop-color="#0f172a" />
				</radialGradient>
				<radialGradient id="atmoGlow" cx="50%" cy="50%" r="50%">
					<stop offset="82%" stop-color="#38bdf8" stop-opacity="0.22" />
					<stop offset="100%" stop-color="#38bdf8" stop-opacity="0" />
				</radialGradient>
				<marker id="arrowAmber" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
					<polygon points="0 0, 7 3.5, 0 7" fill="var(--w-accent)" />
				</marker>
				<marker id="arrowBlue" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
					<polygon points="0 0, 7 3.5, 0 7" fill="var(--w-accent-cold)" />
				</marker>
			</defs>

			<circle cx="0" cy="0" r={R_START} fill="none" stroke="#334155" stroke-dasharray="3 5" stroke-width="1" />
			<circle cx="0" cy="0" r={R_EARTH + 12} fill="url(#atmoGlow)" />
			<circle cx="0" cy="0" r={R_EARTH} fill="url(#earthGrad)" stroke="#60a5fa" stroke-width="1.2" />

			<path
				d="M -45 -55 Q -20 -70 10 -45 T 45 -20 Q 25 15 -10 5 T -55 -25 Z"
				fill="#22c55e"
				opacity="0.22"
			/>
			<path
				d="M 15 25 Q 45 20 55 50 Q 30 75 5 60 Z"
				fill="#22c55e"
				opacity="0.18"
			/>

			<polygon points="-14,-99 0,-118 14,-99" fill="#64748b" stroke="#94a3b8" stroke-width="1" />
			<g transform={`translate(0, ${-R_START}) rotate(${-angleDeg})`}>
				<rect x="-4" y="-4" width="18" height="8" rx="2" fill="#cbd5e1" stroke="#475569" stroke-width="1" />
				<circle cx="0" cy="0" r="5" fill="#94a3b8" />
			</g>

			{#if trailPath}
				<path
					d={trailPath}
					fill="none"
					stroke={orbitType.color}
					stroke-width="2"
					stroke-linecap="round"
					opacity="0.85"
				/>
			{/if}

			{#if gravArrow && status !== 'crashed'}
				<line
					x1={pos.x}
					y1={pos.y}
					x2={gravArrow.x2}
					y2={gravArrow.y2}
					stroke="var(--w-accent-cold)"
					stroke-width="2"
					marker-end="url(#arrowBlue)"
				/>
			{/if}

			{#if velArrow && status !== 'crashed'}
				<line
					x1={pos.x}
					y1={pos.y}
					x2={velArrow.x2}
					y2={velArrow.y2}
					stroke="var(--w-accent)"
					stroke-width="2"
					marker-end="url(#arrowAmber)"
				/>
			{/if}

			<circle
				cx={pos.x}
				cy={pos.y}
				r={status === 'crashed' ? 7 : 5}
				fill={status === 'crashed' ? 'var(--w-accent-err)' : '#f8fafc'}
				stroke={orbitType.color}
				stroke-width="2"
			/>

			<g transform="translate(-248, -206)" font-size="11.5" fill="var(--w-text-muted)">
				<text y="0">
					Скорость: <tspan fill="var(--w-text-main)" font-weight="600">{vCurrent.toFixed(2)} км/с</tspan>
				</text>
				<text y="16">
					Высота: <tspan fill="var(--w-text-main)" font-weight="600">{Math.max(0, Math.round((rCurrent - R_EARTH) * 63.7))} км</tspan>
				</text>
				<text y="32">
					Полных витков: <tspan fill="var(--cannon-success)" font-weight="600">{laps}</tspan>
				</text>
			</g>

			<g transform="translate(105, -206)" font-size="11.5" fill="var(--w-text-muted)">
				<text y="0">
					<tspan fill="var(--w-accent)">●</tspan> Вектор скорости (v)
				</text>
				<text y="16">
					<tspan fill="var(--w-accent-cold)">●</tspan> Сила тяжести (F)
				</text>
				<text y="32">
					Энергия: <tspan fill={specificEnergy >= 0 ? 'var(--w-accent-cold)' : 'var(--cannon-success)'} font-weight="600">
						{specificEnergy >= 0 ? '≥ 0 (свободен)' : '< 0 (связан)'}
					</tspan>
				</text>
			</g>

			{#if status === 'crashed'}
				<g transform="translate(0, 165)">
					<rect x="-210" y="-22" width="420" height="44" rx="6" fill="var(--w-bg-card)" stroke="var(--w-accent-err)" />
					<text text-anchor="middle" fill="var(--w-accent-err)" font-size="12" font-weight="600">
						<tspan x="0" y="-4">Столкновение с планетой — «билет»</tspan>
						<tspan x="0" y="12">оказался слишком дешёвым</tspan>
					</text>
				</g>
			{:else if status === 'escaped'}
				<g transform="translate(0, 165)">
					<rect x="-210" y="-22" width="420" height="44" rx="6" fill="var(--w-bg-card)" stroke="var(--w-accent-cold)" />
					<text text-anchor="middle" fill="var(--w-accent-cold)" font-size="12" font-weight="600">
						<tspan x="0" y="-4">Спутник покинул Землю — вторая космическая</tspan>
						<tspan x="0" y="12">(11.2 км/с) превышена</tspan>
					</text>
				</g>
			{/if}
		</svg>
	</div>

	<figcaption class="z-widget-footer cannon-explanation">
		<p>
			<strong style="color: {orbitType.color}">{orbitType.label}.</strong> {orbitType.hint}
			Обратите внимание на угол между <strong style="color: var(--w-accent)">скоростью</strong> и
			<strong style="color: var(--w-accent-cold)">силой тяжести</strong>: на круговой орбите он всегда равен
			<strong>90°</strong> — гравитация лишь поворачивает вектор движения, не совершая работы (двойной щелчок сбрасывает пушку).
		</p>
	</figcaption>
</figure>

<style lang="scss">
	.cannon-widget {
		--cannon-success: #34d399;
		padding: 0.85rem;
	}

	.cannon-presets {
		justify-content: flex-start;
		gap: 0.45rem;
		margin-bottom: 0.65rem;
	}

	.cannon-controls {
		align-items: end;
		gap: 0.75rem 1rem;
		padding-bottom: 0.75rem;
		border-bottom: 1px solid var(--w-border);
	}

	.cannon-slider {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		flex: 1;
		min-width: min(100%, 220px);
		color: var(--w-text-muted);

		strong {
			color: var(--w-accent);
		}

		input[type='range'] {
			width: 100%;
			accent-color: var(--w-accent);
			cursor: pointer;
		}
	}

	.cannon-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.45rem;
		align-items: center;
		justify-content: flex-end;
	}

	.cannon-launch {
		background: var(--w-accent);
		border-color: var(--w-accent);
		color: #181613;
		font-weight: 700;

		&:hover {
			background: #fbbf24;
			border-color: #fbbf24;
		}
	}

	.cannon-stage {
		padding: clamp(0.35rem, 1.5vw, 0.85rem);
		background: #11100e;
	}

	.cannon-svg {
		width: 100%;
		max-height: min(72vh, 760px);
		border-radius: 6px;
	}

	.cannon-explanation {
		display: block;
		font-size: 0.9rem;

		p {
			margin: 0;
		}
	}

	@media (max-width: 640px) {
		.cannon-widget {
			padding: 0.65rem;
		}

		.cannon-controls {
			align-items: stretch;
		}

		.cannon-actions {
			justify-content: flex-start;
		}
	}
</style>
