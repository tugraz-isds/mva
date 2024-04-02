<script lang="ts">
  import { onDestroy } from 'svelte';
  import type { View } from './ViewType';
  import { activeViewsStore, isCurrentlyResizing } from '../../stores/views';
  import { isInteractableStore } from '../../stores/brushing';
  import Layout_1 from './Layout-1.svelte';
  import Layout_2 from './Layout-2.svelte';
  import Layout_3 from './Layout-3.svelte';
  import Layout_4 from './Layout-4.svelte';
  import Layout_5 from './Layout-5.svelte';
  import Layout_6 from './Layout-6.svelte';

  let activeViews: View[];
  const unsubscribeActive = activeViewsStore.subscribe((value: any) => {
    activeViews = value;
  });

  let disableTextSelection = false;
  let isDraggingVertical = false;
  let isDraggingHorizontal = false;
  let activeHorizonalDivider: number | null = null;

  const handleVerticalMouseDown = () => {
    $isCurrentlyResizing = true;
    isDraggingVertical = true;
    disableTextSelection = true;
  };

  const handleHorizontalMouseDown = (e: MouseEvent) => {
    if (!(e.target instanceof Element)) return;
    const dividerId = e.target.id.match(/\d+$/);
    activeHorizonalDivider = dividerId ? parseInt(dividerId[0]) : null;
    $isCurrentlyResizing = true;
    isDraggingHorizontal = true;
    disableTextSelection = true;
  };

  const handleMouseUp = () => {
    $isInteractableStore = true;
    $isCurrentlyResizing = false;
    disableTextSelection = false;
    isDraggingVertical = false;
    isDraggingHorizontal = false;
    activeHorizonalDivider = null;
  };

  const handleResize = (e: MouseEvent) => {
    // Handle vertical resize
    if (isDraggingVertical) {
      const windowHeight = window.innerHeight;
      const dragY = e.clientY;
      if (activeViews.length === 5) {
        activeViews[0].height =
          activeViews[1].height =
          activeViews[2].height =
            (dragY / windowHeight) * 100 - 5;
        activeViews[3].height = activeViews[4].height =
          ((windowHeight - dragY) / windowHeight) * 100 + 4.5;
      } else if (activeViews.length === 3 || activeViews.length === 4) {
        activeViews[0].height = activeViews[1].height = (dragY / windowHeight) * 100 - 5;
        activeViews[2].height = activeViews[3].height =
          ((windowHeight - dragY) / windowHeight) * 100 + 4.5;
      }
    }
    // Handle horizontal resize based on divider id and number of active views
    else if (isDraggingHorizontal && activeHorizonalDivider) {
      const windowWidth = window.innerWidth;
      const dragX = e.clientX;
      if (activeHorizonalDivider === 1) {
        if (activeViews.length === 3 || activeViews.length === 4) {
          activeViews[0].width = (dragX / windowWidth) * 100;
          activeViews[1].width = ((windowWidth - dragX) / windowWidth) * 100;
        } else if (activeViews.length === 5) {
          activeViews[0].width = (dragX / windowWidth) * 100;
          activeViews[1].width = 100 - (activeViews[0].width + activeViews[2].width + 0.5);
        }
      } else if (activeHorizonalDivider === 2) {
        activeViews[1].width = (dragX / windowWidth) * 100 - activeViews[0].width;
        activeViews[2].width = 100 - (activeViews[0].width + activeViews[1].width + 0.5);
      } else if (activeHorizonalDivider === 3) {
        if (activeViews.length === 2) {
          activeViews[0].width = (dragX / windowWidth) * 100 - 0.5;
          activeViews[1].width = ((windowWidth - dragX) / windowWidth) * 100 + 0.25;
        } else if (activeViews.length === 4) {
          activeViews[2].width = (dragX / windowWidth) * 100 - 0.5;
          activeViews[3].width = ((windowWidth - dragX) / windowWidth) * 100 + 0.25;
        } else if (activeViews.length === 5) {
          activeViews[3].width = (dragX / windowWidth) * 100 - 0.5;
          activeViews[4].width = ((windowWidth - dragX) / windowWidth) * 100 + 0.25;
        } else if (activeViews.length === 6) {
          activeViews[3].width = (dragX / windowWidth) * 100 - 0.5;
          activeViews[4].width =
            ((windowWidth - dragX) / windowWidth) * 100 - activeViews[5].width + 0.25;
        }
      } else if (activeHorizonalDivider === 4 && activeViews.length === 6) {
        activeViews[4].width = (dragX / windowWidth) * 100 - activeViews[3].width;
        activeViews[5].width = 100 - (activeViews[3].width + activeViews[4].width + 0.5);
      }
    }
  };

  const handleSwap = (title: string, e: Event) => {
    // Find the indices of the two objects to swap
    const index1 = activeViews.findIndex((view: View) => view.title === title);
    const index2 = activeViews.findIndex(
      (view: View) => view.title === (e.target as HTMLElement).textContent
    );

    if (index1 !== -1 && index2 !== -1) {
      [activeViews[index1], activeViews[index2]] = [activeViews[index2], activeViews[index1]]; // Swap the objects in the array
      [activeViews[index1].width, activeViews[index2].width] = [
        activeViews[index2].width,
        activeViews[index1].width
      ]; // Swap widths
    }
  };

  onDestroy(() => {
    unsubscribeActive();
  });
</script>

<div
  style="user-select: {disableTextSelection ? 'none' : 'auto'}; height: 95.5%"
  on:mousedown={() => ($isInteractableStore = false)}
  on:mousemove={handleResize}
  on:mouseup={handleMouseUp}
>
  {#if activeViews.length === 1}
    <Layout_1 views={activeViews} {handleSwap} />
  {:else if activeViews.length === 2}
    <Layout_2 views={activeViews} {handleSwap} {handleHorizontalMouseDown} />
  {:else if activeViews.length === 3}
    <Layout_3
      views={activeViews}
      {handleSwap}
      {handleHorizontalMouseDown}
      {handleVerticalMouseDown}
    />
  {:else if activeViews.length === 4}
    <Layout_4
      views={activeViews}
      {handleSwap}
      {handleHorizontalMouseDown}
      {handleVerticalMouseDown}
    />
  {:else if activeViews.length === 5}
    <Layout_5
      views={activeViews}
      {handleSwap}
      {handleHorizontalMouseDown}
      {handleVerticalMouseDown}
    />
  {:else if activeViews.length === 6}
    <Layout_6
      views={activeViews}
      {handleSwap}
      {handleHorizontalMouseDown}
      {handleVerticalMouseDown}
    />
  {/if}
</div>
