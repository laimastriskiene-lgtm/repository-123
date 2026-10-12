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
    userId: record.userId == null ? "" : String(record.userId),
    title: record.task ?? "",
    status: record.status || "Nepradėta",
    deadline: record.Deadline ?? "",
  };
}

// Pirmiausia skaitomi API laukai, kad kurdami neprarastume savininko.
async function getTaskRecords(params = {}, url = GET_TASKS_URL) {
  if (!url.trim()) throw new Error("Įrašyk užduočių API URL.");
  const query = new URLSearchParams(params).toString();
  const separator = url.includes("?") ? "&" : "?";
  let nextUrl = query ? url + separator + query : url;
  const records = [];
  const visitedUrls = new Set();
  while (nextUrl) {
    if (visitedUrls.has(nextUrl)) throw new Error("API kartoja užduočių puslapį.");
    visitedUrls.add(nextUrl);
    const response = await request(nextUrl, {
      method: "GET", headers: { ...TASKS_HEADERS }, cache: "no-store",
    });
    if (!Array.isArray(response?.data)) throw new Error("Netinkamas užduočių API atsakymas.");
    records.push(...response.data);
    nextUrl = response.next_page_url || null;
  }
  return records;
}

function checkOwnerField(records) {
  // Tuščia lentelė neatskleidžia schemos: tuomet savininkas tikrinamas po POST.
  if (records.length && !records.some((record) => Object.hasOwn(record, "userId"))) {
    throw new Error("TestAPI tasklist lentelėje nėra userId lauko. Pridėkite tekstinį userId lauką resurso nustatymuose. Nauja užduotis nebuvo sukurta.");
  }
}

export async function getTasks(userId, params = {}, url = GET_TASKS_URL) {
  const ownerId = requireUserId(userId);
  const records = await getTaskRecords(params, url);
  return records.filter((record) => record.userId != null && String(record.userId) === ownerId).map(toTask);
}

// Formos laukus pritaiko API, o atsakymą – esamam užduočių sąrašui.
export async function createTask(task, userId, url = CREATE_TASK_URL) {
  const ownerId = requireUserId(userId);
  checkOwnerField(await getTaskRecords({}, url));
  const savedTask = await request(url, {
    method: "POST",
    headers: {
      ...TASKS_HEADERS,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId: ownerId,
      task: task.title,
      status: task.status,
      Deadline: task.deadline,
    }),
  });

  if (savedTask?.id == null) {
    throw new Error("API negrąžino sukurtos užduoties ID. Prieš kartodami patikrinkite TestAPI lentelę.");
  }
  const persistedTask = await request(url.replace(/\/$/, "") + "/" + encodeURIComponent(savedTask.id), {
    method: "GET", headers: { ...TASKS_HEADERS }, cache: "no-store",
  });
  if (persistedTask?.userId == null || String(persistedTask.userId) !== ownerId) {
    throw new Error("API sukūrė įrašą, bet neišsaugojo teisingo userId. Patikrinkite tasklist userId lauką. Prieš kartodami patikrinkite sukurtą įrašą TestAPI lentelėje.");
  }
  assertOwner(persistedTask, ownerId);
  return toTask(persistedTask);
}

function taskUrl(taskId) {
  if (taskId === undefined || taskId === null || String(taskId).trim() === "") {
    throw new Error("Trūksta užduoties ID.");
  }
  return `${DELETE_TASK_URL}/${encodeURIComponent(taskId)}`;
}

// Šalina konkretų duomenų bazės įrašą pagal jo ID.
export async function deleteTask(taskId, userId) {
  const currentTask = await request(taskUrl(taskId), { method: "GET", headers: { ...TASKS_HEADERS }, cache: "no-store" });
  assertOwner(currentTask, userId);
  return request(taskUrl(taskId), {
    method: "DELETE",
    headers: { ...TASKS_HEADERS },
  });
}

// PUT siunčia visus API laukus, todėl pirmiausia gauna jų dabartines reikšmes.
export async function updateTaskTitle(taskId, title, userId) {
  requireUserId(userId);
  const trimmedTitle = title.trim();
  if (!trimmedTitle) throw new Error("Įveskite užduoties pavadinimą.");

  const url = taskUrl(taskId);
  const currentTask = await request(url, {
    method: "GET",
    headers: { ...TASKS_HEADERS },
  });
  assertOwner(currentTask, userId);
  await request(url, {
    method: "PUT",
    headers: {
      ...TASKS_HEADERS,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId: String(currentTask.userId),
      task: trimmedTitle,
      status: currentTask.status,
      Deadline: currentTask.Deadline,
    }),
  });
  return trimmedTitle;
}

function requireUserId(userId) {
  if (userId == null || !String(userId).trim()) throw new Error("Trūksta prisijungusio vartotojo ID.");
  return String(userId);
}

function assertOwner(record, userId) {
  const ownerId = requireUserId(userId);
  if (record?.userId == null || String(record.userId) !== ownerId) {
    throw new Error("Užduotis nepriskirta šiai paskyrai. Patikrinkite tasklist userId lauką.");
  }
}
