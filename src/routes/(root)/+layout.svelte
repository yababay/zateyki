<script lang="ts">
    import '$lib/styles/root.scss'
	import Head from '$lib/components/Head.svelte';
	import Header from '$lib/components/Header.svelte';
    import Footer from '$lib/components/Footer.svelte';
    import Telegram from '$lib/components/Telegram.svelte';
    import banner from '$lib/assets/barny-banner.png'
    import _atlas from '$lib/assets/atlas.json'
    import UlExt from './UlExt.svelte'

    const atlas = _atlas as [string, { title: string }][]

    const tocAtlas = atlas.map(([href, descr]) => [ `/${href.replaceAll('-', '/')}`, descr.title ])

    const tocAtlas1859 = tocAtlas.filter(([href]) => /1859/.test(href))
    const tocAtlas1745 = [ ['/atlas-1745/', 'Предисловие к Атласу Российской империи 1745 г.'], ...tocAtlas.filter(([href]) => /1745/.test(href)) ]

    const title = "Бабайкина сарайка"
    const description = "Лонгриды Михаила Белякова"

</script>

<Head {title} {description} />
<img src={banner} alt={title} class="d-none">

<Telegram />

<section id="toc">
    <Header />
        <article>
            <slot /> 

            <h2> Карты и схемы </h2>
            <h3> Атлас Российской империи (1745 г.)</h3>
            <UlExt toc={tocAtlas1745} />
            <h3> Карта земель иррегулярных войск (1859 г.)</h3>
            <UlExt toc={tocAtlas1859} />

        </article>   
    <Footer />
</section>
