<script>
    import '$lib/styles/root.scss'
	import Head from '$lib/components/Head.svelte';
	import Header from '$lib/components/Header.svelte';
    import Footer from '$lib/components/Footer.svelte';
    import Telegram from '$lib/components/Telegram.svelte';
    import banner from '$lib/assets/barny-banner.png'

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
        </article>   
    <Footer />
</section>
