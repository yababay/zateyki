---
title: {{title}}
description: {{description}}
---

<script lang="ts">
    import src from './banner.png'
    import { headState } from "#lib/stores/head.svelte"
    import { onMount } from "svelte"
    import banner from './banner.png'

    onMount(() => {
        headState.title = title
        headState.description = description
        headState.banner = banner
    })
</script>
