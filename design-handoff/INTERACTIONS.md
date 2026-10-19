# Interactions & Behaviors — Menu Builder

Reference for user interactions, animations, and real-time feedback.

---

## Search & Filter

### Real-Time Search
```
User types in search box
  ↓
Query updates state (debounced 300ms)
  ↓
filteredItems computed from:
  - item.name.toLowerCase().includes(query.toLowerCase())
  - item.description.toLowerCase().includes(query.toLowerCase())
  ↓
Results shown instantly
  ↓
Clear button appears if query.length > 0
  ↓
Click clear → query = '', results reset

Visual:
- Search box shows magnifying glass icon on left
- Clear button (✕) on right when active
- "N results" label below search box
- Items not matching query are hidden, not disabled
```

### Category Filter
```
User clicks category in rail
  ↓
selectedCategoryId = categoryId
  ↓
searchQuery cleared (reset to '')
  ↓
filteredItems recomputed
  ↓
Category button highlighted (bg: #F5F5F4, color: accent)
  ↓
Content scrolls to top

Clicking "All Items" clears category filter and shows all
```

---

## Collapse / Expand Tags

### Dietary Tags Collapse
```
Default state:
  - Panel collapsed (hidden)
  - Shows summary: "Dietary tags: Vegan, Vegetarian ▼"
  - 0 tags: "Add dietary tags ▼"

User clicks summary
  ↓
Panel expands
  ↓
Shows grid of tag checkboxes (vegan, vegetarian, gluten-free, etc.)
  ↓
Selected tags show checkmark
  ↓
User clicks checkbox to toggle
  ↓
Tag added/removed from item.dietary
  ↓
Summary updates in real-time
  ↓
State changes: _tagsOpen = !_tagsOpen

Caret icon rotates:
  - Collapsed: ▼ (pointing down)
  - Expanded: ▲ (pointing up)

Animation: caret rotates 180° in 0.2s ease

Interaction:
- Click anywhere in summary area to toggle
- Click checkbox to select/deselect tag
- When collapsed, user can't see tag list
- When expanded, all options visible
```

### Tag Edit Mode
```
Mode toggle: "Edit" / "Done" button in tag header

Edit mode OFF (default):
  - Tags shown as chips (read-only visual)
  - Checkboxes disabled (display: none)
  - Button says "Edit"

Edit mode ON:
  - Checkboxes visible and enabled
  - User can click to toggle
  - Chips update live
  - Button says "Done"

User clicks "Done":
  - tagEditMode = false
  - Checkboxes hide
  - Changes persist in item.dietary

Pressing Escape while in edit mode:
  - Closes panel
  - Resets to default state (collapsed)
```

---

## Modal (Item Edit)

### Open Modal
```
User clicks "Edit" button on item card
  ↓
showItemModal = true
  ↓
editingItemId = item.id
  ↓
Modal overlay fades in (0.2s ease)
  ↓
Modal card slides up from bottom (0.3s ease)
  ↓
Focus moved to first input (name field)

Visual:
- Overlay: fixed, inset: 0, background: rgba(0,0,0,0.4)
- Modal: centered, max-width: 600px, max-height: 90vh
- Close button (✕) in top-right corner
- Tab bar below title (Basic, Options, Combo, Pricing)
```

### Close Modal
```
User clicks close button (✕)
  ↓
showItemModal = false
  ↓
editingItemId = null
  ↓
Changes discarded (unless saved)
  ↓
Modal slides down & fades out (0.3s, 0.2s)

OR

User clicks "Cancel" button
  ↓
Same behavior

OR

User presses Escape key
  ↓
Same behavior

OR

User clicks overlay backdrop
  ↓
Same behavior
```

### Save Changes
```
User fills form
  ↓
Clicks "Save" button
  ↓
Validation runs:
  - name required (non-empty)
  - price required (>= 0)
  - Show inline errors if invalid
  ↓
If valid: POST/PATCH to /api/items/{id}
  ↓
Loading spinner shown on Save button
  ↓
On success:
  - patchItem(id, updated) called
  - Modal closes
  - Success toast: "Item saved" (2s)
  - Item card updates live
  ↓
On error:
  - Error toast with message
  - Modal stays open
  - User can retry or cancel
```

### Tab Navigation (inside modal)
```
User clicks tab button (e.g., "Options")
  ↓
_editingTabIndex = 1
  ↓
Form content switches (0.2s fade)
  ↓
Active tab highlighted (white bg, accent color text)
  ↓
Form preserves input values (no data loss)

Tabs:
  0: Basic (name, description, price, category, image, featured)
  1: Options (modifier groups)
  2: Combo (set meals)
  3: Pricing (advanced pricing rules)
```

---

## Drag & Reorder (Categories)

### Rail Drag-Drop
```
User long-presses (or clicks) category dot in rail
  ↓
Visual feedback: 
  - Dot becomes draggable (cursor: grab)
  - Shadow under dot
  - Opacity: 0.9
  ↓
User drags dot up/down
  ↓
Other dots shift out of the way (animated smoothly)
  ↓
Visual drop zone indicator shows (light highlight or line)
  ↓
User releases
  ↓
Order updated:
  - categories.map((cat, i) => ({ ...cat, order: i }))
  - PATCH all to backend with new order
  ↓
Dots snap to final position (0.2s ease)
  ↓
selectedCategoryId remains active

Feedback:
- Grab cursor while dragging
- Target area glows (bg: rgba(accent, 0.1))
- Smooth spring animation on snap
```

### Item Reorder (Future)
```
Similar to category drag, but applied to items within category
- Drag item card up/down
- Other items shift
- Order persists on backend
- Animation: 0.3s ease
```

---

## Validation & Error States

### Real-Time Validation
```
User types in name field
  ↓
onChange event fired
  ↓
State updated: item.name = value
  ↓
Validation runs:
  - name.trim().length > 0 (required)
  - name.length <= 100 (max)
  ↓
If invalid:
  - errorMessage = "Name required" or "Too long"
  - Input border: 2px solid #DC2626 (alert)
  - Error text shown below input (red, small)
  ↓
If valid:
  - errorMessage = null
  - Input border: 1px solid #E7E5E4 (normal)
  - No error text shown

Focus/Blur:
- On focus: add focus style (outline, highlight)
- On blur: validate, show error if needed
- User can see error and correct before submitting
```

### Form-Level Validation (on Save)
```
User clicks Save button
  ↓
validateForm() runs:
  - Check all required fields
  - Return errors object or null
  ↓
If errors:
  - Show error toast
  - Disable Save button
  - Focus first field with error
  - User fixes and tries again
  ↓
If no errors:
  - Submit form
  - Show loading spinner
```

### Allergen / Dietary Conflict Warnings
```
If user selects contradictory tags (e.g., vegan + contains dairy):
  - Show warning badge near tag
  - Warning: "⚠ Conflicting dietary info"
  - Don't prevent selection (user override)
  - Suggest fixing before save
```

---

## Inline Editing (Direct on Card)

### Edit Mode Toggle
```
User clicks item card
  ↓
Card enters edit mode:
  - Inputs become editable (instead of read-only)
  - Save / Cancel buttons appear
  - Edit icon changes to checkmark
  ↓
User can:
  - Edit name, description, price
  - See changes live
  ↓
Click Save:
  - Validate
  - POST/PATCH
  - Exit edit mode
  - Show success
  ↓
Click Cancel:
  - Discard changes
  - Revert to saved state
  - Exit edit mode
```

---

## Delete Confirmation

### Delete Item
```
User clicks delete icon on item card
  ↓
Confirmation dialog appears:
  - "Delete [item name]?"
  - "This action cannot be undone."
  - [Cancel] [Delete] buttons
  ↓
User clicks Delete
  ↓
Item removed from state
  ↓
DELETE /api/items/{id} called
  ↓
Success toast: "Item deleted"
  ↓
Item card disappears (0.3s fade-out)
  ↓
Item count decrements
  ↓
If no items left in category: show empty state

User clicks Cancel:
  - Dialog closes
  - Item untouched
```

---

## Loading States

### Item List Loading
```
Component mounts
  ↓
Show skeleton loaders (3-5 placeholder cards)
  ↓
Skeleton height: 200px each
  ↓
Skeleton animates: shimmer effect (0.5s loop)
  ↓
Data fetched
  ↓
Skeletons fade out (0.2s)
  ↓
Real items fade in (0.2s)
  ↓
Layout remains stable (no jank)
```

### Button Loading
```
User clicks Save
  ↓
Save button shows loading spinner
  ↓
Button text fades to transparent (or hidden)
  ↓
Spinner rotates (0.8s loop)
  ↓
Button disabled (pointer-events: none, opacity: 0.7)
  ↓
User can't click again
  ↓
Request completes
  ↓
Spinner disappears
  ↓
Text reappears
  ↓
Button re-enabled
```

---

## Hover & Focus States

### Item Card Hover
```
Mouse over item card
  ↓
Card shadow increases (sm → md)
  ↓
Background color shifts slightly (to #F5F5F4)
  ↓
Edit button becomes visible (if hidden)
  ↓
Edit button opacity: 0.6 → 1
  ↓
Transition: 0.2s ease-out

Mouse leaves:
  ↓
Reverse transition
  ↓
Back to normal state
```

### Button Hover
```
Mouse over button
  ↓
Opacity: 1 → 0.8
  ↓
Cursor: pointer
  ↓
No color change (opacity is enough)
  ↓
Transition: 0.15s ease
```

### Input Focus
```
User clicks/tabs into input
  ↓
Border color: #E7E5E4 → #E2562A
  ↓
Box shadow: 0 0 0 3px rgba(226, 86, 42, 0.1)
  ↓
Outline: none (don't show default)
  ↓
Cursor: text
  ↓
Label (above input) may change color to accent
```

---

## Notifications / Toasts

### Success Toast
```
"Item saved"
  ↓
Position: bottom-right, z-index: 100
  ↓
Background: #16A34A (success)
  ↓
Color: white
  ↓
Padding: 12px 16px
  ↓
Border radius: 6px
  ↓
Slide in from right (0.3s ease-out)
  ↓
Auto-dismiss after 3 seconds
  ↓
Slide out (0.3s ease-out)

Interaction:
- User can click to dismiss early
- Multiple toasts stack vertically
```

### Error Toast
```
Same as success, but:
  - Background: #DC2626 (alert)
  - Auto-dismiss: 5 seconds (longer, user might need to read)
  - Can include action button ("Retry", "Go back")
```

---

## Preview Mode

### Mobile Preview
```
User clicks "Preview" tab
  ↓
mode = 'preview'
  ↓
previewDevice = 'mobile'
  ↓
Modal appears showing mobile mockup:
  - iPhone bezel frame
  - 375px viewport width
  - Touch-optimized UI
  - No rail or edit controls
  ↓
Shows customer view (read-only)
  ↓
User can scroll, interact, see ordering flow
  ↓
Click "Back to Edit" or press Escape to return
```

### Desktop Preview
```
User clicks mobile icon → desktop icon
  ↓
previewDevice = 'desktop'
  ↓
Full-width view (1920px)
  ↓
Desktop layout of customer UI
```

---

## Keyboard Shortcuts

### While Editing
```
Escape:        Close modal / stop edit mode
Tab:           Move between form fields
Shift+Tab:     Move between fields (reverse)
Ctrl+S / Cmd+S: Save (submit form)
Ctrl+Z / Cmd+Z: Undo last change (future)
```

### Global
```
/ or Ctrl+K:   Focus search box
Ctrl+/ or ?:   Show help / keyboard shortcuts
```

---

## Animations Summary

| Interaction | Duration | Easing | Notes |
|---|---|---|---|
| Modal open/close | 0.3s / 0.2s | ease-out / ease-in | Slide + fade |
| Card hover | 0.2s | ease-out | Shadow + bg shift |
| Button hover | 0.15s | ease | Opacity only |
| Tab switch | 0.2s | ease | Fade content |
| Collapse/expand | 0.2s | ease | Caret rotation + height |
| Delete animation | 0.3s | ease-out | Fade + slide out |
| Spinner | 0.8s | linear | Continuous rotation |
| Skeleton shimmer | 0.5s | linear | Continuous loop |
| Toast slide | 0.3s | ease-out / ease-in | In/out |
| Drag snap | 0.2s | cubic-bezier(0.34, 1.56, 0.64, 1) | Spring effect |

---

## Accessibility

### Keyboard Navigation
```
- Tab: move through focusable elements (buttons, inputs, links)
- Enter/Space: activate buttons
- Escape: close modals, cancel edits
- Arrow keys: navigate lists (future enhancement)
```

### Screen Reader
```
- All buttons: <button> tag (semantic)
- All inputs: <label> + <input> (associated)
- Icons: aria-label or visually hidden text
- Modals: role="dialog", aria-labelledby="title"
- Collapsibles: aria-expanded="true/false"
```

### Visual
```
- Focus indicators: always visible (2px outline, accent color)
- Contrast: WCAG AA minimum (4.5:1 for text)
- Color not only meaning: use icons + color for status
- Touch targets: 44px minimum on mobile
```

---

## Notes

- All transitions should be smooth (no jumpy layouts)
- Loading states prevent user frustration (show spinner early)
- Error messages are inline, specific, and actionable
- Confirmation dialogs prevent accidental deletes
- Keyboard shortcuts are optional but improve power-user experience
