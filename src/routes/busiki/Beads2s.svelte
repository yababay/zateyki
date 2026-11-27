<script>
	import { onMount } from 'svelte';
	import '#lib/styles/widget.scss';

	// Прогресс скручивания оси симметрии синусоиды:
	// 0.0 -> прямая синусоида (верх оранжевый, низ бирюзовый)
	// 0.5 -> ось согнута в дугу (низ плотнее, верх разреженнее)
	// 1.0 -> ось замкнута в круг-границу (зону тишины), внутри плотно бирюзовые, снаружи разреженно оранжевые
	let bend = $state(0.0);
	let isPlaying = $state(false);
	let animId = null;

	// 120 бусин: 60 в нижней полуволне (бирюзовые, уходят внутрь), 60 в верхней (оранжевые, уходят наружу)
	// Важно: ни одна бусина не лежит на самой оси симметрии (зоне тишины)
	const HALF_COUNT = 60;

	const lowerBeads = Array.from({ length: HALF_COUNT }, (_, i) => {
		// Угол вдоль нижней полуволны от 0.08π до 0.92π (избегаем 0 и π — самой оси тишины)
		const phase = 0.08 * Math.PI + (i / (HALF_COUNT - 1)) * 0.84 * Math.PI;
		const amp = Math.sin(phase); // 0..1 (максимум в середине полуволны)
		// Позиция вдоль оси x: -1..0
		const u = -1 + (i + 0.5) / HALF_COUNT;
		// В финальном круге (радиус зоны тишины R_NODE = 56):
		// чем больше amp, тем ближе бусина к центру (R -> 0); чем ближе к оси, тем ближе к R_NODE
		const targetR = (1 - Math.pow(amp, 0.75)) * 51;
		const targetAngle = i * 2.399963229728653;

		return {
			id: `low-${i}`,
			u,
			amp,
			targetR,
			targetAngle,
			isLower: true
		};
	});

	const upperBeads = Array.from({ length: HALF_COUNT }, (_, i) => {
		const phase = 0.08 * Math.PI + (i / (HALF_COUNT - 1)) * 0.84 * Math.PI;
		const amp = Math.sin(phase);
		// Позиция вдоль оси x: 0..+1
		const u = (i + 0.5) / HALF_COUNT;
		// В финальном круге уходят наружу от R_NODE = 56 до R = 114 (объём больше -> разреженнее)
		const targetR = 61 + Math.pow(amp, 0.7) * 53;
		const targetAngle = i * 2.399963229728653 + 1.1;

		return {
			id: `up-${i}`,
			u,
			amp,
			targetR,
			targetAngle,
			isLower: false
		};
	});

	const allBeads = [...lowerBeads, ...upperBeads];

	function smoothstep(edge0, edge1, x) {
		const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
		return t * t * (3 - 2 * t);
	}

	// Вычисляем координаты бусин и самой оси симметрии при изгибании
	let sceneData = $derived.by(() => {
		const b = bend;
		// На первом этапе (0..0.65) ось изгибается в дугу, на втором (0.65..1.0) бусины равномерно заполняют площади
		const arcFactor = smoothstep(0.0, 0.72, b);
		const fillFactor = smoothstep(0.65, 1.0, b);

		// Угол раскрытия дуги оси симметрии: от почти 0 (прямая) до 2π (полный круг)
		const totalSweep = 0.02 + arcFactor * (Math.PI * 2 - 0.02);
		// Длина оси постоянна: L = 340 px -> радиус кривизны R_arc = L / totalSweep
		const arcLength = 352;
		const rArc = arcLength / totalSweep;
		// Сдвигаем центр окружности так, чтобы вершина дуги оставалась в районе y = 8
		const circleCenterY = 8 + rArc * (1 - arcFactor * 0.92);

		// Координаты самой оси симметрии (зоны тишины)
		const axisPts = [];
		const axisSteps = 64;
		for (let i = 0; i <= axisSteps; i++) {
			// Параметр s от -1 до +1 вдоль всей длины синусоиды
			const s = (i / axisSteps) * 2 - 1;
			// Угол на дуге (s = 0 наверху, -π/2; концы смыкаются внизу, +3π/2)
			const alpha = -Math.PI / 2 + s * (totalSweep / 2);
			const ax = rArc * Math.cos(alpha);
			const ay = circleCenterY + rArc * Math.sin(alpha);
			axisPts.push(`${i === 0 ? 'M' : 'L'} ${ax.toFixed(1)} ${ay.toFixed(1)}`);
		}

		// Координаты всех бусин
		const beads = allBeads.map((item) => {
			// Позиция вдоль дуги: u от -1 до +1
			const alpha = -Math.PI / 2 + item.u * (totalSweep / 2);
			// Смещение от оси по нормали: для верхней (оранжевой) наружу (+), для нижней (бирюзовой) внутрь (-)
			const maxOffset = 46;
			const radialShift = item.isLower
				? -item.amp * maxOffset * (1 - 0.18 * arcFactor)
				: item.amp * maxOffset * (1 + 0.15 * arcFactor);

			const rCur = Math.max(4, rArc + radialShift);
			const xArc = rCur * Math.cos(alpha);
			const yArc = circleCenterY + rCur * Math.sin(alpha);

			// Финальное равномерное заполнение внутреннего круга и внешнего кольца (центр в (0, 8))
			const xRing = item.targetR * Math.cos(item.targetAngle);
			const yRing = 8 + item.targetR * Math.sin(item.targetAngle);

			return {
				id: item.id,
				x: xArc * (1 - fillFactor) + xRing * fillFactor,
				y: yArc * (1 - fillFactor) + yRing * fillFactor,
				isLower: item.isLower,
				size: item.isLower ? 2.3 : 2.1,
				opacity: item.isLower ? 0.9 : 0.78
			};
		});

		return {
			axisPath: axisPts.join(' '),
			beads,
			fillFactor
		};
	});

	let stageInfo = $derived.by(() => {
		if (bend < 0.2) {
			return {
				title: 'Этап 1. Полный цикл синусоиды (две полуволны).',
				text: 'Верхняя полуволна (оранжевая) и нижняя (бирюзовая) симметричны. На самой оси симметрии бусин нет — это будущая зона тишины.'
			};
		}
		if (bend < 0.72) {
			return {
				title: 'Этап 2. Ось симметрии согнули в дугу.',
				text: 'Внутренняя сторона дуги сжимается, и бирюзовые бусины сбиваются плотнее. Наружная сторона растягивается — оранжевые бусины расходятся свободнее.'
			};
		}
		return {
			title: 'Этап 3. Свёрнутое кольцо (2s-орбиталь).',
			text: 'Ось симметрии замкнулась в окружность тишины. Внутри неё бирюзовые бусины лежат плотным ядрышком, а снаружи оранжевые образуют разреженную оболочку.'
		};
	});

	function setPreset(val) {
		isPlaying = false;
		bend = val;
	}

	function togglePlay() {
		if (!isPlaying && bend >= 0.99) {
			bend = 0;
		}
		isPlaying = !isPlaying;
	}

	function resetWidget() {
		isPlaying = false;
		bend = 0;
	}

	$effect(() => {
		if (!isPlaying) return;
		let last = performance.now();

		function loop(now) {
			if (!isPlaying) return;
			const dt = Math.min((now - last) / 1000, 0.05);
			last = now;
			bend = Math.min(1, bend + dt * 0.26);
			if (bend >= 1) {
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
		bend = 0;
	});
</script>

<div class="z-widget">
	<div class="z-widget-toolbar">
		<span class="z-widget-label">Этап:</span>
		<button
			class="z-widget-btn"
			class:active={bend < 0.1 && !isPlaying}
			onclick={() => setPreset(0)}
		>
			1. Синусоида
		</button>
		<button
			class="z-widget-btn"
			class:active={bend >= 0.45 && bend <= 0.6 && !isPlaying}
			onclick={() => setPreset(0.52)}
		>
			2. Изгиб в дугу
		</button>
		<button
			class="z-widget-btn"
			class:active={bend >= 0.95 && !isPlaying}
			onclick={() => setPreset(1)}
		>
			3. Кольцо 2s-орбитали
		</button>

		<div class="z-widget-spacer"></div>

		<button class="z-widget-btn primary" onclick={togglePlay}>
			{isPlaying ? 'Пауза' : bend >= 0.99 ? 'Сначала' : 'Пуск'}
		</button>
	</div>

	<div class="z-widget-toolbar slider-row">
		<label class="slider-control">
			<span class="z-widget-label">
				Скручивание оси: <strong>{Math.round(bend * 100)}%</strong>
			</span>
			<input
				type="range"
				min="0"
				max="1"
				step="0.01"
				bind:value={bend}
				oninput={() => (isPlaying = false)}
			/>
		</label>
	</div>

	<div class="z-widget-stage">
		<svg
			viewBox="-240 -125 480 265"
			width="100%"
			height="305"
			ondblclick={resetWidget}
			role="img"
			aria-label="Сворачивание двухполуволновой синусоиды в 2s-орбиталь с зоной тишины"
		>
			<!-- Внешний контур атома (появляется в финале) -->
			<circle
				cx="0"
				cy="8"
				r="116"
				fill="none"
				stroke="var(--w-border)"
				stroke-width="1"
				opacity={sceneData.fillFactor}
			/>

			<!-- Ось симметрии синусоиды, превращающаяся в круглую зону тишины -->
			<path
				d={sceneData.axisPath}
				fill="none"
				stroke="#f8fafc"
				stroke-width="1.4"
				stroke-dasharray="4 3"
				opacity="0.7"
			/>

			<!-- Подпись зоны тишины в финале -->
			{#if sceneData.fillFactor > 0.7}
				<text
					x="0"
					y="-54"
					text-anchor="middle"
					fill="#f8fafc"
					font-size="9.5"
					font-weight="600"
					opacity={sceneData.fillFactor}
				>
					Зона тишины (ось синусоиды)
				</text>
			{/if}

			<!-- Бусины -->
			{#each sceneData.beads as b (b.id)}
				<circle
					cx={b.x}
					cy={b.y}
					r={b.size}
					fill={b.isLower ? '#2dd4bf' : 'var(--w-accent)'}
					opacity={b.opacity}
				/>
			{/each}

			<!-- Центр (ядро) -->
			<circle cx="0" cy="8" r="3" fill="#f8fafc" opacity={sceneData.fillFactor} />
		</svg>
	</div>

	<div class="z-widget-footer">
		<p>
			<strong style="color: var(--w-accent)">{stageInfo.title}</strong> {stageInfo.text}
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
