<script>
  const props = $props();
  const posts = props.posts ?? [];
  console.log(posts?.[0]?.title)
</script>

<div>
  {#each posts as post}
    <div>
      <h2>{post.title}</h2>
      <p>{post.content}</p>
    </div>
  {/each}
</div>