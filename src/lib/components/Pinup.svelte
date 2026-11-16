<script lang="ts">
    import { headState } from "#lib/stores/head.svelte.ts";
</script>

{#if headState.pinup}
    <img src={headState.pinup} alt={headState.title}>
{/if}

<style lang="scss">
    img {
        width: 100%;
        max-width: 78ch;
        margin: 0;
    }
</style>