
<script lang="ts">
  const props = $props();
  const post = props.data?.post ?? null;
</script>

<div>
  <div class="mt-5">
    <h2 class="text-xl"><a href={`/diary/${post.id}`} class="no-underline">{post.title}</a></h2>
    <p class="ml-5"><a href={`/diary/${post.id}`} class="no-underline">{post.content}</a></p>
  </div>
</div>