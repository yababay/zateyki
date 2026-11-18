<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		/** Растровая картинка — используется, когда children не переданы. */
		src?: string;
		/** Подпись под figure; она же alt для картинки по умолчанию. */
		caption?: string;
		/** Явный alt, если он должен отличаться от подписи. */
		alt?: string;
		/** Произвольное содержимое: SVG, видео, iframe, таблица и т. д. */
		children?: Snippet;
	}

	let { src, caption = '', alt, children }: Props = $props();
</script>

<figure class="rehype-figure">
	{#if children}
		{@render children()}
	{:else if src}
		<img {src} alt={alt ?? caption} loading="lazy" decoding="async" />
	{/if}

	{#if caption}
		<figcaption>{caption}</figcaption>
	{/if}
</figure>
