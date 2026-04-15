const guestsOutput = document.getElementById("guestsOutput");
const roomsOutput = document.getElementById("roomsOutput");
const checkInsOutput = document.getElementById("checkInsOutput");
const combinedOutput = document.getElementById("combinedOutput");
const allGuestsTable = document.getElementById("allGuestsTable");
const allRoomsTable = document.getElementById("allRoomsTable");
const allCheckInsTable = document.getElementById("allCheckInsTable");
const hashMeta = document.getElementById("hashMeta");
const hashBuckets = document.getElementById("hashBuckets");
const skipMeta = document.getElementById("skipMeta");
const skipTableWrap = document.getElementById("skipTableWrap");
const avlSvg = document.getElementById("avlSvg");
const toastHost = document.getElementById("toastHost");

const SVG_NS = "http://www.w3.org/2000/svg";

document.getElementById("guestForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  const err = validateGuestClient(form);
  if (err) {
    showToast(err, "error");
    return;
  }
  try {
    await post("/api/guests", {
      passportNumber: normalizePassport(form.passportNumber.value),
      fullName: form.fullName.value.trim(),
      birthYear: Number(form.birthYear.value),
      address: form.address.value.trim(),
      purpose: form.purpose.value.trim()
    });
    form.reset();
    showToast("Постоялец добавлен", "success");
    await refreshAll();
  } catch {
    /* toast внутри post */
  }
});

document.getElementById("roomForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  const err = validateRoomClient(form);
  if (err) {
    showToast(err, "error");
    return;
  }
  try {
    await post("/api/rooms", {
      roomNumber: form.roomNumber.value.trim(),
      capacity: Number(form.capacity.value),
      roomsCount: Number(form.roomsCount.value),
      hasBathroom: form.hasBathroom.checked,
      equipment: form.equipment.value.trim()
    });
    form.reset();
    showToast("Номер добавлен", "success");
    await refreshAll();
  } catch {
    /* handled */
  }
});

document.getElementById("checkInForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  try {
    await post("/api/checkins", {
      passportNumber: normalizePassport(form.passportNumber.value),
      roomNumber: form.roomNumber.value.trim(),
      checkInDate: form.checkInDate.value
    });
    form.reset();
    showToast("Заселение зарегистрировано", "success");
    await refreshAll();
  } catch {
    /* handled */
  }
});

document.getElementById("checkOutForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  try {
    await post("/api/checkouts", {
      passportNumber: normalizePassport(form.passportNumber.value),
      checkOutDate: form.checkOutDate.value
    });
    form.reset();
    showToast("Выселение зарегистрировано", "success");
    await refreshAll();
  } catch {
    /* handled */
  }
});

document.getElementById("searchGuestBtn").addEventListener("click", async () => {
  const input = document.getElementById("guestNameSearch");
  const query = input.value.trim();
  if (query.length < 1) {
    showToast("Введите фрагмент ФИО (минимум 1 символ)", "error");
    return;
  }
  try {
    const guests = await get(`/api/guests/search?name=${encodeURIComponent(query)}`);
    guestsOutput.textContent = JSON.stringify(guests, null, 2);
  } catch {
    /* handled */
  }
});

document.getElementById("searchRoomBtn").addEventListener("click", async () => {
  const input = document.getElementById("equipmentSearch");
  const fragment = input.value.trim();
  if (fragment.length < 1) {
    showToast("Введите фрагмент оборудования", "error");
    return;
  }
  try {
    const rooms = await get(`/api/rooms/search-equipment?fragment=${encodeURIComponent(fragment)}`);
    roomsOutput.textContent = JSON.stringify(rooms, null, 2);
  } catch {
    /* handled */
  }
});

document.getElementById("refreshAllBtn").addEventListener("click", () => refreshAll());
document.getElementById("loadDemoBtn").addEventListener("click", async () => {
  try {
    await post("/api/demo-data", {});
    showToast("Тестовые данные загружены (включая коллизию в хеш-таблице)", "success");
    await refreshAll();
  } catch {
    /* handled */
  }
});
document.getElementById("resetBtn").addEventListener("click", async () => {
  try {
    await post("/api/reset", {});
    showToast("Данные очищены", "success");
    await refreshAll();
  } catch {
    /* handled */
  }
});

function normalizePassport(raw) {
  return raw.replace(/\s/g, "").trim();
}

function validateGuestClient(form) {
  const p = normalizePassport(form.passportNumber.value);
  if (!/^\d{4}-\d{6}$/.test(p)) return "Паспорт: формат NNNN-NNNNNN";
  return null;
}

function validateRoomClient(form) {
  const r = form.roomNumber.value.trim();
  if (!/^[ЛПОМ]\d{3}$/.test(r)) return "Номер: буква Л/П/О/М и три цифры (например Л001)";
  return null;
}

async function refreshAll() {
  try {
    const [guests, rooms, checkIns, structures] = await Promise.all([
      get("/api/guests", { silent: true }),
      get("/api/rooms", { silent: true }),
      get("/api/checkins", { silent: true }),
      get("/api/structures", { silent: true })
    ]);

    guestsOutput.textContent = "(здесь появятся результаты поиска по ФИО)";
    roomsOutput.textContent = "(здесь появятся результаты поиска по оборудованию)";
    checkInsOutput.textContent = JSON.stringify(checkIns, null, 2);
    combinedOutput.textContent = JSON.stringify({ guests, rooms, checkIns }, null, 2);

    renderAllGuestsTable(guests);
    renderAllRoomsTable(rooms);
    renderAllCheckInsTable(checkIns);

    renderHash(structures.hashTable);
    renderSkipList(structures.layeredList);
    renderAvlSvg(structures.avlTree);
  } catch (e) {
    showToast(e.message || "Не удалось обновить данные", "error");
  }
}

function renderAllGuestsTable(guests) {
  if (!guests.length) {
    allGuestsTable.innerHTML = "<p class=\"hint\">Нет зарегистрированных постояльцев.</p>";
    return;
  }
  const table = document.createElement("table");
  table.className = "data";
  const thead = document.createElement("thead");
  const hr = document.createElement("tr");
  ["Паспорт", "ФИО", "Год рожд.", "Адрес (кратко)", ""].forEach((h) => {
    const th = document.createElement("th");
    th.textContent = h;
    hr.appendChild(th);
  });
  thead.appendChild(hr);
  table.appendChild(thead);
  const tbody = document.createElement("tbody");
  for (const g of guests) {
    const tr = document.createElement("tr");
    tr.appendChild(tdEl(g.passportNumber));
    tr.appendChild(tdEl(g.fullName));
    tr.appendChild(tdEl(String(g.birthYear)));
    const addr = g.address.length > 32 ? `${g.address.slice(0, 32)}…` : g.address;
    tr.appendChild(tdEl(addr));
    const tdBtn = document.createElement("td");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn-danger";
    btn.textContent = "Удалить";
    btn.addEventListener("click", async () => {
      if (!window.confirm(`Удалить постояльца ${g.passportNumber} из хеш-таблицы?`)) return;
      try {
        await httpDelete(`/api/guests/${encodeURIComponent(g.passportNumber)}`);
        showToast("Постоялец удалён (и связанные записи заселений)", "success");
        await refreshAll();
      } catch {
        /* toast */
      }
    });
    tdBtn.appendChild(btn);
    tr.appendChild(tdBtn);
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  allGuestsTable.replaceChildren(table);
}

function renderAllRoomsTable(rooms) {
  if (!rooms.length) {
    allRoomsTable.innerHTML = "<p class=\"hint\">Нет номеров в AVL-дереве.</p>";
    return;
  }
  const table = document.createElement("table");
  table.className = "data";
  const thead = document.createElement("thead");
  const hr = document.createElement("tr");
  ["Номер", "Тип", "Мест", "Комнат", "Занято", "Оборудование (кратко)", ""].forEach((h) => {
    const th = document.createElement("th");
    th.textContent = h;
    hr.appendChild(th);
  });
  thead.appendChild(hr);
  table.appendChild(thead);
  const tbody = document.createElement("tbody");
  for (const r of rooms) {
    const tr = document.createElement("tr");
    tr.appendChild(tdEl(r.roomNumber));
    tr.appendChild(tdEl(r.type));
    tr.appendChild(tdEl(String(r.capacity)));
    tr.appendChild(tdEl(String(r.roomsCount)));
    tr.appendChild(tdEl(`${r.occupied}/${r.capacity}`));
    const eq = r.equipment.length > 28 ? `${r.equipment.slice(0, 28)}…` : r.equipment;
    tr.appendChild(tdEl(eq));
    const tdBtn = document.createElement("td");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn-danger";
    btn.textContent = "Удалить";
    btn.addEventListener("click", async () => {
      if (!window.confirm(`Удалить номер ${r.roomNumber} из дерева?`)) return;
      try {
        await httpDelete(`/api/rooms/${encodeURIComponent(r.roomNumber)}`);
        showToast("Номер удалён из AVL", "success");
        await refreshAll();
      } catch {
        /* toast */
      }
    });
    tdBtn.appendChild(btn);
    tr.appendChild(tdBtn);
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  allRoomsTable.replaceChildren(table);
}

function renderAllCheckInsTable(checkIns) {
  if (!checkIns.length) {
    allCheckInsTable.innerHTML = "<p class=\"hint\">Нет записей в слоеном списке.</p>";
    return;
  }
  const table = document.createElement("table");
  table.className = "data";
  const thead = document.createElement("thead");
  const hr = document.createElement("tr");
  ["Паспорт", "Номер", "Заезд", "Выезд", ""].forEach((h) => {
    const th = document.createElement("th");
    th.textContent = h;
    hr.appendChild(th);
  });
  thead.appendChild(hr);
  table.appendChild(thead);
  const tbody = document.createElement("tbody");
  for (const c of checkIns) {
    const tr = document.createElement("tr");
    tr.appendChild(tdEl(c.passportNumber));
    tr.appendChild(tdEl(c.roomNumber));
    tr.appendChild(tdEl(c.checkInDate));
    tr.appendChild(tdEl(c.checkOutDate ?? "— (активно)"));
    const tdBtn = document.createElement("td");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn-danger";
    btn.textContent = "Удалить запись";
    btn.addEventListener("click", async () => {
      if (
        !window.confirm(
          `Удалить запись заселения ${c.passportNumber} / ${c.roomNumber} от ${c.checkInDate}?`
        )
      ) {
        return;
      }
      try {
        await httpDelete("/api/checkins", {
          passportNumber: c.passportNumber,
          roomNumber: c.roomNumber,
          checkInDate: c.checkInDate
        });
        showToast("Запись удалена из слоеного списка", "success");
        await refreshAll();
      } catch {
        /* toast */
      }
    });
    tdBtn.appendChild(btn);
    tr.appendChild(tdBtn);
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  allCheckInsTable.replaceChildren(table);
}

function tdEl(text) {
  const td = document.createElement("td");
  td.textContent = text;
  return td;
}

function renderHash(view) {
  if (!view || !view.buckets) {
    hashMeta.textContent = "";
    hashBuckets.textContent = "";
    return;
  }
  hashMeta.textContent = `Размер таблицы: ${view.size}, записей: ${view.count}, загрузка: ${(view.loadFactor * 100).toFixed(1)}%. Открытое хеширование (цепочки).`;
  hashBuckets.replaceChildren();
  for (const b of view.buckets) {
    const cell = document.createElement("div");
    cell.className = `bucket ${b.state.toLowerCase()}`;
    const idx = document.createElement("div");
    idx.className = "idx";
    idx.textContent = `#${b.index}`;
    cell.appendChild(idx);
    if (b.state === "FILLED") {
      const l = document.createElement("div");
      const length = Number.isFinite(b.chainLength) ? b.chainLength : 1;
      l.textContent = `цепочка: ${length}`;
      l.style.opacity = "0.9";
      cell.appendChild(l);

      const items = [];
      if (Array.isArray(b.entries) && b.entries.length) {
        items.push(...b.entries.map((entry) => `${entry.passport} (хеш #${entry.homeIndex})`));
      } else if (Array.isArray(b.passports) && b.passports.length) {
        items.push(...b.passports.map((passport) => `${passport} (хеш #${b.index})`));
      } else if (b.passport) {
        const hashed = Number.isFinite(b.homeIndex) ? b.homeIndex : b.index;
        items.push(`${b.passport} (хеш #${hashed})`);
      }

      const p = document.createElement("div");
      p.textContent = items.length ? items.join(" | ") : "данные недоступны";
      p.style.wordBreak = "break-word";
      cell.appendChild(p);
    } else {
      const t = document.createElement("div");
      t.textContent = "—";
      cell.appendChild(t);
    }
    hashBuckets.appendChild(cell);
  }
}

function renderSkipList(view) {
  if (!view) {
    skipMeta.textContent = "";
    skipTableWrap.textContent = "";
    return;
  }
  skipMeta.textContent = `Высота списка (активных уровней): ${view.activeHeight} из ${view.maxLevels}. Ключ сортировки — номер комнаты. «Следующий на уровне k» — сосед по k-му «мосту».`;
  const table = document.createElement("table");
  table.className = "skip";
  const thead = document.createElement("thead");
  const maxTower = Math.max(1, ...view.nodes.map((n) => n.towerHeight), view.headNextKeys?.length || 0);
  const hr = document.createElement("tr");
  hr.appendChild(th("Узел (ключ)"));
  hr.appendChild(th("Высота башни"));
  hr.appendChild(th("Записи заселений"));
  for (let i = 0; i < maxTower; i++) {
    hr.appendChild(th(`Уровень ${i} →`));
  }
  thead.appendChild(hr);
  table.appendChild(thead);
  const tbody = document.createElement("tbody");

  const headRow = document.createElement("tr");
  headRow.appendChild(td("— голова —"));
  headRow.appendChild(td("—"));
  headRow.appendChild(td("—"));
  for (let i = 0; i < maxTower; i++) {
    const v = view.headNextKeys[i] ?? "—";
    headRow.appendChild(td(v === null ? "—" : String(v)));
  }
  tbody.appendChild(headRow);

  for (const n of view.nodes) {
    const tr = document.createElement("tr");
    tr.appendChild(td(n.key));
    tr.appendChild(td(String(n.towerHeight)));
    tr.appendChild(td(n.labels.join("; ") || "—"));
    for (let i = 0; i < maxTower; i++) {
      const v = n.nextKeys[i];
      tr.appendChild(td(v === null || v === undefined ? "—" : String(v)));
    }
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  skipTableWrap.replaceChildren(table);
}

function th(text) {
  const e = document.createElement("th");
  e.textContent = text;
  return e;
}

function td(text) {
  const e = document.createElement("td");
  e.textContent = text;
  return e;
}

function layoutInOrder(node, depth, counter) {
  if (!node) return;
  layoutInOrder(node.left, depth + 1, counter);
  node._x = counter.x++;
  node._y = depth;
  layoutInOrder(node.right, depth + 1, counter);
}

function renderAvlSvg(root) {
  avlSvg.replaceChildren();
  if (!root) {
    const t = document.createElementNS(SVG_NS, "text");
    t.setAttribute("x", "16");
    t.setAttribute("y", "28");
    t.setAttribute("fill", "#64748b");
    t.textContent = "Дерево пустое";
    avlSvg.appendChild(t);
    avlSvg.setAttribute("width", "200");
    avlSvg.setAttribute("height", "48");
    return;
  }

  const counter = { x: 0 };
  layoutInOrder(root, 0, counter);

  const nodes = [];
  function walk(n) {
    if (!n) return;
    walk(n.left);
    nodes.push(n);
    walk(n.right);
  }
  walk(root);

  const nodeW = 76;
  const nodeH = 30;
  const hGap = 14;
  const vGap = 58;
  const pad = 28;
  const maxY = Math.max(...nodes.map((n) => n._y), 0);
  const width = Math.max(240, nodes.length * (nodeW + hGap) + pad * 2);
  const height = (maxY + 1) * vGap + pad * 2 + 10;
  avlSvg.setAttribute("width", String(width));
  avlSvg.setAttribute("height", String(height));
  avlSvg.setAttribute("viewBox", `0 0 ${width} ${height}`);

  const pos = new Map();
  for (const n of nodes) {
    const cx = pad + n._x * (nodeW + hGap) + nodeW / 2;
    const cy = pad + n._y * vGap + nodeH / 2;
    pos.set(n.key, { cx, cy });
  }

  function drawEdge(parentKey, childKey) {
    if (parentKey === null || parentKey === undefined) return;
    const p = pos.get(parentKey);
    const c = pos.get(childKey);
    if (!p || !c) return;
    const line = document.createElementNS(SVG_NS, "line");
    line.setAttribute("x1", String(p.cx));
    line.setAttribute("y1", String(p.cy + nodeH / 2));
    line.setAttribute("x2", String(c.cx));
    line.setAttribute("y2", String(c.cy - nodeH / 2));
    line.setAttribute("stroke", "#94a3b8");
    line.setAttribute("stroke-width", "2");
    avlSvg.appendChild(line);
  }

  function collectEdges(n, parentKey) {
    if (!n) return;
    if (parentKey !== null) {
      drawEdge(parentKey, n.key);
    }
    collectEdges(n.left, n.key);
    collectEdges(n.right, n.key);
  }
  collectEdges(root, null);

  for (const n of nodes) {
    const { cx, cy } = pos.get(n.key);
    const rect = document.createElementNS(SVG_NS, "rect");
    rect.setAttribute("x", String(cx - nodeW / 2));
    rect.setAttribute("y", String(cy - nodeH / 2));
    rect.setAttribute("width", String(nodeW));
    rect.setAttribute("height", String(nodeH));
    rect.setAttribute("rx", "8");
    rect.setAttribute("fill", "#0f172a");
    rect.setAttribute("stroke", "#38bdf8");
    avlSvg.appendChild(rect);

    const text = document.createElementNS(SVG_NS, "text");
    text.setAttribute("x", String(cx));
    text.setAttribute("y", String(cy + 5));
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("fill", "#f8fafc");
    text.setAttribute("font-size", "12");
    text.textContent = n.key;
    avlSvg.appendChild(text);

    const sub = document.createElementNS(SVG_NS, "text");
    sub.setAttribute("x", String(cx));
    sub.setAttribute("y", String(cy + 18));
    sub.setAttribute("text-anchor", "middle");
    sub.setAttribute("fill", "#94a3b8");
    sub.setAttribute("font-size", "9");
    sub.textContent = `h${n.height} · bal ${n.balance}`;
    avlSvg.appendChild(sub);
  }
}

async function get(url, options = {}) {
  const response = await fetch(url);
  let payload = {};
  try {
    payload = await response.json();
  } catch {
    payload = {};
  }
  if (!response.ok) {
    const msg = payload.error || `Ошибка ${response.status}`;
    if (!options.silent) {
      showToast(msg, "error");
    }
    throw new Error(msg);
  }
  return payload;
}

async function post(url, body) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  let payload = {};
  try {
    payload = await response.json();
  } catch {
    payload = {};
  }
  if (!response.ok) {
    const msg = payload.error || `Ошибка ${response.status}`;
    showToast(msg, "error");
    throw new Error(msg);
  }
  return payload;
}

async function httpDelete(url, body) {
  const init = { method: "DELETE" };
  if (body !== undefined) {
    init.headers = { "Content-Type": "application/json" };
    init.body = JSON.stringify(body);
  }
  const response = await fetch(url, init);
  let payload = {};
  try {
    payload = await response.json();
  } catch {
    payload = {};
  }
  if (!response.ok) {
    const msg = payload.error || `Ошибка ${response.status}`;
    showToast(msg, "error");
    throw new Error(msg);
  }
  return payload;
}

function showToast(message, type = "error") {
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.textContent = message;
  toastHost.appendChild(el);
  const ms = type === "error" ? 6500 : 3200;
  setTimeout(() => {
    el.remove();
  }, ms);
}

refreshAll();
