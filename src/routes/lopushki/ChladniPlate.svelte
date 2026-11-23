<script lang="ts">
	import '#lib/styles/widget.scss'
	
	interface Props {
		/** Число диаметров тишины m (0 = круги, 1 = 2 сектора, 2 = 4 сектора, 3 = 6 секторов, 4 = 8 секторов) */
		diameters?: number;
		/** Число внутренних колец тишины k (0..3) */
		rings?: number;
		/** Запускать ли анимацию вибрации сразу */
		autoplay?: boolean;
	}

	let {
		diameters = $bindable(3),
		rings = $bindable(1),
		autoplay = false
	}: Props = $props();

	const initM = diameters;
	const initK = rings;

	let isPlaying = $state(false);
	let showSand = $state(true);
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
			phase = (phase + dt * 4.2) % (Math.PI * 2);
			frameId = requestAnimationFrame(tick);
		};

		frameId = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(frameId);
	});

	const R = 140;

	// Вычисляем радиусы внутренних колец тишины (узловых окружностей)
	const ringRadii = $derived.by(() => {
		const list = new Array<number>();
		for (let i = 1; i <= rings; i++) {
			list.push((i / (rings + 1)) * R);
		}
		return list;
	});

	// Генерируем «лоскуты» (секторные кольца) с чередованием фаз (+1 / -1)
	interface Patch {
		d: string;
		sign: number;
	}

	const patches = $derived.by(() => {
		const result = new Array<Patch>();
		const radialBounds = Array.of(0, ...ringRadii, R);
		const sectorCount = diameters === 0 ? 1 : diameters * 2;

		for (let ri = 0; ri < radialBounds.length - 1; ri++) {
			const r1 = radialBounds.at(ri) ?? 0;
			const r2 = radialBounds.at(ri + 1) ?? R;

			if (diameters === 0) {
				// Чисто концентрические кольца (удар строго в центр)
				const sign = ri % 2 === 0 ? 1 : -1;
				const d =
					r1 === 0
						? `M 0,${-r2} A ${r2},${r2} 0 1,1 0,${r2} A ${r2},${r2} 0 1,1 0,${-r2} Z`
						: `M 0,${-r2} A ${r2},${r2} 0 1,1 0,${r2} A ${r2},${r2} 0 1,1 0,${-r2} Z M 0,${-r1} A ${r1},${r1} 0 1,0 0,${r1} A ${r1},${r1} 0 1,0 0,${-r1} Z`;
				result.push({ d, sign });
			} else {
				for (let si = 0; si < sectorCount; si++) {
					const a1 = (si / sectorCount) * Math.PI * 2;
					const a2 = ((si + 1) / sectorCount) * Math.PI * 2;
					const sign = (ri + si) % 2 === 0 ? 1 : -1;

					const x1Out = r2 * Math.cos(a1);
					const y1Out = r2 * Math.sin(a1);
					const x2Out = r2 * Math.cos(a2);
					const y2Out = r2 * Math.sin(a2);
					const largeArc = a2 - a1 > Math.PI ? 1 : 0;

					let d = '';
					if (r1 === 0) {
						d = `M 0,0 L ${x1Out.toFixed(1)},${y1Out.toFixed(1)} A ${r2},${r2} 0 ${largeArc},1 ${x2Out.toFixed(1)},${y2Out.toFixed(1)} Z`;
					} else {
						const x1In = r1 * Math.cos(a1);
						const y1In = r1 * Math.sin(a1);
						const x2In = r1 * Math.cos(a2);
						const y2In = r1 * Math.sin(a2);
						d = `M ${x1In.toFixed(1)},${y1In.toFixed(1)} L ${x1Out.toFixed(1)},${y1Out.toFixed(1)} A ${r2},${r2} 0 ${largeArc},1 ${x2Out.toFixed(1)},${y2Out.toFixed(1)} L ${x2In.toFixed(1)},${y2In.toFixed(1)} A ${r1},${r1} 0 ${largeArc},0 ${x1In.toFixed(1)},${y1In.toFixed(1)} Z`;
					}
					result.push({ d, sign });
				}
			}
		}
		return result;
	});

	// Углы диаметров тишины
	const diameterAngles = $derived.by(() => {
		const list = new Array<number>();
		for (let i = 0; i < diameters; i++) {
			list.push((i / diameters) * 180);
		}
		return list;
	});

	// Генерируем «песчинки», оседающие на линиях тишины (ободе, кольцах и диаметрах)
	interface Grain {
		x: number;
		y: number;
	}

	const sandGrains = $derived.by(() => {
		const grains = new Array<Grain>();
		// Детерминированный псевдослучайный разброс, чтобы песок не дёргался при анимации
		let seed = diameters * 97 + rings * 31 + 17;
		const rand = () => {
			seed = (seed * 16807) % 2147483647;
			return (seed - 1) / 2147483646;
		};

		// Песок на концентрических кольцах и внешнем ободе
		const allCircles = Array.of(...ringRadii, R - 1.5);
		for (const rad of allCircles) {
			const count = Math.floor(rad * 1.4);
			for (let i = 0; i < count; i++) {
				const ang = (i / count) * Math.PI * 2 + (rand() - 0.5) * 0.08;
				const jitter = (rand() - 0.5) * 3.2;
				grains.push({
					x: (rad + jitter) * Math.cos(ang),
					y: (rad + jitter) * Math.sin(ang)
				});
			}
		}

		// Песок вдоль диаметров тишины
		for (const deg of diameterAngles) {
			const radAng = (deg * Math.PI) / 180;
			const count = 75;
			for (let i = 0; i < count; i++) {
				const pos = -R + (i / (count - 1)) * (R * 2);
				const perp = (rand() - 0.5) * 3.2;
				grains.push({
					x: pos * Math.cos(radAng) - perp * Math.sin(radAng),
					y: pos * Math.sin(radAng) + perp * Math.cos(radAng)
				});
			}
		}

		return grains;
	});

	const diameterOpts = Array.of(0, 1, 2, 3, 4);
	const ringOpts = Array.of(0, 1, 2, 3);

	function applyPreset(m: number, k: number) {
		diameters = m;
		rings = k;
	}

	function resetState() {
		diameters = initM;
		rings = initK;
		isPlaying = autoplay;
		showSand = true;
		phase = 0;
	}
</script>

<figure class="z-widget" aria-label="Интерактивная модель фигур Хладни на круглой мембране">
	<div class="z-widget-toolbar">
		<div class="z-widget-group">
			<span class="z-widget-label">Диаметры (дольки):</span>
			{#each diameterOpts as m}
				<button type="button" class="z-widget-btn" class:active={diameters === m} onclick={() => (diameters = m)}>
					{m === 0 ? '0 (круги)' : `${m} (${m * 2} долек)`}
				</button>
			{/each}
		</div>

		<div class="z-widget-group">
			<span class="z-widget-label">Кольца тишины:</span>
			{#each ringOpts as k}
				<button type="button" class="z-widget-btn" class:active={rings === k} onclick={() => (rings = k)}>
					{k}
				</button>
			{/each}
		</div>

		<div class="z-widget-group cp-actions">
			<label class="z-widget-check">
				<input type="checkbox" bind:checked={showSand} />
				<span>Песок Хладни</span>
			</label>

			<button type="button" class="z-widget-btn play-btn" onclick={() => (isPlaying = !isPlaying)}>
				{isPlaying ? 'Пауза' : 'Пуск'}
			</button>
		</div>
	</div>

	<div class="z-widget-stage with-sidebar" role="application" ondblclick={resetState}>
		<svg viewBox="-165 -165 330 330" class="z-widget-svg cp-svg">
			<!-- Вибрирующие секторы (фаза + и фаза -) -->
			{#each patches as p}
			{@const pulse = isPlaying ? Math.cos(phase) : 1}
				{@const intensity = p.sign * pulse}
				<path
					d={p.d}
					fill={intensity >= 0 ? '#f59e0b' : '#38bdf8'}
					fill-opacity={0.14 + Math.abs(intensity) * 0.36}
				/>
			{/each}

			<!-- Линии тишины: концентрические окружности -->
			{#each ringRadii as rad}
				<circle cx="0" cy="0" r={rad} class="nodal-line" />
			{/each}

			<!-- Линии тишины: диаметры -->
			{#each diameterAngles as deg}
				<line
					x1={-R}
					y1="0"
					x2={R}
					y2="0"
					class="nodal-line"
					transform="rotate({deg})"
				/>
			{/each}

			<!-- Песчинки, сбившиеся в узлы покоя -->
			{#if showSand}
				{#each sandGrains as g}
					<circle cx={g.x.toFixed(1)} cy={g.y.toFixed(1)} r="1.15" class="sand-dot" />
				{/each}
			{/if}

			<!-- Внешний жёсткий обод барабана -->
			<circle cx="0" cy="0" r={R} class="rim" />
		</svg>

		<div class="cp-presets">
			<span class="cp-presets-title">Характерные режимы:</span>
			<button type="button" class="z-widget-btn" onclick={() => applyPreset(0, 2)}>Удар строго в центр (кольца)</button>
			<button type="button" class="z-widget-btn" onclick={() => applyPreset(1, 0)}>Удар сбоку («качели», 2 дольки)</button>
			<button type="button" class="z-widget-btn" onclick={() => applyPreset(2, 0)}>Четырёхлистник (4 дольки)</button>
			<button type="button" class="z-widget-btn" onclick={() => applyPreset(3, 1)}>Холодец с кольцом (6 × 2)</button>
			<button type="button" class="z-widget-btn" onclick={() => applyPreset(4, 1)}>Сложный обертон (8 × 2)</button>
		</div>
	</div>

	<figcaption class="z-widget-footer cp-footer">
		Янтарные и голубые зоны колеблются в противофазе (одна вверх, соседняя вниз), а на границах между ними проходят неподвижные <b>линии тишины</b>, куда сползаются песчинки Хладни. Двойной щелчок сбрасывает настройки.
	</figcaption>
</figure>

<style lang="scss">
	.cp-actions {
		gap: 0.75rem;
	}

	.cp-svg {
		max-width: 300px;
	}

	.nodal-line {
		fill: none;
		stroke: var(--w-text-body);
		stroke-width: 1.1;
		stroke-opacity: 0.35;
		stroke-dasharray: 4 4;
	}

	.sand-dot {
		fill: #fef3c7;
		fill-opacity: 0.9;
	}

	.rim {
		fill: none;
		stroke: #786e5c;
		stroke-width: 4;
	}

	.cp-presets {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;

		.cp-presets-title {
			font-size: 0.78rem;
			color: var(--w-text-dim);
			margin-bottom: 0.15rem;
		}

		button {
			text-align: left;
			padding: 0.38rem 0.6rem;
			font-size: 0.78rem;
		}
	}

	.cp-footer {
		display: block;
	}
</style>
