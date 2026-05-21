<script>

    export let right = false

</script>

<a href="/" title="На главную" class="link-secondary" class:go-right={right} class:go-left={!right}><i class="bi bi-house"></i></a>

<style lang="scss">

    a {
        display: block;
        position: fixed;
        top: .7rem;
        font-size: clamp(1.5rem, 4vw, 2rem);
        z-index: 20;
    }
    
    .go-left {
        left: 1rem;
    }
    
    .go-right {
        right: 1rem;
    }

    @media (max-width: 640px) {
        a {
            top: .5rem;
        }
    }
    
</style>