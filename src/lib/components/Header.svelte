<script lang="ts">
    import { onMount } from "svelte"

    onMount(async () => {
        const img = document.querySelector('img')
        if(!img) return
        header.style.backgroundImage = `url("${img.src}")`
    })

    let header: HTMLElement
</script>

<header bind:this={header}></header>
