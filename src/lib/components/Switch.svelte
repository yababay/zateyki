<script lang="ts">
    let { checked, label, onchange } = $props()

    //const onchange = () => { checked = !checked }
    const id = `switch-${Math.round(Math.random() * 1000000)}`
</script>

<div class="form-check form-switch">
  <input class="form-check-input" type="checkbox" role="switch" {id} {checked} onchange={onchange}>
  <label class="form-check-label" for={id}>{label}</label>
</div>
