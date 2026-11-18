<script lang="ts">
	import { getContext, tick } from 'svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		children?: Snippet;
		/** Подпись в шапке окна. По умолчанию берётся из caption ближайшего Figure. */
		label?: string;
		/** Стартовый масштаб: 'fit' — вписать, число — доля (1 = 100%). */
		initial?: 'fit' | number;
	}

	let { children, label = 'Схема', initial = 'fit' }: Props = $props();

	const uid = $props.id();
	// svelte-ignore state_referenced_locally
	const caption = getContext<string>('zateyki:figcaption');

	const MIN = 0.1;
	const MAX = 8;

	let open = $state(false);
	let scale = $state(1);
	let tx = $state(0);
	let ty = $state(0);
	let fitScale = $state(1);
	let natural = $state({ w: 0, h: 0 });
	let background = $state<'light' | 'dark' | 'grid'>('grid');
	let inverted = $state(false);
	let dragging = $state(false);
	let canDownload = $state(false);

	let dialog = $state<HTMLDialogElement | undefined>();
	let stage = $state<HTMLDivElement | undefined>();
	let canvas = $state<HTMLDivElement | undefined>();

	let autoFit = true;
	const pointers = new Map<number, { x: number; y: number }>();
	let lastDistance = 0;

	const percent = $derived(Math.round(scale * 100));
	const rangeMax = $derived(Math.max(MAX * 100, Math.ceil(fitScale * 100)));
	const canvasStyle = $derived(
		(natural.w > 0 ? `width: ${natural.w}px; height: ${natural.h}px; ` : '') +
			`transform: translate(${tx}px, ${ty}px) scale(${scale})`
	);

	function clamp(value: number) {
		return Math.min(Math.max(MAX, fitScale), Math.max(MIN, value));
	}

	function viewport() {
		const rect = stage?.getBoundingClientRect();
		return { w: rect?.width ?? 0, h: rect?.height ?? 0 };
	}

	function measure() {
		if (!canvas) return;

		const svg = canvas.querySelector('svg') as SVGSVGElement | null;
		let w = 0;
		let h = 0;

		if (svg) {
			const box = svg.viewBox?.baseVal;
			if (box && box.width > 0 && box.height > 0) {
				w = box.width;
				h = box.height;
			} else {
				const attrW = svg.getAttribute('width') ?? '';
				const attrH = svg.getAttribute('height') ?? '';
				const absW = attrW.endsWith('%') ? 0 : parseFloat(attrW);
				const absH = attrH.endsWith('%') ? 0 : parseFloat(attrH);
				if (absW > 0 && absH > 0) {
					w = absW;
					h = absH;
				} else {
					const rect = svg.getBoundingClientRect();
					w = rect.width;
					h = rect.height;
				}
			}
		} else {
			w = canvas.offsetWidth || canvas.scrollWidth;
			h = canvas.offsetHeight || canvas.scrollHeight;
		}

		natural = { w: w > 0 ? w : 1, h: h > 0 ? h : 1 };
		canDownload = !!svg;
	}

	function fit() {
		const { w, h } = viewport();
		if (!w || !h || natural.w <= 0 || natural.h <= 0) return;

		const next = Math.min((w - 32) / natural.w, (h - 32) / natural.h);
		fitScale = Math.min(64, Math.max(0.02, next));
		scale = fitScale;
		tx = (w - natural.w * scale) / 2;
		ty = (h - natural.h * scale) / 2;
		autoFit = true;
	}

	function actual() {
		const { w, h } = viewport();
		scale = 1;
		tx = (w - natural.w) / 2;
		ty = (h - natural.h) / 2;
		autoFit = false;
	}

	function resetView() {
		background = 'grid';
		inverted = false;
		fit();
	}

	function zoomAt(px: number, py: number, next: number) {
		const s = clamp(next);
		if (s === scale) return;
		tx = px - (px - tx) * (s / scale);
		ty = py - (py - ty) * (s / scale);
		scale = s;
		autoFit = false;
	}

	function zoomCenter(factor: number) {
		const { w, h } = viewport();
		zoomAt(w / 2, h / 2, scale * factor);
	}

	function onSlider(event: Event) {
		const value = Number((event.currentTarget as HTMLInputElement).value) / 100;
		const { w, h } = viewport();
		zoomAt(w / 2, h / 2, value);
	}

	async function show() {
		if (!dialog) return;

		open = true;
		natural = { w: 0, h: 0 };
		scale = 1;
		tx = 0;
		ty = 0;
		autoFit = true;

		await tick();
		if (!dialog.open) dialog.showModal();
		await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

		measure();

		if (initial === 'fit') {
			fit();
		} else {
			const { w, h } = viewport();
			scale = clamp(initial);
			tx = (w - natural.w * scale) / 2;
			ty = (h - natural.h * scale) / 2;
			autoFit = false;
		}
	}

	function reset() {
		pointers.clear();
		lastDistance = 0;
		dragging = false;
	}

	function hide() {
		open = false;
		reset();
		if (dialog?.open) dialog.close();
	}

	function distance() {
		const [a, b] = [...pointers.values()];
		return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0;
	}

	function onPointerDown(event: PointerEvent) {
		if (event.pointerType === 'mouse' && event.button !== 0) return;
		(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
		pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
		dragging = true;
		if (pointers.size === 2) lastDistance = distance();
	}

	function onPointerMove(event: PointerEvent) {
		const point = pointers.get(event.pointerId);
		if (!point) return;

		const dx = event.clientX - point.x;
		const dy = event.clientY - point.y;
		point.x = event.clientX;
		point.y = event.clientY;

		if (pointers.size === 1) {
			tx += dx;
			ty += dy;
			autoFit = false;
		} else if (pointers.size === 2) {
			const next = distance();
			if (lastDistance > 0 && next > 0 && stage) {
				const [a, b] = [...pointers.values()];
				const rect = stage.getBoundingClientRect();
				zoomAt(
					(a.x + b.x) / 2 - rect.left,
					(a.y + b.y) / 2 - rect.top,
					scale * (next / lastDistance)
				);
			}
			lastDistance = next;
		}
	}

	function onPointerUp(event: PointerEvent) {
		pointers.delete(event.pointerId);
		if (pointers.size < 2) lastDistance = 0;
		if (pointers.size === 0) dragging = false;
	}

	function onDoubleClick(event: MouseEvent) {
		if (!stage) return;
		const rect = stage.getBoundingClientRect();
		if (Math.abs(scale - fitScale) < 0.02) {
			zoomAt(event.clientX - rect.left, event.clientY - rect.top, fitScale * 2.5);
		} else {
			fit();
		}
	}

	function onKeydown(event: KeyboardEvent) {
		const tag = (event.target as HTMLElement)?.tagName;
		if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;

		const step = event.shiftKey ? 120 : 40;
		switch (event.key) {
			case '+':
			case '=':
				event.preventDefault();
				zoomCenter(1.25);
				break;
			case '-':
			case '_':
				event.preventDefault();
				zoomCenter(0.8);
				break;
			case '0':
				event.preventDefault();
				fit();
				break;
			case '1':
				event.preventDefault();
				actual();
				break;
			case 'ArrowLeft':
				event.preventDefault();
				tx += step;
				autoFit = false;
				break;
			case 'ArrowRight':
				event.preventDefault();
				tx -= step;
				autoFit = false;
				break;
			case 'ArrowUp':
				event.preventDefault();
				ty += step;
				autoFit = false;
				break;
			case 'ArrowDown':
				event.preventDefault();
				ty -= step;
				autoFit = false;
				break;
			default:
				if (event.key.toLowerCase() === 'i') inverted = !inverted;
		}
	}

	function slug(text: string) {
		return text
			.toLowerCase()
			.replace(/[^\p{L}\p{N}]+/gu, '-')
			.replace(/^-+|-+$/g, '');
	}

	function download() {
		const svg = canvas?.querySelector('svg');
		if (!svg) return;

		const clone = svg.cloneNode(true) as SVGSVGElement;
		clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
		clone.setAttribute('width', String(Math.round(natural.w)));
		clone.setAttribute('height', String(Math.round(natural.h)));
		clone.style.removeProperty('width');
		clone.style.removeProperty('height');
		clone.style.removeProperty('max-width');
		clone.style.removeProperty('max-height');

		const source = new XMLSerializer().serializeToString(clone);
		const blob = new Blob([`<?xml version="1.0" encoding="UTF-8"?>\n${source}`], {
			type: 'image/svg+xml;charset=utf-8'
		});
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = `${slug(caption) || 'diagram'}.svg`;
		link.click();
		setTimeout(() => URL.revokeObjectURL(url), 1000);
	}

	$effect(() => {
		if (!open) return;
		const previous = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		return () => {
			document.body.style.overflow = previous;
		};
	});

	$effect(() => {
		const element = stage;
		if (!element || !open) return;
		const onWheel = (event: WheelEvent) => {
			event.preventDefault();
			const rect = element.getBoundingClientRect();
			zoomAt(
				event.clientX - rect.left,
				event.clientY - rect.top,
				scale * Math.exp(-event.deltaY * 0.0015)
			);
		};
		element.addEventListener('wheel', onWheel, { passive: false });
		return () => element.removeEventListener('wheel', onWheel);
	});

	$effect(() => {
		const element = stage;
		if (!element || !open || typeof ResizeObserver === 'undefined') return;
		const observer = new ResizeObserver(() => {
			if (autoFit && natural.w > 0) fit();
		});
		observer.observe(element);
		return () => observer.disconnect();
	});
</script>

<div class="zoom-preview position-relative overflow-hidden">
	<div class="zoom-preview__content p-2">
		{@render children?.()}
	</div>
	<button
		type="button"
		class="zoom-preview__hit btn p-2 d-flex align-items-end justify-content-end border-0 bg-transparent position-absolute top-0 start-0 w-100 h-100"
		onclick={show}
		aria-label="Открыть «{caption}» на весь экран"
	>
		<span class="btn btn-sm btn-primary shadow-sm">
			<i class="bi bi-arrows-angle-expand me-1" aria-hidden="true"></i>Увеличить
		</span>
	</button>
</div>

<dialog
	bind:this={dialog}
	class="modal zoom-modal"
	aria-label={caption}
	onclose={() => {
		open = false;
		reset();
	}}
	onkeydown={onKeydown}
>
	{#if open}
		<div class="modal-dialog modal-fullscreen">
			<div class="modal-content">
				<div class="modal-header py-2">
					<h5 class="modal-title zoom-title text-truncate">{caption}</h5>
					<button
						type="button"
						class="btn btn-sm btn-outline-secondary ms-2 flex-shrink-0"
						onclick={hide}
						title="Закрыть (Esc)"
						aria-label="Закрыть (Esc)"
					>
						<i class="bi bi-x-lg" aria-hidden="true"></i>
					</button>
				</div>

				<div
					class="zoom-toolbar d-flex flex-wrap align-items-center gap-2 px-3 py-2 border-bottom bg-body-tertiary"
				>
					<div class="btn-group btn-group-sm" role="group" aria-label="Масштаб">
						<button
							type="button"
							class="btn btn-outline-secondary"
							onclick={() => zoomCenter(0.8)}
							title="Уменьшить (−)"
							aria-label="Уменьшить"
						>
							<i class="bi bi-dash-lg" aria-hidden="true"></i>
						</button>
						<button
							type="button"
							class="btn btn-outline-secondary zoom-percent"
							onclick={actual}
							title="Реальный размер (1)"
						>
							{percent}%
						</button>
						<button
							type="button"
							class="btn btn-outline-secondary"
							onclick={() => zoomCenter(1.25)}
							title="Увеличить (+)"
							aria-label="Увеличить"
						>
							<i class="bi bi-plus-lg" aria-hidden="true"></i>
						</button>
					</div>

					<input
						type="range"
						class="form-range zoom-range"
						min={MIN * 100}
						max={rangeMax}
						step="1"
						value={Math.min(rangeMax, Math.max(MIN * 100, percent))}
						oninput={onSlider}
						aria-label="Масштаб"
						aria-valuetext="{percent} процентов"
					/>

					<div class="btn-group btn-group-sm" role="group" aria-label="Положение">
						<button type="button" class="btn btn-outline-secondary" onclick={fit} title="Вписать (0)">
							<i class="bi bi-arrows-angle-contract me-md-1" aria-hidden="true"></i>
							<span class="d-none d-md-inline">Вписать</span>
						</button>
						<button
							type="button"
							class="btn btn-outline-secondary"
							onclick={resetView}
							title="Сбросить вид"
							aria-label="Сбросить вид"
						>
							<i class="bi bi-arrow-counterclockwise" aria-hidden="true"></i>
						</button>
					</div>

					<div class="btn-group btn-group-sm" role="group" aria-label="Фон">
						<button
							type="button"
							class="btn btn-outline-secondary"
							class:active={background === 'light'}
							aria-pressed={background === 'light'}
							onclick={() => (background = 'light')}
							title="Светлый фон"
						>
							<i class="bi bi-sun" aria-hidden="true"></i>
						</button>
						<button
							type="button"
							class="btn btn-outline-secondary"
							class:active={background === 'dark'}
							aria-pressed={background === 'dark'}
							onclick={() => (background = 'dark')}
							title="Тёмный фон"
						>
							<i class="bi bi-moon" aria-hidden="true"></i>
						</button>
						<button
							type="button"
							class="btn btn-outline-secondary"
							class:active={background === 'grid'}
							aria-pressed={background === 'grid'}
							onclick={() => (background = 'grid')}
							title="Миллиметровка"
						>
							<i class="bi bi-grid-3x3" aria-hidden="true"></i>
						</button>
					</div>

					<div class="form-check form-switch mb-0 ms-1">
						<input
							class="form-check-input"
							type="checkbox"
							role="switch"
							id="zoom-invert-{uid}"
							bind:checked={inverted}
						/>
						<label class="form-check-label small" for="zoom-invert-{uid}" title="Инвертировать цвета (I)">
							Инверсия
						</label>
					</div>

					<button
						type="button"
						class="btn btn-sm btn-outline-primary ms-md-auto"
						onclick={download}
						disabled={!canDownload}
						title="Скачать SVG"
					>
						<i class="bi bi-download me-md-1" aria-hidden="true"></i>
						<span class="d-none d-md-inline">SVG</span>
					</button>
				</div>

				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div
					bind:this={stage}
					class="modal-body zoom-stage p-0 position-relative overflow-hidden"
					class:is-dragging={dragging}
					data-bg={background}
					onpointerdown={onPointerDown}
					onpointermove={onPointerMove}
					onpointerup={onPointerUp}
					onpointercancel={onPointerUp}
					ondblclick={onDoubleClick}
				>
					<div
						bind:this={canvas}
						class="zoom-canvas"
						class:is-sized={natural.w > 0}
						class:is-inverted={inverted}
						style={canvasStyle}
					>
						{@render children?.()}
					</div>
				</div>

				<div class="modal-footer justify-content-between py-1 px-3">
					<span class="small text-body-secondary">
						<i class="bi bi-mouse me-1" aria-hidden="true"></i>Колесо — масштаб · перетаскивание —
						сдвиг · двойной клик — вписать
					</span>
					<span class="small text-body-secondary d-none d-lg-inline">
						<kbd>Esc</kbd> закрыть · <kbd>0</kbd> вписать · <kbd>1</kbd> 100% · <kbd>I</kbd> инверсия
					</span>
				</div>
			</div>
		</div>
	{/if}
</dialog>

<style>
	/* ---------- превью в тексте ---------- */

	.zoom-preview {
		border: var(--bs-border-width) solid var(--bs-border-color);
		border-radius: var(--bs-border-radius);
		background-color: var(--bs-tertiary-bg);
		transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
	}

	.zoom-preview:hover,
	.zoom-preview:focus-within {
		border-color: rgba(var(--bs-primary-rgb), 0.5);
		box-shadow: var(--bs-box-shadow-sm);
	}

	.zoom-preview__content :global(svg),
	.zoom-preview__content :global(img) {
		display: block;
		width: 100%;
		height: auto;
		max-width: 100%;
	}

	.zoom-preview__hit {
		cursor: zoom-in;
	}

	.zoom-preview__hit:focus-visible {
		outline: 0;
		box-shadow: inset 0 0 0 0.25rem rgba(var(--bs-primary-rgb), 0.25);
	}

	/* ---------- модальное окно ---------- */

	.zoom-modal {
		margin: 0;
		padding: 0;
		border: 0;
		width: 100%;
		height: 100%;
		max-width: none;
		max-height: none;
		background: transparent;
		color: var(--bs-body-color);
		overflow: hidden;
		scrollbar-width: thin;
		scrollbar-color: rgba(var(--bs-secondary-rgb), 0.5) transparent;
	}

	.zoom-modal[open] {
		display: block;
	}

	.zoom-modal::backdrop {
		background-color: #000;
		opacity: 0.5;
	}

	.zoom-modal::-webkit-scrollbar {
		width: 8px;
		height: 8px;
	}

	.zoom-modal::-webkit-scrollbar-track {
		background: transparent;
	}

	.zoom-modal::-webkit-scrollbar-thumb {
		background-color: rgba(var(--bs-secondary-rgb), 0.5);
		border-radius: var(--bs-border-radius-pill);
	}

	.zoom-modal::-webkit-scrollbar-thumb:hover {
		background-color: rgba(var(--bs-secondary-rgb), 0.75);
	}

	.zoom-title {
		min-width: 0;
	}

	.zoom-toolbar {
		flex-shrink: 0;
	}

	.zoom-range {
		width: clamp(6rem, 18vw, 12rem);
		flex: 0 1 auto;
	}

	.zoom-percent {
		min-width: 4.5rem;
		font-variant-numeric: tabular-nums;
	}

	.zoom-stage {
		min-height: 0;
		touch-action: none;
		cursor: grab;
		transition: background-color 0.15s ease-in-out;
	}

	.zoom-stage.is-dragging {
		cursor: grabbing;
	}

	.zoom-stage[data-bg='light'] {
		background-color: var(--bs-body-bg);
	}

	.zoom-stage[data-bg='dark'] {
		background-color: var(--bs-dark);
	}

	.zoom-stage[data-bg='grid'] {
		background-color: var(--bs-body-bg);
		background-image:
			linear-gradient(to right, rgba(var(--bs-primary-rgb), 0.1) 1px, transparent 1px),
			linear-gradient(to bottom, rgba(var(--bs-primary-rgb), 0.1) 1px, transparent 1px),
			linear-gradient(to right, rgba(var(--bs-primary-rgb), 0.22) 1px, transparent 1px),
			linear-gradient(to bottom, rgba(var(--bs-primary-rgb), 0.22) 1px, transparent 1px);
		background-size: 20px 20px, 20px 20px, 100px 100px, 100px 100px;
	}

	.zoom-canvas {
		position: absolute;
		top: 0;
		left: 0;
		transform-origin: 0 0;
		will-change: transform;
	}

	.zoom-canvas :global(svg),
	.zoom-canvas :global(img) {
		display: block;
		max-width: none;
	}

	.zoom-canvas.is-sized :global(svg),
	.zoom-canvas.is-sized :global(img) {
		width: 100% !important;
		height: 100% !important;
		max-width: none !important;
		max-height: none !important;
	}

	.zoom-canvas.is-inverted {
		filter: invert(1) hue-rotate(180deg);
	}

	@media (prefers-reduced-motion: reduce) {
		.zoom-preview,
		.zoom-stage {
			transition: none;
		}
	}
</style>