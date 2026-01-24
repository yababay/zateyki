<script>
    export let toc
</script>

<ul>
    {#each toc as [ href, title ] }
        <li><a {href} {title}>{title}</a></li>
    {/each}
</ul>