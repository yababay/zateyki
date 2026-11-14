<script lang="ts">
    	let { children } = $props();
</script>

<p class="mt-2 mb-3">
    <small><sup>*</sup>
        &nbsp;
		{@render children()}
    </small>
</p>

<style lang="scss">
    p {
        border-block: 1px solid silver;
        padding-block: .5rem;
    }
</style>
