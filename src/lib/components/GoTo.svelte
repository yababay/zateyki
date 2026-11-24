<script lang="ts">
	interface Props {
		id?: string;
	}

	let { id = 'header' }: Props = $props();
</script>

<span {id} class="goto-target" aria-hidden="true"></span>

<style>
	.goto-target {
		display: block;
		scroll-margin-top: 1rem;
	}
</style>