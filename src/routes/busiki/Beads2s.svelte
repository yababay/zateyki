<script>
	import { onMount } from 'svelte';
	import '#lib/styles/widget.scss';

	// Текущий целевой этап (0, 1, 2, 3) и плавный интерполированный прогресс (0.0 .. 3.0)
	let activeStage = $state(0);
	let smoothStage = $state(0);
	let animId = null;

	// 46 бусин на каждую полуволну (всего 92 бусины, радиус 2.3 px -> диаметр 4.6 px, шаг ~ 5.2 px)
	const HALF_COUNT = 46;
	const R_NODE = 54; // Радиус круговой зоны тишины
	const CENTER_Y = 6;

	// Детерминированный псевдослучайный генератор для "хаотичной кучи" на 3-м этапе
	function pseudoRand(seed) {
		const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
		return x - Math.floor(x);
	}

	// Предрасчёт геометрии всех 4 стадий для каждой бусины
	const beadsModel = (() => {
		const list = [];

		// --- ВЕРХНЯЯ ПОЛУВОЛНА (оранжевая, левая половина оси x: -210 .. 0) ---
		for (let i = 0; i < HALF_COUNT; i++) {
			// Параметр u от 0.04 до 0.96 внутри полуволны (чтобы не попадать в узлы 0 и π)
			const u = 0.04 + (i / (HALF_COUNT - 1)) * 0.92;
			const amp = Math.sin(u * Math.PI); // 0..1

			// Этап 0: прямая синусоида (верхняя полуволна, y < 0)
			const x0 = -210 + u * 210;
			const y0 = CENTER_Y - amp * 68;

			// Этап 1: лёгкий изгиб оси в дугу (верхняя часть растягивается)
			const sweep1 = 1.65; // ~95 градусов
			const rArc1 = 420 / sweep1;
			const cy1 = CENTER_Y + rArc1 * 0.86;
			const alpha1 = -Math.PI / 2 - (1 - u) * (sweep1 / 2);
			const r1 = rArc1 + amp * 68;
			const x1 = r1 * Math.cos(alpha1);
			const y1 = cy1 + r1 * Math.sin(alpha1);

			// Этап 2: ось замкнута в кольцо R_NODE, снаружи — "лист кувшинки"
			// Концы полуволны смыкаются внизу (+π/2), вершина кувшинки — наверху (-π/2)
			const alpha2 = Math.PI / 2 + u * Math.PI * 2;
			// Форма листа кувшинки: плавно отходит от кольца у выреза внизу и широко раскрывается наверху
			const lilyBulge = Math.pow(amp, 0.85) * 62;
			const r2 = R_NODE + 3 + lilyBulge;

			// Этап 3: равномерное распределение по внешнему кольцу (R_NODE + 6 .. 116)
			// Чем выше бывший синус, тем дальше в разреженную внешнюю область
			const r3 = R_NODE + 6 + Math.pow(amp, 0.72) * 55;
			const alpha3 = Math.PI / 2 + ((i + 0.5) / HALF_COUNT) * Math.PI * 2 + (i % 3) * 0.42;

			list.push({
				id: `orange-${i}`,
				isLower: false,
				x0,
				y0,
				x1,
				y1,
				r2,
				alpha2,
				r3,
				alpha3
			});
		}

		// --- НИЖНЯЯ ПОЛУВОЛНА (бирюзовая, правая половина оси x: 0 .. +210) ---
		for (let i = 0; i < HALF_COUNT; i++) {
			const u = 0.04 + (i / (HALF_COUNT - 1)) * 0.92;
			const amp = Math.sin(u * Math.PI);

			// Этап 0: прямая синусоида (нижняя полуволна, y > 0)
			const x0 = u * 210;
			const y0 = CENTER_Y + amp * 68;

			// Этап 1: лёгкий изгиб оси (нижняя часть сжимается)
			const sweep1 = 1.65;
			const rArc1 = 420 / sweep1;
			const cy1 = CENTER_Y + rArc1 * 0.86;
			const alpha1 = -Math.PI / 2 + u * (sweep1 / 2);
			const r1 = rArc1 - amp * 64;
			const x1 = r1 * Math.cos(alpha1);
			const y1 = cy1 + r1 * Math.sin(alpha1);

			// Этап 2: нитка потеряла упругость, бирюзовые бусины сбились в хаотичную кучу внутри кольца
			const rndR = pseudoRand(i * 3 + 1);
			const rndA = pseudoRand(i * 7 + 2);
			// Куча чуть смещена вниз (как осыпавшиеся бусины внутри обруча), но плотнее к центру
			const heapR = Math.pow(rndR, 0.75) * (R_NODE - 12);
			const heapAngle = rndA * Math.PI * 2;
			const hx = heapR * Math.cos(heapAngle);
			const hy = CENTER_Y + 8 + heapR * Math.sin(heapAngle) * 0.82;
			const r2 = Math.hypot(hx, hy - CENTER_Y);
			const alpha2 = Math.atan2(hy - CENTER_Y, hx);

			// Этап 3: равномерное распределение по внутренним окружностям (плотно к центру!)
			// Большой синус (amp -> 1) отправляет бусину ближе к ядру (r3 -> 4)
			const r3 = 4 + (1 - Math.pow(amp, 0.78)) * (R_NODE - 9);
			const alpha3 = i * 2.399963229728653;

			list.push({
				id: `teal-${i}`,
				isLower: true,
				x0,
				y0,
				x1,
				y1,
				r2,
				alpha2,
				r3,
				alpha3
			});
		}

		return list;
	})();

	function lerp(a, b, t) {
		return a + (b - a) * t;
	}

	function smoothstep(t) {
		const c = Math.max(0, Math.min(1, t));
		return c * c * (3 - 2 * c);
	}

	// Вычисляем текущие координаты бусин и линий для smoothStage (0..3)
	let scene = $derived.by(() => {
		const s = smoothStage;

		// Координаты бусин
		const beads = beadsModel.map((b) => {
			let x, y;
			if (s <= 1) {
				const t = smoothstep(s);
				x = lerp(b.x0, b.x1, t);
				y = lerp(b.y0, b.y1, t);
			} else if (s <= 2) {
				// Переход из дуги (x1, y1) в полярные координаты кольца (r2, alpha2)
				const t = smoothstep(s - 1);
				const x2 = b.r2 * Math.cos(b.alpha2);
				const y2 = CENTER_Y + b.r2 * Math.sin(b.alpha2);
				x = lerp(b.x1, x2, t);
				y = lerp(b.y1, y2, t);
			} else {
				// Переход от стадии 2 к стадии 3 строго в ПОЛЯРНЫХ координатах (r, alpha)!
				// Благодаря этому оранжевые бусины движутся по дуге снаружи и не пересекают центр.
				const t = smoothstep(s - 2);
				const r = lerp(b.r2, b.r3, t);
				const alpha = lerp(b.alpha2, b.alpha3, t);
				x = r * Math.cos(alpha);
				y = CENTER_Y + r * Math.sin(alpha);
			}

			return {
				id: b.id,
				x,
				y,
				isLower: b.isLower
			};
		});

		// Построение непрерывной синусоиды (видна на этапах 0 и 1, растворяется при переходе к 2)
		const stringOpacity = s <= 1 ? 1 : Math.max(0, 1 - (s - 1) * 2.2);
		let upperCurvePath = '';
		let lowerCurvePath = '';
		let axisPath = '';

		if (stringOpacity > 0.01) {
			const t01 = smoothstep(Math.min(1, s));
			const sweep1 = 1.65;
			const rArc1 = 420 / sweep1;
			const cy1 = CENTER_Y + rArc1 * 0.86;

			const upPts = [];
			const lowPts = [];
			const axPts = [];
			const steps = 48;

			for (let i = 0; i <= steps; i++) {
				const u = i / steps; // 0..1 вдоль полуволны
				const amp = Math.sin(u * Math.PI);

				// Верхняя (оранжевая) полуволна
				const ux0 = -210 + u * 210;
				const uy0 = CENTER_Y - amp * 68;
				const uAlpha1 = -Math.PI / 2 - (1 - u) * (sweep1 / 2);
				const ur1 = rArc1 + amp * 68;
				const ux1 = ur1 * Math.cos(uAlpha1);
				const uy1 = cy1 + ur1 * Math.sin(uAlpha1);
				upPts.push(`${i === 0 ? 'M' : 'L'} ${lerp(ux0, ux1, t01).toFixed(1)} ${lerp(uy0, uy1, t01).toFixed(1)}`);

				// Нижняя (бирюзовая) полуволна
				const lx0 = u * 210;
				const ly0 = CENTER_Y + amp * 68;
				const lAlpha1 = -Math.PI / 2 + u * (sweep1 / 2);
				const lr1 = rArc1 - amp * 64;
				const lx1 = lr1 * Math.cos(lAlpha1);
				const ly1 = cy1 + lr1 * Math.sin(lAlpha1);
				lowPts.push(`${i === 0 ? 'M' : 'L'} ${lerp(lx0, lx1, t01).toFixed(1)} ${lerp(ly0, ly1, t01).toFixed(1)}`);
			}

			// Ось симметрии для этапов 0..1
			for (let i = 0; i <= 64; i++) {
				const v = (i / 64) * 2 - 1; // -1..+1
				const ax0 = v * 210;
				const ay0 = CENTER_Y;
				const aAlpha1 = -Math.PI / 2 + v * (sweep1 / 2);
				const ax1 = rArc1 * Math.cos(aAlpha1);
				const ay1 = cy1 + rArc1 * Math.sin(aAlpha1);
				axPts.push(`${i === 0 ? 'M' : 'L'} ${lerp(ax0, ax1, t01).toFixed(1)} ${lerp(ay0, ay1, t01).toFixed(1)}`);
			}

			upperCurvePath = upPts.join(' ');
			lowerCurvePath = lowPts.join(' ');
			axisPath = axPts.join(' ');
		}

		// Прозрачность круговой зоны тишины (этапы 2 и 3) и контура листа кувшинки (этап 2)
		const ringZoneOpacity = s <= 1 ? 0 : smoothstep(Math.min(1, s - 1));
		const lilyContourOpacity = s > 1.5 && s < 2.5 ? 1 - Math.abs(s - 2) * 2 : 0;
		const finalCirclesOpacity = s <= 2 ? 0 : smoothstep(s - 2);

		// Контур "листа кувшинки" для этапа 2
		let lilyPath = '';
		if (lilyContourOpacity > 0.01) {
			const pts = [];
			for (let i = 0; i <= 72; i++) {
				const u = i / 72;
				const alpha = Math.PI / 2 + u * Math.PI * 2;
				const r = R_NODE + 3 + Math.pow(Math.sin(u * Math.PI), 0.85) * 62;
				const lx = r * Math.cos(alpha);
				const ly = CENTER_Y + r * Math.sin(alpha);
				pts.push(`${i === 0 ? 'M' : 'L'} ${lx.toFixed(1)} ${ly.toFixed(1)}`);
			}
			lilyPath = pts.join(' ') + ' Z';
		}

		return {
			beads,
			stringOpacity,
			upperCurvePath,
			lowerCurvePath,
			axisPath,
			ringZoneOpacity,
			lilyContourOpacity,
			lilyPath,
			finalCirclesOpacity
		};
	});

	const stageDescriptions = [
		{
			title: '1. Исходная синусоида.',
			text: 'Непрерывный цикл из двух полуволн: верхняя оранжевая, нижняя бирюзовая. Бусины нанизаны на нитку с интервалом в один свой диаметр.'
		},
		{
			title: '2. Лёгкий изгиб линии симметрии.',
			text: 'Ось синусоиды слегка согнули дугой: на внешней стороне расстояния между оранжевыми бусинами растянулись, а на внутренней бирюзовые сжались.'
		},
		{
			title: '3. Замкнутое кольцо, куча и «лист кувшинки».',
			text: 'Ось симметрии свернулась в кольцо. Внутри потерявшая упругость нитка исчезла, и бирюзовые бусины сбились в кучу; снаружи оранжевый горб обернулся вокруг кольца «листом кувшинки».'
		},
		{
			title: '4. Равномерное распределение по орбитали 2s.',
			text: 'Бусины аккуратно разложены по концентрическим окружностям согласно их бывшим синусам: плотное бирюзовое ядро внутри, круговая зона тишины и разреженное оранжевое кольцо снаружи.'
		}
	];

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

	// Плавный доводчик между выбранными этапами (без скачков)
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
			1. Синусоида
		</button>
		<button
			class="z-widget-btn"
			class:active={activeStage === 1}
			onclick={() => goToStage(1)}
		>
			2. Изгиб оси
		</button>
		<button
			class="z-widget-btn"
			class:active={activeStage === 2}
			onclick={() => goToStage(2)}
		>
			3. Куча и лист кувшинки
		</button>
		<button
			class="z-widget-btn"
			class:active={activeStage === 3}
			onclick={() => goToStage(3)}
		>
			4. Орбиталь 2s
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
			height="320"
			ondblclick={resetStages}
			role="img"
			aria-label="Четыре стадии превращения синусоиды с бусинами в 2s-орбиталь"
		>
			<!-- Концентрические направляющие на 4-й стадии -->
			{#if scene.finalCirclesOpacity > 0.01}
				<g opacity={scene.finalCirclesOpacity}>
					{#each [22, 38, 76, 96, 116] as rGuide}
						<circle
							cx="0"
							cy={CENTER_Y}
							r={rGuide}
							fill="none"
							stroke="var(--w-border)"
							stroke-width="0.9"
							stroke-dasharray="2 4"
						/>
					{/each}
				</g>
			{/if}

			<!-- Лёгкий контур "листа кувшинки" на 3-й стадии -->
			{#if scene.lilyContourOpacity > 0.01}
				<path
					d={scene.lilyPath}
					fill="var(--w-accent)"
					fill-opacity={scene.lilyContourOpacity * 0.07}
					stroke="var(--w-accent)"
					stroke-width="1"
					stroke-dasharray="3 3"
					opacity={scene.lilyContourOpacity * 0.55}
				/>
			{/if}

			<!-- Ось симметрии на стадиях 1 и 2 -->
			{#if scene.stringOpacity > 0.01}
				<path
					d={scene.axisPath}
					fill="none"
					stroke="var(--w-text-muted)"
					stroke-width="1.2"
					stroke-dasharray="4 4"
					opacity={scene.stringOpacity * 0.7}
				/>

				<!-- Непрерывная линия синусоиды под бусинами -->
				<path
					d={scene.upperCurvePath}
					fill="none"
					stroke="var(--w-accent)"
					stroke-width="1.8"
					stroke-linecap="round"
					opacity={scene.stringOpacity * 0.85}
				/>
				<path
					d={scene.lowerCurvePath}
					fill="none"
					stroke="#2dd4bf"
					stroke-width="1.8"
					stroke-linecap="round"
					opacity={scene.stringOpacity * 0.85}
				/>
			{/if}

			<!-- Круговая зона тишины (бывшая ось симметрии) на стадиях 3 и 4 -->
			{#if scene.ringZoneOpacity > 0.01}
				<circle
					cx="0"
					cy={CENTER_Y}
					r={R_NODE}
					fill="none"
					stroke="#f8fafc"
					stroke-width="1.5"
					stroke-dasharray="4 3"
					opacity={scene.ringZoneOpacity * 0.8}
				/>
				<text
					x="0"
					y={CENTER_Y - R_NODE - 7}
					text-anchor="middle"
					fill="#f8fafc"
					font-size="9.5"
					font-weight="600"
					opacity={scene.ringZoneOpacity * 0.9}
				>
					Зона тишины (ось синусоиды)
				</text>
			{/if}

			<!-- Бусины поверх линии -->
			{#each scene.beads as b (b.id)}
				<circle
					cx={b.x}
					cy={b.y}
					r="2.3"
					fill={b.isLower ? '#2dd4bf' : 'var(--w-accent)'}
				/>
			{/each}

			<!-- Центр (ядро) на стадиях 3 и 4 -->
			{#if scene.ringZoneOpacity > 0.5}
				<circle
					cx="0"
					cy={CENTER_Y}
					r="3"
					fill="#f8fafc"
					opacity={(scene.ringZoneOpacity - 0.5) * 2}
				/>
			{/if}
		</svg>
	</div>

	<div class="z-widget-footer">
		<p>
			<strong style="color: var(--w-accent)">{stageDescriptions[activeStage].title}</strong>
			{stageDescriptions[activeStage].text} Двойной щелчок возвращает к первой стадии.
		</p>
	</div>
</div>
