/**
 * NutriFit Casero - App Logic
 * Modos de batch cooking, porciones por edad, lista de compras semanal y favoritos
 */

document.addEventListener('DOMContentLoaded', () => {
  // Estado general
  const state = {
    currentCategory: 'todas',
    searchTerm: '',
    activeView: 'recipes', // 'recipes', 'portions', 'shopping', 'favorites'
    activePortionAge: 'adult', // 'adult', 'teen', 'kid'
    favorites: JSON.parse(localStorage.getItem('nutrifit_favs') || '[]'),
    shoppingList: JSON.parse(localStorage.getItem('nutrifit_shopping') || '[]'),
    theme: localStorage.getItem('nutrifit_theme') || 'dark',
    activeRecipeModal: null,
    checkedIngredients: {}
  };

  // Inicializar Tema
  if (state.theme === 'light') {
    document.body.classList.add('light-theme');
  }

  // Elementos DOM
  const recipesGrid = document.getElementById('recipesGrid');
  const favsGrid = document.getElementById('favsGrid');
  const categoriesBar = document.getElementById('categoriesBar');
  const searchInput = document.getElementById('searchInput');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  const recipesCount = document.getElementById('recipesCount');
  const favsCount = document.getElementById('favsCount');
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const modalBackdrop = document.getElementById('recipeModal');
  const modalBody = document.getElementById('modalBody');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const shoppingItemsList = document.getElementById('shoppingItemsList');
  const addCustomInput = document.getElementById('addCustomInput');
  const btnAddCustom = document.getElementById('btnAddCustom');
  const btnClearShopping = document.getElementById('btnClearShopping');
  const btnLoadWeeklyPlan = document.getElementById('btnLoadWeeklyPlan');
  const portionCardDetail = document.getElementById('portionCardDetail');
  const portionTabBtns = document.querySelectorAll('.portion-tab-btn');
  const navItems = document.querySelectorAll('.nav-item');
  const viewSections = document.querySelectorAll('.view-section');
  const shoppingBadge = document.getElementById('shoppingBadge');
  const favsBadge = document.getElementById('favsBadge');

  // Registrar Service Worker para celular (PWA)
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    });
  }

  // Notificación flotante (Toast)
  function showToast(message, icon = '✅') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 2400);
  }

  // Alternar Favorito
  function toggleFavorite(id, event) {
    if (event) event.stopPropagation();
    const idx = state.favorites.indexOf(id);
    if (idx > -1) {
      state.favorites.splice(idx, 1);
      showToast('Eliminada de tus favoritos', '💔');
    } else {
      state.favorites.push(id);
      showToast('¡Guardada en favoritos!', '❤️');
    }
    localStorage.setItem('nutrifit_favs', JSON.stringify(state.favorites));
    updateBadges();
    renderRecipes();
    renderFavorites();
    if (state.activeRecipeModal && state.activeRecipeModal.id === id) {
      updateModalFavBtn(id);
    }
  }

  function updateBadges() {
    if (favsBadge) {
      favsBadge.textContent = state.favorites.length;
      favsBadge.style.display = state.favorites.length > 0 ? 'inline-block' : 'none';
    }
    if (shoppingBadge) {
      const pending = state.shoppingList.filter(i => !i.checked).length;
      shoppingBadge.textContent = pending;
      shoppingBadge.style.display = pending > 0 ? 'inline-block' : 'none';
    }
  }

  // Categorías
  function renderCategories() {
    categoriesBar.innerHTML = '';
    CATEGORIES.forEach(cat => {
      const chip = document.createElement('button');
      chip.className = `category-chip ${state.currentCategory === cat.id ? 'active' : ''}`;
      chip.innerHTML = `<span>${cat.icon}</span> <span>${cat.label}</span>`;
      chip.addEventListener('click', () => {
        state.currentCategory = cat.id;
        document.querySelectorAll('.category-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        renderRecipes();
      });
      categoriesBar.appendChild(chip);
    });
  }

  // Filtrado de recetas
  function getFilteredRecipes() {
    return RECIPES_DATA.filter(recipe => {
      let matchCat = true;
      if (state.currentCategory !== 'todas') {
        matchCat = recipe.category === state.currentCategory;
      }

      let matchSearch = true;
      if (state.searchTerm.trim() !== '') {
        const query = state.searchTerm.toLowerCase();
        const inTitle = recipe.title.toLowerCase().includes(query);
        const inSub = recipe.subtitle.toLowerCase().includes(query);
        const inIngredients = recipe.ingredients.some(i => i.item.toLowerCase().includes(query));
        const inTags = recipe.tags.some(t => t.toLowerCase().includes(query));
        matchSearch = inTitle || inSub || inIngredients || inTags;
      }

      return matchCat && matchSearch;
    });
  }

  // Crear tarjeta de receta
  function createRecipeCard(recipe) {
    const isFav = state.favorites.includes(recipe.id);
    const card = document.createElement('article');
    card.className = 'recipe-card';
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');

    card.innerHTML = `
      <div class="card-img-wrap">
        <img class="card-img" src="${recipe.image}" alt="${recipe.title}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=800&q=80'">
        <div class="card-overlay"></div>
        <span class="card-badge-category">${recipe.category}</span>
        <button class="fav-card-btn ${isFav ? 'favorited' : ''}" title="${isFav ? 'Quitar de favoritos' : 'Añadir a favoritos'}" aria-label="Favorito">
          ${isFav ? '❤️' : '🤍'}
        </button>
      </div>
      <div class="card-info">
        <div class="card-title-row">
          <h3 class="card-title">${recipe.title}</h3>
        </div>
        <p class="card-subtitle">${recipe.subtitle}</p>
        
        <div class="card-meta-row">
          <div class="meta-pill">⏱️ <strong>${recipe.prepTime + recipe.cookTime} min</strong></div>
          <div class="meta-pill">🔥 <strong>${recipe.calories} kcal</strong></div>
          <div class="meta-pill">📊 <strong>${recipe.difficulty}</strong></div>
        </div>

        <div class="card-macros-row">
          <span class="macro-badge protein">🍗 ${recipe.macros.protein}</span>
          <span class="macro-badge carbs">🌾 ${recipe.macros.carbs}</span>
          <span class="macro-badge fat">🥑 ${recipe.macros.fat}</span>
        </div>
      </div>
    `;

    const favBtn = card.querySelector('.fav-card-btn');
    favBtn.addEventListener('click', (e) => toggleFavorite(recipe.id, e));

    card.addEventListener('click', () => openRecipeModal(recipe));

    return card;
  }

  function renderRecipes() {
    const filtered = getFilteredRecipes();
    recipesGrid.innerHTML = '';
    recipesCount.textContent = `${filtered.length} preparaciones`;

    if (filtered.length === 0) {
      recipesGrid.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🥘</div>
          <h3>No encontramos preparaciones</h3>
          <p>Prueba buscando con otro ingrediente como "papa", "pollo" o "arroz".</p>
        </div>
      `;
      return;
    }

    filtered.forEach(recipe => {
      recipesGrid.appendChild(createRecipeCard(recipe));
    });
  }

  function renderFavorites() {
    favsGrid.innerHTML = '';
    const favRecipes = RECIPES_DATA.filter(r => state.favorites.includes(r.id));
    favsCount.textContent = `${favRecipes.length} guardadas`;

    if (favRecipes.length === 0) {
      favsGrid.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">⭐</div>
          <h3>Aún no tienes favoritos</h3>
          <p>Toca el corazón en cualquier receta o módulo para tenerlo a mano.</p>
        </div>
      `;
      return;
    }

    favRecipes.forEach(recipe => {
      favsGrid.appendChild(createRecipeCard(recipe));
    });
  }

  // Modal de Detalle de Receta
  function openRecipeModal(recipe) {
    state.activeRecipeModal = recipe;
    if (!state.checkedIngredients[recipe.id]) {
      state.checkedIngredients[recipe.id] = new Set();
    }

    const isFav = state.favorites.includes(recipe.id);

    modalBody.innerHTML = `
      <div class="detail-hero">
        <img src="${recipe.image}" alt="${recipe.title}" onerror="this.src='https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=800&q=80'">
        <div class="detail-hero-overlay"></div>
      </div>

      <div class="detail-content">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span class="detail-badge-pill">${recipe.icon} ${recipe.category.toUpperCase()}</span>
          <div style="display:flex; gap:6px;">
            ${recipe.tags.map(t => `<span class="macro-badge" style="background:rgba(255,255,255,0.06); color:var(--text-muted);">${t}</span>`).join('')}
          </div>
        </div>

        <div>
          <h2 class="detail-title">${recipe.title}</h2>
          <p class="detail-subtitle">${recipe.subtitle}</p>
        </div>

        <!-- Métricas Rápidas -->
        <div class="detail-metrics-grid">
          <div class="metric-item">
            <span class="val">${recipe.prepTime}m</span>
            <span class="lbl">Prep</span>
          </div>
          <div class="metric-item">
            <span class="val">${recipe.cookTime}m</span>
            <span class="lbl">Cocción</span>
          </div>
          <div class="metric-item">
            <span class="val">${recipe.calories}</span>
            <span class="lbl">Kcal</span>
          </div>
          <div class="metric-item">
            <span class="val">${recipe.servings}</span>
            <span class="lbl">Porción</span>
          </div>
        </div>

        <!-- Guía de Porciones según Edad para este Plato -->
        ${recipe.portionWeights ? `
          <div class="modal-portions-box">
            <div class="modal-portions-title">
              <span>⚖️ ¿Cuánto servir según la edad?</span>
            </div>
            <div class="modal-portion-row">
              <span class="role">👨 Adulto:</span>
              <span class="weight">${recipe.portionWeights.adult}</span>
            </div>
            <div class="modal-portion-row">
              <span class="role">👦 Hijo (13 años):</span>
              <span class="weight">${recipe.portionWeights.teen}</span>
            </div>
            <div class="modal-portion-row">
              <span class="role">👧 Hijo (4 años):</span>
              <span class="weight">${recipe.portionWeights.kid}</span>
            </div>
          </div>
        ` : ''}

        <!-- Ingredientes con Checkbox -->
        <div>
          <div class="section-block-title">
            <span>🛒 Ingredientes (${recipe.ingredients.length})</span>
            <span style="font-size:0.75rem; color:var(--text-dim); font-weight:normal;">Toca para tachar</span>
          </div>

          <div class="ingredients-list" id="modalIngredientsList">
            ${recipe.ingredients.map((ing, idx) => {
              const isChecked = state.checkedIngredients[recipe.id].has(idx);
              return `
                <div class="ingredient-item ${isChecked ? 'checked' : ''}" data-idx="${idx}">
                  <div class="ingredient-left">
                    <div class="custom-checkbox">${isChecked ? '✓' : ''}</div>
                    <span class="ingredient-name">${ing.item}</span>
                  </div>
                  <span class="ingredient-qty">${ing.qty}</span>
                </div>
              `;
            }).join('')}
          </div>

          <button class="btn-add-shopping" id="btnAddAllToShopping">
            ➕ Agregar ingredientes a la Lista de Compras
          </button>
        </div>

        <!-- Instrucciones Paso a Paso -->
        <div>
          <div class="section-block-title">
            <span>👩‍🍳 Paso a Paso Fácil</span>
          </div>
          <div class="steps-list">
            ${recipe.steps.map((st, i) => `
              <div class="step-card">
                <div class="step-num">${i + 1}</div>
                <p class="step-text">${st}</p>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Consejo Práctico -->
        <div class="chef-tip-box">
          <span class="tip-icon">💡</span>
          <div>
            <strong style="display:block; margin-bottom:2px; font-size:0.88rem;">Consejo de Cocina</strong>
            <p>${recipe.tips}</p>
          </div>
        </div>

        <!-- Acciones al pie -->
        <div class="sheet-bottom-actions">
          <button class="btn-action-sheet btn-print" id="btnPrintRecipe">
            🖨️ Imprimir / PDF
          </button>
          <button class="btn-action-sheet btn-fav" id="modalFavBtn">
            ${isFav ? '❤️ En Favoritos' : '🤍 Guardar'}
          </button>
        </div>
      </div>
    `;

    // Checkboxes de ingredientes
    const ingItems = modalBody.querySelectorAll('.ingredient-item');
    ingItems.forEach(item => {
      item.addEventListener('click', () => {
        const idx = parseInt(item.getAttribute('data-idx'));
        if (state.checkedIngredients[recipe.id].has(idx)) {
          state.checkedIngredients[recipe.id].delete(idx);
          item.classList.remove('checked');
          item.querySelector('.custom-checkbox').textContent = '';
        } else {
          state.checkedIngredients[recipe.id].add(idx);
          item.classList.add('checked');
          item.querySelector('.custom-checkbox').textContent = '✓';
        }
      });
    });

    // Agregar a la lista de compras
    const btnAddShopping = modalBody.querySelector('#btnAddAllToShopping');
    btnAddShopping.addEventListener('click', () => {
      let added = 0;
      recipe.ingredients.forEach(ing => {
        const text = `${ing.item} (${ing.qty})`;
        if (!state.shoppingList.some(i => i.text.toLowerCase() === text.toLowerCase())) {
          state.shoppingList.push({
            id: 'shop-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
            text: text,
            checked: false
          });
          added++;
        }
      });
      localStorage.setItem('nutrifit_shopping', JSON.stringify(state.shoppingList));
      updateBadges();
      renderShoppingList();
      showToast(`¡${added} ingredientes añadidos a la lista!`, '🛒');
    });

    const modalFavBtn = modalBody.querySelector('#modalFavBtn');
    modalFavBtn.addEventListener('click', () => toggleFavorite(recipe.id));

    const btnPrint = modalBody.querySelector('#btnPrintRecipe');
    btnPrint.addEventListener('click', () => window.print());

    modalBackdrop.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function updateModalFavBtn(id) {
    const btn = document.getElementById('modalFavBtn');
    if (!btn) return;
    const isFav = state.favorites.includes(id);
    btn.innerHTML = isFav ? '❤️ En Favoritos' : '🤍 Guardar';
  }

  function closeModal() {
    modalBackdrop.classList.remove('open');
    document.body.style.overflow = '';
    state.activeRecipeModal = null;
  }

  closeModalBtn.addEventListener('click', closeModal);
  modalBackdrop.addEventListener('click', (e) => {
    if (e.target === modalBackdrop) closeModal();
  });

  // ==========================================================================
  // GUÍA DE PORCIONES
  // ==========================================================================

  function renderPortionDetail(ageKey) {
    const data = PORTION_GUIDE[ageKey];
    if (!data) return;

    portionCardDetail.innerHTML = `
      <div class="portion-header-row">
        <span class="portion-badge-role">${data.label}</span>
        <span style="font-size:0.75rem; color:var(--text-dim);">Medidas en plato cocido</span>
      </div>
      <p class="portion-desc-text">${data.desc}</p>

      <div class="portion-targets-grid">
        <div class="target-box prot">
          <span>🍗 Carnes / Pollo</span>
          <strong>${data.protein}</strong>
        </div>
        <div class="target-box carb">
          <span>🍚 Arroz / Papa</span>
          <strong>${data.carb}</strong>
        </div>
        <div class="target-box veg">
          <span>🥗 Verduras</span>
          <strong>${data.veg}</strong>
        </div>
      </div>
    `;
  }

  portionTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      portionTabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const ageKey = btn.getAttribute('data-age');
      state.activePortionAge = ageKey;
      renderPortionDetail(ageKey);
    });
  });

  // ==========================================================================
  // LISTA DE COMPRAS
  // ==========================================================================

  function renderShoppingList() {
    shoppingItemsList.innerHTML = '';
    if (state.shoppingList.length === 0) {
      shoppingItemsList.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🛒</div>
          <h3>Tu lista está vacía</h3>
          <p>Toca <strong>"Cargar Semana"</strong> arriba para llenar automáticamente lo que necesitas en la carnicería, verdulería y súper.</p>
        </div>
      `;
      return;
    }

    state.shoppingList.forEach(item => {
      const row = document.createElement('div');
      row.className = `shopping-card-item ${item.checked ? 'bought' : ''}`;
      row.innerHTML = `
        <div class="shopping-left-meta">
          <div class="custom-checkbox" style="background:${item.checked ? 'var(--primary)' : 'transparent'}; border-color:${item.checked ? 'var(--primary)' : 'var(--text-dim)'}; color:#042F1C;">
            ${item.checked ? '✓' : ''}
          </div>
          <span class="shopping-text">${item.text}</span>
        </div>
        <button class="btn-del-item" title="Eliminar">&times;</button>
      `;

      row.querySelector('.shopping-left-meta').addEventListener('click', () => {
        item.checked = !item.checked;
        saveShopping();
        renderShoppingList();
      });

      row.querySelector('.btn-del-item').addEventListener('click', (e) => {
        e.stopPropagation();
        state.shoppingList = state.shoppingList.filter(i => i.id !== item.id);
        saveShopping();
        renderShoppingList();
      });

      shoppingItemsList.appendChild(row);
    });
  }

  function saveShopping() {
    localStorage.setItem('nutrifit_shopping', JSON.stringify(state.shoppingList));
    updateBadges();
  }

  function addCustomShoppingItem() {
    const val = addCustomInput.value.trim();
    if (!val) return;
    state.shoppingList.push({
      id: 'shop-' + Date.now(),
      text: val,
      checked: false
    });
    addCustomInput.value = '';
    saveShopping();
    renderShoppingList();
    showToast('Añadido a la lista', '📝');
  }

  btnAddCustom.addEventListener('click', addCustomShoppingItem);
  addCustomInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addCustomShoppingItem();
  });

  // Botón Cargar Plan Semanal Recomendado
  btnLoadWeeklyPlan.addEventListener('click', () => {
    let addedCount = 0;
    const addSection = (sectionName, items) => {
      items.forEach(it => {
        const fullText = `[${sectionName}] ${it.item} - ${it.qty}`;
        if (!state.shoppingList.some(s => s.text.toLowerCase().includes(it.item.toLowerCase()))) {
          state.shoppingList.push({
            id: 'shop-week-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
            text: fullText,
            checked: false
          });
          addedCount++;
        }
      });
    };

    addSection('Carnicería', WEEKLY_GROCERY_LIST.carniceria);
    addSection('Verdulería', WEEKLY_GROCERY_LIST.verduleria);
    addSection('Súper / Almacén', WEEKLY_GROCERY_LIST.supermercado);

    saveShopping();
    renderShoppingList();
    showToast(`¡Se cargaron ${addedCount} productos para la semana!`, '🛍️');
  });

  btnClearShopping.addEventListener('click', () => {
    if (state.shoppingList.length === 0) return;
    if (confirm('¿Quieres vaciar toda la lista de compras?')) {
      state.shoppingList = [];
      saveShopping();
      renderShoppingList();
      showToast('Lista de compras vaciada', '🗑️');
    }
  });

  // ==========================================================================
  // NAVEGACIÓN Y VISTAS
  // ==========================================================================

  function switchView(viewName) {
    state.activeView = viewName;
    navItems.forEach(item => {
      item.classList.toggle('active', item.getAttribute('data-view') === viewName);
    });
    viewSections.forEach(sec => {
      sec.classList.toggle('active', sec.id === `view-${viewName}`);
    });

    if (viewName === 'portions') {
      renderPortionDetail(state.activePortionAge);
    } else if (viewName === 'shopping') {
      renderShoppingList();
    } else if (viewName === 'favorites') {
      renderFavorites();
    } else if (viewName === 'recipes') {
      renderRecipes();
    }
  }

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      switchView(item.getAttribute('data-view'));
    });
  });

  // Búsqueda
  searchInput.addEventListener('input', (e) => {
    state.searchTerm = e.target.value;
    renderRecipes();
  });

  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    state.searchTerm = '';
    renderRecipes();
  });

  // Tema
  themeToggleBtn.addEventListener('click', () => {
    const isLight = document.body.classList.toggle('light-theme');
    state.theme = isLight ? 'light' : 'dark';
    localStorage.setItem('nutrifit_theme', state.theme);
    themeToggleBtn.textContent = isLight ? '🌙' : '☀️';
    showToast(isLight ? 'Modo Claro' : 'Modo Oscuro', '🎨');
  });

  // Inicialización
  renderCategories();
  renderRecipes();
  renderFavorites();
  renderShoppingList();
  renderPortionDetail(state.activePortionAge);
  updateBadges();
});
