<script lang="ts">
    	export let data: {title: string, description?: string}
        const { title, description } = data
</script>

<svelte:head>
    {#if description}
        <meta name="description" content={description}>
    {/if}
    <title>{title}</title>
</svelte:head>
