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
            }, 3000)
            setTimeout(() => {
                title.innerHTML = ''
                title.textContent = document.title
                hiddenTitle = false
            }, 3100)
            //shield.classList.add('d-none')
            //hiddenTitle = false
            //const p = title.parentNode as HTMLParagraphElement
            //p.classList.remove('d-none')
            //p.classList.add('shown-title')
        }
        if(img.complete) {
            onImageLoaded()
            return
        }
        img.addEventListener('load', onImageLoaded)
    })

    let header: HTMLElement
    let shield: HTMLElement
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
    <div 
        class="w-100 h-100 d-flex justify-content-center align-items-center" 
        class:shown-shield={!hiddenShield} class:hidden-shield={hiddenShield} 
        class:d-none={!hiddenHolder} bind:this={shield}
    >
        <div  class="spinner-border text-secondary">
            <span class="visually-hidden">Loading...</span>
        </div>
    </div>
    <!-- div class="spinner-border text-secondary" role="status" class:d-none={hiddenShield}>
    </div -->
</header>
