# UI Components — Menu Builder

Reference spec for every UI component. Follow exactly when building.

---

## Button

### Variants

#### Primary (Accent CTA)
```
Background:     #E2562A
Color:          #FFFFFF
Font:           sans, 13.5px, weight 600
Padding:        9px 16px
Border radius:  9px
Border:         none

States:
  Default:      full opacity
  Hover:        opacity 0.8
  Active:       transform: scale(0.98)
  Focus:        outline: 2px solid #E2562A, outline-offset: 2px
  Disabled:     opacity 0.5, cursor: not-allowed
```

#### Secondary (Light Background)
```
Background:     #F5F5F4
Color:          #1C1917
Font:           sans, 13.5px, weight 600
Padding:        9px 16px
Border radius:  9px
Border:         none

States:
  Hover:        background: #ECEAE8
  Active:       transform: scale(0.98)
  Focus:        outline: 2px solid #E2562A, outline-offset: 2px
  Disabled:     opacity 0.5
```

#### Ghost (Transparent, Bordered)
```
Background:     transparent
Color:          #1C1917
Border:         1px solid #E7E5E4
Font:           sans, 13.5px, weight 600
Padding:        9px 16px
Border radius:  9px

States:
  Hover:        background: #F5F5F4, border-color: #D6D2CE
  Focus:        outline: 2px solid #E2562A, outline-offset: 2px
```

#### Icon Button (Square)
```
Width/Height:   34px
Background:     #F5F5F4
Color:          #44403C
Font size:      16px
Border:         none
Border radius:  9px
Cursor:         pointer

States:
  Hover:        background: #ECEAE8
  Focus:        outline: 2px solid #E2562A
```

#### Segmented Control (Group of Buttons)
```
Container:      display: flex, gap: 2px, background: #F5F5F4, border-radius: 10px, padding: 3px
Buttons:        flex: 1, padding: 9px 16px, border: none, cursor: pointer

Default (inactive):
  Background:   transparent
  Color:        #78716C
  Font size:    13.5px, weight 600

Active:
  Background:   #FFFFFF
  Color:        #1C1917
  Border radius: 9px
```

---

## Input Fields

### Text Input
```
Display:        block / inline-block
Width:          100% (in form context)
Background:     #FFFFFF
Border:         1px solid #E7E5E4
Color:          #1C1917
Font:           sans, 13.5px, weight 400
Padding:        9px 12px
Border radius:  6px
Line height:    1.4

States:
  Focus:        border-color: #E2562A, box-shadow: 0 0 0 3px rgba(226, 86, 42, 0.1), outline: none
  Error:        border-color: #DC2626
  Disabled:     background: #F5F5F4, color: #A8A29E, cursor: not-allowed
  Placeholder:  color: #A8A29E
```

### Textarea
```
Same as text input, but:
Padding:        12px
Min height:     100px
Resize:         vertical (allow user)
Font:           sans, 13.5px, line-height: 1.4
```

### Select / Dropdown
```
Same as text input
Appearance:     none (hide browser UI)
Padding right:  32px (room for chevron icon)
Background:     url(data:image/svg+xml...) no-repeat right 8px center
```

### Checkbox
```
Width:          18px
Height:         18px
Border:         2px solid #E7E5E4
Border radius:  4px
Background:     #FFFFFF
Cursor:         pointer
Appearance:     none (custom)

States:
  Checked:      background: #E2562A, border-color: #E2562A, content: '✓' (centered)
  Hover:        border-color: #D6D2CE
  Focus:        outline: 2px solid #E2562A, outline-offset: 2px
  Disabled:     opacity: 0.5
```

### Toggle Switch
```
Width:          48px
Height:         28px
Background:     #E7E5E4
Border radius:  14px (full)
Position:       relative

States:
  Off:
    Background: #E7E5E4
    Dot (8x8):  background #FFFFFF, left 2px, top 2px
  
  On:
    Background: #16A34A (success)
    Dot:        right 2px, top 2px

Transition:     background 0.2s, transform 0.2s
```

### Color Picker
```
Display:        flex, gap: 8px, flex-wrap: wrap
Options:        swatches (24px square, border-radius: 6px)
Selected:       border: 2px solid #E2562A
Hover:          transform: scale(1.05)
Unselected:     border: 1px solid #D6D2CE

Click handler:  pass color value to parent state
```

---

## Cards

### Item Card (Menu List)
```
Container:      display: flex, flex-direction: column, gap: 12px, padding: 12px
Background:     #FFFFFF
Border:         1px solid #E7E5E4
Border radius:  9px
Box shadow:     0 1px 3px rgba(0,0,0,0.08)

Layout:
  Image:        width: 100%, height: auto, border-radius: 6px, object-fit: cover
  Header:       display: flex, justify-content: space-between, align-items: flex-start
  Title:        font-family: serif, font-size: 16px, font-weight: 600, color: #1C1917
  Price:        font-family: sans, font-size: 16px, font-weight: 600, color: #E2562A
  Description:  font-family: sans, font-size: 11.5px, color: #78716C
  Tags:         display: flex, gap: 4px, flex-wrap: wrap

Actions:
  Edit button:  icon, 20px, color: #78716C, hover: #1C1917
  Delete btn:   icon, 20px, color: #DC2626, hover: darker red
```

### Stats Card
```
Container:      background: #F5F5F4, border-radius: 9px, padding: 12px
Layout:         display: flex, justify-content: space-between, align-items: center
Label:          font-size: 11.5px, color: #78716C, weight 500
Value:          font-size: 24px, color: #1C1917, weight 600
Icon:           24px, color: #E2562A, margin-right: 8px
```

---

## Modal / Dialog

### Overlay
```
Position:       fixed, inset: 0
Background:     rgba(0, 0, 0, 0.4)
Z-index:        100
Display:        flex, justify-content: center, align-items: center
```

### Modal Container
```
Background:     #FFFFFF
Border radius:  12px
Box shadow:     0 8px 24px rgba(0,0,0,0.20)
Max width:      600px (adjustable per modal)
Max height:     90vh
Overflow:       auto
Padding:        22px (xl)
Position:       relative (z-index 101)

Layout:
  Header:       margin-bottom: 16px
    Title:      font-family: serif, font-size: 24px, font-weight: 600
    Close btn:  position: absolute, top: 16px, right: 16px, icon 24px, cursor: pointer

  Content:      display: grid, grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)), gap: 16px

  Footer:       display: flex, gap: 12px, margin-top: 22px
    Primary:    Button (primary)
    Secondary:  Button (secondary)
```

---

## Forms

### Form Field Group
```
Container:      margin-bottom: 16px
Label:          display: block, font-size: 11.5px, weight 500, color: #78716C, margin-bottom: 4px
Input:          width: 100%, (see Input Fields above)
Error:          font-size: 11.5px, color: #DC2626, margin-top: 4px
Hint:           font-size: 11.5px, color: #A8A29E, margin-top: 2px

Multi-column:   display: grid, grid-template-columns: repeat(2, 1fr), gap: 12px
```

### Form Example
```html
<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;">
  <div>
    <label style="display: block; font-size: 11.5px; font-weight: 500; color: #78716C; margin-bottom: 4px;">
      Item Name
    </label>
    <input type="text" placeholder="e.g., Chicken Burrito" style="width: 100%; border: 1px solid #E7E5E4; padding: 9px 12px; border-radius: 6px; font-size: 13.5px;" />
  </div>
</div>
```

---

## Tag / Chip / Badge

### Tag (Selectable)
```
Display:        inline-flex, align-items: center, gap: 4px
Background:     #F5F5F4
Color:          #1C1917
Font:           sans, 12.5px, weight 500
Padding:        4px 8px
Border radius:  6px
Border:         1px solid transparent

States:
  Unselected:   bg: #F5F5F4, border: 1px solid #E7E5E4
  Selected:     bg: #E2562A, color: #FFFFFF, border: 1px solid #E2562A
  Hover:        cursor: pointer, transform: scale(1.02)
```

### Badge (Informational)
```
Display:        inline-block
Background:     varies (accent, success, alert, etc.)
Color:          #FFFFFF
Font:           sans, 10px, weight 600
Padding:        2px 6px
Border radius:  4px
Text transform: uppercase
Letter spacing: 0.5px

Examples:
  SET:          background: #FFA500 (orange)
  FEATURED:     background: #E2562A (accent)
  SPICY:        background: #DC2626 (red)
  NEW:          background: #16A34A (green)
```

### Dietary / Allergen Tag
```
Display:        inline-flex, gap: 4px, align-items: center
Background:     varies by type
Color:          #FFFFFF
Font:           sans, 10px, weight 600
Padding:        3px 6px
Border radius:  4px

Types:
  Vegan:        background: #16B981 (teal)
  Vegetarian:   background: #10B981 (green)
  Gluten-free:  background: #FBBF24 (amber)
  Nut allergy:  background: #DC2626 (red)
  Dairy allergy:background: #F59E0B (orange)
```

---

## Rails & Sidebars

### Expanded Rail
```
Width:          248px
Background:     #FFFFFF
Border right:   1px solid #E7E5E4
Display:        flex, flex-direction: column, gap: 12px
Padding:        12px
Overflow:       auto

Items:
  Button group:    display: flex, flex-direction: column, gap: 2px
  Category item:   padding: 8px 12px, border-radius: 6px, cursor: pointer
    Default:       color: #78716C, hover: bg #F5F5F4
    Active:        background: #F5F5F4, color: #E2562A, font-weight: 600
  Divider:         height: 1px, background: #ECEAE8, margin: 4px 0
```

### Collapsed Rail
```
Width:          54px
Background:     #FFFFFF
Border right:   1px solid #E7E5E4
Display:        flex, flex-direction: column, align-items: center
Padding:        14px 0
Gap:            10px

Items:
  Icon buttons:    width: 34px, height: 34px, border-radius: 9px, background: #F5F5F4
    Default:       color: #44403C
    Hover:         bg: #ECEAE8
    Active:        background: (category color), color: #FFFFFF
```

---

## Tabs

### Tab Bar
```
Display:        flex, gap: 2px
Background:     #F5F5F4
Border radius:  10px
Padding:        3px
Width:          fit-content or 100%

Tab buttons:
  Padding:      9px 16px
  Border:       none
  Cursor:       pointer
  Font:         sans, 13.5px, weight 600

States:
  Default:      background: transparent, color: #78716C
  Active:       background: #FFFFFF, color: #1C1917, border-radius: 9px
  Hover:        background: #FFFFFF (slight), opacity: 0.8
```

---

## Tooltips

```
Background:     #1C1917
Color:          #FFFFFF
Font:           sans, 11.5px
Padding:        6px 8px
Border radius:  6px
Box shadow:     0 2px 6px rgba(0,0,0,0.12)
Z-index:        50

Arrow:          small triangle pointing to trigger element
Position:       absolute, above/below/left/right of trigger
Delay:          200ms on hover (show on :hover after 200ms)
```

---

## Empty State / Placeholder

```
Container:      display: flex, flex-direction: column, align-items: center, gap: 12px, padding: 32px
Text:           font-size: 16px, color: #78716C, text-align: center
Icon:           48px, color: #D6D2CE
Button:         Button (primary) centered below

Example:
  "No items yet. Create your first item to get started."
  [+ New Item] button
```

---

## Loading State

### Spinner
```
Width/Height:   24px
Border:         3px solid #E7E5E4
Border-top:     3px solid #E2562A
Border radius:  50%
Animation:      spin 1s linear infinite

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

### Skeleton
```
Background:     linear-gradient(90deg, #F5F5F4, #ECEAE8, #F5F5F4)
Background-size:200% 100%
Animation:      loading 1.5s infinite
Border radius:  6px

Examples:
  Text line:    height: 12px, width: 80%
  Card:         height: 200px, width: 100%
```

---

## Notes

- All components use inline styles (no CSS classes)
- Border radius follows TOKENS.md scale
- Shadows follow TOKENS.md scale
- Colors always from TOKENS.md
- Spacing always from TOKENS.md (no magic numbers)
- Never use hardcoded values for padding, gap, margin — use tokens
