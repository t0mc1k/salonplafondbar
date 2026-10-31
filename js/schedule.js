/* ============================================================
   js/schedule.js
   Arbeitsplan (Supabase Integration)
   ============================================================ */
    async function openWorkScheduleModal() {
      closeSettingsMenu();
      const container = document.getElementById('workScheduleContentContainer');
      container.innerHTML = `<p class="text-slate-500 italic text-xs text-center py-4">Lade Arbeitsplan für ${escapeHtml(currentWaiterName)}...</p>`;

      const modal = document.getElementById('workScheduleModal');
      modal.classList.remove('hidden');
      modal.classList.add('flex');

      try {
        // Aktuálny mesiac a rok (predvolene november 2026 alebo aktuálny podľa systémového času)
        const now = new Date();
        const currentMonth = now.getMonth() + 1; // 1-12
        const currentYear = now.getFullYear();

        // Stiahneme dáta zo Supabase pre aktuálneho zamestnanca zoradené podľa dňa
        const { data: schedules, error } = await _supabase
          .from("work_schedules")
          .select("*")
          .ilike("employee_name", `%${currentWaiterName}%`)
          .eq("month", currentMonth)
          .eq("year", currentYear)
          .order("day", { ascending: true });

        if (error) {
          throw new Error(error.message);
        }

        if (!schedules || schedules.length === 0) {
          container.innerHTML = `
            <div class="font-bold text-amber-600 dark:text-amber-400 mb-2 flex justify-between items-center">
              <span>📅 Arbeitsplan (Mitarbeiter: ${escapeHtml(currentWaiterName)})</span>
            </div>
            <p class="text-slate-500 italic text-xs text-center py-6">Keine Schichten für diesen Monat (${currentMonth}/${currentYear}) in der Datenbank gefunden. Bitte führen Sie den Excel-Import aus.</p>
          `;
          return;
        }

        // Zostavenie HTML výstupu z reálnych dát z databázy
        let htmlRows = schedules.map(s => {
          let timeStr = "";
          
          if (s.shift_1_start && s.shift_1_end) {
            timeStr += `${s.shift_1_start} – ${s.shift_1_end}`;
          }
          
          if (s.shift_2_start && s.shift_2_end) {
            if (timeStr) timeStr += " / ";
            timeStr += `${s.shift_2_start} – ${s.shift_2_end}`;
          }

          if (!timeStr) {
            timeStr = "Frei (X)";
          }

          return `
            <div class="custom-box p-2.5 rounded-lg border flex items-center justify-between text-xs">
              <div>
                <span class="font-bold text-slate-900 dark:text-white">Tag ${s.day}.${currentMonth}.${currentYear}</span>
                <span class="text-[10px] text-slate-600 dark:text-slate-400 block">Station: ${escapeHtml(s.station || '-')}</span>
              </div>
              <span class="font-bold text-amber-500">${escapeHtml(timeStr)}</span>
            </div>
          `;
        }).join('');

        container.innerHTML = `
          <div class="font-bold text-amber-600 dark:text-amber-400 mb-2 flex justify-between items-center">
            <span>📅 Arbeitsplan ${currentMonth}/${currentYear} (Mitarbeiter: ${escapeHtml(currentWaiterName)})</span>
            <span class="text-[10px] uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-semibold">Live DB</span>
          </div>
          <div class="flex flex-col gap-2 max-h-[60vh] overflow-y-auto pr-1">
            ${htmlRows}
          </div>
        `;

      } catch (err) {
        console.error("Fehler beim Laden des Arbeitsplans:", err);
        container.innerHTML = `
          <div class="font-bold text-red-500 mb-2">Fehler beim Laden</div>
          <p class="text-xs text-slate-400">Konnte den Arbeitsplan nicht aus der Datenbank abrufen: ${escapeHtml(err.message)}</p>
        `;
      }
    }

    function closeWorkScheduleModal() {
      const modal = document.getElementById('workScheduleModal');
      modal.classList.remove('flex');
      modal.classList.add('hidden');
    }
