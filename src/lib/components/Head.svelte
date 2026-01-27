<script lang="ts">
    	export let title: string = '', description: string = '', canonical: string = ''
</script>

<svelte:head>
    {#if canonical}
        <link rel="canonical" href={canonical}>
    {/if}
    {#if description}
        <meta name="description" content={description}>
        <meta name="og:description" content={description}>
    {/if}
        <meta name="og:title" content={title}>
        <title>{title}</title>
</svelte:head>
