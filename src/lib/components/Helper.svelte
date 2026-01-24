<script lang="ts">
    import Head from '$lib/components/Head.svelte';
    import banner from '$lib/assets/barny-banner.png'
    export let title: string, description: string
</script>

<Head {title} {description} />

<slot>
    <img src={banner} alt="banner" class="d-none">
</slot>
