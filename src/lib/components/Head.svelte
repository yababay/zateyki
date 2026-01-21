<script lang="ts">
    	export let data: {title?: string, description?: string}
        const { title, description } = data
</script>

<svelte:head>
    <meta name="description" content={description}>
    <title>{title}</title>
</svelte:head>
