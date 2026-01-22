<script>
    import '$lib/styles/root.scss'
	import Head from '$lib/components/Head.svelte';
	import Header from './Header.svelte';
    import Footer from '$lib/components/Footer.svelte';

    const title = "Бабайкина сарайка"
    const description = "Лонгриды Михаила Белякова"

</script>

<Head {title} {description} />

<section id="toc">
    <Header title="Список лонгридов" />
        <article>
            <slot /> 
        </article>   
    <Footer />
</section>
