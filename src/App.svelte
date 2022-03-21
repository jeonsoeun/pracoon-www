<script lang="ts">
  import {Router, Link, Route} from 'svelte-routing';
  import Home from './routes/Home.svelte';
  import Editor from './routes/NoticeEditor.svelte'
</script>

<Router>
<div class="app">
  <div class="links">
    <Link to="/">Home</Link>
    <Link to="/editor">Editor</Link>
  </div>
  <div class="container">
    <Route path="/editor" component="{Editor}"/>
    <Route path="/" component="{Home}"/>
    </div>
  </div>
</Router>

<style lang="scss">
  .container {
    margin: auto;
    max-width: 1700px;
    padding: 20px;
  }
</style>
