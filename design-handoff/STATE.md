# State Management & Data Shapes — Menu Builder

Reference data structures and state handlers. Use these shapes when building components.

---

## Root State (MenuBuilder)

```javascript
{
  // Mode
  mode: 'edit' | 'preview',
  previewDevice: 'mobile' | 'desktop',

  // Data
  restaurantName: string,
  categories: MenuCategory[],
  items: MenuItem[],
  modifierGroups: ModifierGroup[],

  // UI
  railCollapsed: boolean,
  selectedCategoryId: string,
  searchQuery: string,
  editingItemId: string | null,
  tagEditMode: boolean,

  // Modals
  showItemModal: boolean,
  showCategoryModal: boolean,
}
```

---

## MenuItem

```javascript
{
  id: string,              // uuid
  name: string,            // "Chicken Burrito"
  description: string,     // "Grilled chicken, rice, beans..."
  categoryId: string,      // FK to MenuCategory
  image: string | null,    // URL
  price: number,           // in pence (e.g., 1495 = £14.95)
  
  // Dietary & Allergens
  dietary: DietaryTag[],   // ["vegan", "gluten_free", etc.]
  allergens: string[],     // ["nuts", "shellfish", etc.]
  
  // Metadata
  featured: boolean,       // Show as featured/SET badge
  active: boolean,         // Available for order
  
  // Modifiers
  modifierGroupIds: string[],  // FK to ModifierGroup
  
  // Combos
  combos: ComboGroup[],    // Set meals
  
  // UI State
  _tagsOpen: boolean | undefined,  // Collapse state for dietary tags
  _isEditing: boolean,     // Modal open state
  _editingTabIndex: number, // Which tab is active (0=Basic, 1=Options, etc.)
}
```

### DietaryTag (Enum)
```javascript
'vegan'
'vegetarian'
'gluten_free'
'nut_free'
'dairy_free'
'pescatarian'
'halal'
'kosher'
```

---

## MenuCategory

```javascript
{
  id: string,
  restaurantId: string,
  name: string,           // "Burritos"
  color: string,          // hex from CATEGORY_COLORS
  order: number,          // 0, 1, 2, ... for drag-reorder
  itemCount: number,      // denormalized for UI
  active: boolean,        // Hidden categories still exist
}
```

---

## ModifierGroup

```javascript
{
  id: string,
  restaurantId: string,
  name: string,           // "Size"
  type: 'SINGLE' | 'MULTIPLE' | 'OPTIONAL',
  modifiers: Modifier[],
  order: number,          // 0, 1, 2, ...
  required: boolean,      // Must pick at least one
}
```

### Modifier (within ModifierGroup)
```javascript
{
  id: string,
  name: string,           // "Large"
  price: number,          // upcharge in pence (0 for no charge)
  order: number,
}
```

---

## ComboGroup (Set Meals)

```javascript
{
  id: string,
  name: string,           // "2-Course Meal"
  courses: ComboSource[],
}
```

### ComboSource (Course Options)
```javascript
{
  id: string,
  name: string,           // "Choose a starter"
  type: 'ITEMS' | 'CATEGORY' | 'ANY',
  itemIds: string[],      // if type === 'ITEMS'
  categoryId: string,     // if type === 'CATEGORY'
  minPick: number,        // 1
  maxPick: number,        // 1
}
```

---

## State Handlers

### setMode(mode: 'edit' | 'preview')
```javascript
setState({ mode });
if (mode === 'preview') setPreviewDevice('mobile');
```

### setPreviewDevice(device: 'mobile' | 'desktop')
```javascript
setState({ previewDevice: device });
```

### toggleRail()
```javascript
setState(s => ({ railCollapsed: !s.railCollapsed }));
```

### selectCategory(categoryId: string)
```javascript
setState({ selectedCategoryId: categoryId, searchQuery: '' });
// Also: collapse item edit modal if open
```

### setSearchQuery(query: string)
```javascript
setState({ searchQuery: query });
// Filter items in render, don't mutate state
```

### openItemModal(itemId: string | null)
```javascript
setState({
  showItemModal: !!itemId,
  editingItemId: itemId,
  _editingTabIndex: 0, // Reset to "Basic" tab
});
```

### closeItemModal()
```javascript
setState({
  showItemModal: false,
  editingItemId: null,
});
```

### patchItem(itemId: string, updates: Partial<MenuItem>)
```javascript
setState(s => ({
  items: s.items.map(it =>
    it.id === itemId ? { ...it, ...updates } : it
  ),
}));
// POST to backend if needed
```

### toggleTagEditMode()
```javascript
setState(s => ({ tagEditMode: !s.tagEditMode }));
```

### toggleTagsPanel(itemId: string)
```javascript
setState(s => ({
  items: s.items.map(it =>
    it.id === itemId
      ? { ...it, _tagsOpen: !it._tagsOpen }
      : it
  ),
}));
```

### addDietaryTag(itemId: string, tag: DietaryTag)
```javascript
setState(s => ({
  items: s.items.map(it =>
    it.id === itemId && !it.dietary.includes(tag)
      ? { ...it, dietary: [...it.dietary, tag] }
      : it
  ),
}));
```

### removeDietaryTag(itemId: string, tag: DietaryTag)
```javascript
setState(s => ({
  items: s.items.map(it =>
    it.id === itemId
      ? { ...it, dietary: it.dietary.filter(t => t !== tag) }
      : it
  ),
}));
```

### addCategory(name: string, color: string)
```javascript
const newCategory = {
  id: uuid(),
  restaurantId: this.props.restaurantId,
  name,
  color,
  order: maxOrder + 1,
  itemCount: 0,
  active: true,
};
setState(s => ({
  categories: [...s.categories, newCategory],
}));
// POST to backend
```

### deleteItem(itemId: string)
```javascript
setState(s => ({
  items: s.items.filter(it => it.id !== itemId),
}));
// DELETE to backend
```

### reorderCategories(categoryIds: string[])
```javascript
setState(s => ({
  categories: s.categories.map((cat, i) => ({
    ...cat,
    order: categoryIds.indexOf(cat.id),
  })),
}));
// PATCH all to backend
```

---

## Side Effects / Async

### On Component Mount
```javascript
componentDidMount() {
  // Load restaurant data
  fetch(`/api/restaurants/${restaurantId}`)
    .then(r => r.json())
    .then(data => {
      this.setState({
        restaurantName: data.name,
        categories: data.categories || [],
        items: data.items || [],
      });
    });
}
```

### On Save (Item Update)
```javascript
saveItem(itemId) {
  const item = this.state.items.find(i => i.id === itemId);
  if (!item) return;
  
  // Validate
  if (!item.name.trim()) {
    this.setState({ error: 'Item name required' });
    return;
  }
  
  // POST/PATCH
  fetch(`/api/items/${itemId}`, {
    method: 'PATCH',
    body: JSON.stringify(item),
  })
    .then(r => r.json())
    .then(updated => {
      this.patchItem(itemId, updated);
      this.closeItemModal();
      this.setState({ message: 'Item saved' });
    })
    .catch(err => {
      this.setState({ error: err.message });
    });
}
```

### Debounced Search
```javascript
handleSearchChange(query) {
  clearTimeout(this.searchTimeout);
  this.setState({ searchQuery: query });
  
  this.searchTimeout = setTimeout(() => {
    // Optional: backend search if query is expensive
    // fetch(`/api/items/search?q=${query}`)
  }, 300);
}
```

---

## Derived State (Computed in renderVals)

### filteredItems
```javascript
const filteredItems = this.state.items.filter(it => {
  const matchesCategory = !this.state.selectedCategoryId || it.categoryId === this.state.selectedCategoryId;
  const matchesSearch = !this.state.searchQuery || 
    it.name.toLowerCase().includes(this.state.searchQuery.toLowerCase()) ||
    it.description.toLowerCase().includes(this.state.searchQuery.toLowerCase());
  return matchesCategory && matchesSearch && it.active;
});
```

### itemCountLabel
```javascript
const itemCountLabel = `${this.state.categories.length} categories · ${this.state.items.length} items`;
```

### itemsInCategory
```javascript
const itemsInCategory = (categoryId) =>
  this.state.items.filter(it => it.categoryId === categoryId && it.active).length;
```

### railCats
```javascript
const railCats = this.state.categories.map(cat => ({
  id: cat.id,
  name: cat.name,
  color: cat.color,
  selected: cat.id === this.state.selectedCategoryId,
  onSelect: () => this.selectCategory(cat.id),
  // ... more derived data
}));
```

---

## Data Flow Diagram

```
Root State
  ├─ mode ('edit' | 'preview')
  ├─ categories: MenuCategory[]
  ├─ items: MenuItem[]
  └─ selectedCategoryId: string
       │
       └─> Rail Component
           ├─ reads: categories, selectedCategoryId
           ├─ calls: selectCategory(id), toggleRail()
           └─ renders: category dots / buttons
       
       └─> Content Area
           ├─ reads: items, searchQuery, selectedCategoryId
           ├─ derived: filteredItems
           ├─ calls: selectCategory(id), setSearchQuery(q), openItemModal(id)
           └─> ItemCard (per item)
               ├─ reads: item (via prop or computed)
               └─ calls: patchItem(id, updates), deleteItem(id)
       
       └─> ItemModal (if showItemModal === true)
           ├─ reads: editingItemId, item data
           ├─ calls: patchItem(id, updates), closeItemModal()
           └─ has 4 tabs: Basic, Options, Combo, Pricing
```

---

## Redux-like Pattern (Alternative)

If implementing Redux:

```javascript
// Actions
const OPEN_ITEM_MODAL = 'OPEN_ITEM_MODAL';
const PATCH_ITEM = 'PATCH_ITEM';
const SET_SEARCH = 'SET_SEARCH';

// Reducer
function reducer(state, action) {
  switch (action.type) {
    case PATCH_ITEM:
      return {
        ...state,
        items: state.items.map(it =>
          it.id === action.payload.id
            ? { ...it, ...action.payload.updates }
            : it
        ),
      };
    case SET_SEARCH:
      return { ...state, searchQuery: action.payload };
    default:
      return state;
  }
}

// Use in component
const [state, dispatch] = useReducer(reducer, initialState);
dispatch({ type: PATCH_ITEM, payload: { id, updates } });
```

---

## Notes

- All IDs are UUIDs (string)
- All prices are in pence (integer, e.g., 1495 = £14.95)
- Don't mutate arrays/objects directly — always create new ones
- UI state (modals, collapse, editing) lives in component state, not backend
- Derived data is computed in `renderVals()`, not stored in state
- Async operations should catch errors and set error state
- Validation happens before save, show errors inline
