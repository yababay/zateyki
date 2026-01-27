<script lang="ts">
    	export let title: string = '', description: string = ''
</script>

<svelte:head>
    {#if description}
        <meta name="description" content={description}>
        <meta name="og:description" content={description}>
    {/if}
        <meta name="og:title" content={title}>
        <title>{title}</title>
</svelte:head>
