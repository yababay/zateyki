<script lang="ts">

    import { onMount } from "svelte"
    import { headState } from "#lib/stores/head.svelte.ts";

    let header = $state<HTMLElement | null>(null)
    let title = $derived(headState.title) //$state<HTMLSpanElement | null>(null)
    let hiddenShield = $state(false)
    let hiddenTitle  = $state(false)
    let hiddenHolder  = $state(false)

    onMount(async () => {
        /*const img = document.querySelector('#banner img') as HTMLImageElement
        window.onload = function() { 
        if(title) title.textContent = document.title
        };
        if(!img) return
        const onImageLoaded = () => {
            setTimeout(() => {
                if(!(img && header)) return
                //console.log('img src = ', img.src)
                header.style.backgroundImage = `url("${img.src}")`
                hiddenShield = true
                hiddenHolder = false
                setTimeout(() => {
                    if(!title) return
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
        */
    })
</script>

<header bind:this={header}>
    <div class="w-100 h-100 d-flex justify-content-center align-items-center" class:d-none={hiddenHolder}>
        <p class:shown-title={!hiddenTitle} class:hidden-title={hiddenTitle}>
            <i class="bi bi-align-end"></i><span bind:textContent={title} contenteditable="false"></span><i class="bi bi-align-start"></i>
        </p>
    </div>
    <!--div class="w-100 h-100 d-flex justify-content-center align-items-center" class:shown-shield={!hiddenShield} class:hidden-shield={hiddenShield} class:d-none={!hiddenHolder}>
        <div  class="spinner-border text-secondary">
            <span class="visually-hidden">Loading...</span>
        </div>
    </div -->
</header>

<style lang="scss">

    $h1-color: rgb(151, 151, 151); //rgb(219, 219, 219) ;//rgb(236, 232, 193);

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
    }

    .hidden-title {
        visibility: hidden;
        opacity: 0;  
    }

    .shown-title {
        opacity: .85;
        transition: all 1.5s ease-out;
        visibility: visible;  
    }

    .hidden-shield {
        visibility: hidden;
        transition: all 1.9s ease-out;
        opacity: 0;  
    }

    .shown-shield {
        opacity: 1;
        visibility: visible;  
        background-color: black;
    }
</style>