<script>
  import Foot from './Foot.svelte';
</script>

<style>
  .min-h-80vh {
    min-height: 80vh;
  }
</style>

<html lang="en">
  <head></head>

  <body>
    <slot />
    <Foot />
  </body>
</html>
