// Įrašyk savo API adresą.
const GET_TASKS_URL = "https://testapi.io/api/laimastriskiene-lgtm/resource/tasklist";
const CREATE_TASK_URL = "https://testapi.io/api/laimastriskiene-lgtm/resource/tasklist";
const DELETE_TASK_URL = "https://testapi.io/api/laimastriskiene-lgtm/resource/tasklist";

// Bendros antraštės: čia gali pridėti Authorization.
const TASKS_HEADERS = { Accept: "application/json" };

async function request(url, options) {
  if (!url.trim()) {
    throw new Error("Įrašyk užduočių API URL.");
  }

  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`Užklausa nepavyko: ${response.status}`);
  }

  // Leidžia DELETE grąžinti tuščią atsakymą, įskaitant 204.
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

function toTask(record) {
  return {
    id: String(record.id),
    title: record.task ?? "",
    status: record.status || "Nepradėta",
    deadline: record.Deadline ?? "",
  };
}

// Užkrauna visus API puslapius ir pritaiko laukus Flowly komponentams.
export async function getTasks(params = {}, url = GET_TASKS_URL) {
  if (!url.trim()) throw new Error("Įrašyk užduočių API URL.");
  const query = new URLSearchParams(params).toString();
  const separator = url.includes("?") ? "&" : "?";
  let nextUrl = query ? `${url}${separator}${query}` : url;
  const tasks = [];
  const visitedUrls = new Set();

  while (nextUrl) {
    if (visitedUrls.has(nextUrl)) throw new Error("API kartoja užduočių puslapį.");
    visitedUrls.add(nextUrl);
    const response = await request(nextUrl, {
      method: "GET",
      headers: { ...TASKS_HEADERS },
      cache: "no-store",
    });
    if (!Array.isArray(response?.data)) {
      throw new Error("Netinkamas užduočių API atsakymas.");
    }
    tasks.push(...response.data.map(toTask));
    nextUrl = response.next_page_url || null;
  }

  return tasks;
}

// Formos laukus pritaiko API, o atsakymą – esamam užduočių sąrašui.
export async function createTask(task, url = CREATE_TASK_URL) {
  const savedTask = await request(url, {
    method: "POST",
    headers: {
      ...TASKS_HEADERS,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      task: task.title,
      status: task.status,
      Deadline: task.deadline,
    }),
  });

  return toTask(savedTask);
}

function taskUrl(taskId) {
  if (taskId === undefined || taskId === null || String(taskId).trim() === "") {
    throw new Error("Trūksta užduoties ID.");
  }
  return `${DELETE_TASK_URL}/${encodeURIComponent(taskId)}`;
}

// Šalina konkretų duomenų bazės įrašą pagal jo ID.
export async function deleteTask(taskId) {
  return request(taskUrl(taskId), {
    method: "DELETE",
    headers: { ...TASKS_HEADERS },
  });
}

// PUT siunčia visus API laukus, todėl pirmiausia gauna jų dabartines reikšmes.
export async function updateTaskTitle(taskId, title) {
  const trimmedTitle = title.trim();
  if (!trimmedTitle) throw new Error("Įveskite užduoties pavadinimą.");

  const url = taskUrl(taskId);
  const currentTask = await request(url, {
    method: "GET",
    headers: { ...TASKS_HEADERS },
  });
  await request(url, {
    method: "PUT",
    headers: {
      ...TASKS_HEADERS,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      task: trimmedTitle,
      status: currentTask.status,
      Deadline: currentTask.Deadline,
    }),
  });
  return trimmedTitle;
}
