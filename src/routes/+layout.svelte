<script lang="ts">
	import type { LayoutProps } from './$types';
	import Head    from '#lib/components/Head.svelte';
	import Header  from '#lib/components/Header.svelte';
    import Footer  from '#lib/components/Footer.svelte';
    import '#lib/styles/article.scss'

    const title = "Бабайкина сарайка"
    const description = "Лонгриды Михаила Белякова"
	let { children }: LayoutProps = $props();
</script>

<Head {title} {description} />
<Header />

<section class="container">
	<article>
		{@render children()}
	</article>
</section>

<Footer />
