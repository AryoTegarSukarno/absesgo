# Migration Guide: Refactored Code Structure

## Overview
This guide helps developers understand the new code structure after the refactoring.

## What Changed?

### Before Refactoring
```
templates/
├── index.html        (11,424 bytes - with inline CSS/JS)
├── guru.html         (35,622 bytes - with inline CSS/JS)
└── siswa.html        (9,653 bytes - with inline CSS/JS)
```

### After Refactoring
```
templates/
├── base.html         (1,014 bytes - base template)
├── index.html        (3,700 bytes - extends base)
├── guru.html         (5,700 bytes - extends base)
└── siswa.html        (1,600 bytes - extends base)

static/
├── css/
│   ├── common.css    (8.3 KB - shared styles)
│   ├── login.css     (5.6 KB - login page)
│   ├── guru.css      (2.9 KB - guru dashboard)
│   └── siswa.css     (3.2 KB - siswa dashboard)
└── js/
    ├── common.js     (4.8 KB - utilities)
    ├── guru.js       (13 KB - GuruDashboard class)
    └── siswa.js      (4.8 KB - SiswaDashboard class)
```

## How to Use New Structure

### 1. Creating a New Page

```html
<!-- templates/new_page.html -->
{% extends "base.html" %}

{% block title %}Page Title{% endblock %}

{% block extra_css %}
<link rel="stylesheet" href="{{ url_for('static', filename='css/new_page.css') }}" />
{% endblock %}

{% block content %}
  <!-- Your page content here -->
{% endblock %}

{% block extra_js %}
<script src="{{ url_for('static', filename='js/new_page.js') }}"></script>
{% endblock %}
```

### 2. Using Common Utilities

All pages automatically have access to common utilities:

```javascript
// Available globally from common.js

// Format dates
const formatted = formatDate(new Date());
// Output: "2024-12-06 13:30:45"

// Show alerts
showAlert('Success!', 'success');
showAlert('Error occurred', 'error');

// API requests
const data = await apiRequest('/api/endpoint', {
  method: 'POST',
  body: JSON.stringify({ key: 'value' })
});

// Debounce function calls
const debouncedSearch = debounce(searchFunction, 300);

// Format numbers
const formatted = formatNumber(1000000);
// Output: "1.000.000"

// Escape HTML
const safe = escapeHtml('<script>alert("xss")</script>');
```

### 3. Using Common Styles

All pages automatically have access to common CSS classes:

```html
<!-- Buttons -->
<button class="btn btn-primary">Primary</button>
<button class="btn btn-success">Success</button>
<button class="btn btn-danger">Danger</button>
<button class="btn btn-warning">Warning</button>
<button class="btn btn-info">Info</button>
<button class="btn btn-secondary">Secondary</button>

<!-- Cards -->
<div class="card">
  <div class="card-header">
    <h2>Card Title</h2>
  </div>
  <!-- Card content -->
</div>

<!-- Tables -->
<div class="table-container">
  <table>
    <thead>
      <tr><th>Header</th></tr>
    </thead>
    <tbody>
      <tr><td>Data</td></tr>
    </tbody>
  </table>
</div>

<!-- Forms -->
<form>
  <div class="form-group">
    <label>Label</label>
    <input type="text" />
  </div>
</form>

<!-- Alerts -->
<div class="alert alert-success">Success message</div>
<div class="alert alert-error">Error message</div>

<!-- Modals -->
<div class="modal" id="myModal">
  <div class="modal-content">
    <div class="modal-header">
      <h2>Modal Title</h2>
      <span class="close">&times;</span>
    </div>
    <!-- Modal content -->
  </div>
</div>
```

### 4. Creating Dashboard Classes

Follow the pattern established:

```javascript
// static/js/my_dashboard.js

class MyDashboard {
  constructor() {
    // Initialize properties
    this.data = null;
  }

  init() {
    console.log('🚀 Initializing dashboard...');
    this.bindEvents();
    this.loadInitialData();
    console.log('✅ Dashboard initialized');
  }

  bindEvents() {
    // Attach event listeners
    document.getElementById('btn-action')
      .addEventListener('click', () => this.handleAction());
  }

  async loadInitialData() {
    // Load data
    try {
      this.data = await apiRequest('/api/data');
      this.render();
    } catch (error) {
      showAlert('Failed to load data', 'error');
    }
  }

  handleAction() {
    // Handle user action
  }

  render() {
    // Render data to DOM
  }

  destroy() {
    // Cleanup resources
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function () {
  window.dashboard = new MyDashboard();
  window.dashboard.init();
});
```

## Best Practices

### 1. CSS Organization
- **common.css**: Styles used across multiple pages
- **page-specific.css**: Styles unique to one page
- Use CSS variables for consistency
- Follow BEM naming if needed

### 2. JavaScript Organization
- **common.js**: Utility functions used everywhere
- **page-specific.js**: Page-specific logic as classes
- Use ES6 features (classes, async/await, arrow functions)
- Always clean up resources in destroy()

### 3. Template Organization
- Always extend base.html
- Use proper block structure
- Keep templates clean and minimal
- Let CSS/JS handle presentation and behavior

## Common Patterns

### Pattern 1: Loading Data
```javascript
async loadData() {
  try {
    const data = await apiRequest('/api/endpoint');
    if (data.success) {
      this.renderData(data.data);
      showAlert('Data loaded successfully', 'success');
    }
  } catch (error) {
    console.error('Error:', error);
    showAlert('Failed to load data', 'error');
  }
}
```

### Pattern 2: Form Submission
```javascript
async handleSubmit(e) {
  e.preventDefault();
  
  const formData = {
    field1: document.getElementById('field1').value,
    field2: document.getElementById('field2').value,
  };

  try {
    const data = await apiRequest('/api/submit', {
      method: 'POST',
      body: JSON.stringify(formData),
    });

    if (data.success) {
      showAlert('Saved successfully', 'success');
      this.closeModal();
      this.loadData();
    } else {
      showAlert(data.message, 'error');
    }
  } catch (error) {
    showAlert('Error saving data', 'error');
  }
}
```

### Pattern 3: Modal Management
```javascript
openModal(type, id = null) {
  const modal = document.getElementById('myModal');
  
  if (type === 'add') {
    // Setup for add
    document.getElementById('modalTitle').textContent = 'Add Item';
    document.getElementById('form').reset();
  } else {
    // Setup for edit
    document.getElementById('modalTitle').textContent = 'Edit Item';
    this.loadItemForEdit(id);
  }
  
  modal.style.display = 'block';
}

closeModal() {
  document.getElementById('myModal').style.display = 'none';
}
```

## Troubleshooting

### Issue: Styles not applying
**Solution**: Check that CSS file is properly linked in `extra_css` block

### Issue: JavaScript not working
**Solution**: Check that JS file is properly linked in `extra_js` block, and placed after common.js

### Issue: Functions not defined
**Solution**: Make sure common.js is loaded before page-specific JS

### Issue: Template not rendering
**Solution**: Verify `{% block content %}` is properly opened and closed

### Issue: Responsive design broken
**Solution**: Check media queries in CSS files

## Migration Checklist

When migrating old code to new structure:

- [ ] Extract inline CSS to appropriate file
- [ ] Extract inline JS to appropriate file
- [ ] Convert JS to ES6 class if needed
- [ ] Update template to extend base.html
- [ ] Add proper block structure
- [ ] Test all functionality
- [ ] Check responsive design
- [ ] Verify no console errors

## Need Help?

If you encounter issues:
1. Check browser console for errors
2. Verify file paths are correct
3. Check that all blocks are properly closed
4. Review existing files for patterns
5. Consult REFACTORING_SUMMARY.md

## References

- Flask Templates: https://flask.palletsprojects.com/en/2.0.x/templating/
- Jinja2 Template Inheritance: https://jinja.palletsprojects.com/en/3.0.x/templates/#template-inheritance
- ES6 Classes: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes
- CSS Variables: https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties
