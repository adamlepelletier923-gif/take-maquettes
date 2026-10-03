(() => {
  const key = 'take-iphone-2026-10-03-v2';
  const version = document.getElementById('version');
  const notes = document.getElementById('notes');
  const progress = document.getElementById('progress');
  const storageStatus = document.getElementById('storage-status');
  const boxes = Array.from(document.querySelectorAll('input[data-k]'));
  const films = Array.from(document.querySelectorAll('input[data-proof]'));
  let activeVersion = '';

  function storage(action) {
    try {
      return action(localStorage);
    } catch {
      storageStatus.textContent = 'Les coches ne peuvent pas être gardées ici. Note tes résultats avant de fermer cette page.';
      return null;
    }
  }

  function updateProgress() {
    const count = boxes.filter(box => box.checked).length;
    progress.textContent = activeVersion
      ? `${count} / ${boxes.length} points vérifiés sur l’iPhone`
      : 'Indique la version de Take avant de cocher.';
  }

  function save() {
    if (!activeVersion) return;
    const checked = boxes.filter(box => box.checked).map(box => box.dataset.k);
    const proofs = Object.fromEntries(films.map(field => [field.dataset.proof, field.value]));
    storage(store => store.setItem(`${key}:${activeVersion}`, JSON.stringify({ checked, notes: notes.value, proofs })));
    updateProgress();
  }

  function load() {
    activeVersion = version.value.trim();
    let result = {};
    if (activeVersion) {
      const raw = storage(store => store.getItem(`${key}:${activeVersion}`));
      try {
        result = JSON.parse(raw || '{}') || {};
      } catch {
        storageStatus.textContent = 'Les anciens résultats sont illisibles. Les cases repartent vides pour cette version.';
      }
    }
    const checked = Array.isArray(result.checked) ? result.checked : [];
    boxes.forEach(box => {
      box.checked = activeVersion !== '' && checked.includes(box.dataset.k);
      box.disabled = activeVersion === '';
    });
    notes.value = typeof result.notes === 'string' ? result.notes : '';
    notes.disabled = activeVersion === '';
    films.forEach(field => {
      const saved = result.proofs?.[field.dataset.proof];
      field.value = typeof saved === 'string' ? saved : field.defaultValue || '';
      field.disabled = activeVersion === '';
    });
    storage(store => store.setItem(key, activeVersion));
    updateProgress();
  }

  version.value = storage(store => store.getItem(key)) || '';
  version.addEventListener('change', load);
  boxes.forEach(box => box.addEventListener('change', save));
  notes.addEventListener('input', save);
  films.forEach(field => field.addEventListener('input', save));
  load();
})();
