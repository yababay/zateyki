<script>
	import { onMount } from 'svelte';
	import '#lib/styles/widget.scss';

	// Прогресс трансформации:
	// 0.0 -> натянутая прямая нитка
	// 0.5 -> провисшая дуга (полуволна)
	// 1.0 -> бусины рассыпались по концентрическим кольцам вокруг нижней точки
	let progress = $state(0.0);
	let isPlaying = $state(false);
	let animId = null;

	// 96 бусин на нитке (индекс 0..95)
	const TOTAL_BEADS = 96;

	// Детерминированные точки для финального распределения по концентрическим кольцам
	const beadsData = Array.from({ length: TOTAL_BEADS }, (_, i) => {
		// Позиция на нитке: t от -1 (левый конец) до +1 (правый конец), 0 = середина
		const t = (i / (TOTAL_BEADS - 1)) * 2 - 1;
		const absT = Math.abs(t);

		// Целевой радиус в круге: чем ближе бусина к середине нитки (absT -> 0),
		// тем ближе она к центру круга, причём плотность к центру резко возрастает
		const targetR = Math.pow(absT, 1.45) * 102;
		// Равномерный угол по золотому сечению + лёгкая привязка к левой/правой половине нитки
		const goldenAngle = i * 2.399963229728653;
		const sideBias = t < 0 ? Math.PI * 0.5 : -Math.PI * 0.5;
		const targetAngle = goldenAngle + sideBias * 0.15;

		return {
			id: i,
			t,
			absT,
			targetR,
			targetAngle,
			size: absT < 0.25 ? 2.7 : 2.1
		};
	});

	// Плавная интерполяция (smoothstep)
	function smoothstep(edge0, edge1, x) {
		const u = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
		return u * u * (3 - 2 * u);
	}

	// Вычисляем координаты каждой бусины на текущем шаге progress
	let renderedBeads = $derived.by(() => {
		// Этап 1 (0 -> 0.5): провисание нитки
		const sagFactor = smoothstep(0.0, 0.5, progress);
		// Этап 2 (0.5 -> 1.0): рассыпание по концентрическим кольцам
		const ringFactor = smoothstep(0.5, 1.0, progress);

		return beadsData.map((b) => {
			// 1. Положение на натянутой/провисшей нитке
			// Концы нитки сближаются при провисании (от ±210 до ±135)
			const halfSpan = 210 - 75 * sagFactor;
			const xRope = b.t * halfSpan;
			// Купол полуволны вниз (максимум провисания в центре y = +65)
			const sagDepth = 88 * sagFactor;
			const yRope = -35 + sagDepth * Math.cos((b.t * Math.PI) / 2);

			// 2. Положение в концентрических кольцах (центр в (0, 8))
			const xRing = b.targetR * Math.cos(b.targetAngle);
			const yRing = 8 + b.targetR * Math.sin(b.targetAngle);

			return {
				id: b.id,
				x: xRope * (1 - ringFactor) + xRing * ringFactor,
				y: yRope * (1 - ringFactor) + yRing * ringFactor,
				size: b.size,
				// В центре круга бусины ярче и плотнее
				opacity: 0.45 + 0.55 * (1 - b.absT * 0.75)
			};
		});
	});

	// SVG-кривая самой нитки (исчезает, когда бусины рассыпаются по кольцам)
	let ropePath = $derived.by(() => {
		const sagFactor = smoothstep(0.0, 0.5, progress);
		const halfSpan = 210 - 75 * sagFactor;
		const sagDepth = 88 * sagFactor;

		const pts = [];
		const steps = 40;
		for (let i = 0; i <= steps; i++) {
			const t = (i / steps) * 2 - 1;
			const x = t * halfSpan;
			const y = -35 + sagDepth * Math.cos((t * Math.PI) / 2);
			pts.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`);
		}
		return pts.join(' ');
	});

	let ropeOpacity = $derived(1 - smoothstep(0.5, 0.72, progress));
	let ringsOpacity = $derived(smoothstep(0.48, 0.85, progress));

	let stageDescription = $derived.by(() => {
		if (progress < 0.2) {
			return {
				title: 'Этап 1. Натянутая нитка (бесконечный радиус).',
				text: 'Бусины нанизаны на нитку на равном расстоянии друг от друга. Концы нитки разведены далеко в стороны.'
			};
		}
		if (progress < 0.65) {
			return {
				title: 'Этап 2. Провисшая полуволна.',
				text: 'Концы нитки сблизили — она провисла единым куполом без перегибов. Внизу (в центре будущего атома) бусин на единицу ширины стало заметно больше.'
			};
		}
		return {
			title: 'Этап 3. Концентрические кольца (1s-орбиталь).',
			text: 'Окружили нижнюю точку кольцами и рассыпали бусины по площадям: в самом центре плотность максимальна, а к далёким концам нитки сходит на нет.'
		};
	});

	function setPreset(val) {
		isPlaying = false;
		progress = val;
	}

	function togglePlay() {
		if (!isPlaying && progress >= 0.99) {
			progress = 0;
		}
		isPlaying = !isPlaying;
	}

	function resetWidget() {
		isPlaying = false;
		progress = 0;
	}

	$effect(() => {
		if (!isPlaying) return;
		let last = performance.now();

		function loop(now) {
			if (!isPlaying) return;
			const dt = Math.min((now - last) / 1000, 0.05);
			last = now;
			progress = Math.min(1, progress + dt * 0.28);
			if (progress >= 1) {
				isPlaying = false;
				return;
			}
			animId = requestAnimationFrame(loop);
		}

		animId = requestAnimationFrame(loop);
		return () => {
			if (animId) cancelAnimationFrame(animId);
		};
	});

	onMount(() => {
		progress = 0;
	});
</script>

<div class="z-widget">
	<div class="z-widget-toolbar">
		<span class="z-widget-label">Этап:</span>
		<button
			class="z-widget-btn"
			class:active={progress < 0.1 && !isPlaying}
			onclick={() => setPreset(0)}
		>
			1. Натянутая нитка
		</button>
		<button
			class="z-widget-btn"
			class:active={progress >= 0.45 && progress <= 0.55 && !isPlaying}
			onclick={() => setPreset(0.5)}
		>
			2. Провисшая дуга
		</button>
		<button
			class="z-widget-btn"
			class:active={progress >= 0.95 && !isPlaying}
			onclick={() => setPreset(1)}
		>
			3. Кольца 1s-орбитали
		</button>

		<div class="z-widget-spacer"></div>

		<button class="z-widget-btn primary" onclick={togglePlay}>
			{isPlaying ? 'Пауза' : progress >= 0.99 ? 'Сначала' : 'Пуск'}
		</button>
	</div>

	<div class="z-widget-toolbar slider-row">
		<label class="slider-control">
			<span class="z-widget-label">
				Превращение: <strong>{Math.round(progress * 100)}%</strong>
			</span>
			<input
				type="range"
				min="0"
				max="1"
				step="0.01"
				bind:value={progress}
				oninput={() => (isPlaying = false)}
			/>
		</label>
	</div>

	<div class="z-widget-stage">
		<svg
			viewBox="-240 -125 480 265"
			width="100%"
			height="300"
			ondblclick={resetWidget}
			role="img"
			aria-label="Превращение натянутой нитки с бусинами в концентрические кольца 1s-орбитали"
		>
			<!-- Концентрические кольца (проявляются на 3-м этапе) -->
			<g opacity={ringsOpacity}>
				{#each [22, 44, 66, 88, 108] as ringR}
					<circle
						cx="0"
						cy="8"
						r={ringR}
						fill="none"
						stroke="var(--w-border)"
						stroke-width="1"
						stroke-dasharray="3 3"
					/>
				{/each}
				<text x="0" y="-108" text-anchor="middle" fill="var(--w-text-muted)" font-size="9.5">
					Зона тишины — далеко на краях (концы нитки)
				</text>
			</g>

			<!-- Сама нитка и опоры на её концах -->
			{#if ropeOpacity > 0.01}
				<path
					d={ropePath}
					fill="none"
					stroke="var(--w-text-muted)"
					stroke-width="1.2"
					opacity={ropeOpacity * 0.65}
				/>
				{@const sagFactor = Math.min(1, progress * 2)}
				{@const endX = 210 - 75 * (sagFactor * sagFactor * (3 - 2 * sagFactor))}
				<circle cx={-endX} cy="-35" r="4" fill="var(--w-text-muted)" opacity={ropeOpacity} />
				<circle cx={endX} cy="-35" r="4" fill="var(--w-text-muted)" opacity={ropeOpacity} />
			{/if}

			<!-- Бусины -->
			{#each renderedBeads as b (b.id)}
				<circle
					cx={b.x}
					cy={b.y}
					r={b.size}
					fill="var(--w-accent)"
					opacity={b.opacity}
				/>
			{/each}

			<!-- Ядро в центре (появляется при формировании колец) -->
			<circle cx="0" cy="8" r="3" fill="#f8fafc" opacity={ringsOpacity} />
		</svg>
	</div>

	<div class="z-widget-footer">
		<p>
			<strong style="color: var(--w-accent)">{stageDescription.title}</strong> {stageDescription.text}
			Двойной щелчок сбрасывает вид.
		</p>
	</div>
</div>

<style lang="scss">
	.slider-row {
		border-top: 1px solid var(--w-border);
		padding-top: 0.55rem;
	}

	.slider-control {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		width: 100%;

		strong {
			color: var(--w-accent);
		}

		input[type='range'] {
			flex: 1;
			accent-color: var(--w-accent);
			cursor: pointer;
		}
	}
</style>
