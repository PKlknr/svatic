<script>
  export let lang;
</script>

<html lang="{lang}">
  <head></head>
  <body>
    <h1>Hello world</h1>
    <button on:click="{() => console.log('Hello')}">
      Does something when hydrated
    </button>
  </body>
</html>
