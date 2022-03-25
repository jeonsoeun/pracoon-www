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
          // [{ font: ['Poppins', 'Noto Sans'] }],
          // [{ size: ['10', '11', '12'] }],
          [{ 'list': 'ordered'}, { 'list': 'bullet' }],
          [{color: [/* '#000', '#e80000', '#00b81c', '#008cff', '#fcc603' */]}],
          [{background: ['#fff', '#ffb3b3', '#7dffb1', '#70deff', '#feffa6']}],
          ["bold", "italic", "underline", "strike"],
          ["link"/*, "code-block"*/],
        ],
      },
      placeholder: "내용을 적어주세요",
      theme: "snow",
    });
    
    console.log(quill.getModule('toolbar'))
  });
</script>

<div class="editor">
  <div id={id} />
</div>

<style lang="scss">
</style>
