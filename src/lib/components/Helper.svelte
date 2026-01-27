<script lang="ts">
    import Head from '$lib/components/Head.svelte';
    import _banner from '$lib/assets/barny-banner.png'
    export let title: string, description: string, canonical: string = '', image: string = '', banner: string = ''
</script>

<Head {title} {description} {canonical} {image} />

<slot>
    <img src={banner || _banner} alt="banner" class="d-none">
</slot>

{#if image}
    <img src={image} alt={title} >
{/if}

{#if canonical}
    <p>Исходный материал <a href={canonical} title={title} target="_blank">здесь</a>.</p>
{/if}
