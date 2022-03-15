<script lang="ts">
  import Editor from "./Editor.svelte";
  export let id: string = "";

  let htmlPreviewRef: HTMLDivElement = null;

  const onClickConvertHtml = () => {
    const editorEl = document.getElementById(id).querySelector(".ql-editor");
    const htmlStr = editorEl.innerHTML;
    htmlPreviewRef.innerText = htmlStr;
  };
</script>

<div class="editor-convert">
  <Editor {id} />
  <div class="button-wrapper">
    <button on:click={onClickConvertHtml}> Convert to HTML </button>
  </div>
  <div class="html-preview" bind:this={htmlPreviewRef}>
    <p></p>
  </div>
</div>

<style lang="scss">
  .editor-convert {
    flex-grow: 1;
    :global(.ql-editor) {
      height: 500px;
    }
  }
  .button-wrapper {
    padding: 10px 10px 10px 0;
  }
  .html-preview {
    padding: 20px;
    border: 1px solid #ddd;
    :global(*) {
      padding: 0;
      margin: 0;
    }
  }
</style>
