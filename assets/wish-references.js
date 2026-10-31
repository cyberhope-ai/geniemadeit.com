/* Shared-source reference selection; only selected images are imported, never a whole contact vault. */
window.GenieWishReferences = function ({ root, onChange, onBusy, signedIn, signIn, hint }) {
  const items = [];
  let busy = false, source = 'disk', library = [], epoch = 0, anchor = '', cursor = '', max = 5;
  const dialog = document.createElement('dialog');
  dialog.className = 'wish-dialog'; dialog.setAttribute('aria-labelledby', 'wishPickerTitle');
  dialog.innerHTML = `<h2 id="wishPickerTitle">Choose reference photos</h2>
    <p>Up to five for supported image options. Choose clear originals when possible; generated pictures can carry over invented details.</p>
    <nav class="wish-sources" aria-label="Photo sources">
      <button type="button" class="btn ghost" data-source="disk">From my device</button>
      <button type="button" class="btn ghost" data-source="vault">My Vault</button>
      <button type="button" class="btn ghost" data-source="eververify">EverVerify</button>
      <button type="button" class="btn ghost" data-source="people">My People / contacts</button>
    </nav>
    <label class="wish-permission"><input id="wishPermission" type="checkbox"> I have permission to use these photos and the likenesses shown.</label>
    <section id="wishDisk"><input id="wishFiles" type="file" accept="image/jpeg,image/png,image/webp" multiple aria-label="Upload reference photos"></section>
    <section id="wishPeople" hidden><label>Choose a person<select id="wishPerson"><option value="">Select a contact…</option></select></label></section>
    <section id="wishRegistry" hidden><p>Your EverVerify images are shown below. Stored images may be previews; records without an image cannot be selected.</p>
      <label>Or find a public owner / receipt<input id="wishOwner" type="search" placeholder="Exact owner name or EverVerify receipt link"></label>
      <button type="button" class="btn ghost" id="wishSearch">Find public account</button><div id="wishOwners"></div>
      <p id="wishPublicNotice" hidden>Public visibility is not permission to reuse someone’s likeness. Confirm the account and your permission before selecting photos.</p>
    </section>
    <label id="wishFilterLabel" hidden>Filter images<input id="wishFilter" type="search" placeholder="Search image titles"></label>
    <p id="wishLimit" role="status"></p>
    <div id="wishSelectionTools" hidden><button type="button" class="btn ghost" id="wishSelectAll">Select photos</button> <button type="button" class="btn ghost" id="wishClearSelection">Clear selection</button></div>
    <p id="wishSelectionCount" role="status" aria-live="polite"></p>
    <div class="wish-library" id="wishLibrary"></div>
    <button type="button" class="btn ghost" id="wishMore" hidden>Load more public images</button>
    <p id="wishPickerStatus" role="status" aria-live="polite"></p>
    <footer><button type="button" class="btn ghost" id="wishClose">Done</button><button type="button" class="btn gold" id="wishAdd">Add selected photos</button></footer>`;
  document.body.append(dialog);
  const el = id => dialog.querySelector('#' + id);
  const say = text => { el('wishPickerStatus').textContent = text; hint(text); };
  const imageUrl = value => typeof value === 'string' && /^\/asset\/.+\.(png|jpe?g|webp)$/i.test(value);
  function setBusy(value) {
    busy = value; onBusy(value);
    dialog.querySelectorAll('button,input,select').forEach(node => node.disabled = value);
    updateSelection();
  }
  function updateSelection() {
    const remaining = Math.max(0, max - items.length);
    el('wishLimit').textContent = 'Current option: up to ' + max + ' reference photo(s); ' + items.length + ' added.' + (max === 1 ? ' For up to five, close this picker and choose Pro Image, Realistic Portrait or Ultra Realism. Check its credit price before creating.' : ' Select different clear views of the same person for likeness; more photos do not guarantee a better result.');
    const checks = [...el('wishLibrary').querySelectorAll('input')];
    checks.forEach(check => {
      const added = items.some(item => item.url === library[Number(check.value)].url);
      if (added) check.checked = false;
      check.disabled = busy || added;
    });
    const selected = checks.filter(check => check.checked).length;
    const available = checks.filter(check => !check.disabled && !check.closest('label').hidden).length;
    el('wishSelectionTools').hidden = !library.length;
    el('wishSelectAll').textContent = !remaining ? 'Reference limit reached' : available <= remaining ? 'Select all available (' + available + ')' : 'Select up to ' + remaining + ' photos';
    el('wishSelectAll').disabled = busy || !remaining || !available;
    el('wishClearSelection').disabled = busy || !selected;
    el('wishAdd').textContent = selected ? 'Add ' + selected + ' selected photo' + (selected === 1 ? '' : 's') : 'Add selected photos';
    el('wishSelectionCount').textContent = library.length ? selected + ' selected to add · ' + items.length + '/' + max + ' already added. Already-added photos cannot be selected again.' : '';
  }
  async function api(path, body) {
    const r = await fetch(path, { credentials: 'same-origin', ...(body ? { method: 'POST', headers: {'content-type':'application/json'}, body: JSON.stringify(body) } : {}) });
    const d = await r.json();
    if (!r.ok || d.ok === false) throw new Error(d.message || 'Could not load these photos. Please sign in or try again.');
    return d;
  }
  function render() {
    root.replaceChildren(); root.className = 'wish-selected';
    items.forEach((item, index) => {
      const figure = document.createElement('figure'), image = document.createElement('img'), caption = document.createElement('figcaption'), remove = document.createElement('button');
      image.src = item.url; image.alt = 'Reference ' + (index + 1);
      caption.textContent = 'Reference ' + (index + 1) + ' · ' + item.label;
      remove.type = 'button'; remove.className = 'btn ghost'; remove.textContent = 'Remove'; remove.setAttribute('aria-label', 'Remove reference ' + (index + 1));
      remove.onclick = () => { if (busy) return; items.splice(index, 1); render(); };
      figure.append(image, caption, remove); root.append(figure);
    });
    onChange(items.map(x => ({...x})));
    updateSelection();
  }
  function add(url, label = 'Photo') {
    if (items.some(x => x.url === url)) { say('That photo is already selected.'); return false; }
    if (items.length >= max) { say('This option accepts ' + max + ' reference photo(s). Remove one before adding another.'); return false; }
    items.push({url, label}); render(); return true;
  }
  function renderLibrary() {
    const box = el('wishLibrary'); box.replaceChildren();
    library.forEach((item, i) => {
      const label = document.createElement('label'), image = document.createElement('img'), check = document.createElement('input'), title = document.createElement('span');
      label.dataset.title = (item.label || '').toLowerCase(); image.src = item.url; image.alt = item.label; image.loading = 'lazy';
      check.type = 'checkbox'; check.value = String(i); check.setAttribute('aria-label', 'Select ' + item.label);
      check.onchange = () => { const count = box.querySelectorAll('input:checked').length; if (count + items.length > max) { check.checked = false; say('Select at most ' + Math.max(0, max - items.length) + ' more photos.'); } updateSelection(); };
      title.textContent = item.label; label.append(image, check, title); box.append(label);
    });
    el('wishFilterLabel').hidden = !library.length; el('wishFilter').value = '';
    updateSelection();
  }
  async function choose(next) {
    if (busy) return;
    source = next; const token = ++epoch; anchor = ''; cursor = ''; library = [];
    el('wishPermission').checked = false; el('wishOwners').replaceChildren(); el('wishPublicNotice').hidden = true;
    el('wishMore').hidden = true; el('wishDisk').hidden = next !== 'disk'; el('wishPeople').hidden = next !== 'people'; el('wishRegistry').hidden = next !== 'eververify'; el('wishAdd').hidden = next === 'disk';
    dialog.querySelectorAll('[data-source]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.source === next)));
    renderLibrary(); say(next === 'disk' ? 'Confirm permission, then select photos from your device.' : 'Loading photos…');
    if (next === 'disk') return;
    setBusy(true);
    try {
      const d = await api(next === 'people' ? '/api/people' : next === 'vault' ? '/api/gallery' : '/api/registry/mine');
      if (token !== epoch) return;
      if (next === 'people') {
        const select = el('wishPerson'); select.replaceChildren(new Option('Select a contact…', ''));
        (d.people || []).forEach(p => { const option = new Option(p.name || 'Unnamed', p.id); option.disabled = !p.photo_permission; if (option.disabled) option.text += ' — permission needed in My People'; select.append(option); });
        select.onchange = () => {
          const p = (d.people || []).find(p => p.id === select.value);
          library = p?.photo_permission ? (p.photos || []).filter(imageUrl).map((url,i) => ({url,label:(p.name || 'Contact') + ' photo ' + (i+1)})) : [];
          el('wishPermission').checked = false; renderLibrary(); say(library.length + ' photos. Select up to ' + Math.max(0,max-items.length) + '; permission is still required.');
        };
        say('Choose a contact, then choose their best reference photos.');
      } else {
        library = next === 'vault' ? (d.generations || []).filter(x => imageUrl(x.url)).map(x => ({id:x.id,url:x.url,label:x.prompt || 'Vault image'})) : (d.registrations || []).filter(x => imageUrl(x.thumb_url)).map(x => ({id:x.receipt_id,url:x.thumb_url,label:x.title || 'Registry image'}));
        renderLibrary(); say(library.length ? library.length + ' images available (latest account library entries).' : 'No supported images found in this account library.');
      }
    } catch(e) { say(e.message); } finally { setBusy(false); }
  }
  async function loadPublic(selectedAnchor, more = false) {
    if (busy) return; setBusy(true);
    try {
      const d = await api('/api/people/public-registry?anchor=' + encodeURIComponent(selectedAnchor) + (more && cursor ? '&cursor=' + encodeURIComponent(cursor) : ''));
      const batch = (d.registrations || []).filter(x => imageUrl(x.thumb_url)).map(x => ({id:x.receipt_id,url:x.thumb_url,label:x.title || 'Public image'}));
      source = 'public-eververify'; anchor = selectedAnchor; cursor = d.next_cursor; library = more ? library.concat(batch) : batch;
      el('wishPermission').checked = false; el('wishPublicNotice').hidden = false; el('wishMore').hidden = !cursor;
      renderLibrary(); say('Public account: ' + d.owner + '. Verify this is the right person; confirm permission to use selected images.');
    } catch(e) { say(e.message); } finally { setBusy(false); }
  }
  el('wishSearch').onclick = async () => {
    if (busy) return; setBusy(true); el('wishOwners').replaceChildren();
    try {
      const d = await api('/api/people/public-registry?q=' + encodeURIComponent(el('wishOwner').value.trim()));
      (d.owners || []).forEach(owner => { const b = document.createElement('button'); b.type = 'button'; b.className = 'btn ghost'; b.textContent = owner.owner + ' · receipt ' + owner.anchor.slice(0,8); b.onclick = () => loadPublic(owner.anchor); el('wishOwners').append(b); });
      say((d.owners || []).length ? 'Choose the correct account. Matching names may belong to different people.' : 'No public account found. Try an exact owner name or receipt link.');
    } catch(e) { say(e.message); } finally { setBusy(false); }
  };
  el('wishMore').onclick = () => loadPublic(anchor, true);
  el('wishAdd').onclick = async () => {
    if (busy) return;
    if (!el('wishPermission').checked) { say('Confirm photo and likeness permission first.'); return; }
    const selected = [...el('wishLibrary').querySelectorAll('input:checked')].map(x => library[Number(x.value)]);
    if (!selected.length || items.length + selected.length > max) { say('Choose between one and ' + Math.max(0,max-items.length) + ' photos.'); return; }
    setBusy(true); let count = 0;
    try {
      for (const item of selected) {
        const d = source === 'people' ? item : await api('/api/people/import-vault', {id:item.id,source,owner_anchor:anchor,contact_confirmed:source === 'public-eververify',photo_permission:true});
        if (add(d.url, item.label)) count++;
      }
      say(count + ' reference photo(s) added. Close this picker and describe your wish.'); renderLibrary();
    } catch(e) { say(count + ' added. ' + e.message + ' Earlier selections are retained.'); }
    finally { setBusy(false); }
  };
  async function upload(files) {
    if (busy) return;
    if (!signedIn()) { signIn(); return; }
    const list = [...(files || [])];
    if (!list.length) return;
    if (!el('wishPermission').checked) { if (!dialog.open) dialog.showModal(); say('Confirm photo and likeness permission, then select your files again.'); return; }
    if (list.length + items.length > max) { say('Choose no more than ' + Math.max(0,max-items.length) + ' additional photos.'); return; }
    if (list.some(f => !/^image\/(png|jpeg|webp)$/.test(f.type) || f.size > 12*1024*1024)) { say('Use JPG, PNG or WebP files, no larger than 12 MB each.'); return; }
    setBusy(true); let count = 0;
    try {
      for (const file of list) {
        say('Uploading photo ' + (count+1) + ' of ' + list.length + '…');
        const form = new FormData(); form.append('file',file);
        const r = await fetch('/api/upload',{method:'POST',credentials:'same-origin',body:form}), d = await r.json();
        if (!r.ok || !d.ok || !d.url) throw new Error(d.message || 'Upload failed.');
        if (add(d.url,file.name)) count++;
      }
      say(count + ' reference photos added. They are not added to a contact or your personal photo library automatically.');
    } catch(e) { say(count + ' added. ' + e.message); } finally { setBusy(false); el('wishFiles').value = ''; }
  }
  dialog.querySelectorAll('[data-source]').forEach(b => b.onclick = () => choose(b.dataset.source));
  el('wishSelectAll').onclick = () => {
    if (busy) return;
    const selectedUrls = new Set(items.map(item => item.url));
    let count = 0;
    el('wishLibrary').querySelectorAll('input').forEach(check => {
      const url = library[Number(check.value)].url;
      check.checked = !check.disabled && !check.closest('label').hidden && !selectedUrls.has(url) && count < Math.max(0, max - items.length);
      if (check.checked) { count++; selectedUrls.add(url); }
    });
    updateSelection();
    say(count + ' photos selected. Confirm permission, then click Add ' + count + ' selected photos.');
  };
  el('wishClearSelection').onclick = () => { if (!busy) { el('wishLibrary').querySelectorAll('input').forEach(check => check.checked = false); updateSelection(); } };
  el('wishFilter').oninput = () => { el('wishLibrary').querySelectorAll('label').forEach(label => { label.hidden = !label.dataset.title.includes(el('wishFilter').value.toLowerCase()); if (label.hidden) label.querySelector('input').checked = false; }); updateSelection(); };
  el('wishFiles').onchange = () => upload(el('wishFiles').files);
  el('wishClose').onclick = () => { if (!busy) dialog.close(); };
  dialog.addEventListener('cancel', e => { if (busy) e.preventDefault(); });
  return { open() { if (!signedIn()) { signIn(); return; } if (!dialog.open) dialog.showModal(); choose('disk'); }, upload, add, clear() { if (!busy) { items.splice(0); render(); } }, limit(n) { max = n; updateSelection(); }, get items() { return items.map(x => ({...x})); } };
};
