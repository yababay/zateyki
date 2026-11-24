<script lang="ts">
    import { onMount } from 'svelte';

    interface Props {
        /** Показывать после ухода первого абзаца из окна или после прокрутки доли высоты экрана. */
        showAfter?: 'first-paragraph' | number;
    }

    let { showAfter = 'first-paragraph' }: Props = $props();
    let isVisible = $state(false);

    onMount(() => {
        if (showAfter === 'first-paragraph') {
            const firstParagraph = document.querySelector('article p');
            if (!firstParagraph) return;

            const observer = new IntersectionObserver(([entry]) => {
                isVisible = !entry.isIntersecting;
            });
            observer.observe(firstParagraph);
            return () => observer.disconnect();
        }

        const updateVisibility = () => {
            isVisible = window.scrollY >= window.innerHeight * Math.max(0, showAfter);
        };

        updateVisibility();
        window.addEventListener('scroll', updateVisibility, { passive: true });
        window.addEventListener('resize', updateVisibility);

        return () => {
            window.removeEventListener('scroll', updateVisibility);
            window.removeEventListener('resize', updateVisibility);
        };
    });
</script>

{#if isVisible}
<a href="#header" title="Наверх" aria-label="Прокрутить страницу вверх" class="link-secondary go-right">
	<i class="bi bi-arrow-up-short" aria-hidden="true"></i>
</a>
{/if}

<style lang="scss">

    a {
        display: block;
        position: fixed;
        bottom: .7rem;
        font-size: 2rem;
    }

    .go-right {
        right: 1.3rem;
    }

</style>
