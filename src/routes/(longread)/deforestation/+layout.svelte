<script lang="ts">
    import '$lib/styles/longread.scss'
	import Home from '$lib/components/Home.svelte';
	import Header from '$lib/components/Header.svelte';
    import Footer from '$lib/components/Footer.svelte';
</script>

<Home icon="github" right={true} href="https://github.com/yababay/deforestation" title="Репозиторий на Github"/>

<Header />

<main>
    <article>
        <slot />
    </article>
</main>

<Footer />
