<script lang="ts">
  import Editor from "./Editor.svelte";
  let {id = 'editor'}: {id: string } = $props();
  let htmlPreviewCtxRef: HTMLDivElement | null = null;

  const onClickConvertHtml = () => {
    // editor에 적은 내용 하단 privew에 추가.
    const editorEl = document?.getElementById(id)?.querySelector(".ql-editor");
    if(!editorEl) return;
    const htmlStr = editorEl.innerHTML;
    if(!htmlPreviewCtxRef) return;
    htmlPreviewCtxRef.innerText = htmlStr;
  };
</script>

<div class="editor-convert flex-1">
  <input class="w-full p-[10px] box-border mb-5" placeholder="제목" />
  <Editor {id} />
  <div class="p-[10px] pb-0">
    <button onclick={onClickConvertHtml}> Convert to HTML </button>
  </div>
  <div class="html-preview p-5 border border-solid border-[#ddd]" >
    <div class="html-preview__content" bind:this={htmlPreviewCtxRef}></div>
  </div>
</div>

<!-- <style>
   .editor-convert .ql-editor {
      height: 200px;
    }
  .html-preview *  {
      padding: 0;
      margin: 0;
  }
 </style> -->
