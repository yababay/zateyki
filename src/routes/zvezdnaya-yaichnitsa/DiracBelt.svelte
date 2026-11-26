<script>
	import { onMount } from 'svelte';
	import '#lib/styles/widget.scss';

	// Угол поворота "чашки" (электрона): 0 .. 720 градусов
	let twistDeg = $state(0);
	// Фаза топологического распутывания (0 = закручен, 1 = полностью распутан обводом петли)
	let untwistProgress = $state(0);

	// Режим автоматической анимации: 'none' | 'to360' | 'to720' | 'untwist'
	let animMode = $state('none');
	let animId = null;

	const SEGMENTS = 44;

	// Можно ли распутать ремень без вращения концов? (Только около 720°)
	let canUntwist = $derived(Math.abs(twistDeg - 720) < 12 && untwistProgress < 0.99);
	let is360Locked = $derived(Math.abs(twistDeg - 360) < 18);

	// Квантовая фаза спинора: cos(theta / 2)
	let spinorSign = $derived(Math.cos(((twistDeg * Math.PI) / 180) * 0.5));

	// Статус и подсказка в футере
	let statusInfo = $derived.by(() => {
		if (untwistProgress > 0.95) {
			return {
				title: '720° (4π): ремень распутан без вращения концов!',
				color: 'var(--w-accent)',
				text: 'Концы ремня остались неподвижными, но петля обошла чашку и сняла оба витка. Так спинор электрона возвращается в исходное состояние.'
			};
		}
		if (animMode === 'untwist') {
			return {
				title: 'Идёт обвод петли вокруг чашки...',
				color: 'var(--w-accent)',
				text: 'Ни стена, ни чашка не поворачиваются — мы просто проносим середину ремня вокруг объекта.'
			};
		}
		if (Math.abs(twistDeg) < 5) {
			return {
				title: '0°: исходное состояние (ψ = +1)',
				color: 'var(--w-text)',
				text: 'Ремень прямой, фаза электрона положительна. Попробуйте повернуть чашку на 360° или сразу на 720°.'
			};
		}
		if (is360Locked) {
			return {
				title: '360° (2π): ловушка одного оборота (ψ = −1)',
				color: 'var(--w-accent-err)',
				text: 'Чашка вернулась в прежнее положение, но ремень перекручен на один оборот. Распутать его, не отпуская концов, математически невозможно!'
			};
		}
		if (Math.abs(twistDeg - 720) < 12) {
			return {
				title: '720° (4π): два оборота — готов к распутыванию (ψ = +1)',
				color: 'var(--w-accent-cold)',
				text: 'Ремень перекручен вдвойне, но теперь топология разрешает фокус Дирака: нажмите «Распутать без вращения!».'
			};
		}
		return {
			title: `Поворот на ${Math.round(twistDeg)}°`,
			color: 'var(--w-accent)',
			text: 'Двигайте ползунок или воспользуйтесь кнопками быстрого поворота на 360° и 720°.'
		};
	});

	// Генерация 3D-ленты и её проекции на SVG-сцену
	let beltRibbons = $derived.by(() => {
		const totalTwistRad = ((twistDeg * Math.PI) / 180) * (1 - untwistProgress);
		// Амплитуда обводной петли при распутывании (максимум в середине движения)
		const loopArc = Math.sin(untwistProgress * Math.PI);

		const pts = [];
		const xStart = -175;
		const xEnd = 95;
		const halfWidth = 14;

		for (let i = 0; i <= SEGMENTS; i++) {
			const s = i / SEGMENTS; // 0 у стены, 1 у чашки
			// Плавный профиль профиля скрутки (сосредоточен в центральной части ленты)
			const smoothS = s * s * (3 - 2 * s);
			const theta = totalTwistRad * smoothS;

			// Базовая линия ремня + обводная дуга вокруг чашки при распутывании
			const env = Math.sin(s * Math.PI);
			// При обводе петля уходит вниз и вперёд за чашку, затем возвращается в плоскость
			const cx = xStart + (xEnd - xStart) * s + loopArc * Math.pow(s, 1.4) * 58;
			const cy = loopArc * env * 86;
			const cz = loopArc * Math.sin(s * Math.PI * 2) * 32;

			// Вектор ширины ремня в 3D (вращается вокруг оси X на угол theta)
			const wy = halfWidth * Math.cos(theta);
			const wz = halfWidth * Math.sin(theta);

			// Простая изометрическая/перспективная проекция (3D -> 2D)
			const projTopX = cx - wz * 0.35;
			const projTopY = cy - wy * 0.85 - wz * 0.32 + cz * 0.25;

			const projBotX = cx + wz * 0.35;
			const projBotY = cy + wy * 0.85 + wz * 0.32 + cz * 0.25;

			pts.push({
				s,
				cx,
				cy,
				topX: projTopX,
				topY: projTopY,
				botX: projBotX,
				botY: projBotY,
				facingFront: Math.cos(theta) >= 0,
				depth: cz + wz
			});
		}

		// Собираем четырёхугольники-сегменты для красивой отрисовки лицевой и изнаночной сторон
		const quads = [];
		for (let i = 0; i < SEGMENTS; i++) {
			const a = pts[i];
			const b = pts[i + 1];
			quads.push({
				id: i,
				points: `${a.topX.toFixed(1)},${a.topY.toFixed(1)} ${b.topX.toFixed(1)},${b.topY.toFixed(1)} ${b.botX.toFixed(1)},${b.botY.toFixed(1)} ${a.botX.toFixed(1)},${a.botY.toFixed(1)}`,
				midLine: `M ${((a.topX + a.botX) / 2).toFixed(1)} ${((a.topY + a.botY) / 2).toFixed(1)} L ${((b.topX + b.botX) / 2).toFixed(1)} ${((b.topY + b.botY) / 2).toFixed(1)}`,
				facingFront: a.facingFront,
				depth: (a.depth + b.depth) * 0.5
			});
		}

		// Сортируем по глубине, чтобы при обводе петли перекрытия выглядели объёмно
		return quads.sort((q1, q2) => q1.depth - q2.depth);
	});

	function handleSliderInput() {
		animMode = 'none';
		untwistProgress = 0;
	}

	function animateTo360() {
		untwistProgress = 0;
		if (Math.abs(twistDeg - 360) < 2) twistDeg = 0;
		animMode = 'to360';
	}

	function animateTo720() {
		untwistProgress = 0;
		if (Math.abs(twistDeg - 720) < 2) twistDeg = 0;
		animMode = 'to720';
	}

	function triggerUntwist() {
		if (Math.abs(twistDeg - 720) > 12) {
			twistDeg = 720;
		}
		untwistProgress = 0;
		animMode = 'untwist';
	}

	function resetBelt() {
		animMode = 'none';
		twistDeg = 0;
		untwistProgress = 0;
	}

	$effect(() => {
		if (animMode === 'none') return;

		let last = performance.now();

		function step(now) {
			const dt = Math.min((now - last) / 1000, 0.05);
			last = now;

			if (animMode === 'to360') {
				const dir = twistDeg < 360 ? 1 : -1;
				twistDeg += dir * dt * 240;
				if ((dir > 0 && twistDeg >= 360) || (dir < 0 && twistDeg <= 360)) {
					twistDeg = 360;
					animMode = 'none';
					return;
				}
			} else if (animMode === 'to720') {
				twistDeg += dt * 300;
				if (twistDeg >= 720) {
					twistDeg = 720;
					animMode = 'none';
					return;
				}
			} else if (animMode === 'untwist') {
				untwistProgress += dt * 0.65;
				if (untwistProgress >= 1) {
					untwistProgress = 1;
					animMode = 'none';
					return;
				}
			}

			animId = requestAnimationFrame(step);
		}

		animId = requestAnimationFrame(step);
		return () => {
			if (animId) cancelAnimationFrame(animId);
		};
	});

	onMount(() => {
		resetBelt();
	});
</script>

<div class="z-widget">
	<div class="z-widget-toolbar">
		<span class="z-widget-label">Поворот чашки:</span>
		<button
			class="z-widget-btn"
			class:active={Math.abs(twistDeg) < 2 && untwistProgress === 0}
			onclick={resetBelt}
		>
			0° (Старт)
		</button>
		<button
			class="z-widget-btn"
			class:active={is360Locked}
			onclick={animateTo360}
		>
			Повернуть на 360° (2π)
		</button>
		<button
			class="z-widget-btn"
			class:active={Math.abs(twistDeg - 720) < 5 && untwistProgress === 0}
			onclick={animateTo720}
		>
			Повернуть на 720° (4π)
		</button>

		<div class="z-widget-spacer"></div>

		<button
			class="z-widget-btn primary"
			disabled={!canUntwist}
			onclick={triggerUntwist}
		>
			{untwistProgress > 0.95 ? 'Распутано!' : 'Распутать без вращения!'}
		</button>
	</div>

	<div class="z-widget-toolbar slider-row">
		<label class="slider-control">
			<span class="z-widget-label">
				Угол закрутки: <strong>{Math.round(twistDeg)}°</strong>
			</span>
			<input
				type="range"
				min="0"
				max="720"
				step="1"
				bind:value={twistDeg}
				oninput={handleSliderInput}
			/>
		</label>

		<div class="legend-pills">
			<span class="pill">
				<span class="dot amber"></span> Лицевая сторона
			</span>
			<span class="pill">
				<span class="dot cold"></span> Изнанка ремня
			</span>
		</div>
	</div>

	<div class="z-widget-stage">
		<svg
			viewBox="-245 -130 490 260"
			width="100%"
			height="300"
			ondblclick={resetBelt}
			role="img"
			aria-label="Трюк Дирака с ремнём: поворот на 360 и 720 градусов"
		>
			<defs>
				<linearGradient id="wallGrad" x1="0%" y1="0%" x2="100%" y2="0%">
					<stop offset="0%" stop-color="#1e293b" />
					<stop offset="100%" stop-color="#334155" />
				</linearGradient>
			</defs>

			<!-- Левая неподвижная опора ("Вселенная") -->
			<rect x="-205" y="-58" width="28" height="116" rx="4" fill="url(#wallGrad)" stroke="var(--w-border)" />
			<line x1="-177" y1="-52" x2="-177" y2="52" stroke="var(--w-text-muted)" stroke-width="1.5" stroke-dasharray="3 3" />
			<text x="-191" y="-68" text-anchor="middle" fill="var(--w-text-muted)" font-size="10.5" font-weight="600">
				Опора (0°)
			</text>

			<!-- Ремень Дирака (отсортированные по глубине сегменты) -->
			{#each beltRibbons as seg (seg.id)}
				<polygon
					points={seg.points}
					fill={seg.facingFront ? 'var(--w-accent)' : 'var(--w-accent-cold)'}
					fill-opacity={seg.facingFront ? 0.85 : 0.72}
					stroke="rgba(15, 23, 42, 0.45)"
					stroke-width="0.6"
				/>
				<path
					d={seg.midLine}
					stroke="#fef9c3"
					stroke-width="0.9"
					stroke-opacity="0.55"
					fill="none"
				/>
			{/each}

			<!-- Правый объект ("Чашка / Электрон со спином 1/2") -->
			<g transform="translate(105, 0)">
				<!-- Кольцо-индикатор угла поворота чашки -->
				<circle cx="0" cy="0" r="32" fill="var(--w-bg-card)" stroke="var(--w-border)" stroke-width="1.5" />
				<circle
					cx="0"
					cy="0"
					r="26"
					fill="none"
					stroke={is360Locked ? 'var(--w-accent-err)' : 'var(--w-accent)'}
					stroke-width="1.5"
					stroke-dasharray="3 3"
					opacity="0.7"
				/>

				<!-- Вращающаяся стрелка-ручка чашки -->
				<g transform={`rotate(${twistDeg})`}>
					<line x1="0" y1="0" x2="0" y2="-25" stroke="var(--w-accent)" stroke-width="3" stroke-linecap="round" />
					<circle cx="0" cy="-25" r="4" fill="#fef08a" />
				</g>

				<!-- Центр чашки -->
				<circle cx="0" cy="0" r="7" fill="var(--w-text)" />
				<text x="0" y="-42" text-anchor="middle" fill="var(--w-text-muted)" font-size="10.5" font-weight="600">
					Чашка ({Math.round(twistDeg)}°)
				</text>
			</g>

			<!-- Индикатор квантового спинора справа -->
			<g transform="translate(192, 0)">
				<rect x="-36" y="-56" width="72" height="112" rx="8" fill="var(--w-bg-card)" stroke="var(--w-border)" />
				<text x="0" y="-38" text-anchor="middle" fill="var(--w-text-muted)" font-size="9.5" font-weight="600">
					СПИНОР ψ
				</text>

				<circle cx="0" cy="2" r="22" fill="none" stroke="var(--w-border)" stroke-width="1.2" />
				<!-- Вектор спинора вращается в 2 раза медленнее чашки (theta / 2) -->
				<g transform={`rotate(${twistDeg * 0.5})`}>
					<line
						x1="0"
						y1="0"
						x2="0"
						y2="-19"
						stroke={spinorSign >= 0 ? 'var(--w-accent)' : 'var(--w-accent-err)'}
						stroke-width="2.5"
						stroke-linecap="round"
					/>
					<circle
						cx="0"
						cy="-19"
						r="3.2"
						fill={spinorSign >= 0 ? 'var(--w-accent)' : 'var(--w-accent-err)'}
					/>
				</g>

				<text
					x="0"
					y="42"
					text-anchor="middle"
					fill={spinorSign >= 0 ? 'var(--w-accent)' : 'var(--w-accent-err)'}
					font-size="11"
					font-weight="700"
				>
					{spinorSign >= 0.95 ? 'ψ = +1' : spinorSign <= -0.95 ? 'ψ = −1' : `cos = ${spinorSign.toFixed(2)}`}
				</text>
			</g>
		</svg>
	</div>

	<div class="z-widget-footer">
		<p>
			<strong style="color: {statusInfo.color}">{statusInfo.title}</strong> {statusInfo.text}
			Двойной щелчок сбрасывает ремень.
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
		min-width: 210px;

		strong {
			color: var(--w-accent);
		}

		input[type='range'] {
			flex: 1;
			accent-color: var(--w-accent);
			cursor: pointer;
		}
	}

	.legend-pills {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.pill {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		font-size: 0.78rem;
		color: var(--w-text-muted);
		background: var(--w-bg-card);
		border: 1px solid var(--w-border);
		border-radius: 999px;
		padding: 0.2rem 0.65rem;
	}

	.dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;

		&.amber {
			background: var(--w-accent);
		}

		&.cold {
			background: var(--w-accent-cold);
		}
	}
</style>
