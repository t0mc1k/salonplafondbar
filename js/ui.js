/* ============================================================
   js/ui.js
   Allgemeine Oberfläche: Menü, Einstellungen, Theme, Vollbild, Foto-Vorschau, Motivations-Sprüche
   ============================================================ */
    function startLogoIconCycler() {
      setInterval(() => {
        const box = document.querySelector('.header-logo-container');
        if (!box || !currentWaiterName) return;           // nur wenn jemand angemeldet ist
        if (box.querySelector('.logo-avatar')) return;    // läuft gerade schon

        const ov = document.createElement('div');
        ov.className = 'logo-avatar';
        if (currentWaiterAvatar) {
          const img = document.createElement('img');
          img.src = currentWaiterAvatar;
          img.alt = currentWaiterName;
          ov.appendChild(img);
        } else {
          ov.classList.add('logo-avatar-initial');
          ov.textContent = currentWaiterName.charAt(0).toUpperCase();
        }
        box.appendChild(ov);
        setTimeout(() => ov.remove(), 2800);
      }, 9000);
    }

    // ---------- Hinweise (Toast), kurz sichtbar und dann automatisch weg ----------
    function showAppToast(opts) {
      const o = opts || {};
      let host = document.getElementById('appToastHost');
      if (!host) {
        host = document.createElement('div');
        host.id = 'appToastHost';
        host.className = 'app-toast-host';
        document.body.appendChild(host);
      }
      const toast = document.createElement('div');
      toast.className = 'app-toast glass-surface';

      const av = document.createElement('div');
      av.className = 'app-toast-avatar';
      if (o.avatarUrl) {
        const img = document.createElement('img');
        img.src = o.avatarUrl;
        img.alt = '';
        av.appendChild(img);
      } else {
        av.textContent = o.initial || '🔔';
      }

      const body = document.createElement('div');
      body.className = 'app-toast-body';
      const title = document.createElement('div');
      title.className = 'app-toast-title';
      title.textContent = o.title || '';
      const text = document.createElement('div');
      text.className = 'app-toast-text';
      text.textContent = o.text || '';
      body.appendChild(title);
      if (o.text) body.appendChild(text);

      toast.appendChild(av);
      toast.appendChild(body);
      host.appendChild(toast);
      requestAnimationFrame(() => toast.classList.add('show'));

      const close = () => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 350);
      };
      toast.addEventListener('click', close);
      setTimeout(close, o.ms || 5000);
    }

    // ---------- Weichzeichner (Blur) an/aus ----------
    function isBlurEnabled() {
      return document.documentElement.classList.contains('blur-on');
    }

    function setBlurEnabled(on) {
      document.documentElement.classList.toggle('blur-on', !!on);
      try { localStorage.setItem('salon_blur', on ? 'on' : 'off'); } catch (e) {}
      updateUnifiedSettingsUI();
    }

    function toggleBlurEffect() {
      setBlurEnabled(!isBlurEnabled());
    }

    // ---------- Zeit als „vor 5 Min.“ ----------
    function formatRelativeTime(iso) {
      if (!iso) return 'noch nie';
      const t = new Date(iso).getTime();
      if (isNaN(t)) return 'unbekannt';
      const min = Math.floor(Math.max(0, Date.now() - t) / 60000);
      if (min < 1) return 'gerade eben';
      if (min < 60) return `vor ${min} Min.`;
      const h = Math.floor(min / 60);
      if (h < 24) return `vor ${h} Std.`;
      const d = Math.floor(h / 24);
      if (d === 1) return 'gestern';
      if (d < 7) return `vor ${d} Tagen`;
      return new Date(t).toLocaleDateString('de-AT');
    }

    function handleScrollPosition() {
      const scrollBtn = document.getElementById('scrollToTopBtn');
      if (window.scrollY > 300) {
        scrollBtn.classList.remove('hidden');
      } else {
        scrollBtn.classList.add('hidden');
      }
    }

    function scrollToTop() {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    const motivationalQuotes = [
      "„Frau gut? Ruhe bitte!“ 🤫",
      "„Keine Zeit!“ ⏱️",
      "„Shaken, einschenken, lächeln! Ihr macht das großartig!“ 🍸✨",
      "„Kein Stress hinter der Bar – die Drinks schmecken besser mit Gelassenheit!“ 🧊",
      "„Ein perfekter Drink ist wie Kunst. Und ihr seid die Künstler heute Abend!“ 🎨🍾",
      "„Fokus, Teamwork und ein guter Cocktail – das Erfolgsrezept für jeden Abend!“ 🔥",
      "„Egal wie lang die Schlange ist: Einen Drink nach dem anderen. Du schaffst das!“ 💪",
      "„Weißt du, wer der beste Spüler im Salonplafond ist? Natürlich Tomas Kardos, der auch diese App für euch programmiert hat! Er grüßt euch und freut sich, dass ihr diese App nutzt!“ 🧽✨"
    ];

    function showRandomMotivation(event) {
      if (event) event.stopPropagation();
      const randomIndex = Math.floor(Math.random() * motivationalQuotes.length);
      document.getElementById('motivationTextContainer').innerText = motivationalQuotes[randomIndex];
      const modal = document.getElementById('motivationModal');
      modal.classList.remove('hidden');
      modal.classList.add('flex');
    }

    function closeMotivationModal() {
      const modal = document.getElementById('motivationModal');
      modal.classList.remove('flex');
      modal.classList.add('hidden');
    }

    function setQuickVal(fieldId, value) {
      document.getElementById(fieldId).value = value;
    }

    function toggleThemeMode() {
      const body = document.body;
      if (themeMode === 'dark') {
        themeMode = 'light';
        body.classList.remove('dark-mode');
        body.classList.add('light-mode');
      } else {
        themeMode = 'dark';
        body.classList.remove('light-mode');
        body.classList.add('dark-mode');
      }
    }

    function toggleFilterDrawer() {
      const drawer = document.getElementById('filterDrawer');
      const arrow = document.getElementById('filterArrow');
      if (drawer.classList.contains('hidden')) {
        drawer.classList.remove('hidden');
        drawer.classList.add('flex');
        arrow.innerText = '▲';
      } else {
        drawer.classList.remove('flex');
        drawer.classList.add('hidden');
        arrow.innerText = '▼';
      }
    }

    function closeSettingsMenu() {
      const dropdown = document.getElementById('settingsDropdown');
      const backdrop = document.getElementById('settingsMenuBackdrop');
      if (dropdown) dropdown.classList.add('hidden');
      if (backdrop) backdrop.classList.add('hidden');
    }

    function toggleSettingsMenu(event) {
      event.stopPropagation();
      const dropdown = document.getElementById('settingsDropdown');
      const backdrop = document.getElementById('settingsMenuBackdrop');
      const willOpen = dropdown.classList.contains('hidden');
      dropdown.classList.toggle('hidden');
      if (backdrop) {
        if (willOpen) backdrop.classList.remove('hidden');
        else backdrop.classList.add('hidden');
      }
    }

    function closeDropdowns(event) {
      const dropdown = document.getElementById('settingsDropdown');
      if (!dropdown || dropdown.classList.contains('hidden')) return;
      if (dropdown.contains(event.target)) return;
      if (event.target.closest && event.target.closest('button[onclick*="toggleSettingsMenu"]')) return;
      closeSettingsMenu();
    }

    function openUnifiedSettingsModal() {
      closeSettingsMenu();
      renderUnifiedSeasonSelect();
      updateUnifiedSettingsUI();
      const modal = document.getElementById('unifiedSettingsModal');
      modal.classList.remove('hidden');
      modal.classList.add('flex');
    }

    function closeUnifiedSettingsModal() {
      const modal = document.getElementById('unifiedSettingsModal');
      modal.classList.remove('flex');
      modal.classList.add('hidden');
    }

    function updateUnifiedSettingsUI() {
      const blurCheck = document.getElementById('unifiedBlurCheck');
      if (blurCheck) blurCheck.checked = isBlurEnabled();

      const themeBtn = document.getElementById('unifiedThemeBtn');
      if (themeBtn) themeBtn.innerText = themeMode === 'dark' ? "Dunkel" : "Hell";

      const gridBtn = document.getElementById('unifiedViewGrid');
      const listBtn = document.getElementById('unifiedViewList');
      if (gridBtn && listBtn) {
        gridBtn.className = viewMode === 'grid' ? 'px-2.5 py-1 text-xs font-bold rounded bg-amber-500 text-slate-950' : 'px-2.5 py-1 text-xs font-bold rounded bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-300';
        listBtn.className = viewMode === 'list' ? 'px-2.5 py-1 text-xs font-bold rounded bg-amber-500 text-slate-950' : 'px-2.5 py-1 text-xs font-bold rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300';
      }
    }

    function renderUnifiedSeasonSelect() {
      const seasons = getAllSeasons();
      const select = document.getElementById('unifiedSeasonSelect');
      let html = '';
      seasons.forEach(s => {
        html += `<option value="${escapeHtml(s)}" ${currentSeasonFilter === s ? 'selected' : ''}>📅 ${escapeHtml(s)}</option>`;
      });
      select.innerHTML = html;
    }

    function onUnifiedSeasonChange(selectEl) {
      selectSeason(selectEl.value);
    }

    function setViewMode(mode) {
      viewMode = mode;
      updateUnifiedSettingsUI();
      renderDrinks();
    }

    function toggleFullscreen() {
      if (!document.fullscreenElement) document.documentElement.requestFullscreen();
      else if (document.exitFullscreen) document.exitFullscreen();
    }

    function openPhotoPreview(url) {
      currentPhotoPreviewUrl = url;
      document.getElementById('previewImageSrc').src = url;
      const modal = document.getElementById('photoPreviewModal');
      modal.classList.remove('hidden');
      modal.classList.add('flex');
    }

    function closePhotoPreview() {
      const modal = document.getElementById('photoPreviewModal');
      modal.classList.remove('flex');
      modal.classList.add('hidden');
    }

    function openPhotoPreviewFromModal() {
      if (currentPhotoPreviewUrl) {
        openPhotoPreview(currentPhotoPreviewUrl);
      }
    }
