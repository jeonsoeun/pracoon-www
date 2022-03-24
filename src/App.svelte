<script lang="ts">
  import { Router, Link, Route } from "svelte-routing";
  import Home from "./routes/Home.svelte";
  import Editor from "./routes/NoticeEditor.svelte";
  import NotFound from "./routes/NotFound.svelte";
import Chart from "./routes/Chart.svelte";
</script>

<Router>
  <div class="app">
    <div class="links">
      <Link to="/">Home</Link>
      <Link to="/editor">Editor</Link>
      <Link to="/chart">Chart</Link>
    </div>
    <div class="container">
      <Route path="/editor" component={Editor} />
      <Route path="/chart" component={Chart}/>
      <Route path="/" component={Home} />
      <Route path="*" component={NotFound} />
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
