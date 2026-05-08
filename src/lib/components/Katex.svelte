<script lang="ts">
    import { renderToString } from 'katex'

    export let formula: string
</script>

<div class="d-flex justify-content-center mt-2 mb-2">
    {@html renderToString(formula)}
</div>
