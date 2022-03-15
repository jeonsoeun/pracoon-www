<script>
  import EditorConverter from "../components/EditorConverter.svelte";
</script>

<div class="page page-notice-editor">
  <div class="flex-box">
    <EditorConverter id="notice-editor-en" />
    <!-- <EditorConverter id="notice-editor-ko" /> -->
  </div>
</div>

<style lang="scss">
  .page-notice-editor {
    .flex-box {
      display: flex;
      gap: 20px;
      
    }
    .button-wrapper {
      padding: 10px 10px 10px 0;
    }
  }
</style>
