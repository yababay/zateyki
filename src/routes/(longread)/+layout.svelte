<script lang="ts">
    import '$lib/styles/longread.scss'
	import Home from '$lib/components/Home.svelte';
</script>

<Home />

<main>
    <article>
        <slot />
    </article>
</main>
