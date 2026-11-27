<script>
	let { children, title = '' } = $props();
	let isShortsMode = $state(false);
	let wrapperEl = $state(null);

	async function openShorts() {
		isShortsMode = true;
		try {
			if (wrapperEl && !document.fullscreenElement) {
				await wrapperEl.requestFullscreen();
			}
		} catch {
			// Если браузер заблокировал системный fullscreen, останется полноэкранный оверлей окна
		}
	}

	async function closeShorts() {
		isShortsMode = false;
		try {
			if (document.fullscreenElement) {
				await document.exitFullscreen();
			}
		} catch {
			// Игнорируем ошибку, если уже вышли
		}
	}

	function handleFullscreenChange() {
		// Синхронизируем состояние при выходе по системной клавише Esc
		if (!document.fullscreenElement && isShortsMode) {
			isShortsMode = false;
		}
	}

	function handleKeydown(event) {
		if (isShortsMode && event.key === 'Escape') {
			closeShorts();
		}
	}
</script>
<div class="shorts-wrapper" class:is-modal={isShortsMode} bind:this={wrapperEl}>
	{#if isShortsMode}
		<button
			class="shorts-close-btn"
			onclick={closeShorts}
			title="Выйти из полноэкранного режима (Esc)"
			aria-label="Закрыть полноэкранный режим"
		>
			✕ Esc
		</button>
	{/if}

	<div class="shorts-frame">
		{#if !isShortsMode}
			<button
				class="shorts-trigger-btn"
				onclick={openShorts}
				title="Развернуть на весь экран в формате 9:16"
				aria-label="Открыть на весь экран 9:16"
			>
				<svg width="14" height="14" viewBox="0 0 16 16" fill="none">
					<rect x="4.5" y="1.5" width="7" height="13" rx="1.5" stroke="currentColor" stroke-width="1.4" />
					<circle cx="8" cy="12.2" r="0.7" fill="currentColor" />
				</svg>
				<span>9:16</span>
			</button>
		{:else if title}
			<div class="shorts-header">{title}</div>
		{/if}

		<div class="shorts-content">
			{@render children?.()}
		</div>
	</div>
</div>

<style lang="scss">
	.shorts-wrapper {
		position: relative;
		margin: 1.5rem 0;

		&.is-modal {
			position: fixed;
			inset: 0;
			z-index: 9999;
			margin: 0;
			padding: 0;
			background: #020617;
			display: flex;
			align-items: center;
			justify-content: center;
		}
	}

	.shorts-frame {
		position: relative;
		width: 100%;
	}

	.shorts-trigger-btn {
		position: absolute;
		bottom: 0.55rem;
		right: 1.55rem;
		z-index: 10;
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.2rem 0.45rem;
		font-size: 0.7rem;
		font-weight: 600;
		color: var(--w-text-muted, #94a3b8);
		background: rgba(15, 23, 42, 0.75);
		border: 1px solid var(--w-border, #334155);
		border-radius: 6px;
		cursor: pointer;
		opacity: 0.35;
		transition: opacity 0.2s ease, color 0.2s ease, border-color 0.2s ease;

		&:hover {
			opacity: 1;
			color: var(--w-accent, #f59e0b);
			border-color: var(--w-accent, #f59e0b);
		}
	}

	.shorts-close-btn {
		position: fixed;
		top: 1rem;
		right: 1.25rem;
		z-index: 10000;
		padding: 0.4rem 0.75rem;
		font-size: 0.8rem;
		font-weight: 600;
		color: #94a3b8;
		background: rgba(30, 41, 59, 0.75);
		border: 1px solid #334155;
		border-radius: 8px;
		cursor: pointer;
		opacity: 0.45;
		transition: opacity 0.2s ease, color 0.2s ease;

		&:hover {
			opacity: 1;
			color: #f8fafc;
		}
	}

	/* Полноэкранный контейнер ровно во всю высоту монитора (100vh) в пропорции 9:16 */
	.is-modal .shorts-frame {
		height: 100vh;
		height: 100dvh;
		width: auto;
		aspect-ratio: 9 / 16;
		max-width: 100vw;
		background: var(--w-bg, #0f172a);
		border-left: 1px solid var(--w-border, #1e293b);
		border-right: 1px solid var(--w-border, #1e293b);
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.shorts-header {
		padding: 1rem 1rem 0.4rem;
		text-align: center;
		font-size: 1rem;
		font-weight: 700;
		color: var(--w-accent, #f59e0b);
		letter-spacing: 0.02em;
	}

	.shorts-content {
		width: 100%;
	}

	.is-modal .shorts-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		min-height: 0;

		:global(.z-widget) {
			flex: 1;
			margin: 0;
			border: none;
			border-radius: 0;
			display: flex;
			flex-direction: column;
			justify-content: space-between;
		}

		:global(.z-widget-toolbar) {
			padding: 0.75rem 0.9rem;
			gap: 0.45rem;
		}

		:global(.z-widget-stage) {
			flex: 1;
			display: flex;
			align-items: center;
			justify-content: center;
			min-height: 0;
			padding: 0.5rem;
		}

		:global(.z-widget-stage svg) {
			width: 100%;
			height: auto;
			max-height: 100%;
		}

		:global(.z-widget-footer) {
			padding: 0.9rem 1rem 1.2rem;
			font-size: 0.88rem;
			line-height: 1.45;
		}
	}
</style>
