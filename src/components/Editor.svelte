<script lang="ts">
  import Quill from "quill";
  import { onMount } from "svelte";
  export let id: string = "";
  export let htmlText: string = "";

  onMount(async () => {
    // font size customize
    const Size = Quill.import("attributors/style/size");
    console.log(Size);
    const sizelist = [];
    for (let fz = 10; fz <= 32; ++fz) {
      sizelist.push(`${fz}pt`); // pt로 해야 google docs에서 복사시 반영된다.
    }
    Size.whitelist = sizelist;
    Quill.register(Size, true);
    // 에디터 생성
    const quill = new Quill(`#${id}`, {
      modules: {
        toolbar: [
          [{ header: [1, 2, 3, false] }],
          [{ size: sizelist }],
          [{ list: "ordered" }, { list: "bullet" }],
          [{ color: [] }],
          [{ background: [] }],
          ["bold", "italic", "underline", "strike"],
          ["link" /*, "code-block"*/, "clipboard"],
        ],
      },
      placeholder: "내용을 적어주세요",
      theme: "snow",
    });
  });
</script>

<div class="editor">
  <div {id} />
</div>

<style lang="scss">
  :global(.ql-container) {
    font-size: inherit !important;
  }
  @for $i from 10 to 33 {
    :global(.ql-snow .ql-picker.ql-size .ql-picker-item[data-value="#{$i}pt"]::before) {
      content: "#{$i}";
      font-size: #{$i}pt !important;
    }
  }
  @for $i from 10 to 33 {
  :global(.ql-snow .ql-picker.ql-size .ql-picker-label[data-value="#{$i}pt"]::before) {
      content: "#{$i}";
    }
  }
</style>
