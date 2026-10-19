# Layout Patterns — Menu Builder

Reference layouts and grid/flex patterns. Use these as blueprints for new screens.

---

## Main Editor Layout (Rail + Content)

### Structure
```
┌─────────────────────────────────┐
│      Header (64px)              │
├────────┬──────────────────────────┤
│ Rail   │ Content Area             │
│ (248px)│ (flex: 1)                │
│        │                          │
│ ≪ ◆    │ Search bar               │
│ ◆ ALL  │ ─────────────────────── │
│ ● SET  │ [Category]    [Items]    │
│ ● STR  │ ┌─────────────────────┐  │
│ ● NAC  │ │ Item Card           │  │
│        │ │ [Img] Title  [Edit]  │  │
│        │ └─────────────────────┘  │
│        │                          │
└────────┴──────────────────────────┘
```

### CSS Grid / Flex
```html
<div style="display: grid; grid-template-columns: auto 1fr; height: 100vh;">
  <!-- Rail -->
  <aside style="width: 248px; border-right: 1px solid #E7E5E4; overflow-y: auto; background: #FFFFFF;">
    ...
  </aside>

  <!-- Content -->
  <main style="flex: 1; min-height: 0; display: flex; flex-direction: column; overflow: hidden;">
    <div style="flex-shrink: 0;">Search & filters</div>
    <div style="flex: 1; overflow-y: auto;">Item list</div>
  </main>
</div>
```

### Collapsed Rail
Change `width: 248px` to `width: 54px` and align items center

---

## Header Layout

```
┌────────────────────────────────────────────────┐
│ [Logo] Restaurant Name        [Edit|Preview]   │
│        Cats: 14, Items: 58    [Devices] [View] │
└────────────────────────────────────────────────┘
```

### CSS
```html
<header style="display: flex; align-items: center; gap: 18px; padding: 0 22px; height: 64px; border-bottom: 1px solid #E7E5E4;">
  <!-- Logo + Name -->
  <div style="display: flex; align-items: center; gap: 11px;">
    <div style="width: 34px; height: 34px; border-radius: 9px; background: accent;">Logo</div>
    <div>
      <div style="font-family: serif; font-size: 20px; font-weight: 600;">Name</div>
      <div style="font-size: 11.5px; color: #A8A29E;">Subtitle</div>
    </div>
  </div>

  <!-- Controls (flex: 1 to push right) -->
  <div style="margin-left: auto; display: flex; gap: 12px; align-items: center;">
    ...
  </div>
</header>
```

---

## Tab Bar Layout

```
┌──────────────────────────────┐
│ [Basic][Options][Combo][Pricing] │
├──────────────────────────────┤
│ Form content for active tab  │
└──────────────────────────────┘
```

### CSS
```html
<div>
  <div style="display: flex; gap: 2px; background: #F5F5F4; border-radius: 10px; padding: 3px; margin-bottom: 16px;">
    <button style="flex: 1; padding: 9px 16px; border: none; border-radius: 9px; cursor: pointer; background: active ? '#FFFFFF' : 'transparent';">Tab 1</button>
    <button style="...">Tab 2</button>
  </div>
  <div style="padding: 0;">Content for active tab</div>
</div>
```

---

## Form Grid Layout (2-Column)

```
┌─────────────────┬──────────────────┐
│ Name            │ Price            │
├─────────────────┼──────────────────┤
│ Description (full width)           │
├────────────────────────────────────┤
│ Category        │ Featured    [ ]   │
└────────────────────────────────────┘
```

### CSS
```html
<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;">
  <div>
    <label>Name</label>
    <input ... />
  </div>
  <div>
    <label>Price</label>
    <input ... />
  </div>
</div>

<div style="grid-column: 1 / -1;">
  <label>Description</label>
  <textarea ... />
</div>

<div style="display: grid; grid-template-columns: 1fr auto; gap: 16px;">
  <div>
    <label>Category</label>
    <select ... />
  </div>
  <div style="display: flex; align-items: flex-end; gap: 8px;">
    <label>Featured</label>
    <input type="checkbox" />
  </div>
</div>
```

---

## Item List Layout (Grid of Cards)

```
┌──────────────────────────────────────┐
│ ┌──────────┐ ┌──────────┐ ┌────────┐ │
│ │ Item 1   │ │ Item 2   │ │ Item 3 │ │
│ └──────────┘ └──────────┘ └────────┘ │
│ ┌──────────┐ ┌──────────┐ ┌────────┐ │
│ │ Item 4   │ │ Item 5   │ │ Item 6 │ │
│ └──────────┘ └──────────┘ └────────┘ │
└──────────────────────────────────────┘
```

### CSS
```html
<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px;">
  <div style="...card styles...">Item 1</div>
  <div style="...card styles...">Item 2</div>
  ...
</div>
```

**Responsive:**
- Desktop (1920px): 4-5 columns
- Tablet (768px): 2-3 columns
- Mobile (320px): 1 column

---

## Modal Centered Layout

```
┌─────────────────────────────────────┐
│ ┌─────────────────────────────────┐ │
│ │ Edit Item              [✕]      │ │
│ ├─────────────────────────────────┤ │
│ │ Name:   [________]              │ │
│ │ Price:  [________]              │ │
│ │ ...                             │ │
│ ├─────────────────────────────────┤ │
│ │              [Cancel] [Save]    │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### CSS
```html
<div style="position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 100; display: flex; align-items: center; justify-content: center;">
  <div style="background: #FFFFFF; border-radius: 12px; padding: 22px; max-width: 600px; width: 90%; max-height: 90vh; overflow: auto; box-shadow: 0 8px 24px rgba(0,0,0,0.20);">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
      <h2 style="...">Title</h2>
      <button onClick={closeModal} style="...">✕</button>
    </div>
    
    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 22px;">
      Form fields...
    </div>

    <div style="display: flex; gap: 12px; justify-content: flex-end;">
      <button style="...secondary...">Cancel</button>
      <button style="...primary...">Save</button>
    </div>
  </div>
</div>
```

---

## Responsive Breakpoints

### Mobile (320px – 640px)
```
- Single column layouts
- Full-width modals (90% width with 5% margin)
- Stacked form inputs (grid-template-columns: 1fr)
- Collapsed rail (54px)
- Smaller padding (12px instead of 16px)
- Touch targets: 44px minimum
```

### Tablet (641px – 1024px)
```
- 2-column layouts where applicable
- Form grids: grid-template-columns: repeat(2, 1fr)
- Item grids: 2-3 columns
- Expanded rail (200px instead of 248px)
- Modal max-width: 500px
```

### Desktop (1025px+)
```
- Multi-column layouts
- Form grids: repeat(2, 1fr) or repeat(3, 1fr)
- Item grids: 3-4 columns
- Full rail (248px)
- Modal max-width: 600px
- Generous padding/gaps
```

### Media Queries (CSS)
```css
@media (max-width: 640px) {
  grid-template-columns: 1fr;
  padding: 12px;
}

@media (min-width: 641px) and (max-width: 1024px) {
  grid-template-columns: repeat(2, 1fr);
  padding: 16px;
}

@media (min-width: 1025px) {
  grid-template-columns: repeat(3, 1fr);
  padding: 22px;
}
```

---

## Flex vs Grid Decision Tree

**Use Flex when:**
- Single axis layout (row or column)
- Items flow in one direction (nav, toolbar, button group)
- Need alignment + spacing in one dimension
- Example: `display: flex; gap: 12px; align-items: center;`

**Use Grid when:**
- 2D layout (rows AND columns)
- Explicit positioning needed
- Responsive column counts
- Example: `display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;`

---

## Spacing Inside Components

### Card
```
Padding: 12px (md)
Internal gap: 12px (md)
```

### Modal
```
Padding: 22px (xl)
Content gap: 16px (lg)
Footer margin-top: 22px (xl)
```

### Form
```
Field gap: 16px (lg) between groups
Label margin-bottom: 4px (xs)
Input padding: 9px 12px
```

### Button Group
```
Gap: 12px (md) between buttons
Padding: 9px 16px per button
```

---

## Z-Index Stack

```
Modals:           z-index: 100
Modal backrop:    z-index: 100 (same as modal)
Dropdowns:        z-index: 50
Sticky headers:   z-index: 30
Floating buttons: z-index: 20
Rail:             z-index: 10
Main content:     z-index: 1
Background:       z-index: 0
```

---

## Common Patterns

### Empty State
```html
<div style="display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 32px; text-align: center;">
  <div style="font-size: 48px; color: #D6D2CE;">📦</div>
  <p style="font-size: 16px; color: #78716C;">No items yet</p>
  <p style="font-size: 13.5px; color: #A8A29E;">Create your first item to get started</p>
  <button style="...primary...">+ New Item</button>
</div>
```

### Loading Skeleton
```html
<div style="height: 200px; background: linear-gradient(90deg, #F5F5F4 25%, #ECEAE8 50%, #F5F5F4 75%); background-size: 200% 100%; animation: loading 1.5s infinite; border-radius: 9px;">
</div>

<style>
@keyframes loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>
```

### Divider
```html
<div style="height: 1px; background: #ECEAE8; margin: 12px 0;"></div>
```

---

## Notes

- Always test at 320px, 768px, and 1920px
- Use `min-height: 0` on flex containers with scrolling content
- Avoid hardcoded widths; use percentages or grid auto-sizing
- Touch targets on mobile should be 44px minimum
- Modal max-widths prevent content from getting too wide
