---
title: Пушкин и саранча
description: Подозрительное совпадение, случившееся с двумя литераторами путешествовавшими из Кишенева в Одессу.
---

<script>
    import Helper from '$lib/components/Helper.svelte' 
    import Prolog from '$lib/components/Prolog.svelte'
    import div from './Пушкин и саранча.swinb?raw' 
    export let data
    const { title, description, banner, image } = data
</script>

<Helper {title} {description} {banner} {image} />

<Prolog {div} />
