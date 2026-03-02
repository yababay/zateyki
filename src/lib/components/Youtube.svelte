<script lang="ts">
    export let alt: string, id: string
</script>

<iframe width="690" height="388" src={`https://www.youtube.com/embed/${id}`} title={alt} frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>

<style>
    iframe {
        margin: auto;
        display: block;
        margin-bottom: 2rem;
    }
</style>
