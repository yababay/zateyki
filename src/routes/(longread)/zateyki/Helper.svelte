<script lang="ts">
    import { extractMdxMeta } from '$lib'
    import Head from '$lib/components/Head.svelte';
    import page from './+page.svx?raw'
    import banner from './banner.png'

    export const { title, description } = extractMdxMeta(page)
</script>

<Head {title} {description} />
<img src={banner} alt={title} class="d-none">