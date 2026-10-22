import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
  runTransaction,
  writeBatch,
  onSnapshot,
  type DocumentData,
} from "firebase/firestore";
import { signInWithPopup, signOut, type User } from "firebase/auth";
import { app, auth, db, googleProvider, ADMIN_EMAILS } from "./config";
import {
  normalize,
  type Profile,
  type Role,
  type Meet,
  type Item,
  type Submission,
} from "../types";
const database = () => {
  if (!db) throw new Error("Configura Firebase para conectar el garage.");
  return db;
};
export const ref = (path: string) => doc(database(), path);
export async function list<T>(
  path: string,
  sort = "createdAt",
  count = 30,
): Promise<T[]> {
  const result = await getDocs(
    query(collection(database(), path), orderBy(sort, "desc"), limit(count)),
  );
  return result.docs.map((d) => ({ ...d.data(), id: d.id }) as T);
}
export async function read<T>(path: string): Promise<T | null> {
  const d = await getDoc(ref(path));
  return d.exists() ? ({ ...d.data(), id: d.id } as T) : null;
}
export async function googleLogin() {
  if (!auth) throw new Error("Primero configura Firebase.");
  return signInWithPopup(auth, googleProvider);
}
export const logout = () => auth && signOut(auth);
export async function loadProfile(user: User): Promise<Profile> {
  const access = await read<{ role: Role }>(
    `access/${user.email?.toLowerCase()}`,
  );
  const role = ADMIN_EMAILS.includes(user.email?.toLowerCase() || "") && user.emailVerified
    ? "camilo_owner" : access?.role ?? "member";
  const existing = await read<Profile>(`users/${user.uid}`);
  if (existing) return { ...existing, role, email: user.email || "" };
  const profile = {
    displayName: user.displayName || "Piloto",
    photoURL: user.photoURL || "",
    role,
    rpmPoints: 0,
    badges: ["Fundador / Early Adopter"],
    createdAt: serverTimestamp(),
  };
  await setDoc(ref(`users/${user.uid}`), profile);
  return { ...profile, email: user.email || "", id: user.uid };
}
export async function create(path: string, data: DocumentData) {
  const target = doc(collection(database(), path));
  await setDoc(target, { ...data, createdAt: serverTimestamp() });
  return target.id;
}
export const patch = (path: string, data: DocumentData) =>
  updateDoc(ref(path), data);
export const remove = (path: string) => deleteDoc(ref(path));
export function watchItem(
  id: string,
  onValue: (item: Item | null) => void,
  onError: (message: string) => void,
) {
  return onSnapshot(
    ref(`marketplace/${id}`),
    (snap) =>
      onValue(snap.exists() ? ({ ...snap.data(), id: snap.id } as Item) : null),
    (e) => onError(e.message),
  );
}
export async function createTrivia(
  question: string,
  answer: string,
  prize: string,
  hours: number,
) {
  const target = doc(collection(database(), "trivias"));
  const batch = writeBatch(database());
  batch.set(target, {
    question,
    prize,
    status: "active",
    expiresAt: Timestamp.fromMillis(Date.now() + hours * 3600000),
    createdAt: serverTimestamp(),
  });
  batch.set(doc(target, "private/answer"), { answer: normalize(answer) });
  await batch.commit();
}
export async function submitAnswer(id: string, answer: string, p: Profile) {
  await setDoc(ref(`trivias/${id}/submissions/${p.id}`), {
    uid: p.id,
    displayName: p.displayName,
    answer: normalize(answer),
    submittedAt: serverTimestamp(),
    awarded: false,
    delivered: false,
  });
}
export async function winners(id: string) {
  const secret = await read<{ answer: string }>(`trivias/${id}/private/answer`);
  const q = query(
    collection(database(), `trivias/${id}/submissions`),
    where("answer", "==", secret?.answer || ""),
    orderBy("submittedAt", "asc"),
    limit(3),
  );
  return (await getDocs(q)).docs.map(
    (d) => ({ ...d.data(), id: d.id }) as Submission,
  );
}
export async function awardTrivia(id: string, submission: Submission) {
  await runTransaction(database(), async (tx) => {
    const sr = ref(`trivias/${id}/submissions/${submission.uid}`),
      ur = ref(`users/${submission.uid}`);
    const [s, u] = await Promise.all([tx.get(sr), tx.get(ur)]);
    if (s.data()?.awarded)
      throw new Error("Los RPM de esta respuesta ya fueron acreditados.");
    if (!u.exists()) throw new Error("Usuario inexistente.");
    tx.update(sr, { awarded: true });
    tx.update(ur, {
      rpmPoints: u.data().rpmPoints + 1000,
      badges: [
        ...new Set([...(u.data().badges || []), "Ganador de Trivia Flash"]),
      ],
    });
  });
}
export async function register(meet: Meet, p: Profile) {
  const token = crypto.randomUUID();
  await runTransaction(database(), async (tx) => {
    const er = ref(`events/${meet.id}`),
      rr = ref(`events/${meet.id}/registrations/${p.id}`);
    const [e, r] = await Promise.all([tx.get(er), tx.get(rr)]);
    if (r.exists()) throw new Error("Ya tienes una inscripción.");
    const data = e.data() as Meet;
    if (!data || data.date.toMillis() <= Date.now())
      throw new Error("El registro está cerrado.");
    if (data.mode === "raffle" && (data.raffleDrawn || data.raffleLocked))
      throw new Error("El sorteo ya fue ejecutado o está en proceso.");
    if (data.mode === "limited" && data.confirmedCount >= data.capacity)
      throw new Error("Cupo agotado.");
    const status = data.mode === "raffle" ? "waitlist" : "confirmed";
    tx.set(rr, {
      uid: p.id,
      displayName: p.displayName,
      token,
      status,
      checkedIn: false,
      createdAt: serverTimestamp(),
    });
    if (status === "confirmed")
      tx.update(er, { confirmedCount: data.confirmedCount + 1 });
  });
}
function randomIndex(max: number) {
  const bound = Math.floor(4294967296 / max) * max;
  const a = new Uint32Array(1);
  do {
    crypto.getRandomValues(a);
  } while (a[0] >= bound);
  return a[0] % max;
}
export async function raffle(eventId: string, count: number) {
  const er = ref(`events/${eventId}`);
  await runTransaction(database(), async (tx) => {
    const event = await tx.get(er);
    if (!event.exists() || event.data().mode !== "raffle")
      throw new Error("Evento sin sorteo.");
    if (event.data().raffleDrawn || event.data().raffleLocked)
      throw new Error("Sorteo ejecutado o en proceso.");
    tx.update(er, { raffleLocked: true });
  });
  try {
    const rows = (
      await getDocs(
        query(
          collection(database(), `events/${eventId}/registrations`),
          where("status", "==", "waitlist"),
          limit(401),
        ),
      )
    ).docs;
    if (rows.length > 400)
      throw new Error(
        "Más de 400 inscritos: requiere sorteo auditado externo para conservar una operación atómica.",
      );
    if (!Number.isInteger(count) || count < 1 || count > rows.length)
      throw new Error(`Elige entre 1 y ${rows.length} ganadores.`);
    const weights = new Map<string, number>();
    for (let start = 0; start < rows.length; start += 20) {
      await Promise.all(
        rows.slice(start, start + 20).map(async (row) => {
          const profile = await read<Profile>(`users/${row.id}`);
          weights.set(row.id, profile && profile.rpmPoints >= 8000 ? 2 : 1);
        }),
      );
    }
    const pool = [...rows];
    const selected: typeof rows = [];
    while (selected.length < count) {
      let ticket = randomIndex(
        pool.reduce((sum, row) => sum + weights.get(row.id)!, 0),
      );
      const index = pool.findIndex((row) => {
        ticket -= weights.get(row.id)!;
        return ticket < 0;
      });
      selected.push(pool.splice(index, 1)[0]);
    }
    await runTransaction(database(), async (tx) => {
      const event = await tx.get(er);
      if (event.data()?.raffleDrawn || !event.data()?.raffleLocked)
        throw new Error("Sorteo ejecutado o desbloqueado por el propietario.");
      tx.update(er, {
        raffleDrawn: true,
        raffleLocked: false,
        confirmedCount: count,
        drawnAt: serverTimestamp(),
      });
      selected.forEach((r) => tx.update(r.ref, { status: "confirmed" }));
    });
  } catch (error) {
    await runTransaction(database(), async (tx) => {
      const event = await tx.get(er);
      if (event.exists() && !event.data().raffleDrawn)
        tx.update(er, { raffleLocked: false });
    }).catch(() => {});
    throw error;
  }
}
export async function checkIn(raw: string) {
  let payload: { eventId: string; uid: string; token: string };
  try {
    payload = JSON.parse(raw);
  } catch {
    throw new Error("Código QR inválido.");
  }
  if (
    ![payload.eventId, payload.uid, payload.token].every(
      (x) => typeof x === "string" && /^[\w-]{1,128}$/.test(x),
    )
  )
    throw new Error("Pase inválido.");
  return runTransaction(database(), async (tx) => {
    const rr = ref(`events/${payload.eventId}/registrations/${payload.uid}`),
      ur = ref(`users/${payload.uid}`);
    const [r, u] = await Promise.all([tx.get(rr), tx.get(ur)]);
    const data = r.data();
    if (
      !data ||
      !u.exists() ||
      data.token !== payload.token ||
      data.status !== "confirmed"
    )
      throw new Error("Pase no autorizado.");
    if (data.checkedIn) throw new Error("QR YA ESCANEADO PREVIAMENTE");
    tx.update(rr, { checkedIn: true, checkedInAt: serverTimestamp() });
    tx.update(ur, {
      rpmPoints: u.data()!.rpmPoints + 500,
      badges: [
        ...new Set([...(u.data()!.badges || []), "Primer Meet Check-In"]),
      ],
    });
    return data.displayName as string;
  });
}
export async function order(item: Item, size: string, p: Profile) {
  const target = doc(collection(database(), "orders"));
  await runTransaction(database(), async (tx) => {
    const ir = ref(`marketplace/${item.id}`);
    const snap = await tx.get(ir);
    const product = snap.data() as Item;
    if (!product?.active || (product.stock[size] || 0) < 1)
      throw new Error("Talla agotada. Actualiza el showroom.");
    tx.update(ir, {
      stock: { ...product.stock, [size]: product.stock[size] - 1 },
      lastOrderId: target.id,
    });
    tx.set(target, {
      uid: p.id,
      itemId: item.id,
      title: product.title,
      size,
      price: product.price,
      status: "reserved",
      createdAt: serverTimestamp(),
    });
  });
  return target.id;
}
export async function myOrders(uid: string) {
  const docs = await getDocs(
    query(collection(database(), "orders"), where("uid", "==", uid), limit(30)),
  );
  return docs.docs.map((d) => ({ ...d.data(), id: d.id })) as {
    id: string;
    title: string;
    status: string;
    size: string;
  }[];
}
export async function reactTo(postId: string, uid: string, emoji: string) {
  await setDoc(ref(`earlyAccess/${postId}/reactions/${uid}`), { uid, emoji });
}
export async function tickets(p: Profile) {
  const q =
    p.role === "member"
      ? query(
          collection(database(), "supportTickets"),
          where("uid", "==", p.id),
          limit(30),
        )
      : query(
          collection(database(), "supportTickets"),
          orderBy("createdAt", "desc"),
          limit(30),
        );
  return (await getDocs(q)).docs.map((d) => ({ ...d.data(), id: d.id }));
}
export async function setAccess(email: string, role: Role | "remove") {
  const address = email.trim().toLowerCase();
  if (!/^[^/@\s]+@[^/@\s]+\.[^/@\s]+$/.test(address))
    throw new Error("Correo inválido.");
  await runTransaction(database(), async (tx) => {
    const rosterRef = ref("settings/staff");
    const roster = await tx.get(rosterRef);
    const emails = ((roster.data()?.emails || []) as string[]).filter(
      (e) => e !== address,
    );
    if (role === "spotter_mod") emails.push(address);
    if (emails.length > 11)
      throw new Error(
        "El equipo ya tiene 11 Spotters. Revoca un acceso antes de agregar otro.",
      );
    tx.set(rosterRef, { emails });
    if (role === "remove") tx.delete(ref(`access/${address}`));
    else tx.set(ref(`access/${address}`), { role });
  });
}
export async function enablePush(uid: string) {
  const { getMessaging, getToken, isSupported } = await import(
    "firebase/messaging"
  );
  if (!app || !(await isSupported()))
    throw new Error(
      "Push no disponible. En iPhone instala la app en Inicio y ábrela desde allí.",
    );
  const key = import.meta.env.VITE_FIREBASE_VAPID_KEY;
  if (!key) throw new Error("Falta configurar la clave pública VAPID.");
  if ((await Notification.requestPermission()) !== "granted")
    throw new Error("Permiso de notificaciones no concedido.");
  const registration = await navigator.serviceWorker.register(
    `${import.meta.env.BASE_URL}sw.js`,
  );
  await navigator.serviceWorker.ready;
  const token = await getToken(getMessaging(app), {
    vapidKey: key,
    serviceWorkerRegistration: registration,
  });
  await setDoc(ref(`users/${uid}/pushTokens/${token}`), {
    token,
    updatedAt: serverTimestamp(),
  });
}
export { Timestamp };

export async function settleOrder(
  id: string,
  status: "paid" | "fulfilled" | "cancelled",
) {
  await runTransaction(database(), async (tx) => {
    const or = ref(`orders/${id}`);
    const snap = await tx.get(or);
    const data = snap.data();
    if (!data) throw new Error("Orden inexistente.");
    if (data.status === "cancelled" || data.status === "fulfilled")
      throw new Error("Esta orden ya está cerrada.");
    if (status === "paid" && data.status !== "reserved")
      throw new Error("El pago ya está registrado.");
    if (status === "fulfilled" && data.status !== "paid")
      throw new Error("Confirma el pago antes de entregar.");
    const ir = ref(`marketplace/${data.itemId}`),
      ur = ref(`users/${data.uid}`);
    const [item, user] = await Promise.all([tx.get(ir), tx.get(ur)]);
    if (status === "cancelled") {
      if (data.status !== "reserved")
        throw new Error(
          "Una orden pagada necesita conciliar el reembolso antes de cancelarse.",
        );
      if (!item.exists())
        throw new Error("Producto eliminado. Revisa la orden manualmente.");
      tx.update(ir, {
        stock: {
          ...item.data().stock,
          [data.size]: (item.data().stock[data.size] || 0) + 1,
        },
      });
    }
    if (status === "fulfilled") {
      if (!user.exists()) throw new Error("Usuario inexistente.");
      tx.update(ur, {
        badges: [
          ...new Set([...(user.data().badges || []), "Coleccionista de Merch"]),
        ],
      });
    }
    tx.update(or, { status });
  });
}
