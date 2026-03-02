---
title: title
description: description
---

<script>
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

<Helper {title} {description} />

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
