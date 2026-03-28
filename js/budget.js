const STORAGE_KEY = "family-budget-v1";

const TYPE_LABELS = {
  income: "Доход",
  expense: "Расход",
};

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    let parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    let changed = false;
    parsed = parsed.map((item) => {
      if (item && !item.id) {
        changed = true;
        return { ...item, id: crypto.randomUUID() };
      }
      return item;
    });
    if (changed) localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    return parsed;
  } catch {
    return [];
  }
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

let data = loadData();

function initForm() {
  const dateEl = document.getElementById("date");
  if (dateEl && !dateEl.value) dateEl.value = todayISO();
}

function addEntry() {
  const type = document.getElementById("type").value;
  const desc = document.getElementById("description").value.trim();
  const amountRaw = document.getElementById("amount").value;
  const amount = parseFloat(amountRaw.replace(",", "."));
  const date = document.getElementById("date").value;

  if (!desc || Number.isNaN(amount) || amount <= 0) {
    alert("Укажите описание и положительную сумму.");
    return;
  }
  if (!date) {
    alert("Выберите дату.");
    return;
  }

  data.push({
    id: crypto.randomUUID(),
    type,
    desc,
    amount,
    date,
  });
  saveData(data);
  render();

  document.getElementById("description").value = "";
  document.getElementById("amount").value = "";
}

function removeEntry(id) {
  data = data.filter((item) => item.id !== id);
  saveData(data);
  render();
}

function clearAll() {
  if (!data.length) return;
  if (!confirm("Удалить все записи? Это действие нельзя отменить.")) return;
  data = [];
  saveData(data);
  render();
}

function render() {
  const list = document.getElementById("list");
  if (!list) return;

  list.innerHTML = "";
  let income = 0;
  let expense = 0;

  const sorted = [...data].sort((a, b) => b.date.localeCompare(a.date));

  sorted.forEach((item) => {
    if (item.type === "income") income += item.amount;
    else expense += item.amount;

    const id = item.id;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(item.date)}</td>
      <td>${escapeHtml(TYPE_LABELS[item.type] || item.type)}</td>
      <td>${escapeHtml(item.desc)}</td>
      <td>${formatMoney(item.amount)}</td>
      <td><button type="button" class="btn btn--danger btn--small" data-remove="${id}">Удалить</button></td>
    `;
    list.appendChild(tr);
  });

  list.querySelectorAll("[data-remove]").forEach((btn) => {
    btn.addEventListener("click", () => removeEntry(btn.getAttribute("data-remove")));
  });

  if (!sorted.length) {
    list.innerHTML =
      '<tr><td colspan="5" class="empty-hint">Пока нет записей — добавьте доход или расход выше.</td></tr>';
  }

  const incomeEl = document.getElementById("income");
  const expenseEl = document.getElementById("expense");
  const balanceEl = document.getElementById("balance");
  if (incomeEl) incomeEl.textContent = formatMoney(income);
  if (expenseEl) expenseEl.textContent = formatMoney(expense);
  if (balanceEl) balanceEl.textContent = formatMoney(income - expense);
}

function formatMoney(n) {
  return new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n);
}

function escapeHtml(s) {
  const div = document.createElement("div");
  div.textContent = s;
  return div.innerHTML;
}

window.addEntry = addEntry;
window.clearAll = clearAll;

initForm();
render();
