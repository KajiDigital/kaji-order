# Menu Builder Design System — Handoff Guide

This folder contains the complete design system for Menu Builder, formatted for **Cursor Agent** (Claude in code) and human reference.

## Files

| File | Purpose |
|------|---------|
| `TOKENS.md` | Design tokens (colors, spacing, type, shadows) |
| `COMPONENTS.md` | UI component specs (button, card, input, modal, item card, etc.) |
| `LAYOUTS.md` | Layout patterns (grid, flex, responsive, specific screens) |
| `STATE.md` | Data shapes, state handlers, side effects |
| `INTERACTIONS.md` | User interactions (drag, collapse, search, validation) |
| `EXAMPLES.md` | Copy-paste code snippets for common patterns |
| `README.md` | This file |

## Quick Start

### For Cursor (Claude Code Agent)
1. **.cursorrules** at project root pins this design system to every prompt
2. Before building, tell Cursor: *"Follow the Menu Builder design system from `/design-handoff`"*
3. Cursor will reference TOKENS.md, COMPONENTS.md, etc. automatically
4. Result: consistent, on-brand UI every time

### For Humans (Designers, PMs)
1. Read `TOKENS.md` first — understand the palette and spacing
2. Skim `COMPONENTS.md` — see what UI building blocks exist
3. Reference `EXAMPLES.md` for copy-paste starting points
4. Use `LAYOUTS.md` to understand responsive breakpoints

### For Engineers (Adding New Features)
1. Check `STATE.md` — what data shape do I need?
2. Check `COMPONENTS.md` — do I need a new component, or combine existing ones?
3. Reference `EXAMPLES.md` for similar code patterns
4. Ask Cursor to build it, referencing the design system

## Example Cursor Prompts

### Build a new modal
```
"Build a modal for 'Edit Item'. Follow the design system in /design-handoff.

Use these specs:
- Modal from COMPONENTS.md > Modal
- Form fields: name, description, price
- Button: primary (Save), secondary (Cancel)
- Styling: inline, all tokens from TOKENS.md
- State shape: from STATE.md > MenuItem

Make it a React component that accepts `item`, `onSave`, `onCancel` props."
```

### Build a category selector
```
"Build a category tab bar. Follow /design-handoff:
- Layout from LAYOUTS.md > TabBar
- Styling from TOKENS.md
- Component spec from COMPONENTS.md > TabBar
- Show current selection with highlight
- Click to change (pass handler via props)
- Copy code style from EXAMPLES.md > TabBar"
```

### Update color scheme
```
"We're changing the accent color from #E2562A to #FF6B35.
Update /design-handoff/TOKENS.md and rebuild these components:
- Button (primary)
- ItemCard
- Badge
- AccentText

Keep all other tokens the same."
```

## Design System Principles

### Consistency
Every UI piece follows the same tokens. No ad-hoc colors or spacing.

### Scalability
New components are added to COMPONENTS.md first (spec), then built. No surprises.

### Automation
Cursor reads the design system and builds accordingly. Reduces back-and-forth.

### Documentation
Every component, pattern, and token is documented. Future maintainers (and Cursor) know exactly what to follow.

## Updating the Design System

If you want to **change colors, spacing, or add a component**:

1. **Token change** → Update TOKENS.md, then ask Cursor to rebuild affected components
2. **New component** → Add to COMPONENTS.md with full spec (sizes, colors, states), then ask Cursor to build
3. **Layout change** → Update LAYOUTS.md with new pattern, reference in next build request

**Never:** Change colors in components directly. Always update TOKENS.md first.

## Testing Checklist

When Cursor builds something, verify:
- [ ] Follows TOKENS.md (colors, spacing, type)
- [ ] Matches COMPONENTS.md spec (sizes, states, spacing)
- [ ] Uses LAYOUTS.md patterns (flex/grid, responsive)
- [ ] State shape matches STATE.md
- [ ] Interactions work as described in INTERACTIONS.md
- [ ] Tested at 320px, 768px, 1920px widths
- [ ] All inline styles (no CSS classes)
- [ ] Accessible (semantic HTML, ARIA labels, focus states)

## Reference Implementation

**`Menu Builder.dc.html`** is the source of truth for the design system. When in doubt about how something should look or work, check there first.

---

**Version:** 1.0  
**Last Updated:** June 2026  
**Maintained By:** Design System / Cursor Integration
