<script lang="ts">
    	export let title: string = '', description: string = ''
</script>

<svelte:head>
    {#if description}
        <meta name="description" content={description}>
    {/if}
    <title>{title}</title>
</svelte:head>
