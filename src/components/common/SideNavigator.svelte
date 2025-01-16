<script lang='ts'>
  let siteTitle = $state('Cave');
  const menuConfig = [
    {
      title: '테스트 페이지',
      children: [
        {
          title: '차트 테스트',
          link: '/chart-test'
        },
        {
          title: '에디터 테스트',
          link: '/editor-test'
        }
      ],
    },{
       title: 'Diary',
       link: '/diary'
    }
  ]
  let menu = $state([
  ]);

</script>

<div class="SideNavigator w-[300px] min-h-full p-3 bg-gray-300 flex-shrink-0">
  <h2 class="SideNavigator_SiteName font-bold text-lg mb-10">{siteTitle}</h2>
  <div class="SideNavigator_menu">
    {#each menuConfig as item}
      <div class="SideNavigator_menu__item">
        {#if item.link}
        <a href={item.link}>{item.title}</a>
        {/if}
        {#if item.children}
        {#if !item.link}
        <h3>{item.title}</h3>
        {/if}
        <ul>
          {#each item.children as child}
            <li>
              <a href={child.link}>{child.title}</a>
            </li>
          {/each}
        </ul>
        {/if}
      </div>
    {/each}
  </div>

</div>