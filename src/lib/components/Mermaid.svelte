<script lang="ts">
  interface Props {
    src: string;
    config?: Record<string, any>;
  }

  let { src, config = {} }: Props = $props();
  let svg = $state('');
  let error = $state('');

  // Генерируем уникальный ID для каждого экземпляра компонента
  const id = `mermaid-${Math.random().toString(36).substring(2, 9)}`;

  $effect(() => {
    // $effect в Svelte 5 выполняется только в браузере (на клиенте)
    if (!src) return;

    let isCancelled = false;

    async function renderDiagram() {
      try {
        // Динамический импорт предотвращает ошибки SSR (document is not defined)
        const mermaid = (await import('mermaid')).default;

        mermaid.initialize({
          startOnLoad: false,
          theme: 'default',
          ...config
        });

        const { svg: renderedSvg } = await mermaid.render(id, src);

        if (!isCancelled) {
          svg = renderedSvg;
          error = '';
        }
      } catch (err) {
        if (!isCancelled) {
          error = err instanceof Error ? err.message : 'Ошибка рендеринга диаграммы';
          console.error('Mermaid error:', err);
        }
      }
    }

    renderDiagram();

    return () => {
      isCancelled = true;
    };
  });
</script>

{#if error}
  <pre class="mermaid-error">{error}</pre>
{:else if svg}
  <div class="mermaid-container">
    {@html svg}
  </div>
{:else}
  <div class="mermaid-loading">Загрузка диаграммы...</div>
{/if}

<style>
  .mermaid-container {
    display: flex;
    justify-content: center;
    overflow-x: auto;
  }

  .mermaid-error {
    color: #b91c1c;
    background: #fef2f2;
    padding: 1rem;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    white-space: pre-wrap;
  }
</style>
