<script>

    export let right = false
    export let icon = 'house'
    export let href = '/'
    export let title = 'На главную'
    const iconClass = `bi bi-${icon}`

</script>

<a {href} {title} class="link-secondary" class:go-right={right} class:go-left={!right}><i class={iconClass}></i></a>

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