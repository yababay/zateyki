<script lang="ts">

    import { onMount } from "svelte"

    onMount(async () => {
        const img = document.querySelector('img')
        if(!img) return
        const onImageLoaded = () => {
            header.style.backgroundImage = `url("${img.src}")`
            hiddenShield = true
            setTimeout(() => {
                hiddenHolder = false
                setTimeout(() => {
                    title.innerHTML = ''
                    title.textContent = document.title
                    hiddenTitle = false
                    img.remove()
                }, 100)
            }, 2000)
        }
        if(img.complete) {
            onImageLoaded()
            return
        }
        img.addEventListener('load', onImageLoaded)
    })

    let header: HTMLElement
    let title: HTMLSpanElement
    let hiddenShield = false
    let hiddenTitle  = true
    let hiddenHolder  = true

</script>

<header bind:this={header}>
    <div class="w-100 h-100 d-flex justify-content-center align-items-center" class:d-none={hiddenHolder}>
        <p class:shown-title={!hiddenTitle} class:hidden-title={hiddenTitle}>
            <i class="bi bi-align-end"></i><span bind:this={title}></span><i class="bi bi-align-start"></i>
        </p>
    </div>
    <div class="w-100 h-100 d-flex justify-content-center align-items-center" class:shown-shield={!hiddenShield} class:hidden-shield={hiddenShield} class:d-none={!hiddenHolder}>
        <div  class="spinner-border text-secondary">
            <span class="visually-hidden">Loading...</span>
        </div>
    </div>
</header>
