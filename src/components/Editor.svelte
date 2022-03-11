<script>
  import Quill from "quill";
  import { onMount } from "svelte";

  onMount(async () => {
    var quill = new Quill("#editor", {
      modules: {
        toolbar: [
          [{ header: [1, 2, 3, false] }],
          ["bold", "italic", "underline", "strike"],
          ["link", "code-block"],
        ],
      },
      placeholder: "Type something...",
      theme: "snow",
    });
  });
</script>

<div class="editor">
  <div id="editor" />
</div>

<style lang="scss">
</style>
