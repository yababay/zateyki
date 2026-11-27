<script>
	import { onMount } from 'svelte';
	import '#lib/styles/widget.scss';

	let activeStage = $state(0);
	let smoothStage = $state(0);
	let animId = null;

	// 68 бусин (диаметр 4.6 px, шаг ~ 8.6 px)
	const TOTAL_BEADS = 68;
	const CENTER_Y = 14;
	const SPAN_X = 238; // Опоры у левого и правого краёв холста (-238 .. +238)
	const TOP_Y = -118; // Верхний уровень обеих опор
	const BOT_Y = 118;  // Нижний правый угол для старта диагонали
	const RING_RADII = new Array(28, 56, 84, 112);

	const beadsModel = (() => {
		// 1. Таблица длин дуги для провисшей нитки от (-238, -118) до (+238, -118) с нижней точкой (0, 14)
		const SAMPLES = 400;
		const arcTable = new Array();
		let totalArc = 0;
		let prevX = -SPAN_X;
		let prevY = TOP_Y;

		for (let k = 0; k <= SAMPLES; k++) {
			const t = (k / SAMPLES) * 2 - 1; // -1 .. +1
			const x = SPAN_X * t;
			const y = TOP_Y + (CENTER_Y - TOP_Y) * Math.cos((t * Math.PI) / 2);
			if (k > 0) {
				totalArc += Math.hypot(x - prevX, y - prevY);
			}
			arcTable.push({ t, x, y, arc: totalArc });
			prevX = x;
			prevY = y;
		}

		function pointAtArc(u) {
			const targetArc = u * totalArc;
			let lo = 0;
			let hi = SAMPLES;
			while (lo < hi - 1) {
				const mid = (lo + hi) >> 1;
				if (arcTable[mid].arc < targetArc) lo = mid;
				else hi = mid;
			}
			const a = arcTable[lo];
			const b = arcTable[hi];
			const span = b.arc - a.arc || 1;
			const frac = (targetArc - a.arc) / span;
			return {
				x: a.x + (b.x - a.x) * frac,
				y: a.y + (b.y - a.y) * frac
			};
		}

		// 2. Координаты на диагонали (этап 0) и на провисшей дуге (этапы 1 и 2)
		const raw = Array.from({ length: TOTAL_BEADS }, (_, i) => {
			const u = i / (TOTAL_BEADS - 1);

			// Этап 0: натянутая диагональ (-238, -118) -> (+238, +118)
			const x0 = -SPAN_X + u * (SPAN_X * 2);
			const y0 = TOP_Y + u * (BOT_Y - TOP_Y);

			// Этапы 1 и 2: провисшая дуга между (-238, -118) и (+238, -118)
			const pt1 = pointAtArc(u);
			const distFromBottom = Math.hypot(pt1.x, pt1.y - CENTER_Y);

			// Попадание в 4 внутренних кольца или во внешнее пространство (bandIndex = 4)
			let bandIndex = 4;
			if (distFromBottom <= 28) bandIndex = 0;
			else if (distFromBottom <= 56) bandIndex = 1;
			else if (distFromBottom <= 84) bandIndex = 2;
			else if (distFromBottom <= 112) bandIndex = 3;

			return {
				id: i,
				u,
				x0,
				y0,
				x1: pt1.x,
				y1: pt1.y,
				distFromBottom,
				bandIndex
			};
		});

		// 3. Группировка по поясам: 0..3 внутри атома, 4 — во внешнем пространстве за пределами 4-го кольца
		const bands = new Array(new Array(), new Array(), new Array(), new Array(), new Array());
		raw.forEach((b) => bands[b.bandIndex].push(b));

		bands.forEach((group, bIdx) => {
			const count = group.length;
			if (bIdx < 4) {
				// Внутренние кольца атома
				const rMin = bIdx === 0 ? 0 : RING_RADII[bIdx - 1];
				const rMax = RING_RADII[bIdx];

				group.forEach((b, idxInBand) => {
					const frac = (idxInBand + 0.5) / Math.max(1, count);
					const r3 = Math.sqrt(rMin * rMin + frac * (rMax * rMax - rMin * rMin));
					const angle3 = idxInBand * 2.399963229728653 + bIdx * 1.15;
					b.x3 = r3 * Math.cos(angle3);
					b.y3 = CENTER_Y + r3 * Math.sin(angle3);
				});
			} else {
				// Внешние бусины остаются снаружи (r > 115) и рассеиваются по внешнему пространству холста
				group.forEach((b, idxInBand) => {
					const frac = (idxInBand + 0.5) / Math.max(1, count);
					// Чем дальше бусина была от центра на нитке, тем дальше она уходит во внешнюю пустоту
					const r3 = 116 + Math.pow(frac, 0.85) * 145;
					// Ориентируем угол в ту же полуплоскость (левую или правую), откуда пришла бусина
					const baseAngle = b.x1 < 0 ? Math.PI : 0;
					const spread = ((idxInBand * 1.73205) % 1 - 0.5) * 1.45;
					const angle3 = baseAngle + spread;

					b.x3 = Math.max(-242, Math.min(242, r3 * Math.cos(angle3)));
					b.y3 = Math.max(-124, Math.min(130, CENTER_Y + r3 * Math.sin(angle3) * 0.72));
				});
			}
		});

		return raw;
	})();

	function lerp(a, b, t) {
		return a + (b - a) * t;
	}

	function smoothstep(t) {
		const c = Math.max(0, Math.min(1, t));
		return c * c * (3 - 2 * c);
	}

	let scene = $derived.by(() => {
		const s = smoothStage;

		const beads = beadsModel.map((b) => {
			let x, y;
			if (s <= 1) {
				const t = smoothstep(s);
				x = lerp(b.x0, b.x1, t);
				y = lerp(b.y0, b.y1, t);
			} else if (s <= 2) {
				x = b.x1;
				y = b.y1;
			} else {
				const t = smoothstep(s - 2);
				x = lerp(b.x1, b.x3, t);
				y = lerp(b.y1, b.y3, t);
			}

			// Внешние бусины на 4-й стадии становятся более разреженными и приглушёнными
			const finalOpacity = b.bandIndex === 4 ? 0.42 : 0.96 - b.bandIndex * 0.09;
			const opacity = s <= 2 ? 0.95 : lerp(0.95, finalOpacity, smoothstep(s - 2));

			return {
				id: b.id,
				x,
				y,
				opacity
			};
		});

		const ropeOpacity = s <= 2 ? 1 : Math.max(0, 1 - smoothstep(s - 2) * 1.6);
		let ropePath = '';
		const leftEnd = { x: -SPAN_X, y: TOP_Y };
		let rightEnd = { x: SPAN_X, y: BOT_Y };

		if (ropeOpacity > 0.01) {
			const t01 = smoothstep(Math.min(1, s));
			rightEnd = {
				x: SPAN_X,
				y: lerp(BOT_Y, TOP_Y, t01)
			};

			const pts = new Array();
			const steps = 64;
			for (let i = 0; i <= steps; i++) {
				const u = i / steps;
				const t = u * 2 - 1;
				const x0 = -SPAN_X + u * (SPAN_X * 2);
				const y0 = TOP_Y + u * (BOT_Y - TOP_Y);
				const x1 = SPAN_X * t;
				const y1 = TOP_Y + (CENTER_Y - TOP_Y) * Math.cos((t * Math.PI) / 2);
				pts.push(`${i === 0 ? 'M' : 'L'} ${lerp(x0, x1, t01).toFixed(1)} ${lerp(y0, y1, t01).toFixed(1)}`);
			}
			ropePath = pts.join(' ');
		}

		// Концентрические окружности: появляются на 3-м кадре и исчезают на 4-м
		let ringsOpacity = 0;
		if (s > 1 && s < 3) {
			ringsOpacity = s <= 2 ? smoothstep(s - 1) : 1 - smoothstep(s - 2);
		}

		const coreOpacity = s <= 1 ? 0 : smoothstep(Math.min(1, s - 1));

		return {
			beads,
			ropeOpacity,
			ropePath,
			leftEnd,
			rightEnd,
			ringsOpacity,
			coreOpacity
		};
	});

	const stageDescriptions = new Array(
		{
			title: '1. Натянутая нитка по диагонали.',
			text: 'Бусины нанизаны на прямую нитку с равными интервалами в один диаметр между верхним левым и нижним правым углами.'
		},
		{
			title: '2. Правый конец подняли на уровень левого.',
			text: 'Обе опоры на одном уровне — нитка провисла плавной «цепной линией» во всю ширину холста, а бусины сохранили равный шаг.'
		},
		{
			title: '3. Разметка концентрическими кольцами.',
			text: 'Вокруг нижней точки провисания провели кольца равной толщины: видно, что часть бусин остаётся за пределами условной границы.'
		},
		{
			title: '4. Орбиталь 1s и внешний «хвост».',
			text: 'Нитка и кольца убраны: внутренние бусины сгустились к центру, а внешние так и остались рассеянными снаружи — ведь настоящая линия тишины уходит в бесконечность.'
		}
	);

	function goToStage(idx) {
		activeStage = idx;
	}

	function nextStage() {
		activeStage = (activeStage + 1) % 4;
	}

	function resetStages() {
		activeStage = 0;
		smoothStage = 0;
	}

	$effect(() => {
		const target = activeStage;
		if (Math.abs(smoothStage - target) < 0.002) {
			smoothStage = target;
			return;
		}

		let last = performance.now();
		function tick(now) {
			const dt = Math.min((now - last) / 1000, 0.05);
			last = now;
			const diff = target - smoothStage;
			if (Math.abs(diff) < 0.01) {
				smoothStage = target;
				return;
			}
			smoothStage += Math.sign(diff) * Math.min(Math.abs(diff), dt * 2.4);
			animId = requestAnimationFrame(tick);
		}

		animId = requestAnimationFrame(tick);
		return () => {
			if (animId) cancelAnimationFrame(animId);
		};
	});

	onMount(() => {
		activeStage = 0;
		smoothStage = 0;
	});
</script>
<div class="z-widget">
	<div class="z-widget-toolbar">
		<span class="z-widget-label">Стадия:</span>
		<button
			class="z-widget-btn"
			class:active={activeStage === 0}
			onclick={() => goToStage(0)}
		>
			1. Диагональ
		</button>
		<button
			class="z-widget-btn"
			class:active={activeStage === 1}
			onclick={() => goToStage(1)}
		>
			2. Провисание
		</button>
		<button
			class="z-widget-btn"
			class:active={activeStage === 2}
			onclick={() => goToStage(2)}
		>
			3. Разметка кольцами
		</button>
		<button
			class="z-widget-btn"
			class:active={activeStage === 3}
			onclick={() => goToStage(3)}
		>
			4. Орбиталь 1s
		</button>

		<div class="z-widget-spacer"></div>

		<button class="z-widget-btn primary" onclick={nextStage}>
			{activeStage === 3 ? 'Сначала ↺' : 'Далее →'}
		</button>
	</div>

	<div class="z-widget-stage">
		<svg
			viewBox="-250 -132 500 272"
			width="100%"
			height="315"
			ondblclick={resetStages}
			role="img"
			aria-label="Четыре стадии превращения натянутой диагональной нитки с бусинами в 1s-орбиталь"
		>
			<!-- Концентрические окружности (видны на 3-й стадии и исчезают на 4-й) -->
			{#if scene.ringsOpacity > 0.01}
				<g opacity={scene.ringsOpacity}>
					{#each RING_RADII as rGuide}
						<circle
							cx="0"
							cy={CENTER_Y}
							r={rGuide}
							fill="none"
							stroke="var(--w-text-muted)"
							stroke-width="1.1"
							stroke-dasharray="4 3"
						/>
					{/each}
				</g>
			{/if}

			<!-- Линия нитки и опоры в углах (исчезают на 4-й стадии) -->
			{#if scene.ropeOpacity > 0.01}
				<path
					d={scene.ropePath}
					fill="none"
					stroke="var(--w-accent)"
					stroke-width="1.6"
					stroke-linecap="round"
					opacity={scene.ropeOpacity * 0.75}
				/>
				<circle
					cx={scene.leftEnd.x}
					cy={scene.leftEnd.y}
					r="3.8"
					fill="var(--w-text-muted)"
					opacity={scene.ropeOpacity}
				/>
				<circle
					cx={scene.rightEnd.x}
					cy={scene.rightEnd.y}
					r="3.8"
					fill="var(--w-text-muted)"
					opacity={scene.ropeOpacity}
				/>
			{/if}

			<!-- Бусины (внутренние и внешние) -->
			{#each scene.beads as b (b.id)}
				<circle
					cx={b.x}
					cy={b.y}
					r="2.3"
					fill="var(--w-accent)"
					opacity={b.opacity}
				/>
			{/each}

			<!-- Центр (ядро) -->
			{#if scene.coreOpacity > 0.01}
				<circle
					cx="0"
					cy={CENTER_Y}
					r="3"
					fill="#f8fafc"
					opacity={scene.coreOpacity}
				/>
			{/if}
		</svg>
	</div>

	<div class="z-widget-footer">
		<p>
			<strong style="color: var(--w-accent)">{stageDescriptions[activeStage].title}</strong>
			{stageDescriptions[activeStage].text} Двойной щелчок возвращает к диагонали.
		</p>
	</div>
</div>
