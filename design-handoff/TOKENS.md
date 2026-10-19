# Design Tokens — Menu Builder

Reference all design values from this file. Never hardcode colors, spacing, or fonts.

## Colors

### Semantic
```
Accent (Primary CTA):     #E2562A  (orange-red, brand)
Success:                  #16A34A  (green, confirmation)
Alert:                    #DC2626  (red, errors)
Warning:                  #F59E0B  (amber, warnings)
```

### Text
```
Primary (body text):      #1C1917  (near-black, high contrast)
Secondary (labels):       #78716C  (warm gray, medium contrast)
Tertiary (hints):         #A8A29E  (light gray, low contrast)
Disabled:                 #D6D2CE  (light, disabled state)
```

### Background
```
Page bg:                  #FAFAF9  (off-white, slight warmth)
Card/Input bg:            #FFFFFF  (white)
Hover/Focus bg:           #F5F5F4  (light gray, interactive feedback)
Alt section bg:           #FFFBF7  (very light beige, for sections)
```

### Border
```
Default border:           #E7E5E4  (light gray)
Focus border:             #E2562A  (accent, on focused inputs)
Subtle border:            #EBE8E4  (lighter, for secondary dividers)
```

### Category Colors (Use in Rail, Category Headers)
```
These cycle through menu categories. Ordered for visual variety:

Set Meals:     #EA580C  (orange)
Starters:      #DC2626  (red)
Nachos:        #EAB308  (yellow)
Burritos:      #10B981  (teal)
Tacos:         #06B6D4  (cyan)
Quesadillas:   #8B5CF6  (purple)
Enchiladas:    #EC4899  (pink)
Fajitas:       #F59E0B  (amber)
Burgers:       #6366F1  (indigo)
Mains:         #14B8A6  (turquoise)
Sides:         #84CC16  (lime)
Kids Menu:     #F97316  (orange-600)
Desserts:      #D946EF  (magenta)
Drinks:        #0EA5E9  (sky blue)
```

---

## Spacing

All spacing uses this scale. No arbitrary pixel values.

```
xs:    4px    (tight, inline gaps)
sm:    8px    (small padding, subtle gaps)
md:    12px   (default padding, most gaps)
lg:    16px   (medium padding, sections)
xl:    22px   (large padding, major sections)
2xl:   32px   (extra large, page margins)
3xl:   48px   (huge, full-page gutters)
```

### Common Combinations
```
Card padding:           12px (md)
Button padding:         9px 16px (md vertical, lg horizontal)
Modal padding:          22px (xl)
Section gap:            12px (md) or 16px (lg)
Page padding:           22px (xl) left/right; 32px (2xl) top/bottom
Input padding:          9px 12px (sm vertical, md horizontal)
```

---

## Typography

### Font Families
```
Sans (body, UI):         'Schibsted Grotesk', sans-serif
                         Fallback: -apple-system, BlinkMacSystemFont, 'Segoe UI'

Serif (headings, brand): 'Newsreader', serif
                         Fallback: Georgia, serif

Load via @font-face:
<link href="https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,400;6..72,500;6..72,600&family=Schibsted+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">
```

### Font Sizes
```
xs:     11.5px  (labels, hints, meta)
sm:     12.5px  (small text, secondary)
base:   13.5px  (body, default)
lg:     16px    (subheading, larger body)
xl:     20px    (heading)
2xl:    28px    (large heading)
3xl:    36px    (hero/title)
```

### Font Weights
```
Regular: 400  (body text)
Medium:  500  (labels, captions)
Semi:    600  (headings, buttons, emphasis)
Bold:    700  (strong emphasis, category titles)
```

### Line Heights
```
Tight:   1.05  (headings, names)
Normal:  1.4   (body text)
Relaxed: 1.6   (long-form text)
```

### Text Examples
```
Page title:      font-family: serif; font-size: 28px; font-weight: 600; line-height: 1.05;
Body text:       font-family: sans; font-size: 13.5px; font-weight: 400; line-height: 1.4;
Button:          font-family: sans; font-size: 13.5px; font-weight: 600;
Label:           font-family: sans; font-size: 11.5px; font-weight: 500; color: secondary;
Item price:      font-family: sans; font-size: 16px; font-weight: 600; color: accent;
Category name:   font-family: sans; font-size: 13.5px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;
```

---

## Border Radius

```
sm:    6px    (input fields, small components)
md:    9px    (buttons, cards, icons)
lg:    11px   (modals, large cards)
xl:    16px   (very large components, page corners)
full:  9999px (pill buttons, full circles)
```

---

## Shadows

```
None:     (default, flat)
sm:       box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
md:       box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
lg:       box-shadow: 0 4px 12px rgba(0, 0, 0, 0.16);
xl:       box-shadow: 0 8px 24px rgba(0, 0, 0, 0.20);
```

### Usage
```
Card:             sm or md
Modal overlay:    lg
Dropdown:         md
Floating button:  lg
Hover card:       md
```

---

## Opacity / States

```
Disabled:    opacity: 0.5
Hover:       opacity: 0.8 or darken 5%
Pressed:     opacity: 0.9, scale: 0.98
Focus:       border: 2px solid accent, outline: none
```

---

## Z-Index Stack

```
Modals:           100+
Dropdowns:        50
Floating buttons: 40
Sticky headers:   30
Rail:             20
Main content:     1
Background:       0
```

---

## Responsive Breakpoints

```
Mobile:    0px – 640px
Tablet:    641px – 1024px
Desktop:   1025px+

Test at:   320px (mobile), 768px (tablet), 1920px (desktop)
```

---

## Dark Mode (Future)

Currently not implemented. If adding dark mode:

```
Text primary (light):     #F5F5F4
Text secondary (light):   #A8A29E
Background (dark):        #1C1917
Card bg (dark):           #2A2723
Border (dark):            #44403C
Accent:                   #FF7344 (lighter orange)
```

---

## Implementation Examples

### Button (Primary)
```
background: #E2562A
color: white
font-size: 13.5px
font-weight: 600
padding: 9px 16px
border-radius: 9px
border: none
cursor: pointer

On hover: opacity: 0.8
On active: transform: scale(0.98)
On focus: outline: 2px solid #E2562A, outline-offset: 2px
```

### Input Field
```
background: #FFFFFF
border: 1px solid #E7E5E4
color: #1C1917
font-size: 13.5px
padding: 9px 12px
border-radius: 6px
font-family: sans

On focus: 
  border-color: #E2562A
  outline: none
  box-shadow: 0 0 0 3px rgba(226, 86, 42, 0.1)
```

### Card
```
background: #FFFFFF
border: 1px solid #E7E5E4
border-radius: 9px
padding: 12px
box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08)
```

### Label
```
font-family: sans
font-size: 11.5px
font-weight: 500
color: #78716C
text-transform: uppercase
letter-spacing: 0.5px
margin-bottom: 4px
```

---

## Notes

- All hex colors are sRGB (web-safe)
- Shadows use black (0,0,0) with varying alpha for consistency
- Never use grayscale grays (#999, #666, etc.) — use the warm grays defined here
- Font loads should be placed in `<helmet>` with other `<link>` tags
- Category colors are fixed; don't change them without approval
