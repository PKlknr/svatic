<script>
  import Page from './Page.svelte';
  console.log('Executes on SSR-render, not in HTML');
</script>

<Page>
  <h1>Hello world</h1>
  <button on:click="{() => console.log('Hello')}">Does nothing</button>
</Page>
