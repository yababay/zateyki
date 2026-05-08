<script lang="ts">
    import { onMount, mount } from 'svelte'
    import { render } from 'katex'
    import Helper from '$lib/components/Helper.svelte' 
    import Katex from '$lib/components/Katex.svelte' 
    import Story from './story.md'
    
    export let data: {formulas: string[], sources: string[], title: string, description: string, banner: string, image: string}

    const { title, description, banner, image, sources, formulas } = data

    onMount(() => {

        Array.from(document.querySelectorAll('img') as NodeListOf<HTMLImageElement>)
        .filter(img => img.id !== 'banner')
        .forEach((img, i) => {
            const { alt } = img
            const parent = img.parentElement
            if(!parent) return
            const figure = document.createElement('figure')
            parent.insertBefore(figure, img)
            const caption = document.createElement('figcaption')
            const update = parent.removeChild(img)
            update.src = sources[i]
            caption.textContent = alt
            figure.appendChild(update)
            figure.appendChild(caption)
        })

        Array.from(document.querySelectorAll('pre.language-latex') as NodeListOf<HTMLPreElement>)
        .forEach((pre, i) => {
            const parent = pre.parentElement
            if(!parent) return
            const div = document.createElement('div')
            parent.replaceChild(div, pre)
            div.classList.add('mt-3')
            div.classList.add('mb-3')
            div.classList.add('text-center')
            render(formulas[i], div)
            //mount(Katex, {target: div, props: {formula: formulas[i]}})
        })
    })
</script>

<Helper {title} {description} {banner} {image} />

<Story />


<!-- script>
    import Helper from '$lib/components/Helper.svelte' 
    // import Figure from '$lib/components/Figure.svelte' 
    // import Footnote from '$lib/components/Footnote.svelte' 
    // import Sup from '$lib/components/Sup.svelte' 
    // import Prolog from '$lib/components/Prolog.svelte' 
    // import div from './Prolog.swinb?raw'
    // import src   from './'
    // import src01 from './'
    // import src02 from './'
    // import src03 from './'
    // import src04 from './'
    export let data
    const { title, description, banner, image } = data
    //const caption = ''
    //const caption01 = ''
    //const caption02 = ''
    //const caption03 = ''
    //const caption04 = ''
    //const caption05 = ''
</script>

<Helper {title} {description} / -->

<!--

<Helper {title} {description} {banner} {image} />

<Prolog {div} />

<Figure {caption}>
    <img {src} alt={caption}>
</Figure>

<Figure caption={caption01}>
    <img src={src01} alt={caption01}>
</Figure>

<Figure caption={caption02}>
    <img src={src02} alt={caption02}>
</Figure>

<Figure caption={caption03}>
    <img src={src03} alt={caption03}>
</Figure>

<Figure caption={caption04}>
    <img src={src04} alt={caption04}>
</Figure>

<Figure caption={caption05}>
    <img src={src05} alt={caption05}>
</Figure>

-->


