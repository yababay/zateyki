<script>
	import { onMount } from 'svelte';
	import '#lib/styles/widget.scss';

	// Накопленный фазовый угол путешествия: 0° .. 720°
	// 0° -> 180°: 1-й спуск (край -> центр)
	// 180° -> 360°: 1-й подъём (центр -> край), цвет зонда инвертируется!
	// 360° -> 540°: 2-й спуск (край -> центр)
	// 540° -> 720°: 2-й подъём (центр -> край), цвет зонда возвращается в исходный!
	let cycleDeg = $state(0);
	let isPlaying = $state(false);
	let animId = null;

	// Отметка зоны тишины 2s (r = 2.0 a0) на шкале 0..6.3
	const yNode = -82 + (1 - 2.0 / 6.3) * 176;

	// Удержание вспышки бейджа "Зона тишины 2s!" на 500 мс
	let badgeHold = $state(false);
	let badgeTimer = null;
	let prevDiff = 6.3 - 2.0;

	// 220 детерминированных бусин на срезе 2s-орбитали
	const BEAD_COUNT = 220;
	const beads = Array.from({ length: BEAD_COUNT }, (_, i) => {
		const angle = i * 2.399963229728653;
		const rNorm = Math.sqrt((i + 0.5) / BEAD_COUNT);
		const rVal = rNorm * 6.3;
		return {
			id: i,
			r: rVal,
			x: rVal * Math.cos(angle),
			y: rVal * Math.sin(angle),
			baseSize: i % 7 === 0 ? 2.6 : 1.9
		};
	});

	function psi2s(r) {
		return (1 - r / 2) * Math.exp(-r / 2);
	}

	function visualBar(val, maxPx) {
		if (Math.abs(val) < 0.002) return 0;
		return Math.sign(val) * Math.pow(Math.min(1, Math.abs(val)), 0.72) * maxPx;
	}

	// Текущая глубина r (0..6.3) вычисляется из угла cycleDeg (0..720°)
	let radius = $derived.by(() => {
		const phaseInLap = cycleDeg % 360; // 0..360 внутри одного такта
		// 0..180° -> спуск от 6.3 до 0; 180..360° -> подъём от 0 до 6.3
		const distFromTop = phaseInLap <= 180 ? phaseInLap / 180 : (360 - phaseInLap) / 180;
		return +(6.3 * (1 - distFromTop)).toFixed(3);
	});

	// Показания для орбитали 2s (360°) и спинора (720°)
	let telemetry = $derived.by(() => {
		const v2s = psi2s(radius);
		const depthRatio = 1 - radius / 6.3;
		const yOrbital = -82 + depthRatio * 176;

		const spinNorm = (cycleDeg % 720) / 720;
		const ySpin = -82 + spinNorm * 176;

		const spinPhase = Math.cos(((cycleDeg * Math.PI) / 180) * 0.5);
		const isSecondLap = cycleDeg >= 360 && cycleDeg < 720;
		const lapNumber = isSecondLap ? 2 : 1;

		const probeColor = isSecondLap ? 'var(--w-accent-cold)' : 'var(--w-accent)';
		const w2 = visualBar(v2s, 44);
		const color2 = v2s < 0 ? '#2dd4bf' : 'var(--w-accent)';
		const spinDir = isSecondLap ? -34 : 34;

		return {
			v2s,
			yOrbital,
			ySpin,
			spinPhase,
			isSecondLap,
			lapNumber,
			probeColor,
			w2,
			color2,
			spinDir
		};
	});

	// Отрисовка бусин 2s-орбитали
	let renderedBeads = $derived.by(() => {
		const scale = 15.5;
		return beads.map((b) => {
			const val = psi2s(b.r);
			const absVal = Math.abs(val);
			const visualWeight = Math.min(1, Math.pow(absVal, 0.65) * 1.15);
			return {
				id: b.id,
				cx: b.x * scale,
				cy: b.y * scale,
				r: b.baseSize * (0.35 + 0.95 * visualWeight),
				opacity: 0.08 + 0.88 * visualWeight,
				isNegative: val < 0
			};
		});
	});

	// Отслеживание прохода через зону тишины r = 2.0 a0
	$effect(() => {
		const diff = radius - 2.0;
		const crossed = (prevDiff > 0 && diff <= 0) || (prevDiff < 0 && diff >= 0);
		const near = Math.abs(diff) < 0.22;
		prevDiff = diff;

		if (crossed || near) {
			badgeHold = true;
			clearTimeout(badgeTimer);
			badgeTimer = setTimeout(() => {
				badgeHold = false;
			}, 500);
		}
	});

	function togglePlay() {
		isPlaying = !isPlaying;
	}

	function handleSliderInput() {
		isPlaying = false;
	}

	function jumpToLap(targetDeg) {
		isPlaying = false;
		cycleDeg = targetDeg;
	}

	function resetWidget() {
		isPlaying = false;
		cycleDeg = 0;
		badgeHold = false;
		clearTimeout(badgeTimer);
	}

	$effect(() => {
		if (!isPlaying) return;
		let last = performance.now();

		function loop(now) {
			if (!isPlaying) return;
			const dt = Math.min((now - last) / 1000, 0.05);
			last = now;

			// Один такт (360°) занимает ~3.4 сек, полный цикл спинора (720°) ~6.8 сек
			cycleDeg = (cycleDeg + dt * 105) % 720;
			animId = requestAnimationFrame(loop);
		}

		animId = requestAnimationFrame(loop);
		return () => {
			if (animId) cancelAnimationFrame(animId);
		};
	});

	onMount(() => {
		cycleDeg = 0;
		isPlaying = false;
	});


</script>

<div class="z-widget">
	<div class="z-widget-toolbar">
		<span class="z-widget-label">Фаза цикла:</span>
		<button
			class="z-widget-btn"
			class:active={cycleDeg < 180 && !isPlaying}
			onclick={() => jumpToLap(0)}
		>
			0° (Старт, такт 1)
		</button>
		<button
			class="z-widget-btn"
			class:active={cycleDeg >= 355 && cycleDeg <= 365 && !isPlaying}
			onclick={() => jumpToLap(360)}
		>
			360° (Смена цвета!)
		</button>
		<button
			class="z-widget-btn"
			class:active={cycleDeg >= 710 && !isPlaying}
			onclick={() => jumpToLap(719)}
		>
			720° (Возврат)
		</button>

		<div class="z-widget-spacer"></div>

		<button class="z-widget-btn primary" onclick={togglePlay}>
			{isPlaying ? 'Пауза' : 'Пуск погружения'}
		</button>
	</div>

	<div class="z-widget-toolbar slider-row">
		<label class="slider-control">
			<span class="z-widget-label">
				Угол цикла: <strong>{Math.round(cycleDeg)}° / 720°</strong>
				<span class="node-badge" class:visible={badgeHold}>Зона тишины 2s!</span>
			</span>
			<input
				type="range"
				min="0"
				max="720"
				step="1"
				bind:value={cycleDeg}
				oninput={handleSliderInput}
			/>
		</label>

		<div class="telemetry-pills">
			<span class="pill">
				Глубина: <strong>{radius.toFixed(2)} a₀</strong>
			</span>
			<span class="pill">
				Такт: <strong>{telemetry.lapNumber} из 2</strong>
			</span>
		</div>
	</div>

	<div class="z-widget-stage">
		<svg
			viewBox="-250 -138 500 276"
			width="100%"
			height="330"
			ondblclick={resetWidget}
			role="img"
			aria-label="Возбуждённый водород 2s и смена цвета спинора за 720 градусов"
		>
			<!-- Вертикальный разделитель -->
			<line x1="-18" y1="-122" x2="-18" y2="122" stroke="var(--w-border)" stroke-dasharray="3 4" />

			<!-- ==================== ЛЕВАЯ СЦЕНА: ВОЗБУЖДЁННЫЙ ВОДОРОД (2s) ==================== -->
			<g transform="translate(-134, 10)">
				<text x="0" y="-126" text-anchor="middle" fill="var(--w-text-muted)" font-size="10.5" font-weight="600">
					ВОДОРОД НА ЭТАЖЕ 2s
				</text>

				<circle cx="0" cy="0" r={6.3 * 15.5} fill="none" stroke="var(--w-border)" stroke-width="1" />

				{#each renderedBeads as b (b.id)}
					<circle
						cx={b.cx}
						cy={b.cy}
						r={b.r}
						fill={b.isNegative ? '#2dd4bf' : 'var(--w-accent)'}
						opacity={b.opacity}
					/>
				{/each}

				<!-- Узловая сфера 2s (зона тишины на r = 2.0 a0) -->
				<circle
					cx="0"
					cy="0"
					r={2.0 * 15.5}
					fill="none"
					stroke="#2dd4bf"
					stroke-width="1.2"
					stroke-dasharray="3 3"
					opacity="0.85"
				/>

				<!-- Вертикальная скважина -->
				<line
					x1="0"
					y1={-6.3 * 15.5}
					x2="0"
					y2="0"
					stroke="rgba(248, 250, 252, 0.35)"
					stroke-width="6"
					stroke-linecap="round"
				/>
				<line
					x1="0"
					y1={-6.3 * 15.5}
					x2="0"
					y2="0"
					stroke="var(--w-text)"
					stroke-width="1"
					stroke-dasharray="2 2"
				/>

				<text x="8" y={-6.3 * 15.5 + 4} fill="var(--w-text-muted)" font-size="8.5">Край (6.3)</text>
				<text x="8" y="4" fill="var(--w-text)" font-size="8.5" font-weight="600">Центр (0)</text>

				<circle cx="0" cy="0" r="3.5" fill="#f8fafc" />

				<!-- Путешественник-зонд -->
				<g transform={`translate(0, ${-radius * 15.5})`}>
					<circle
						cx="0"
						cy="0"
						r="8.5"
						fill="rgba(15, 23, 42, 0.9)"
						stroke={telemetry.probeColor}
						stroke-width="2.2"
					/>
					<circle cx="0" cy="0" r="4" fill={telemetry.probeColor} />
					<text x="-13" y="3" text-anchor="end" fill={telemetry.probeColor} font-size="9.5" font-weight="700">
						{telemetry.isSecondLap ? 'Зонд (−ψ)' : 'Зонд (+ψ)'}
					</text>
				</g>
			</g>

			<!-- ==================== ПРАВАЯ СЦЕНА: ОРБИТАЛЬ (360°) И СПИНОР (720°) ==================== -->
			<g transform="translate(0, 0)">
				<text x="116" y="-116" text-anchor="middle" fill="var(--w-text-muted)" font-size="10.5" font-weight="600">
					ОДИН ТАКТ (360°) ПРОТИВ ДВУХ (720°)
				</text>

				<!-- ---------- ШКАЛА 1: ОРБИТАЛЬ 2s (0–360°) ---------- -->
				<g transform="translate(56, 0)">
					<text x="0" y="-96" text-anchor="middle" fill="#2dd4bf" font-size="10" font-weight="600">
						Орбиталь 2s (360°)
					</text>
					<text x="0" y="-86" text-anchor="middle" fill="var(--w-text-muted)" font-size="8">Край (0° / 360°)</text>
					<text x="0" y="106" text-anchor="middle" fill="var(--w-text-muted)" font-size="8">Центр (180°)</text>

					<!-- Отметка зоны тишины -->
					<line x1="-6" y1={yNode} x2="6" y2={yNode} stroke="#2dd4bf" stroke-width="1.2" />

					<line x1="0" y1="-82" x2="0" y2="94" stroke="var(--w-border)" stroke-width="2" />
					<line x1="-4" y1="-82" x2="4" y2="-82" stroke="var(--w-text-muted)" stroke-width="1" />
					<line x1="-4" y1="94" x2="4" y2="94" stroke="var(--w-text-muted)" stroke-width="1" />

					<!-- {@const w2 = visualBar(telemetry.v2s, 44)}
					{@const color2 = telemetry.v2s < 0 ? '#2dd4bf' : 'var(--w-accent)'} -->
					<line
						x1="0"
						y1={telemetry.yOrbital}
                        x2={telemetry.w2} 
                        y2={telemetry.yOrbital}
                        stroke={telemetry.color2}
                        fill={telemetry.color2}   						
						stroke-width="5"
						stroke-linecap="round"
					/>
					<circle cx="0" cy={telemetry.yOrbital} r="3" fill={telemetry.color2} />
					<text x="0" y="122" text-anchor="middle" fill={telemetry.color2} font-size="9" font-weight="600">
						{Math.round(cycleDeg % 360)}° | {telemetry.v2s >= 0 ? `+${telemetry.v2s.toFixed(2)}` : telemetry.v2s.toFixed(2)}
					</text>
				</g>

				<!-- ---------- ШКАЛА 2: СПИНОР ЭЛЕКТРОНА (0–720°) ---------- -->
				<g transform="translate(178, 0)">
					<text x="0" y="-96" text-anchor="middle" fill="var(--w-accent)" font-size="10" font-weight="600">
						Спинор (720°)
					</text>
					<text x="0" y="-86" text-anchor="middle" fill="var(--w-text-muted)" font-size="8">0° / 720° (+ψ)</text>
					<text x="0" y="106" text-anchor="middle" fill="var(--w-text-muted)" font-size="8">Конец 2-го такта</text>

					<!-- Середина шкалы спинора: отметка 360° (смена фазы на -ψ) -->
					<line x1="-8" y1="6" x2="8" y2="6" stroke="var(--w-accent-cold)" stroke-width="1.4" stroke-dasharray="2 2" />
					<text x="12" y="9" fill="var(--w-accent-cold)" font-size="8" font-weight="600">360° (−ψ)</text>

					<line x1="0" y1="-82" x2="0" y2="94" stroke="var(--w-border)" stroke-width="2" />
					<line x1="-4" y1="-82" x2="4" y2="-82" stroke="var(--w-text-muted)" stroke-width="1" />
					<line x1="-4" y1="94" x2="4" y2="94" stroke="var(--w-text-muted)" stroke-width="1" />

					<!-- {@const spinColor = telemetry.isSecondLap ? 'var(--w-accent-cold)' : 'var(--w-accent)'}
					{@const spinDir = telemetry.isSecondLap ? -34 : 34} -->
					<line
						x1="0"
						y1={telemetry.ySpin}
                        x2={telemetry.spinDir} 
                        stroke={telemetry.probeColor} 
                        fill={telemetry.probeColor}						
                        y2={telemetry.ySpin}
						stroke-width="5"
						stroke-linecap="round"
					/>
					<circle cx="0" cy={telemetry.ySpin} r="3.5" fill="#f8fafc" />
					<text x="0" y="122" text-anchor="middle" fill={telemetry.spinColor} font-size="9" font-weight="700">
						{Math.round(cycleDeg)}° ({telemetry.isSecondLap ? '−ψ' : '+ψ'})
					</text>
				</g>
			</g>
		</svg>
	</div>

	<div class="z-widget-footer">
		<p>
			<strong style="color: var(--w-accent)">Два такта на один возврат.</strong>
			За первый спуск и подъём (360°) 2s-орбиталь завершает полный цикл, но цвет зонда в скважине инвертируется (+ψ → −ψ). Только после второго круга (720°) зонд возвращает исходный цвет.
		</p>
	</div>
</div>

<style lang="scss">
	.slider-row {
		border-top: 1px solid var(--w-border);
		padding-top: 0.55rem;
		gap: 1rem;
		justify-content: space-between;
	}

	.slider-control {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex: 1;
		min-width: 220px;

		strong {
			color: var(--w-accent);
		}

		input[type='range'] {
			flex: 1;
			accent-color: var(--w-accent);
			cursor: pointer;
		}
	}

	.node-badge {
		display: inline-block;
		margin-left: 0.4rem;
		padding: 0.1rem 0.45rem;
		border-radius: 999px;
		font-size: 0.72rem;
		font-weight: 600;
		color: #0f172a;
		background: #2dd4bf;
		opacity: 0;
		visibility: hidden;
		transition: opacity 0.15s ease;

		&.visible {
			opacity: 1;
			visibility: visible;
		}
	}

	.telemetry-pills {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.pill {
		font-size: 0.78rem;
		color: var(--w-text-muted);
		background: var(--w-bg-card);
		border: 1px solid var(--w-border);
		border-radius: 999px;
		padding: 0.2rem 0.65rem;

		strong {
			color: var(--w-text);
		}
	}
</style>
