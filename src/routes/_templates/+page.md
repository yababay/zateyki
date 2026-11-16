---
title: {{title}}
description: {{description}}
---

<script lang="ts">
   	// import Figure from '#lib/components/Figure.svelte';
   	// import Pinup from '#lib/components/Pinup.svelte';
    import { headState } from "#lib/stores/head.svelte"
    import { onMount } from "svelte"
    import banner from './banner.webp'
    // import pinup  from './pinup.webp'

    onMount(() => {
        headState.title = title
        headState.description = description
        headState.banner = banner
        headState.pinup = false // pinup
    })
</script>

<!-- Pinup /-->