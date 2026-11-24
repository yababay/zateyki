<script>
	import { onMount } from 'svelte';
	import '#lib/styles/widget.scss';

	// Степень гравитационного коллапса: 0 (рыхлый шар) -> 1 (плоский диск + звезда)
	let collapse = $state(0.0);
	let isPlaying = $state(false);
	let animId = null;
	let time = 0;

	// Детерминированный генератор частиц молекулярного облака (160 пылинок)
	const PARTICLE_COUNT = 160;
	const particles = Array.from({ length: PARTICLE_COUNT }, (_, i) => {
		// Золотой угол для равномерного заполнения объёма сферы
		const u = ((i * 0.61803398875) % 1) * 2 - 1; // z0 в [-1, 1]
		const phi0 = i * 2.399963229728653;
		const rShell = Math.cbrt((i + 0.5) / PARTICLE_COUNT); // равномерно по объёму шара
		const rCyl0 = Math.sqrt(Math.max(0, 1 - u * u)) * rShell;
		const z0 = u * rShell;

		// К какой будущей планете/кольцу тяготеет пылинка (4 орбиты + протозвезда)
		const ringSlot = i % 5; // 0 = в протозвезду, 1..4 = в планетные кольца
		return {
			id: i,
			rCyl0,
			z0,
			phi0,
			ringSlot,
			size: i % 9 === 0 ? 2.6 : 1.7
		};
	});

	// Текущие макропараметры облака (закон сохранения момента импульса L = const)
	let metrics = $derived.by(() => {
		// Экваториальный радиус сжимается от 1.0 до 0.42 (с учётом центробежного барьера)
		const rEq = 1 - 0.58 * Math.pow(collapse, 0.85);
		// Полярная полуось схлопывается почти в ноль (от 1.0 до 0.045)
		const rPole = 1 - 0.955 * Math.pow(collapse, 0.72);
		// Угловая скорость ω ~ 1 / R_eq^2 (рост до ~5.7x в визуальном масштабе)
		const omega = 1 / (rEq * rEq);
		// Сплюснутость (отношение диаметра к толщине)
		const flatness = (rEq / rPole).toFixed(1);
		// Температура "желтка" (протозвезды)
		const tempK = Math.round(15 + Math.pow(collapse, 2.4) * 5765);

		let stageTitle = 'Холодное молекулярное облако';
		let stageDesc =
			'Огромный рыхлый шар из газа и пыли едва заметно вращается из-за случайного перекоса скоростей.';

		if (collapse >= 0.85) {
			stageTitle = 'Звёздная яичница (протопланетный диск)';
			stageDesc =
				'Полюса схлопнулись, а экватор удержал центробежный барьер. В центре зажёгся «желток»-звезда, в «белке» слипаются планеты.';
		} else if (collapse >= 0.45) {
			stageTitle = 'Эффект фигуриста и сплющивание';
			stageDesc =
				'Сжимаясь, облако резко раскручивается (L = const). Вдоль оси пыль падает свободно, а у экватора её тормозит вращение.';
		} else if (collapse >= 0.12) {
			stageTitle = 'Начало гравитационного сжатия';
			stageDesc =
				'Гравитация тянет газ к центру. Чтобы сжаться сильнее, облако платит ростом скорости вращения.';
		}

		return { rEq, rPole, omega, flatness, tempK, stageTitle, stageDesc };
	});

	// Позиции частиц на текущем кадре
	let frameTick = $state(0);

	let renderedParticles = $derived.by(() => {
		const _tick = frameTick;
		const c = collapse;
		const { rEq, rPole, omega } = metrics;

		return particles.map((p) => {
			// Дифференциальное кеплеровское вращение: ближе к центру быстрее
			const radialFactor = 1 / (0.35 + 0.65 * p.rCyl0);
			const angle = p.phi0 + time * 0.65 * omega * (0.45 + 0.55 * c * radialFactor);

			// При сильном коллапсе часть вещества стягивается в 4 планетных кольца диска
			const targetRingR =
				p.ringSlot === 0
					? 0.08 + p.rCyl0 * 0.12
					: 0.24 + p.ringSlot * 0.17 + (p.rCyl0 - 0.5) * 0.04;

			const blendRing = Math.max(0, (c - 0.55) / 0.45);
			const currentRCyl = (p.rCyl0 * rEq * (1 - blendRing) + targetRingR * blendRing) * 86;
			const currentZ = p.z0 * rPole * 86;

			const x3d = currentRCyl * Math.cos(angle);
			const y3d = currentRCyl * Math.sin(angle);

			// Окраска: от холодного голубого газа к горячему янтарю в центре диска
			const distNorm = currentRCyl / 86;
			const isCore = distNorm < 0.22 && c > 0.35;

			return {
				id: p.id,
				// Вид сбоку (плоскость X-Z)
				sideX: x3d,
				sideY: currentZ,
				// Вид сверху (плоскость X-Y)
				topX: x3d,
				topY: y3d,
				size: p.size,
				isCore,
				depth: y3d // для сортировки ближних/дальних точек на виде сбоку
			};
		});
	});

	let sideSorted = $derived([...renderedParticles].sort((a, b) => a.depth - b.depth));

	function setStage(val) {
		isPlaying = false;
		collapse = val;
	}

	function togglePlay() {
		if (!isPlaying && collapse >= 0.99) {
			collapse = 0;
		}
		isPlaying = !isPlaying;
	}

	function resetWidget() {
		isPlaying = false;
		collapse = 0;
		time = 0;
		frameTick++;
	}

	$effect(() => {
		let last = performance.now();

		function loop(now) {
			const dt = Math.min((now - last) / 1000, 0.05);
			last = now;

			time += dt;
			if (isPlaying) {
				collapse = Math.min(1, collapse + dt * 0.14);
				if (collapse >= 1) {
					isPlaying = false;
				}
			}
			frameTick++;
			animId = requestAnimationFrame(loop);
		}

		animId = requestAnimationFrame(loop);
		return () => {
			if (animId) cancelAnimationFrame(animId);
		};
	});

	onMount(() => {
		frameTick++;
	});
</script>

<div class="z-widget">
	<div class="z-widget-toolbar">
		<span class="z-widget-label">Этапы коллапса:</span>
		<button
			class="z-widget-btn"
			class:active={collapse < 0.1 && !isPlaying}
			onclick={() => setStage(0)}
		>
			1. Молекулярный шар
		</button>
		<button
			class="z-widget-btn"
			class:active={collapse >= 0.45 && collapse < 0.65 && !isPlaying}
			onclick={() => setStage(0.55)}
		>
			2. Сплющивание
		</button>
		<button
			class="z-widget-btn"
			class:active={collapse >= 0.9 && !isPlaying}
			onclick={() => setStage(1)}
		>
			3. Звёздная яичница
		</button>

		<div class="z-widget-spacer"></div>

		<button class="z-widget-btn primary" onclick={togglePlay}>
			{isPlaying ? 'Пауза' : collapse >= 0.99 ? 'Сначала' : 'Запустить коллапс'}
		</button>
	</div>

	<div class="z-widget-toolbar slider-row">
		<label class="slider-control">
			<span class="z-widget-label">
				Сжатие облака: <strong>{Math.round(collapse * 100)}%</strong>
			</span>
			<input type="range" min="0" max="1" step="0.01" bind:value={collapse} />
		</label>

		<div class="telemetry-pills">
			<span class="pill">
				Скорость ω: <strong>{metrics.omega.toFixed(1)}×</strong>
			</span>
			<span class="pill">
				Сплюснутость: <strong>{metrics.flatness} : 1</strong>
			</span>
			<span class="pill">
				Центр: <strong>{metrics.tempK} K</strong>
			</span>
		</div>
	</div>

	<div class="z-widget-stage">
		<svg
			viewBox="-250 -135 500 270"
			width="100%"
			height="330"
			ondblclick={resetWidget}
			role="img"
			aria-label="Превращение вращающегося газопылевого шара в плоский протопланетный диск"
		>
			<defs>
				<radialGradient id="yolkGlow" cx="50%" cy="50%" r="50%">
					<stop offset="0%" stop-color="#fef08a" stop-opacity="0.95" />
					<stop offset="35%" stop-color="#f59e0b" stop-opacity="0.65" />
					<stop offset="100%" stop-color="#f59e0b" stop-opacity="0" />
				</radialGradient>
				<radialGradient id="cloudHalo" cx="50%" cy="50%" r="50%">
					<stop offset="0%" stop-color="#38bdf8" stop-opacity="0.16" />
					<stop offset="100%" stop-color="#38bdf8" stop-opacity="0" />
				</radialGradient>
			</defs>

			<!-- Разделитель двух ракурсов -->
			<line x1="0" y1="-118" x2="0" y2="118" stroke="var(--w-border)" stroke-dasharray="3 4" />

			<!-- ==================== ЛЕВАЯ ПАНЕЛЬ: ВИД СБОКУ ==================== -->
			<g transform="translate(-125, 8)">
				<text x="0" y="-118" text-anchor="middle" fill="var(--w-text-muted)" font-size="11" font-weight="600">
					ВИД СБОКУ (РАЗРЕЗ ПО ОСИ)
				</text>

				<!-- Ось вращения -->
				<line x1="0" y1="-102" x2="0" y2="102" stroke="var(--w-accent-cold)" stroke-width="1" stroke-dasharray="2 3" opacity="0.6" />
				<text x="6" y="-92" fill="var(--w-accent-cold)" font-size="9.5" opacity="0.85">Ось вращения</text>

				<!-- Контур облака (эллипс сжатия) -->
				<ellipse
					cx="0"
					cy="0"
					rx={metrics.rEq * 88}
					ry={Math.max(4, metrics.rPole * 88)}
					fill="url(#cloudHalo)"
					stroke="var(--w-accent-cold)"
					stroke-width="1"
					stroke-dasharray="3 3"
					opacity="0.55"
				/>

				<!-- Стрелки падения вещества с полюсов -->
				{#if collapse > 0.08 && collapse < 0.92}
					<path d="M -26 -62 L -26 -24 M -30 -30 L -26 -24 L -22 -30" stroke="var(--w-accent-cold)" stroke-width="1.3" fill="none" opacity="0.75" />
					<path d="M 26 62 L 26 24 M 22 30 L 26 24 L 30 30" stroke="var(--w-accent-cold)" stroke-width="1.3" fill="none" opacity="0.75" />
					<!-- Стрелки центробежного барьера на экваторе -->
					<path d="M 48 0 L 76 0 M 70 -4 L 76 0 L 70 4" stroke="var(--w-accent)" stroke-width="1.3" fill="none" opacity="0.8" />
					<path d="M -48 0 L -76 0 M -70 -4 L -76 0 L -70 4" stroke="var(--w-accent)" stroke-width="1.3" fill="none" opacity="0.8" />
				{/if}

				<!-- Пылинки (вид сбоку) -->
				{#each sideSorted as p (p.id)}
					<circle
						cx={p.sideX}
						cy={p.sideY}
						r={p.size * (p.depth > 0 ? 1.12 : 0.88)}
						fill={p.isCore ? 'var(--w-accent)' : 'var(--w-accent-cold)'}
						opacity={p.depth > 0 ? 0.9 : 0.45}
					/>
				{/each}

				<!-- Свечение "желтка" протозвезды -->
				{#if collapse > 0.25}
					<circle
						cx="0"
						cy="0"
						r={8 + collapse * 20}
						fill="url(#yolkGlow)"
						opacity={Math.min(1, (collapse - 0.25) * 1.4)}
					/>
					<circle
						cx="0"
						cy="0"
						r={2.5 + collapse * 5}
						fill="#fef9c3"
						opacity={Math.min(1, (collapse - 0.25) * 1.5)}
					/>
				{/if}
			</g>

			<!-- ==================== ПРАВАЯ ПАНЕЛЬ: ВИД СВЕРХУ ==================== -->
			<g transform="translate(125, 8)">
				<text x="0" y="-118" text-anchor="middle" fill="var(--w-text-muted)" font-size="11" font-weight="600">
					ВИД СВЕРХУ (ПЛОСКОСТЬ ДИСКА)
				</text>

				<!-- Направляющая кругового вращения -->
				<circle
					cx="0"
					cy="0"
					r={metrics.rEq * 88}
					fill="url(#cloudHalo)"
					stroke="var(--w-accent-cold)"
					stroke-width="1"
					stroke-dasharray="3 3"
					opacity="0.5"
				/>

				<!-- Орбитальные кольца будущих планет при высоком коллапсе -->
				{#if collapse > 0.65}
					{#each [0.41, 0.58, 0.75, 0.92] as ringR}
						<circle
							cx="0"
							cy="0"
							r={ringR * 86}
							fill="none"
							stroke="var(--w-accent)"
							stroke-width="0.8"
							stroke-dasharray="2 4"
							opacity={(collapse - 0.65) * 1.1}
						/>
					{/each}
				{/if}

				<!-- Пылинки (вид сверху) -->
				{#each renderedParticles as p (p.id)}
					<circle
						cx={p.topX}
						cy={p.topY}
						r={p.size}
						fill={p.isCore ? 'var(--w-accent)' : 'var(--w-accent-cold)'}
						opacity="0.82"
					/>
				{/each}

				<!-- "Желток" звезды в центре -->
				{#if collapse > 0.25}
					<circle
						cx="0"
						cy="0"
						r={10 + collapse * 24}
						fill="url(#yolkGlow)"
						opacity={Math.min(1, (collapse - 0.25) * 1.4)}
					/>
					<circle
						cx="0"
						cy="0"
						r={3 + collapse * 6}
						fill="#fef9c3"
						opacity={Math.min(1, (collapse - 0.25) * 1.5)}
					/>
				{/if}
			</g>
		</svg>
	</div>

	<div class="z-widget-footer">
		<p>
			<strong style="color: var(--w-accent)">{metrics.stageTitle}.</strong> {metrics.stageDesc}
			Двойной щелчок по схеме возвращает облако в исходное состояние.
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
		min-width: 200px;

		strong {
			color: var(--w-accent);
		}

		input[type='range'] {
			flex: 1;
			accent-color: var(--w-accent);
			cursor: pointer;
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
