<script lang="ts">
    export let banner: string = 'iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg=='
    const url = "data:image/png;base64," + banner;
    console.log(url.slice(0, 100))
</script>


<section style="--bannerUrl: {url}"></section>

<style lang="scss">
    section {
        width: 80ch;
        height: 180px;
        background-image: url(var(--bannerUrl));
    }
</style>
