<script lang="ts">
  import Quill from "quill";
  import { onMount } from "svelte";
  export let id:string = '';
  export let htmlText:string = '';

  onMount(async () => {
    const quill = new Quill(`#${id}`, {
      modules: {
        toolbar: [
          [{ header: [1, 2, 3, false] }],
          [{ font: ['sans serif', ''] }],
          ["bold", "italic", "underline", "strike"],
          ["link"/*, "code-block"*/],
        ],
      },
      placeholder: "내용을 적어주세요",
      theme: "snow",
    });
  });
</script>

<div class="editor">
  <div id={id} />
</div>

<style lang="scss">
</style>
