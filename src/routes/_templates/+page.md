<script lang="ts">
    import { onMount } from "svelte"
    import { headState } from "#lib/stores/head.svelte"
    import banner from '#lib/assets/barny-banner.png' // './banner.webp'
   	// import Figure from '#lib/components/Figure.svelte';
   	// import Pinup from '#lib/components/Pinup.svelte';
    // import pinup  from './pinup.webp'
    // import 'katex/dist/katex.min.css'

    onMount(() => {
        headState.title = title
        headState.description = description
        headState.banner = banner
        headState.pinup = false // pinup
    })
</script>

<!-- Pinup /-->
