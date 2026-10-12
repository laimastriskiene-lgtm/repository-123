const AUTH_URL = "https://testapi.io/api/laimastriskiene-lgtm/resource/auth";
const SESSION_KEY = "flowly.session";

async function request(url, options = {}) {
  const response = await fetch(url, { ...options, headers: { Accept: "application/json", ...options.headers }, cache: "no-store" });
  if (!response.ok) throw new Error(`Auth API klaida: ${response.status}`);
  return response.json();
}

async function getUsers() {
  const users = [];
  const visited = new Set();
  let url = AUTH_URL;
  while (url) {
    if (visited.has(url)) throw new Error("API kartoja vartotojų puslapį.");
    visited.add(url);
    const result = await request(url);
    if (!Array.isArray(result?.data)) throw new Error("Netinkamas auth API atsakymas.");
    users.push(...result.data);
    url = result.next_page_url || null;
  }
  return users;
}

function toUser(record) {
  if (record?.id == null || typeof record.username !== "string" || !record.username.trim()) throw new Error("Netinkami paskyros duomenys.");
  return { id: String(record.id), username: record.username, name: record.username };
}

function toHex(bytes) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function hashPassword(password, salt) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt: new TextEncoder().encode(salt), iterations: 210000, hash: "SHA-256" }, key, 256);
  return `pbkdf2$${salt}$${toHex(new Uint8Array(bits))}`;
}

export async function registerUser(username, password) {
  const name = username.trim();
  if (!name) throw new Error("Įveskite vartotojo vardą.");
  if (password.length < 8) throw new Error("Slaptažodį turi sudaryti bent 8 simboliai.");
  const users = await getUsers();
  if (users.some((user) => user.username?.toLowerCase() === name.toLowerCase())) throw new Error("Šis vartotojo vardas jau naudojamas.");
  const salt = toHex(crypto.getRandomValues(new Uint8Array(16)));
  return toUser(await request(AUTH_URL, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: name, password: await hashPassword(password, salt) }),
  }));
}

export async function loginUser(username, password) {
  const users = await getUsers();
  const record = users.find((user) => user.username?.toLowerCase() === username.trim().toLowerCase());
  const encoded = typeof record?.password === "string" ? record.password : "";
  const [, salt] = encoded.split("$");
  if (!/^pbkdf2\$[a-f0-9]{32}\$[a-f0-9]{64}$/.test(encoded) || await hashPassword(password, salt) !== encoded) throw new Error("Neteisingas vartotojo vardas arba slaptažodis.");
  const user = toUser(record);
  localStorage.setItem(SESSION_KEY, JSON.stringify({ id: user.id }));
  return user;
}

export async function restoreSession() {
  const saved = localStorage.getItem(SESSION_KEY);
  if (!saved) return null;
  let session;
  try {
    session = JSON.parse(saved);
    if (typeof session?.id !== "string" || !session.id) throw new Error();
  } catch {
    logoutUser();
    return null;
  }
  // Viešas CRUD API neturi serverio sesijų: ID atkuria tik demonstracinį UI.
  const response = await fetch(`${AUTH_URL}/${encodeURIComponent(session.id)}`, { headers: { Accept: "application/json" }, cache: "no-store" });
  if (response.status === 404) {
    logoutUser();
    return null;
  }
  if (!response.ok) throw new Error(`Auth API klaida: ${response.status}`);
  const record = await response.json();
  const user = toUser(record);
  if (user.id !== session.id || !/^pbkdf2\$[a-f0-9]{32}\$[a-f0-9]{64}$/.test(record.password)) {
    logoutUser();
    return null;
  }
  return user;
}

export function logoutUser() {
  localStorage.removeItem(SESSION_KEY);
}
