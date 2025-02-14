<script>
  const props = $props();
  const posts = props.data?.posts ?? [];
</script>

<div>
  <h1 class="text-2xl font-bold">Diary</h1>
  {#each posts as post}
    <div class="mt-5">
      <h2 class="text-xl"><a href={`/diary/${post.id}`} class="no-underline">{post.title}</a></h2>
      <p class="ml-5"><a href={`/diary/${post.id}`} class="no-underline">{post.content}</a></p>
    </div>
  {/each}
</div>