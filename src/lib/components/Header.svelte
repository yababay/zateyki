<script lang="ts">
    import { isRoot, headState } from '#lib/stores/head.svelte.ts';
    import { ROOT_TITLE, ROOT_DESCRIPTION } from '$app/env/public'
    import default_banner from '#lib/assets/barny-banner.png'

    let title = $derived(isRoot() && ROOT_TITLE || headState.title)
    let description = $derived(isRoot() && ROOT_DESCRIPTION || headState.description)
    let banner = $derived(isRoot() && default_banner || headState.banner)

</script>

<header style:background-image={`url("${banner}")`} class="d-flex justify-content-center align-items-center flex-column">
    <div class="w-100 h-75 d-flex justify-content-center align-items-center">
        <p>
            <i class="bi bi-align-end"></i><span bind:textContent={title} contenteditable="false"></span><i class="bi bi-align-start"></i>
        </p>
    </div>
    <p class="description">{description}</p>
</header>

<svelte:head>
    <link rel="canonical" href="https://yababay.github.io/zateyki/">
    {#if headState.pinup}
        <meta property="image" content={headState.pinup} />
        <meta property="twitter:image" content={headState.pinup} />
        <meta property="og:image:width" content="1600" />
        <meta property="og:image:height" content="840" />
        <meta property="og:image" content={headState.pinup} />
    {/if}
    <meta name="description" content={description}>
    <meta name="og:description" content={description}>
    <meta name="og:title" content={title}>
    <title>{title}</title>
</svelte:head>

<style lang="scss">

    $h1-color: rgb(151, 151, 151);

    header {
        margin: 0;
        border: 0;
        padding: 0;
        background-color: black;
        width: 100%;
        height: 20vh;
        min-height: 200px;
        background-position: center;
        background-repeat: no-repeat;
        background-size: cover;
        display: flex;
        flex-direction: row;
        justify-content: center;
        align-items: center;
        margin-bottom: 3rem;
        p {
            margin: 0;
            font-size: 3rem;
            line-height: 100%;
            opacity: .80;
            color: $h1-color;
            span {
                border: 3px solid $h1-color;
                padding-inline: 1.5rem;
                padding-block: 1rem;
                color: white;
                background-color: #333;
            }
        }
        .description {
            color: white;
            text-align: center;
            width: 100%;
            font-size: 1.2rem;
        }
    }
</style>
