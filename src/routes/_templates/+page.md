<!-- script lang="ts">
    import { onMount } from "svelte"
    import { headState } from "#lib/stores/head.svelte"
   	import Pinup  from '#lib/components/Pinup.svelte';
    import banner from  './banner.webp' // '#lib/assets/barny-banner.png'
    import pinup  from  './pinup.webp'

    onMount(() => {
        headState.title = title
        headState.description = description
        headState.banner = banner
        headState.pinup = pinup
    })
</script>

<Pinup {title} {description} {pinup} / -->
