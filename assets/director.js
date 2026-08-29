/* The Director — plan a film before you shoot it.
 *
 * Flow: describe a moment -> /api/shot/compose writes the frame prompt in the chosen
 * eye -> /api/generate renders it -> the result is attached to the open project.
 *
 * Compose returns a prompt only and spends no credits; generation is the single place
 * money moves, exactly as it is everywhere else in GenieMade.
 */
(() => {
  const $ = (id) => document.getElementById(id);
  const api = async (path, opts = {}) => {
    const r = await fetch(path, {
      credentials: "include",
      headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
      ...opts,
    });
    let d = {};
    try { d = await r.json(); } catch {}
    return { ok: r.ok, status: r.status, ...d };
  };

  const state = { persona: "", project: "", shots: [] };

  const say = (msg, cls = "") => { $("stat").textContent = msg; $("stat").className = "stat " + cls; };

  /* ---------- menu: personas, shots, styles ----------
   * The engine is the source of truth, but if the menu call fails the page must still
   * read as a coherent product rather than a form with empty dropdowns. These mirror
   * DIRECTOR_MENU; the engine's response always wins when it arrives. */
  const FALLBACK = {
    personas: {
      cinematographer: "Roger Deakins", hitchcock: "Alfred Hitchcock", kubrick: "Stanley Kubrick",
      villeneuve: "Denis Villeneuve", spielberg: "Steven Spielberg", scorsese: "Martin Scorsese",
      production_designer: "Hannah Beachler",
    },
    shots: {
      storyboard: "Storyboard frame", concept: "Concept art", location: "Location / establishing",
      character: "Character look", lighting: "Lighting study",
    },
    styles: ["noir-gothic", "photoreal", "watercolor-storybook"],
  };

  async function loadMenu() {
    let m = await api("/api/director/menu");
    if (!m.ok || !m.personas) m = FALLBACK;

    $("personas").innerHTML = "";
    const none = eyeRow("", "No particular eye", "The style decides everything");
    $("personas").appendChild(none);
    for (const [id, name] of Object.entries(m.personas || {})) {
      // The label carries the craft after the name where the template provides it.
      $("personas").appendChild(eyeRow(id, name, craftFor(id)));
    }
    select($("shot"), m.shots || {});
    for (const s of m.styles || []) {
      const o = document.createElement("option");
      o.value = s; o.textContent = s.replace(/-/g, " ");
      $("style").appendChild(o);
    }
  }

  const CRAFT = {
    cinematographer: "Available light, long lenses, restraint",
    hitchcock: "Withhold and reveal, dread in the foreground",
    kubrick: "Symmetry, one-point perspective, cold precision",
    villeneuve: "Scale, haze, silence as texture",
    spielberg: "Wonder on a face, warm backlight",
    scorsese: "Restless camera, saturated, dense",
    production_designer: "The world tells the story",
  };
  const craftFor = (id) => CRAFT[id] || "";

  function eyeRow(id, name, craft) {
    const el = document.createElement("div");
    // The row carries its persona id. Reopening a project matches on this, not on the
    // visible name: the project stores "villeneuve" while the row reads "Denis Villeneuve".
    el.dataset.persona = id;
    el.className = "eye" + (id === state.persona ? " on" : "");
    el.innerHTML = `<div><div class="nm">${name}</div><div class="cr">${craft}</div></div>`;
    el.onclick = () => {
      state.persona = id;
      [...$("personas").children].forEach((c) => c.classList.remove("on"));
      el.classList.add("on");
    };
    return el;
  }

  function select(el, obj) {
    el.innerHTML = "";
    for (const [v, label] of Object.entries(obj)) {
      const o = document.createElement("option");
      o.value = v; o.textContent = label;
      if (v === "concept") o.selected = true;
      el.appendChild(o);
    }
  }

  /* ---------- account ---------- */
  async function loadMe() {
    const me = await api("/api/me");
    if (!me.ok || me.error === "auth_required") {
      $("gate").style.display = "block";
      $("go").disabled = true;
      say("Sign in to start directing.", "err");
      return false;
    }
    $("creditN").textContent = me.credits ?? "—";
    return true;
  }

  /* ---------- projects ---------- */
  async function loadProjects(keep) {
    const d = await api("/api/projects");
    const sel = $("projSel");
    sel.innerHTML = '<option value="">— no project —</option>';
    for (const p of d.projects || []) {
      const o = document.createElement("option");
      o.value = p.id; o.textContent = p.title;
      sel.appendChild(o);
    }
    if (keep) sel.value = keep;
    state.project = sel.value;
    fillProject();
  }

  async function fillProject() {
    if (!state.project) {
      ["projLogline", "projGenre", "projTone"].forEach((i) => ($(i).value = ""));
      renderShots([]);
      return;
    }
    const d = await api("/api/projects/" + state.project);
    if (!d.ok) return;
    $("projLogline").value = d.project.logline || "";
    $("projGenre").value = d.project.genre || "";
    $("projTone").value = d.project.tone || "";
    // Always reconcile, including the empty case: switching from a project that has an eye to
    // one that doesn't must clear both the highlight and the state, or the next shot is composed
    // through an eye the page is no longer showing.
    state.persona = d.project.persona || "";
    [...$("personas").children].forEach((c) =>
      c.classList.toggle("on", c.dataset.persona === state.persona));
    // Items carry the generation id; the Vault holds the pixels.
    renderShots((d.items || []).map((i) => ({
      url: `/asset/gen/${i.user_id}/${i.generation_id}.png`,
      caption: i.scene_ref || i.shot || "shot", kind: i.shot, sealed: true,
    })));
  }

  /* ---------- gallery ---------- */
  function renderShots(list) {
    state.shots = list;
    const g = $("shots");
    g.innerHTML = "";
    $("empty").style.display = list.length ? "none" : "block";
    for (const s of list) {
      const el = document.createElement("div");
      el.className = "shot";
      const media = s.video
        ? `<video src="${s.url}" controls muted loop playsinline></video>`
        : `<a href="${s.url}" target="_blank" rel="noopener"><img src="${s.url}" alt="" loading="lazy"></a>`;
      el.innerHTML =
        media +
        (s.kind ? `<span class="kind">${s.kind}</span>` : "") +
        (s.sealed ? `<span class="seal" title="Sealed with a certificate">✦ sealed</span>` : "") +
        `<div class="cap" title="${(s.caption || "").replace(/"/g, "&quot;")}">${s.caption || ""}</div>`;
      g.prepend(el);
    }
  }

  /* ---------- the main act ---------- */
  async function direct() {
    const scene = $("scene").value.trim();
    if (scene.length < 8) { say("Describe the moment in a sentence or two.", "err"); $("scene").focus(); return; }

    $("go").disabled = true;
    try {
      say("The Director is framing the shot…");
      const c = await api("/api/shot/compose", {
        method: "POST",
        body: JSON.stringify({
          scene, shot: $("shot").value, style: $("style").value || undefined,
          persona: state.persona || undefined, aspect: $("aspect").value,
        }),
      });
      if (!c.ok || !c.prompt) { say(c.message || c.error || "Could not compose the shot.", "err"); return; }

      say("Rendering…");
      const g = await api("/api/generate", {
        method: "POST",
        body: JSON.stringify({
          capability: c.suggested_capability, prompt: c.prompt, aspect: $("aspect").value,
        }),
      });

      // A queued video comes back as {status:"processing", job_id}; an image is immediate.
      if (g.status === "processing" && g.job_id) return void (await pollJob(g.job_id, scene, c.shot));
      if (!g.ok || !g.generation) {
        say(g.message || g.error || "Generation failed.", "err");
        return;
      }
      await landed(g, scene, c.shot);
    } catch (e) {
      say("Something went wrong: " + e.message, "err");
    } finally {
      $("go").disabled = false;
    }
  }

  async function pollJob(jobId, scene, shot) {
    const t0 = Date.now();
    for (let i = 0; i < 105; i++) {
      await new Promise((r) => setTimeout(r, 4000));
      const j = await api("/api/jobs/" + jobId);
      if (j.status === "completed" && j.generation) return void (await landed(j, scene, shot));
      if (j.status === "failed") { say(j.error || "The render failed — your credits were refunded.", "err"); return; }
      say(`Rendering… ${Math.round((Date.now() - t0) / 1000)}s`);
    }
    say("Still rendering. It will appear in your Vault when it finishes.");
  }

  async function landed(res, scene, shot) {
    const gen = res.generation;
    if (res.credits_remaining != null) $("creditN").textContent = res.credits_remaining;

    renderShots([{
      url: gen.url, caption: scene.slice(0, 70), kind: shot,
      sealed: !!(gen.certificate && gen.certificate.receipt_id),
      video: /\.(mp4|webm|mov)$/i.test(gen.url || ""),
    }, ...state.shots]);

    if (state.project) {
      await api(`/api/projects/${state.project}/attach`, {
        method: "POST",
        body: JSON.stringify({ generation_id: gen.id, shot, scene_ref: scene.slice(0, 200) }),
      });
      say("Shot rendered and added to the project.", "ok");
    } else {
      say("Shot rendered and sealed in your Vault.", "ok");
    }
  }

  /* ---------- wiring ---------- */
  $("go").onclick = direct;
  $("projSel").onchange = () => { state.project = $("projSel").value; fillProject(); };

  $("projAdd").onclick = async () => {
    const title = $("projTitle").value.trim();
    if (!title) { $("projTitle").focus(); return; }
    const d = await api("/api/projects", { method: "POST", body: JSON.stringify({ title }) });
    if (d.ok) { $("projTitle").value = ""; await loadProjects(d.project.id); say(`Project “${title}” created.`, "ok"); }
    else say(d.message || d.error || "Could not create the project.", "err");
  };

  $("projSave").onclick = async () => {
    if (!state.project) { say("Create or choose a project first.", "err"); return; }
    const d = await api("/api/projects/" + state.project, {
      method: "PATCH",
      body: JSON.stringify({
        logline: $("projLogline").value, genre: $("projGenre").value,
        tone: $("projTone").value, persona: state.persona || "",
      }),
    });
    say(d.ok ? "Project saved." : (d.error || "Could not save."), d.ok ? "ok" : "err");
  };

  $("scene").addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") direct();
  });

  (async () => {
    await loadMenu();
    if (await loadMe()) await loadProjects();
  })();
})();
