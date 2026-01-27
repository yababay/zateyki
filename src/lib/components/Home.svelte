<script>

    export let right = false

</script>

<a href="/" title="На главную" class="link-secondary" class:go-right={right} class:go-left={!right}><i class="bi bi-house"></i></a>

<style lang="scss">

    a {
        display: block;
        position: fixed;
        top: .7rem;
        font-size: 2rem;
    }
    
    .go-left {
        left: 1rem;
    }
    
    .go-right {
        right: 1rem;
    }
    
</style>