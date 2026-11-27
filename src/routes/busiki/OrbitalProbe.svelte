<script>
	import { onMount } from 'svelte';
	import '#lib/styles/widget.scss';

	// Режим отображения: '1s' | '2s' | 'mix'
	let mode = $state('mix');
	// Глубина зонда (от 6.3 у поверхности до 0.0 в центре)
	let radius = $state(6.3);
	// По умолчанию анимация остановлена
	let isPlaying = $state(false);
	// Направление движения при анимации: -1 (погружение к центру), +1 (подъём к краю)
	let direction = $state(-1);

	let animId = null;
    const yNode = -82 + (1 - 2.0 / 6.3) * 176;

	// Детерминированные "бусины" на срезе сферы (220 точек)
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

	// Радиальные волновые функции (нормированы на 1.0 в центре)
	function psi1s(r) {
		return Math.exp(-r);
	}

	function psi2s(r) {
		// В центре (r < 2) > 0 (янтарный), в зоне тишины (r = 2) = 0, снаружи (r > 2) < 0 (бирюзовый)
		return (1 - r / 2) * Math.exp(-r / 2);
	}

	// Визуальное масштабирование длины отрезка, чтобы разреженная внешняя оболочка 2s хорошо читалась
	function visualBar(val, maxPx) {
		if (Math.abs(val) < 0.002) return 0;
		return Math.sign(val) * Math.pow(Math.min(1, Math.abs(val)), 0.72) * maxPx;
	}

	// Показания трёх шкал на текущей глубине radius
	let readings = $derived.by(() => {
		const v1 = mode === '2s' ? 0 : psi1s(radius);
		const v2 = mode === '1s' ? 0 : psi2s(radius);

		// В режиме смеси берём нормированную сумму (1s + 2s) / √2, в одиночных — саму орбиталь
		const vSum = mode === 'mix' ? (v1 + v2) * Math.SQRT1_2 : v1 + v2;

		// Вертикальная координата на всех трёх шкалах: верх (-82) = край (6.3), низ (+94) = центр (0)
		const depthRatio = 1 - radius / 6.3; // 0 наверху -> 1 внизу
		const yPos = -82 + depthRatio * 176;

		return {
			v1,
			v2,
			vSum,
			yPos,
			probDensity: vSum * vSum
		};
	});

	// Состояние бусин на срезе сферы
	let renderedBeads = $derived.by(() => {
		const scale = 15.5;

		return beads.map((b) => {
			const v1 = mode === '2s' ? 0 : psi1s(b.r);
			const v2 = mode === '1s' ? 0 : psi2s(b.r);
			const val = mode === 'mix' ? (v1 + v2) * Math.SQRT1_2 : v1 + v2;

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

	let footerNote = $derived.by(() => {
		const nearNode = mode !== '1s' && Math.abs(radius - 2.0) < 0.22;
		if (nearNode) {
			return {
				title: 'Зона тишины 2s (r = 2.0 a₀)!',
				text: 'На 2-й шкале отрезок сжался в ноль. Глубже (r < 2) он перескочит вправо и станет янтарным, а выше (r > 2) уходит влево и становится бирюзовым.'
			};
		}
		if (mode === '1s') {
			return {
				title: '1s-орбиталь (полуволна без перетяжек).',
				text: 'При погружении к центру янтарный отрезок плавно растёт до максимума, а при подъёме уменьшается, не меняя ни цвета, ни стороны шкалы.'
			};
		}
		if (mode === '2s') {
			return {
				title: '2s-орбиталь (полный цикл с переходом через ноль).',
				text: 'От поверхности до зоны тишины (r = 2) отрезок бирюзовый и растёт влево; пройдя через ноль, он становится янтарным и растёт вправо до самого центра.'
			};
		}
		return {
			title: 'Сложение 1s + 2s на третьей шкале.',
			text: 'Внешняя бирюзовая оболочка 2s частично гасит янтарный хвост 1s (отрезки вычитаются), а ближе к центру оба янтарных отрезка складываются в общий пик.'
		};
	});

	function togglePlay() {
		if (!isPlaying && radius <= 0.05) {
			direction = 1;
		} else if (!isPlaying && radius >= 6.25) {
			direction = -1;
		}
		isPlaying = !isPlaying;
	}

	function handleSliderInput() {
		isPlaying = false;
	}

	function resetProbe() {
		isPlaying = false;
		mode = 'mix';
		radius = 6.3;
		direction = -1;
        badgeHold = false; 
        clearTimeout(badgeTimer);
	}

	// Клик по вертикальной скважине устанавливает глубину зонда
	function handleSliceClick(event) {
		const svg = event.currentTarget;
		const rect = svg.getBoundingClientRect();
		const viewBoxY = ((event.clientY - rect.top) / rect.height) * 276 - 138;
		// Центр среза в y = 10, масштаб 1 a0 = 15.5 px
		const dy = 10 - viewBoxY;
		const newR = Math.max(0, Math.min(6.3, dy / 15.5));
		isPlaying = false;
		radius = +newR.toFixed(2);
	}

	$effect(() => {
		if (!isPlaying) return;
		let last = performance.now();

		function loop(now) {
			if (!isPlaying) return;
			const dt = Math.min((now - last) / 1000, 0.05);
			last = now;

			// Скорость погружения/подъёма: полный проход за ~3.5 секунды
			const speed = 1.8;
			let nextR = radius + direction * speed * dt;

			if (nextR <= 0) {
				nextR = 0;
				direction = 1; // достигли центра -> поднимаемся обратно
			} else if (nextR >= 6.3) {
				nextR = 6.3;
				direction = -1; // достигли поверхности -> погружаемся снова
			}

			radius = +nextR.toFixed(3);
			animId = requestAnimationFrame(loop);
		}

		animId = requestAnimationFrame(loop);
		return () => {
			if (animId) cancelAnimationFrame(animId);
		};
	});

	onMount(() => {
		radius = 6.3;
		isPlaying = false;
	});

    let badgeHold = $state(false);
    let badgeTimer = null;
    let prevDiff = 6.3 - 2.0;
    const badgePause = 500;

    $effect(() => {
        const diff = radius - 2.0;
        // Срабатывает при попадании в окрестность узла или при пересечении r = 2.0
        const crossed = (prevDiff > 0 && diff <= 0) || (prevDiff < 0 && diff >= 0);
        const near = Math.abs(diff) < 0.25;
        prevDiff = diff;

        if (mode !== '1s' && (crossed || near)) {
            badgeHold = true;
            clearTimeout(badgeTimer);
            badgeTimer = setTimeout(() => {
                badgeHold = false;
            }, badgePause);
        }
    });
</script>

<div class="z-widget">
	<div class="z-widget-toolbar">
		<span class="z-widget-label">Орбиталь:</span>
		<button
			class="z-widget-btn"
			class:active={mode === '1s'}
			onclick={() => (mode = '1s')}
		>
			Только 1s
		</button>
		<button
			class="z-widget-btn"
			class:active={mode === '2s'}
			onclick={() => (mode = '2s')}
		>
			Только 2s
		</button>
		<button
			class="z-widget-btn"
			class:active={mode === 'mix'}
			onclick={() => (mode = 'mix')}
		>
			Смесь 1s + 2s
		</button>

		<div class="z-widget-spacer"></div>

		<button class="z-widget-btn primary" onclick={togglePlay}>
			{isPlaying ? 'Пауза' : 'Пуск погружения'}
		</button>
	</div>

	<div class="z-widget-toolbar slider-row">
		<label class="slider-control">
			<!-- span class="z-widget-label">
				Глубиномер (r): <strong>{radius.toFixed(2)} a₀</strong>
				{#if mode !== '1s' && Math.abs(radius - 2.0) < 0.16}
					<span class="node-badge">Зона тишины 2s!</span>
				{/if}
			</span -->

            <span class="node-badge" class:visible={mode !== '1s' && badgeHold}>
                Тишина 2s!
            </span>
          
			<input
				type="range"
				min="0"
				max="6.3"
				step="0.05"
				bind:value={radius}
				oninput={handleSliderInput}
			/>
		</label>

		<div class="telemetry-pills">
			<span class="pill">
				Сумма ψ: <strong>{readings.vSum >= 0 ? `+${readings.vSum.toFixed(2)}` : readings.vSum.toFixed(2)}</strong>
			</span>
			<span class="pill">
				Плотность |ψ|²: <strong>{readings.probDensity.toFixed(2)}</strong>
			</span>
		</div>
	</div>

	<div class="z-widget-stage">
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<svg
			viewBox="-250 -138 500 276"
			width="100%"
			height="330"
			onclick={handleSliceClick}
			ondblclick={resetProbe}
			role="img"
			aria-label="Вертикальная скважина s-орбитали и синхронные шкалы глубины и амплитуды"
		>
			<!-- Вертикальный разделитель -->
			<line x1="-32" y1="-122" x2="-32" y2="122" stroke="var(--w-border)" stroke-dasharray="3 4" />

			<!-- ==================== ЛЕВАЯ СЦЕНА: ВЕРТИКАЛЬНАЯ СКВАЖИНА ==================== -->
			<g transform="translate(-142, 10)">
				<text x="0" y="-126" text-anchor="middle" fill="var(--w-text-muted)" font-size="10.5" font-weight="600">
					СКВАЖИНА ПО РАДИУСУ (r)
				</text>

				<!-- Внешняя граница среза -->
				<circle cx="0" cy="0" r={6.3 * 15.5} fill="none" stroke="var(--w-border)" stroke-width="1" />

				<!-- Распределение бусин плотности -->
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
				{#if mode !== '1s'}
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
				{/if}

				<!-- Вертикальная шахта-скважина от поверхности (сверху) к центру (вниз) -->
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

				<!-- Подписи поверхности и центра -->
				<text x="8" y={-6.3 * 15.5 + 4} fill="var(--w-text-muted)" font-size="8.5">Край (6.3)</text>
				<text x="8" y="4" fill="var(--w-text)" font-size="8.5" font-weight="600">Центр (0)</text>

				<!-- Ядро в центре -->
				<circle cx="0" cy="0" r="3.5" fill="#f8fafc" />

				<!-- Датчик-зонд на текущей глубине radius -->
				<g transform={`translate(0, ${-radius * 15.5})`}>
					<circle cx="0" cy="0" r="7.5" fill="rgba(15, 23, 42, 0.85)" stroke="#f8fafc" stroke-width="1.8" />
					<circle cx="0" cy="0" r="2.5" fill="var(--w-accent)" />
					<text x="-12" y="3" text-anchor="end" fill="#f8fafc" font-size="9.5" font-weight="600">
						Зонд
					</text>
				</g>
			</g>

			<!-- ==================== ПРАВАЯ СЦЕНА: ТРИ СИНХРОННЫЕ ШКАЛЫ ==================== -->
			<!-- Верх y = -82 (поверхность 6.3 a0), низ y = +94 (центр 0 a0) -->
			<g transform="translate(0, 0)">
				<text x="115" y="-116" text-anchor="middle" fill="var(--w-text-muted)" font-size="10.5" font-weight="600">
					ПОКАЗАНИЯ ПРИБОРА ПРИ ПОГРУЖЕНИИ
				</text>

				<!-- Горизонтальная линия текущего уровня глубины через все 3 шкалы -->
				<line
					x1="-12"
					y1={readings.yPos}
					x2="244"
					y2={readings.yPos}
					stroke="var(--w-border)"
					stroke-width="1"
					stroke-dasharray="2 3"
				/>

				<!-- ---------- ШКАЛА 1: 1s (0–180°) ---------- -->
				<g transform="translate(28, 0)">
					<text x="14" y="-96" text-anchor="middle" fill="var(--w-accent)" font-size="10" font-weight="600">
						1s (0–180°)
					</text>
					<text x="0" y="-86" text-anchor="middle" fill="var(--w-text-muted)" font-size="8">Край</text>
					<text x="0" y="106" text-anchor="middle" fill="var(--w-text-muted)" font-size="8">Центр</text>

					<line x1="0" y1="-82" x2="0" y2="94" stroke="var(--w-border)" stroke-width="2" />
					<line x1="-4" y1="-82" x2="4" y2="-82" stroke="var(--w-text-muted)" stroke-width="1" />
					<line x1="-4" y1="94" x2="4" y2="94" stroke="var(--w-text-muted)" stroke-width="1" />

					{#if mode !== '2s'}
						{@const w1 = visualBar(readings.v1, 42)}
						<line
							x1="0"
							y1={readings.yPos}
							x2={w1}
							y2={readings.yPos}
							stroke="var(--w-accent)"
							stroke-width="5"
							stroke-linecap="round"
						/>
						<circle cx="0" cy={readings.yPos} r="3" fill="var(--w-accent)" />
						<text x="12" y="122" text-anchor="middle" fill="var(--w-accent)" font-size="9" font-weight="600">
							+{readings.v1.toFixed(2)}
						</text>
					{:else}
						<text x="12" y="122" text-anchor="middle" fill="var(--w-text-muted)" font-size="9">выкл.</text>
					{/if}
				</g>

				<!-- ---------- ШКАЛА 2: 2s (0–360°, со сменой стороны на зоне тишины) ---------- -->
				<g transform="translate(118, 0)">
					<text x="0" y="-96" text-anchor="middle" fill="#2dd4bf" font-size="10" font-weight="600">
						2s (0–360°)
					</text>
					<text x="0" y="-86" text-anchor="middle" fill="var(--w-text-muted)" font-size="8">Край</text>
					<text x="0" y="106" text-anchor="middle" fill="var(--w-text-muted)" font-size="8">Центр</text>

					<!-- Отметка зоны тишины (r = 2.0 -> y = -82 + (1 - 2/6.3)*176 = 38.1) -->
					<!-- {@const yNode = -82 + (1 - 2.0 / 6.3) * 176} -->
					<line x1="-6" y1={yNode} x2="6" y2={yNode} stroke="#2dd4bf" stroke-width="1.2" />

					<line x1="0" y1="-82" x2="0" y2="94" stroke="var(--w-border)" stroke-width="2" />
					<line x1="-4" y1="-82" x2="4" y2="-82" stroke="var(--w-text-muted)" stroke-width="1" />
					<line x1="-4" y1="94" x2="4" y2="94" stroke="var(--w-text-muted)" stroke-width="1" />

					{#if mode !== '1s'}
						{@const w2 = visualBar(readings.v2, 42)}
						{@const color2 = readings.v2 < 0 ? '#2dd4bf' : 'var(--w-accent)'}
						<line
							x1="0"
							y1={readings.yPos}
							x2={w2}
							y2={readings.yPos}
							stroke={color2}
							stroke-width="5"
							stroke-linecap="round"
						/>
						<circle cx="0" cy={readings.yPos} r="3" fill={color2} />
						<text x="0" y="122" text-anchor="middle" fill={color2} font-size="9" font-weight="600">
							{readings.v2 >= 0 ? `+${readings.v2.toFixed(2)}` : readings.v2.toFixed(2)}
						</text>
					{:else}
						<text x="0" y="122" text-anchor="middle" fill="var(--w-text-muted)" font-size="9">выкл.</text>
					{/if}
				</g>

				<!-- ---------- ШКАЛА 3: РЕЗУЛЬТИРУЮЩАЯ (0–360°, сумма с учётом знака) ---------- -->
				<g transform="translate(204, 0)">
					<text x="0" y="-96" text-anchor="middle" fill="#f8fafc" font-size="10" font-weight="600">
						Сумма (0–360°)
					</text>
					<text x="0" y="-86" text-anchor="middle" fill="var(--w-text-muted)" font-size="8">Край</text>
					<text x="0" y="106" text-anchor="middle" fill="var(--w-text-muted)" font-size="8">Центр</text>

					<line x1="0" y1="-82" x2="0" y2="94" stroke="var(--w-border)" stroke-width="2" />
					<line x1="-4" y1="-82" x2="4" y2="-82" stroke="var(--w-text-muted)" stroke-width="1" />
					<line x1="-4" y1="94" x2="4" y2="94" stroke="var(--w-text-muted)" stroke-width="1" />

					{#if true}
						{@const wSum = visualBar(readings.vSum, 40)}
						{@const colorSum = readings.vSum < 0 ? '#2dd4bf' : 'var(--w-accent)'}
						<line
							x1="0"
							y1={readings.yPos}
							x2={wSum}
							y2={readings.yPos}
							stroke={colorSum}
							stroke-width="5"
							stroke-linecap="round"
						/>
						<circle cx="0" cy={readings.yPos} r="3.5" fill="#f8fafc" />
						<text x="0" y="122" text-anchor="middle" fill={colorSum} font-size="9" font-weight="700">
							{readings.vSum >= 0 ? `+${readings.vSum.toFixed(2)}` : readings.vSum.toFixed(2)}
						</text>
					{/if}
				</g>
			</g>
		</svg>
	</div>

	<div class="z-widget-footer">
		<p>
			<strong style="color: var(--w-accent)">{footerNote.title}</strong> {footerNote.text}
			Двойной щелчок возвращает зонд на поверхность.
		</p>
	</div>
</div>

<style lang="scss">
	.z-widget-footer p {
		@media (min-height: 1000px ) {
			min-height: 85px
		}
	}
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

        &.silence {
	        color: #0f172a;
	        background: #2dd4bf;
	        opacity: 1;
        }

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
