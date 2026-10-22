import { readFileSync } from "node:fs";
import { before, after, beforeEach, test } from "node:test";
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} from "@firebase/rules-unit-testing";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  runTransaction,
  Timestamp,
  serverTimestamp,
} from "firebase/firestore";
let env;
const user = (id = "member") =>
  env
    .authenticatedContext(id, {
      email: `${id}@club.test`,
      email_verified: true,
    })
    .firestore();
const future = () => Timestamp.fromMillis(Date.now() + 3600000);
before(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-cg-cars",
    firestore: {
      rules: readFileSync("firestore.rules", "utf8"),
      host: "127.0.0.1",
      port: 8080,
    },
  });
});
after(async () => {
  await env?.cleanup();
});
beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (c) => {
    const db = c.firestore();
    await setDoc(doc(db, "users/member"), {
      displayName: "Piloto",
      email: "member@club.test",
      role: "member",
      rpmPoints: 0,
      badges: [],
    });
    await setDoc(doc(db, "users/other"), {
      displayName: "Otro",
      role: "member",
      rpmPoints: 0,
      badges: [],
    });
    await setDoc(doc(db, "access/owner@club.test"), { role: "camilo_owner" });
    await setDoc(doc(db, "trivias/t"), {
      question: "WHP?",
      prize: "Hoodie",
      status: "active",
      expiresAt: future(),
    });
    await setDoc(doc(db, "trivias/t/private/answer"), { answer: "500" });
    await setDoc(doc(db, "events/e"), {
      title: "Meet",
      mode: "limited",
      date: future(),
      capacity: 1,
      confirmedCount: 0,
      raffleDrawn: false,
    });
    await setDoc(doc(db, "marketplace/m"), {
      title: "Hoodie",
      category: "merch",
      price: 500,
      stock: { M: 1 },
      active: true,
    });
  });
});
test("un miembro no se puede promover ni regalar RPM", async () => {
  const db = user();
  await assertFails(
    updateDoc(doc(db, "users/member"), { role: "camilo_owner" }),
  );
  await assertFails(updateDoc(doc(db, "users/member"), { rpmPoints: 9999 }));
  await assertFails(
    setDoc(doc(db, "access/member@club.test"), { role: "camilo_owner" }),
  );
});
test("respuesta correcta privada para miembros", async () => {
  await assertFails(getDoc(doc(user(), "trivias/t/private/answer")));
  await assertSucceeds(getDoc(doc(user("owner"), "trivias/t/private/answer")));
});
test("el intento es único y usa reloj del servidor", async () => {
  const db = user();
  const path = doc(db, "trivias/t/submissions/member");
  const data = {
    uid: "member",
    displayName: "Piloto",
    answer: "500",
    submittedAt: serverTimestamp(),
    awarded: false,
    delivered: false,
  };
  await assertSucceeds(setDoc(path, data));
  await assertFails(setDoc(path, { ...data, answer: "600" }));
});
test("una trivia vencida no acepta respuestas", async () => {
  await env.withSecurityRulesDisabled((c) =>
    updateDoc(doc(c.firestore(), "trivias/t"), {
      expiresAt: Timestamp.fromMillis(0),
    }),
  );
  await assertFails(
    setDoc(doc(user(), "trivias/t/submissions/member"), {
      uid: "member",
      displayName: "Piloto",
      answer: "500",
      submittedAt: serverTimestamp(),
      awarded: false,
      delivered: false,
    }),
  );
});
test("un miembro no puede editar el evento ni contadores aislados", async () => {
  const db = user();
  await assertFails(updateDoc(doc(db, "events/e"), { title: "Hack" }));
  await assertFails(updateDoc(doc(db, "events/e"), { confirmedCount: 1 }));
});
async function register(db, uid) {
  return runTransaction(db, async (tx) => {
    const er = doc(db, "events/e");
    const event = await tx.get(er);
    tx.update(er, { confirmedCount: event.data().confirmedCount + 1 });
    tx.set(doc(db, `events/e/registrations/${uid}`), {
      uid,
      displayName: "Piloto",
      token: "secure-token",
      status: "confirmed",
      checkedIn: false,
      createdAt: serverTimestamp(),
    });
  });
}
test("registro atómico respeta el último lugar", async () => {
  await assertSucceeds(register(user(), "member"));
  await assertFails(register(user("other"), "other"));
});
test("QR ajeno es privado y check-in no se puede autofirmar", async () => {
  await register(user(), "member");
  await assertFails(
    getDoc(doc(user("other"), "events/e/registrations/member")),
  );
  await assertFails(
    updateDoc(doc(user(), "events/e/registrations/member"), {
      checkedIn: true,
      checkedInAt: serverTimestamp(),
    }),
  );
});
test("no se puede reducir inventario sin orden", async () => {
  await assertFails(
    updateDoc(doc(user(), "marketplace/m"), {
      stock: { M: 0 },
      lastOrderId: "fake",
    }),
  );
});
test("reserva atómica conserva precio y stock", async () => {
  const db = user();
  await assertSucceeds(
    runTransaction(db, async (tx) => {
      const ir = doc(db, "marketplace/m");
      await tx.get(ir);
      tx.update(ir, { stock: { M: 0 }, lastOrderId: "o" });
      tx.set(doc(db, "orders/o"), {
        uid: "member",
        itemId: "m",
        title: "Hoodie",
        size: "M",
        price: 500,
        status: "reserved",
        createdAt: serverTimestamp(),
      });
    }),
  );
  await assertFails(updateDoc(doc(db, "orders/o"), { status: "paid" }));
});
test("soporte y tokens son privados", async () => {
  await assertSucceeds(
    setDoc(doc(user(), "supportTickets/t"), {
      uid: "member",
      displayName: "Piloto",
      question: "Ayuda",
      answer: "",
      status: "open",
      createdAt: serverTimestamp(),
    }),
  );
  await assertFails(getDoc(doc(user("other"), "supportTickets/t")));
  await assertFails(
    setDoc(doc(user("other"), "users/member/pushTokens/token"), {
      token: "token",
      updatedAt: serverTimestamp(),
    }),
  );
});
test("alta real de miembro y propietario permite solo el rol autorizado", async () => {
  const base = {
    displayName: "Nuevo",
    photoURL: "",
    role: "member",
    rpmPoints: 0,
    badges: ["Fundador / Early Adopter"],
    createdAt: serverTimestamp(),
  };
  await assertSucceeds(setDoc(doc(user("new"), "users/new"), base));
  await assertFails(
    setDoc(doc(user("fake"), "users/fake"), { ...base, role: "camilo_owner" }),
  );
  await assertSucceeds(
    setDoc(doc(user("owner"), "users/owner"), {
      ...base,
      role: "camilo_owner",
    }),
  );
});
test("check-in staff suma 500 RPM una sola vez", async () => {
  await register(user(), "member");
  const db = user("owner");
  const check = () =>
    runTransaction(db, async (tx) => {
      const rr = doc(db, "events/e/registrations/member"),
        ur = doc(db, "users/member");
      const r = await tx.get(rr),
        u = await tx.get(ur);
      tx.update(rr, { checkedIn: true, checkedInAt: serverTimestamp() });
      tx.update(ur, {
        rpmPoints: u.data().rpmPoints + 500,
        badges: ["Primer Meet Check-In"],
      });
    });
  await assertSucceeds(check());
  await assertFails(check());
});
test("premio correcto cerrado acredita 1000 RPM", async () => {
  const member = user();
  await setDoc(doc(member, "trivias/t/submissions/member"), {
    uid: "member",
    displayName: "Piloto",
    answer: "500",
    submittedAt: serverTimestamp(),
    awarded: false,
    delivered: false,
  });
  const db = user("owner");
  await assertSucceeds(updateDoc(doc(db, "trivias/t"), { status: "closed" }));
  await assertSucceeds(
    runTransaction(db, async (tx) => {
      const ur = doc(db, "users/member"),
        sr = doc(db, "trivias/t/submissions/member");
      await tx.get(ur);
      await tx.get(sr);
      tx.update(sr, { awarded: true });
      tx.update(ur, { rpmPoints: 1000, badges: ["Ganador de Trivia Flash"] });
    }),
  );
});
test("el registro de Spotters bloquea el número doce", async () => {
  const db = user("owner");
  await assertSucceeds(
    runTransaction(db, async (tx) => {
      const roster = doc(db, "settings/staff");
      await tx.get(roster);
      tx.set(roster, { emails: ["mod@club.test"] });
      tx.set(doc(db, "access/mod@club.test"), { role: "spotter_mod" });
    }),
  );
  await assertFails(
    setDoc(doc(db, "settings/staff"), {
      emails: Array.from({ length: 12 }, (_, i) => `m${i}@club.test`),
    }),
  );
  await assertFails(
    setDoc(doc(user("mod"), "access/other@club.test"), { role: "spotter_mod" }),
  );
});
test("un sorteo bloqueado no acepta registros tardíos", async () => {
  await env.withSecurityRulesDisabled((c) =>
    updateDoc(doc(c.firestore(), "events/e"), {
      mode: "raffle",
      raffleLocked: true,
    }),
  );
  await assertFails(
    setDoc(doc(user(), "events/e/registrations/member"), {
      uid: "member",
      displayName: "Piloto",
      token: "secure-token",
      status: "waitlist",
      checkedIn: false,
      createdAt: serverTimestamp(),
    }),
  );
  await assertSucceeds(
    updateDoc(doc(user("owner"), "events/e"), { raffleLocked: false }),
  );
  await assertSucceeds(
    setDoc(doc(user(), "events/e/registrations/member"), {
      uid: "member",
      displayName: "Piloto",
      token: "secure-token",
      status: "waitlist",
      checkedIn: false,
      createdAt: serverTimestamp(),
    }),
  );
});
test('el correo maestro requiere un token de Google verificado', async () => {
  const base = { displayName: 'Camilo', photoURL: '', role: 'camilo_owner', rpmPoints: 0, badges: ['Fundador / Early Adopter'], createdAt: serverTimestamp() };
  const verified = env.authenticatedContext('master', { email: 'camiloguerra2010@gmail.com', email_verified: true }).firestore();
  const unverified = env.authenticatedContext('forged', { email: 'camiloguerra2010@gmail.com', email_verified: false }).firestore();
  await assertSucceeds(setDoc(doc(verified, 'users/master'), base));
  await assertFails(setDoc(doc(unverified, 'users/forged'), base));
});
