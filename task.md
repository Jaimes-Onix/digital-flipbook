# Fix Navigation and Labeling in Reader

The user reported they cannot go "back" a page when reading books in landscape orientation. This appears to be caused by a combination of misleading page labels and potentially buggy interaction settings in the flipbook viewer.

## Proposed Changes

### 1. `components/BookViewer.tsx` [x]
- **Enable Native Interaction:** Re-enable clicking on page edges to flip pages (`disableFlipByClick: false`) and set a reasonable `swipeDistance` (30).
- **Improve Button Visibility:** Increase the visibility of the left/right navigation arrows (change `text-white/15` to `text-white/40`) and make them larger.
- **Conditional Cover:** Disable `showCover` when in `isSinglePage` mode (landscape orientation) to avoid logic conflicts in `react-pageflip`.
- **Coordinate with App:** Ensure the `onFlip` callback provides clear enough data for the header to display the correct page numbers.

### 2. `App.tsx` [x]
- **Refine Page Label:** Update the `readerPageInfo` calculation to detect if the viewer is likely in single-page mode (based on `selectedBook.orientation`) and display "page X" instead of "pages X-Y" for landscape books.

## Verification Plan

### Manual Verification
- Open a landscape book (like "The Lifetime App: User Guide") and verify that:
  1. The top header says "page 1 of X" instead of "pages 1-2".
  2. Clicking the right side of the page turns it forward.
  3. Clicking the left side (or the left arrow button) turns it back.
  4. The navigation arrows are clearly visible.
