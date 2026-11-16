<script lang="ts">
    import { renderToString } from 'katex'
    import 'katex/dist/katex.min.css'
    let  { formula } = $props()
</script>

<div class="d-flex justify-content-center mt-2 mb-2">
    {@html renderToString(formula)}
</div>
