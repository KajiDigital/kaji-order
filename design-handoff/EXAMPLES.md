# Code Examples — Copy & Paste Patterns

Use these as starting points for common UI patterns.

---

## Button Examples

### Primary Button
```jsx
<button 
  onClick={handleSave}
  style={{
    background: '#E2562A',
    color: '#FFFFFF',
    fontSize: '13.5px',
    fontWeight: 600,
    padding: '9px 16px',
    borderRadius: '9px',
    border: 'none',
    cursor: 'pointer',
    opacity: isLoading ? 0.5 : 1,
    transition: 'opacity 0.15s ease',
  }}
  onMouseEnter={(e) => (e.target.style.opacity = '0.8')}
  onMouseLeave={(e) => (e.target.style.opacity = '1')}
  disabled={isLoading}
>
  {isLoading ? '...' : 'Save'}
</button>
```

### Secondary Button
```jsx
<button 
  onClick={handleCancel}
  style={{
    background: '#F5F5F4',
    color: '#1C1917',
    fontSize: '13.5px',
    fontWeight: 600,
    padding: '9px 16px',
    borderRadius: '9px',
    border: 'none',
    cursor: 'pointer',
  }}
  onMouseEnter={(e) => (e.target.style.background = '#ECEAE8')}
  onMouseLeave={(e) => (e.target.style.background = '#F5F5F4')}
>
  Cancel
</button>
```

### Icon Button
```jsx
<button 
  onClick={handleDelete}
  title="Delete"
  style={{
    width: '34px',
    height: '34px',
    borderRadius: '9px',
    background: '#F5F5F4',
    color: '#DC2626',
    border: 'none',
    cursor: 'pointer',
    fontSize: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }}
  onMouseEnter={(e) => (e.target.style.background = '#ECEAE8')}
  onMouseLeave={(e) => (e.target.style.background = '#F5F5F4')}
>
  🗑
</button>
```

---

## Form Input Examples

### Text Input
```jsx
<div style={{ marginBottom: '16px' }}>
  <label 
    style={{
      display: 'block',
      fontSize: '11.5px',
      fontWeight: 500,
      color: '#78716C',
      marginBottom: '4px',
    }}
  >
    Item Name
  </label>
  <input 
    type="text"
    value={itemName}
    onChange={(e) => setItemName(e.target.value)}
    placeholder="e.g., Chicken Burrito"
    style={{
      width: '100%',
      background: '#FFFFFF',
      border: error ? '2px solid #DC2626' : '1px solid #E7E5E4',
      color: '#1C1917',
      fontSize: '13.5px',
      padding: '9px 12px',
      borderRadius: '6px',
      fontFamily: "'Schibsted Grotesk', sans-serif",
      boxSizing: 'border-box',
      transition: 'border-color 0.15s',
    }}
    onFocus={(e) => {
      if (!error) e.target.style.borderColor = '#E2562A';
    }}
    onBlur={(e) => {
      e.target.style.borderColor = error ? '#DC2626' : '#E7E5E4';
    }}
  />
  {error && (
    <div style={{ fontSize: '11.5px', color: '#DC2626', marginTop: '4px' }}>
      {error}
    </div>
  )}
</div>
```

### Textarea
```jsx
<div style={{ marginBottom: '16px' }}>
  <label 
    style={{
      display: 'block',
      fontSize: '11.5px',
      fontWeight: 500,
      color: '#78716C',
      marginBottom: '4px',
    }}
  >
    Description
  </label>
  <textarea 
    value={description}
    onChange={(e) => setDescription(e.target.value)}
    placeholder="Describe the item..."
    style={{
      width: '100%',
      background: '#FFFFFF',
      border: '1px solid #E7E5E4',
      color: '#1C1917',
      fontSize: '13.5px',
      padding: '12px',
      borderRadius: '6px',
      fontFamily: "'Schibsted Grotesk', sans-serif",
      minHeight: '100px',
      resize: 'vertical',
      boxSizing: 'border-box',
    }}
  />
</div>
```

### Checkbox
```jsx
<div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
  <input 
    type="checkbox"
    id="featured"
    checked={featured}
    onChange={(e) => setFeatured(e.target.checked)}
    style={{
      width: '18px',
      height: '18px',
      cursor: 'pointer',
      appearance: 'none',
      border: '2px solid #E7E5E4',
      borderRadius: '4px',
      background: featured ? '#E2562A' : '#FFFFFF',
      borderColor: featured ? '#E2562A' : '#E7E5E4',
      position: 'relative',
    }}
  />
  <label 
    htmlFor="featured"
    style={{
      fontSize: '13.5px',
      fontWeight: 500,
      color: '#1C1917',
      cursor: 'pointer',
    }}
  >
    Featured item
  </label>
</div>
```

### Select Dropdown
```jsx
<div style={{ marginBottom: '16px' }}>
  <label 
    style={{
      display: 'block',
      fontSize: '11.5px',
      fontWeight: 500,
      color: '#78716C',
      marginBottom: '4px',
    }}
  >
    Category
  </label>
  <select 
    value={categoryId}
    onChange={(e) => setCategoryId(e.target.value)}
    style={{
      width: '100%',
      background: '#FFFFFF',
      border: '1px solid #E7E5E4',
      color: '#1C1917',
      fontSize: '13.5px',
      padding: '9px 12px',
      borderRadius: '6px',
      fontFamily: "'Schibsted Grotesk', sans-serif",
      boxSizing: 'border-box',
      cursor: 'pointer',
    }}
  >
    <option value="">Select category</option>
    {categories.map(cat => (
      <option key={cat.id} value={cat.id}>{cat.name}</option>
    ))}
  </select>
</div>
```

---

## Modal Examples

### Basic Modal
```jsx
{showModal && (
  <div 
    style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.4)',
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
    onClick={() => setShowModal(false)}
  >
    <div 
      style={{
        background: '#FFFFFF',
        borderRadius: '12px',
        padding: '22px',
        maxWidth: '600px',
        width: '90%',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 8px 24px rgba(0,0,0,0.20)',
        position: 'relative',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div 
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
        }}
      >
        <h2 
          style={{
            fontFamily: "'Newsreader', serif",
            fontSize: '24px',
            fontWeight: 600,
            margin: 0,
          }}
        >
          Edit Item
        </h2>
        <button 
          onClick={() => setShowModal(false)}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '20px',
            cursor: 'pointer',
            color: '#78716C',
          }}
        >
          ✕
        </button>
      </div>

      {/* Modal content */}
      <div style={{ marginBottom: '22px' }}>
        {/* Form fields here */}
      </div>

      {/* Footer buttons */}
      <div 
        style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end',
        }}
      >
        <button 
          onClick={() => setShowModal(false)}
          style={{ /* secondary button styles */ }}
        >
          Cancel
        </button>
        <button 
          onClick={handleSave}
          style={{ /* primary button styles */ }}
        >
          Save
        </button>
      </div>
    </div>
  </div>
)}
```

---

## Tag/Chip Examples

### Dietary Tag Chip
```jsx
<span 
  style={{
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    background: '#16B981',  // vegan color
    color: '#FFFFFF',
    fontSize: '10px',
    fontWeight: 600,
    padding: '3px 6px',
    borderRadius: '4px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  }}
>
  🌱 Vegan
</span>
```

### Selectable Tag
```jsx
<button 
  onClick={() => toggleTag(tag.id)}
  style={{
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    background: selected ? '#E2562A' : '#F5F5F4',
    color: selected ? '#FFFFFF' : '#1C1917',
    fontSize: '12.5px',
    fontWeight: 500,
    padding: '4px 8px',
    borderRadius: '6px',
    border: selected ? 'none' : '1px solid #E7E5E4',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  }}
  onMouseEnter={(e) => {
    e.target.style.transform = 'scale(1.02)';
  }}
  onMouseLeave={(e) => {
    e.target.style.transform = 'scale(1)';
  }}
>
  {tag.name}
</button>
```

---

## Card Examples

### Item Card
```jsx
<div 
  style={{
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    padding: '12px',
    background: '#FFFFFF',
    border: '1px solid #E7E5E4',
    borderRadius: '9px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    transition: 'box-shadow 0.2s ease-out',
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.12)';
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)';
  }}
>
  {/* Image */}
  {image && (
    <img 
      src={image}
      alt={name}
      style={{
        width: '100%',
        height: 'auto',
        borderRadius: '6px',
        objectFit: 'cover',
      }}
    />
  )}

  {/* Header: Title + Price */}
  <div 
    style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: '8px',
    }}
  >
    <div style={{ flex: 1 }}>
      <h3 
        style={{
          fontFamily: "'Newsreader', serif",
          fontSize: '16px',
          fontWeight: 600,
          color: '#1C1917',
          margin: '0 0 4px 0',
        }}
      >
        {name}
      </h3>
      {description && (
        <p 
          style={{
            fontSize: '11.5px',
            color: '#78716C',
            margin: 0,
            lineHeight: 1.4,
          }}
        >
          {description}
        </p>
      )}
    </div>
    <div 
      style={{
        fontFamily: "'Schibsted Grotesk', sans-serif",
        fontSize: '16px',
        fontWeight: 600,
        color: '#E2562A',
        whiteSpace: 'nowrap',
      }}
    >
      £{(price / 100).toFixed(2)}
    </div>
  </div>

  {/* Tags */}
  {dietary.length > 0 && (
    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
      {dietary.map(tag => (
        <span key={tag} style={{ /* tag styles */ }}>
          {tag}
        </span>
      ))}
    </div>
  )}

  {/* Action buttons */}
  <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
    <button style={{ /* edit button */ }}>✎</button>
    <button style={{ /* delete button */ }}>🗑</button>
  </div>
</div>
```

---

## Form Grid Examples

### 2-Column Layout
```jsx
<div 
  style={{
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '16px',
  }}
>
  {/* Left column */}
  <div>
    <label style={{ /* label styles */ }}>Name</label>
    <input style={{ width: '100%' }} />
  </div>

  {/* Right column */}
  <div>
    <label style={{ /* label styles */ }}>Price</label>
    <input style={{ width: '100%' }} />
  </div>

  {/* Full width */}
  <div style={{ gridColumn: '1 / -1' }}>
    <label style={{ /* label styles */ }}>Description</label>
    <textarea style={{ width: '100%' }} />
  </div>
</div>
```

### Responsive 2-Column (Mobile → Tablet → Desktop)
```jsx
<div 
  style={{
    display: 'grid',
    gridTemplateColumns: window.innerWidth < 768 ? '1fr' : 'repeat(2, 1fr)',
    gap: '16px',
  }}
>
  {/* Items */}
</div>
```

---

## Search Input Example

### Search Box with Clear Button
```jsx
<div 
  style={{
    display: 'flex',
    alignItems: 'center',
    position: 'relative',
    marginBottom: '16px',
  }}
>
  <input 
    type="text"
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    placeholder="Search items..."
    style={{
      width: '100%',
      background: '#FFFFFF',
      border: '1px solid #E7E5E4',
      color: '#1C1917',
      fontSize: '13.5px',
      padding: '9px 32px 9px 12px',
      borderRadius: '6px',
      fontFamily: "'Schibsted Grotesk', sans-serif",
      boxSizing: 'border-box',
    }}
  />
  {searchQuery && (
    <button 
      onClick={() => setSearchQuery('')}
      style={{
        position: 'absolute',
        right: '8px',
        background: 'none',
        border: 'none',
        color: '#A8A29E',
        cursor: 'pointer',
        fontSize: '16px',
      }}
    >
      ✕
    </button>
  )}
</div>

{searchQuery && (
  <div style={{ fontSize: '11.5px', color: '#78716C', marginBottom: '12px' }}>
    {filteredItems.length} results
  </div>
)}
```

---

## Tab Bar Example

### Tab Navigation
```jsx
<div 
  style={{
    display: 'flex',
    gap: '2px',
    background: '#F5F5F4',
    borderRadius: '10px',
    padding: '3px',
    marginBottom: '16px',
  }}
>
  {['Basic', 'Options', 'Combo', 'Pricing'].map((tab, idx) => (
    <button 
      key={tab}
      onClick={() => setActiveTab(idx)}
      style={{
        flex: 1,
        padding: '9px 16px',
        border: 'none',
        borderRadius: activeTab === idx ? '9px' : '0',
        background: activeTab === idx ? '#FFFFFF' : 'transparent',
        color: activeTab === idx ? '#1C1917' : '#78716C',
        fontSize: '13.5px',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.15s ease',
      }}
    >
      {tab}
    </button>
  ))}
</div>

{/* Tab content */}
<div style={{ display: activeTab === 0 ? 'block' : 'none' }}>
  {/* Basic tab content */}
</div>
<div style={{ display: activeTab === 1 ? 'block' : 'none' }}>
  {/* Options tab content */}
</div>
{/* ... etc */}
```

---

## Loading Skeleton Example

### Card Skeleton
```jsx
<div 
  style={{
    height: '200px',
    background: 'linear-gradient(90deg, #F5F5F4 25%, #ECEAE8 50%, #F5F5F4 75%)',
    backgroundSize: '200% 100%',
    animation: 'loading 1.5s infinite',
    borderRadius: '9px',
    marginBottom: '12px',
  }}
/>

<style>{`
  @keyframes loading {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
`}</style>
```

---

## Toast Notification Example

### Success Toast
```jsx
{message && (
  <div 
    style={{
      position: 'fixed',
      bottom: '16px',
      right: '16px',
      background: '#16A34A',
      color: '#FFFFFF',
      padding: '12px 16px',
      borderRadius: '6px',
      fontSize: '13.5px',
      fontWeight: 500,
      boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
      zIndex: 1000,
      animation: 'slideIn 0.3s ease-out',
    }}
  >
    {message}
  </div>
)}

<style>{`
  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
`}</style>
```

---

## Notes

- All examples use inline styles for portability
- Replace hardcoded colors with TOKENS.md values
- Test examples at multiple viewport widths
- Adapt keyboard handlers (onKeyDown, etc.) as needed
- Combine examples to build complete features
