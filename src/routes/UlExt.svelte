<script>
    let { toc } = $props()
</script>

<ul>
    {#each toc as [ href, title ] }
        <li><a {href} {title}>{title}</a></li>
    {/each}
</ul>
