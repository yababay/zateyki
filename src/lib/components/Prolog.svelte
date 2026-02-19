<script lang="ts">
    import { onMount } from 'svelte'
    import hljs from '$lib/util/highlight.js'
    import '$lib/styles/highlight/styles/github.min.css'
    import '$lib/styles/prolog.scss'
    import showdown from 'showdown'
    const convetrer = new showdown.Converter()
    export let div
    export let show = false


    let count = 100
    const getId = () => `prolog-${count++}`
    const cloneTemplate = (pre: HTMLElement) => {
        const section = template.cloneNode(true) as HTMLElement
        const div = section.querySelector('div')
        const btn = section.querySelector('a')
        if(!(btn && div)) return
        const id = getId()
        div.setAttribute('id', id)
        btn.setAttribute('aria-controls', id)
        // btn.dataset.bsTarget = `#${id}`
        btn.setAttribute('href', `#${id}`)
        div.appendChild(pre)
        section.classList.remove('d-none')
        return section
    }

    onMount(() => {
        let divs = document.querySelectorAll('.nb-cell.query')
        for(const div of divs){ 
            div.classList.remove('query')
            div.classList.add('markdown')
            const query = div.textContent.trim()
            div.textContent = `__Итак, запрос <code class="result">${query}</code> и результат работы:__`
        }
        divs = document.querySelectorAll('.nb-cell.markdown')
        for(const div of divs){
            div.innerHTML = convetrer.makeHtml(div.textContent.trim())
            div.classList.remove('markdown')
        }
        divs = document.querySelectorAll('.nb-cell.program')
        for(const div of divs){

            const pre = document.createElement('pre')
            const code = document.createElement('code')
            code.textContent = div.textContent
            code.classList.add('language-prolog')
            pre.appendChild(code)

            const parent = div.parentElement
            const section = cloneTemplate(pre)
            if(!(parent && section)) return
            parent?.replaceChild(section, div)
        }
        hljs.highlightAll()
    })
    let template: HTMLElement
</script>

{@html div}

<section class="mb-3" bind:this={template}>
    <p class="w-100 text-end">
        <!-- svelte-ignore a11y_missing_attribute -->
        <a class="icon-link link-secondary link-offset-2 link-underline-opacity-25 link-underline-opacity-100-hover" data-bs-toggle="collapse" role="button" aria-expanded="true" aria-controls="collapseExample">
            <svg xmlns="http://www.w3.org/2000/svg" class="bi" viewBox="0 0 16 16" aria-hidden="true">
                <path d="M8.186 1.113a.5.5 0 0 0-.372 0L1.846 3.5l2.404.961L10.404 2l-2.218-.887zm3.564 1.426L5.596 5 8 5.961 14.154 3.5l-2.404-.961zm3.25 1.7-6.5 2.6v7.922l6.5-2.6V4.24zM7.5 14.762V6.838L1 4.239v7.923l6.5 2.6zM7.443.184a1.5 1.5 0 0 1 1.114 0l7.129 2.852A.5.5 0 0 1 16 3.5v8.662a1 1 0 0 1-.629.928l-7.185 2.874a.5.5 0 0 1-.372 0L.63 13.09a1 1 0 0 1-.63-.928V3.5a.5.5 0 0 1 .314-.464L7.443.184z"/>
            </svg>
            Показать/скрыть код на языке Prolog 
        </a>
    </p>
    <div class="collapse" class:show={show}>
    </div>
</section>

<style>
    section p {
        font-size: smaller;
    }
</style>
