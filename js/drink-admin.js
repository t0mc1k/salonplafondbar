/* ============================================================
   js/drink-admin.js
   Getränke bearbeiten: hinzufügen, ändern, löschen, Zutaten, Foto-Upload
   ============================================================ */
    function togglePresetAllergen(allergenName, isChecked) {
      const textarea = document.getElementById('dAllergens');
      let currentVal = textarea.value.trim();
      let list = currentVal ? currentVal.split(',').map(s => s.trim()).filter(Boolean) : [];
      if (isChecked) {
        if (!list.includes(allergenName)) list.push(allergenName);
      } else {
        list = list.filter(item => item !== allergenName);
      }
      textarea.value = list.join(', ');
    }

    function addIngredientRow(name = '', amount = '') {
      const container = document.getElementById('ingredientRowsContainer');
      const rowId = 'ing_row_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5);
      const div = document.createElement('div');
      div.id = rowId;
      div.className = 'flex gap-2 items-center';
      div.innerHTML = `
        <input type="text" autocomplete="off" placeholder="Zutat (z. B. Tequila)" value="${escapeHtml(name)}" class="ing-name ui-field flex-1" onkeydown="if (event.key === 'Enter') { event.preventDefault(); this.nextElementSibling.focus(); }">
        <input type="text" autocomplete="off" placeholder="Menge (z. B. 5 cl)" value="${escapeHtml(amount)}" class="ing-amount ui-field w-32 sm:w-40" onkeydown="if (event.key === 'Enter') { event.preventDefault(); addIngredientRow(); }">
        <button type="button" onclick="document.getElementById(${jsArg(rowId)}).remove()" class="ing-remove" title="Zutat entfernen">&times;</button>
      `;
      container.appendChild(div);
      if (!name && !amount && container.children.length > 1) div.querySelector('.ing-name').focus();
    }

    function getIngredientsData() {
      const rows = document.querySelectorAll('#ingredientRowsContainer > div');
      let ingredients = [];
      rows.forEach(row => {
        let name = row.querySelector('.ing-name').value.trim();
        let amount = row.querySelector('.ing-amount').value.trim();
        if (name) ingredients.push({ name, amount });
      });
      return ingredients;
    }

    function populateIngredientRows(ingredientsArr) {
      const container = document.getElementById('ingredientRowsContainer');
      container.innerHTML = '';
      if (Array.isArray(ingredientsArr) && ingredientsArr.length > 0) {
        ingredientsArr.forEach(item => addIngredientRow(item.name, item.amount));
      } else {
        addIngredientRow('', '');
      }
    }

    async function uploadImageToSupabase(event) {
      const file = event.target.files[0];
      if (!file) return;
      const status = document.getElementById('uploadStatus');
      status.innerText = "⏳ Foto wird hochgeladen...";
      
      const fileName = `${Date.now()}_${file.name}`;
      let { data, error } = await _supabase.storage.from('drinks').upload(fileName, file);
      
      if (error) {
        console.error("Supabase Storage Error:", error);
        status.innerText = 'Fehler: ' + error.message;
        return;
      }
      
      let { data: publicURLData } = _supabase.storage.from('drinks').getPublicUrl(fileName);
      if (publicURLData && publicURLData.publicUrl) {
        document.getElementById('dPhoto').value = publicURLData.publicUrl;
        status.innerText = '✔ Foto wurde erfolgreich hochgeladen.';
        updatePhotoPreview();
      }
    }

    function toggleMode() {
      if (!userIsAdmin && !userCanEdit) {
        alert("Du hast keine Verwaltungsrechte.");
        return;
      }
      isAdmin = !isAdmin;
      if (!isAdmin) resetForm();
      applyRoleUI();
      renderDrinks();
    }

    function openAddDrinkModal() {
      checkDrinkEditAuth(() => {
        resetForm();
        document.getElementById('formTitle').innerText = "➕ Neues Getränk hinzufügen";
        renderSeasonFormSelect(currentSeasonFilter);
        document.getElementById('deleteFormBtn').classList.add('hidden');
        document.getElementById('adminModal').classList.remove('hidden');
        document.getElementById('adminModal').classList.add('flex');
      });
    }

    function openAddDrinkModalFromMenu() {
      closeSettingsMenu();
      openAddDrinkModal();
    }

    function closeAdminModal() {
      resetForm();
      document.getElementById('adminModal').classList.remove('flex');
      document.getElementById('adminModal').classList.add('hidden');
    }

    function editDrink(id) {
      const d = allDrinks.find(item => item.id === id);
      if (!d) return;
      closeModal();
      document.getElementById('editingId').value = d.id;
      document.getElementById('formTitle').innerText = "✏️ Getränk bearbeiten";
      document.getElementById('dName').value = d.name || '';
      formPendingCategories = [];
      renderCategoryChooser(d.category || '');
      renderSeasonFormSelect(d.season || getAllSeasons()[0]);
      document.getElementById('dGlass').value = d.glass_type || '';
      document.getElementById('dMethod').value = d.method || '';
      document.getElementById('dIce').value = d.ice || '';
      document.getElementById('dGarnish').value = d.garnish || '';
      populateIngredientRows(d.ingredients_json);
      document.getElementById('dCost').value = d.cost_price || '';
      document.getElementById('dPrice').value = d.selling_price || '';
      document.getElementById('dAllergens').value = d.allergens || '';
      document.getElementById('dRecipe').value = d.recipe || '';
      document.getElementById('dPhoto').value = d.photo_url || '';
      document.getElementById('dFeatured').checked = !!d.is_featured;
      document.getElementById('dVegan').checked = !!d.is_vegan;
      document.getElementById('dGlutenfree').checked = !!d.is_glutenfree;
      document.getElementById('dLactosefree').checked = !!d.is_lactosefree;
      syncAllergenChecks();
      updateMarginPreview();
      updatePhotoPreview();
      document.getElementById('adminFormBody').scrollTop = 0;
      document.getElementById('deleteFormBtn').classList.remove('hidden');
      document.getElementById('adminModal').classList.remove('hidden');
      document.getElementById('adminModal').classList.add('flex');
    }

    async function deleteDrinkConfirm(id) {
      if (confirm("Möchten Sie dieses Getränk wirklich löschen?")) {
        const { error } = await _supabase.from('drinks').delete().eq('id', id);
        if (error) return alert("Error: " + error.message);
        closeModal();
        closeAdminModal();
        loadDrinks();
      }
    }

    function deleteDrinkFromForm() {
      const id = document.getElementById('editingId').value;
      if (id) checkDrinkEditAuth(() => deleteDrinkConfirm(id));
    }

    function resetForm() {
      document.getElementById('editingId').value = '';
      document.getElementById('dName').value = '';
      formPendingCategories = [];
      renderCategoryChooser('');
      toggleNewCategoryRow(false);
      populateIngredientRows([]);
      document.getElementById('dGlass').value = '';
      document.getElementById('dMethod').value = '';
      document.getElementById('dIce').value = '';
      document.getElementById('dGarnish').value = '';
      document.getElementById('dCost').value = '';
      document.getElementById('dPrice').value = '';
      document.getElementById('dAllergens').value = '';
      document.getElementById('dRecipe').value = '';
      document.getElementById('dPhoto').value = '';
      document.getElementById('dFeatured').checked = false;
      document.getElementById('dVegan').checked = false;
      document.getElementById('dGlutenfree').checked = false;
      document.getElementById('dLactosefree').checked = false;
      document.querySelectorAll('.preset-alg').forEach(c => c.checked = false);
      document.getElementById('uploadStatus').innerText = '';
      updateMarginPreview();
      updatePhotoPreview();
      document.getElementById('deleteFormBtn').classList.add('hidden');
    }

    async function saveDrink() {
      checkDrinkEditAuth(async () => {
        const name = document.getElementById('dName').value;
        const category = document.getElementById('dCategory').value.trim();
        if (!name.trim()) return alert("Bitte einen Namen angeben.");
        if (!category) return alert("Bitte eine Kategorie auswählen oder eine neue anlegen.");

        const rawCost = document.getElementById('dCost').value;
        const rawPrice = document.getElementById('dPrice').value;

        const drinkObj = {
          name, category,
          season: document.getElementById('dSeason').value,
          glass_type: document.getElementById('dGlass').value,
          method: document.getElementById('dMethod').value,
          ice: document.getElementById('dIce').value,
          garnish: document.getElementById('dGarnish').value,
          ingredients_json: getIngredientsData(),
          cost_price: rawCost !== '' ? parseFloat(rawCost) || null : null,
          selling_price: rawPrice !== '' ? parseFloat(rawPrice) || null : null,
          allergens: document.getElementById('dAllergens').value,
          recipe: document.getElementById('dRecipe').value,
          photo_url: document.getElementById('dPhoto').value,
          is_featured: document.getElementById('dFeatured').checked,
          is_vegan: document.getElementById('dVegan').checked,
          is_glutenfree: document.getElementById('dGlutenfree').checked,
          is_lactosefree: document.getElementById('dLactosefree').checked,
          updated_at: new Date().toISOString()
        };

        const id = document.getElementById('editingId').value;
        let saveRes;
        if (id) saveRes = await _supabase.from('drinks').update(drinkObj).select().eq('id', id);
        else saveRes = await _supabase.from('drinks').insert([drinkObj]).select();

        if (saveRes.error) {
          alert("Fehler beim Speichern: " + saveRes.error.message);
          return;
        }
        if (!saveRes.data || saveRes.data.length === 0) {
          alert("Das Getränk wurde NICHT gespeichert (keine Berechtigung in der Datenbank).");
          return;
        }

        closeAdminModal();
        await loadDrinks();
        showAppToast({ initial: '🍸', title: id ? 'Getränk gespeichert' : 'Getränk angelegt', text: name });
      });
    }

    // ---------- Kategorie wählen / neu anlegen ----------
    let formPendingCategories = [];

    function renderCategoryChooser(selected) {
      const box = document.getElementById('categoryChips');
      const hidden = document.getElementById('dCategory');
      if (!box || !hidden) return;
      const cats = getAllCategories(formPendingCategories);
      if (selected && !cats.some(c => c.toLowerCase() === selected.toLowerCase())) cats.push(selected);
      hidden.value = selected || '';
      box.innerHTML = cats.map(c =>
        `<button type="button" class="ui-chip ${c === selected ? 'active' : ''}" onclick="selectDrinkCategory(${jsArg(c)})">${escapeHtml(c)}</button>`
      ).join('') + `<button type="button" class="ui-chip chip-new" onclick="toggleNewCategoryRow()">➕ Neue Kategorie</button>`;
    }

    function selectDrinkCategory(name) {
      renderCategoryChooser(name);
    }

    function toggleNewCategoryRow(force) {
      const row = document.getElementById('newCategoryRow');
      if (!row) return;
      const show = force === undefined ? row.classList.contains('hidden') : !!force;
      row.classList.toggle('hidden', !show);
      if (show) document.getElementById('dNewCategory').focus();
      else document.getElementById('dNewCategory').value = '';
    }

    function addNewCategory() {
      const input = document.getElementById('dNewCategory');
      const name = input.value.trim().replace(/\s+/g, ' ');
      if (!name) return;
      if (name.length > 30) return alert("Der Name der Kategorie darf höchstens 30 Zeichen lang sein.");
      const existing = getAllCategories(formPendingCategories).find(c => c.toLowerCase() === name.toLowerCase());
      if (existing) {
        selectDrinkCategory(existing);
        showAppToast({ initial: '🏷️', title: 'Kategorie gibt es schon', text: `„${existing}“ wurde ausgewählt.` });
      } else {
        formPendingCategories.push(name);
        selectDrinkCategory(name);
        showAppToast({ initial: '🏷️', title: 'Neue Kategorie', text: `„${name}“ wird mit diesem Getränk gespeichert.` });
      }
      toggleNewCategoryRow(false);
    }

    // ---------- Allergene, Marge, Foto vorschau ----------
    function syncAllergenChecks() {
      const text = document.getElementById('dAllergens').value;
      document.querySelectorAll('.preset-alg').forEach(chk => {
        const m = /togglePresetAllergen\('([^']+)'/.exec(chk.getAttribute('onchange') || '');
        if (m) chk.checked = text.indexOf(m[1]) !== -1;
      });
    }

    function updateMarginPreview() {
      const info = document.getElementById('dMarginInfo');
      if (!info) return;
      const cost = parseFloat(document.getElementById('dCost').value);
      const price = parseFloat(document.getElementById('dPrice').value);
      if (isNaN(cost) || isNaN(price) || price <= 0) {
        info.textContent = 'Gib beide Preise ein, dann siehst du hier die Marge.';
        info.classList.remove('margin-good', 'margin-bad');
        return;
      }
      const profit = price - cost;
      const pct = (profit / price) * 100;
      const quota = (cost / price) * 100;
      info.textContent = `Marge: € ${profit.toFixed(2)} (${pct.toFixed(0)} %) · Wareneinsatz-Quote: ${quota.toFixed(0)} %`;
      info.classList.toggle('margin-good', profit > 0);
      info.classList.toggle('margin-bad', profit <= 0);
    }

    function updatePhotoPreview() {
      const box = document.getElementById('dPhotoPreview');
      if (!box) return;
      const url = document.getElementById('dPhoto').value.trim();
      box.innerHTML = '';
      if (url) {
        const img = document.createElement('img');
        img.src = url;
        img.alt = 'Vorschau';
        img.onerror = () => { box.innerHTML = '<span>Foto nicht ladbar</span>'; };
        box.appendChild(img);
      } else {
        box.innerHTML = '<span>Kein Foto</span>';
      }
    }
