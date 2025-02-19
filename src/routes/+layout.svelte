<script lang="ts">
	import '../app.css';
	import "quill/dist/quill.core.css";
	import SideNavigator from '../components/common/SideNavigator.svelte';
	let { children } = $props();
</script>

<div class="w-full min-h-dvh flex">
	<!-- <SideNavigator/> -->
	{@render children()}
</div>