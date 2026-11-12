<script lang="ts">
    import Helper from '$lib/components/Helper.svelte'
    export let data: {title: string, description: string, banner: string, image: string}
    const { title, description, banner, image } = data
</script>

<Helper {title} {description} {banner} {image} />

<slot />
