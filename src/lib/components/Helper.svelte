<script lang="ts">
    import Head from '$lib/components/Head.svelte';
    import banner from '$lib/assets/barny-banner.png'
    export let title: string, description: string
</script>

<Head {title} {description} />
<img src={banner} alt={title} class="d-none">
