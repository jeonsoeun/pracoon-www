<script lang="ts">
  import Editor from "./Editor.svelte";
  export let id: string = "";

  let htmlPreviewCtxRef: HTMLDivElement = null;

  const onClickConvertHtml = () => {
    // editor에 적은 내용 하단 privew에 추가.
    const editorEl = document.getElementById(id).querySelector(".ql-editor");
    const htmlStr = editorEl.innerHTML;
    htmlPreviewCtxRef.innerText = htmlStr;
  };
</script>

<div class="editor-convert">
  <input class="title-input" placeholder="제목" />
  <Editor {id} />
  <div class="button-wrapper">
    <button on:click={onClickConvertHtml}> Convert to HTML </button>
  </div>
  <div class="html-preview" >
    <div class="html-preview__content" bind:this={htmlPreviewCtxRef}/>
  </div>
</div>

<style lang="scss">
  .editor-convert {
    flex-grow: 1;
    :global(.ql-editor) {
      height: 200px;
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
  .title-input {
    width: 100%;
    padding: 10px;
    box-sizing: border-box;
    margin-bottom: 20px;
  }
</style>
