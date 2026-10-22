import React, { useEffect, useState, type FormEvent } from "react";
import { createRoot } from "react-dom/client";
import {
  HashRouter,
  Routes,
  Route,
  Link,
  NavLink,
  Navigate,
  useLocation,
} from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import {
  ArrowUpRight,
  ArrowRight,
  Home,
  CalendarDays,
  CalendarPlus,
  ShoppingBag,
  UserRound,
  Gauge,
  ShieldCheck,
  QrCode,
  X,
  LogOut,
  Bell,
  Flame,
  Search,
  Play,
  ChevronRight,
  Flag,
  MapPin,
  Trophy,
  ScanLine,
  MessageCircle,
  Plus,
  CarFront,
  Wrench,
  Crown,
  Sparkles,
  Zap,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { serverTimestamp } from "firebase/firestore";
import { auth, configured, WHATSAPP_NUMBER } from "./firebase/config";
import * as api from "./firebase/api";
import {
  type Profile,
  type Trivia,
  type Meet,
  type Registration,
  type Post,
  type Item,
  type Submission,
  type Comment,
  type Ticket,
  type Role,
  money,
  level,
  safeUrl,
} from "./types";
import "./style.css";
import { Session, useSession } from "./session";
import { useLoad } from "./useLoad";
import { AsyncState, Action, Modal, Timer, Heading, SyncButton } from "./components/ui";
const HERO =
  "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1000&q=85";
const errorText = (e: unknown) =>
  e instanceof Error ? e.message : "No se pudo completar la operación.";
function App() {
  const [profile, setProfile] = useState<Profile | null>(null),
    [loading, setLoading] = useState(configured),
    [message, setMessage] = useState(""),
    [authError, setAuthError] = useState("");
  const refresh = async () => {
    if (auth?.currentUser) setProfile(await api.loadProfile(auth.currentUser));
  };
  useEffect(() => {
    if (!auth) return;
    return onAuthStateChanged(auth, (user) => {
      setLoading(true);
      setAuthError("");
      if (user)
        api
          .loadProfile(user)
          .then(setProfile)
          .catch((e) => {
            setProfile(null);
            setAuthError(errorText(e));
          })
          .finally(() => setLoading(false));
      else {
        setProfile(null);
        setLoading(false);
      }
    });
  }, []);
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(""), 6500);
    return () => clearTimeout(t);
  }, [message]);
  return (
    <Session.Provider value={{ profile, refresh, notify: setMessage }}>
      <HashRouter>
        <div className="phone">
          {loading ? (
            <div className="splash">
              <LoadingSpinner />
              <p>ABRIENDO EL GARAGE</p>
            </div>
          ) : (
            <>
              <Routes>
                <Route
                  path="/"
                  element={profile ? <Navigate to="/garage" /> : <Welcome />}
                />
                <Route
                  path="/login"
                  element={
                    profile ? (
                      <Navigate to="/garage" />
                    ) : (
                      <Login error={authError} />
                    )
                  }
                />
                <Route
                  path="/*"
                  element={profile ? <Shell /> : <Navigate to="/" />}
                />
              </Routes>
              <InstallPrompt />
            </>
          )}
          {message && (
            <div role="status" className="toast" onClick={() => setMessage("")}>
              {message}
              <X size={16} />
            </div>
          )}
        </div>
      </HashRouter>
    </Session.Provider>
  );
}
function LoadingSpinner() {
  return <div className="loader-bars" aria-label="Cargando">{Array.from({ length: 5 }, (_, i) => <span className="loader-slider" style={{ "--i": i } as React.CSSProperties} key={i} />)}</div>;
}
function Welcome() {
  return (
    <main className="welcome">
      <div className="brand">
        <img className="official-logo" src={`${import.meta.env.BASE_URL}branding/logo-camilo.png`} alt="Camilo Guerra Cars" />
        <span>CAMILO GUERRA <small>CARS · CLUB OFICIAL</small></span>
      </div>
      <div className="hero-label">
        <span className="dot" /> PASIÓN SIN LIMITADOR
      </div>
      <img className="hero-car" src={HERO} alt="Auto deportivo del club Camilo Guerra Cars" />
      <div className="welcome-copy">
        <span className="eyebrow">EL GARAGE TIENE UN LUGAR PARA TI</span>
        <h1>
          No es un auto.
          <br />
          Es lo que
          <br />
          <em>nos mueve.</em>
        </h1>
        <p>
          Rutas, proyectos y experiencias que no ves en redes. Bienvenido al
          círculo de Camilo.
        </p>
        <Link className="cta" to="/login">
          ENTRAR AL GARAGE{" "}
          <span>
            <ArrowRight size={22} />
          </span>
        </Link>
        <div className="hero-foot">
          <span>COMUNIDAD REAL. PASIÓN REAL.</span>
          <span>01 / 06</span>
        </div>
      </div>
    </main>
  );
}
function WeatherHero() {
  const [weather, setWeather] = useState({ temp: 36, max: 42, min: 28, label: "Consultando clima…", city: "CAMILO GARAGE" });
  useEffect(() => {
    const load = (latitude: number, longitude: number, city = "TU UBICACIÓN") => {
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&forecast_days=1&timezone=auto`)
        .then((response) => response.json())
        .then((data) => {
          const code = Number(data.current?.weather_code || 0);
          const labels = code === 0 ? "Despejado" : code < 4 ? "Parcialmente nublado" : code < 70 ? "Nublado" : "Lluvia";
          setWeather({ temp: Math.round(data.current.temperature_2m), max: Math.round(data.daily.temperature_2m_max[0]), min: Math.round(data.daily.temperature_2m_min[0]), label: labels, city });
        }).catch(() => undefined);
    };
    load(19.4326, -99.1332, "CIUDAD DE MÉXICO");
  }, []);
  const now = new Date();
  const day = now.toLocaleDateString("es-MX", { weekday: "short" }).replace(".", "").toUpperCase();
  const date = `${day} ${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const time = now.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hour12: false });
  return <div className="hero-weather card">
    <section className="info-section"><div className="background-design"><div className="circle"/><div className="circle"/><div className="circle"/></div>
      <div className="left-side"><div className="weather"><span aria-hidden="true">☀</span><span>{weather.label}</span></div><div className="temperature">{weather.temp}°</div><div className="range">{weather.max}° / {weather.min}°</div></div>
      <div className="right-side"><div><div className="hour">{time}</div><div className="date">{date}</div></div><div className="city">{weather.city}</div></div>
    </section><section className="days-section"><button><span className="day">LUN</span><span>☀</span></button><button><span className="day">MAR</span><span>☁</span></button><button><span className="day">MIÉ</span><span>☁</span></button><button><span className="day">JUE</span><span>☀</span></button></section></div>;
}
function Login({ error }: { error: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [registering, setRegistering] = useState(false);
  const [formError, setFormError] = useState("");
  const submitEmail = async (event: FormEvent) => {
    event.preventDefault();
    setFormError("");
    try {
      if (registering) {
        await api.emailRegister(email, password);
        setFormError("Cuenta creada. Revisa tu correo y confirma la dirección antes de entrar.");
        return;
      }
      await api.emailLogin(email, password);
    } catch (e) {
      const code = (e as { code?: string }).code;
      setFormError(
        code === "auth/invalid-credential" || code === "auth/wrong-password"
          ? "Correo o contraseña incorrectos."
          : code === "auth/email-already-in-use"
            ? "Ese correo ya tiene una cuenta. Inicia sesión."
            : code === "auth/weak-password"
              ? "La contraseña debe tener al menos 6 caracteres."
              : errorText(e),
      );
    }
  };
  return (
    <main className="login">
      <Link to="/" className="back">
        ← VOLVER AL GARAGE
      </Link>
      <div className="login-center">
        <img className="login-logo" src={`${import.meta.env.BASE_URL}branding/logo-camilo.png`} alt="Camilo Guerra Cars" />
        <span className="eyebrow">EL ACCESO A TU SIGUIENTE NIVEL</span>
        <h1>
          Dentro del
          <br />
          <em>círculo.</em>
        </h1>
        <p>
          Un solo acceso. Todo el club.
          <br />
          Tu pase a lo que viene.
        </p>
        <div className="glass login-box">
          <h2>Verifica tu acceso</h2>
          <p>Entra con Google o con correo y contraseña.</p>
          <Action
            className="google"
            disabled={!configured}
            onClick={api.googleLogin}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M22.6 12.2c0-.7-.1-1.5-.2-2.2H12v4.2h6a5.2 5.2 0 0 1-2.2 3.3v2.8h3.6c2.1-1.9 3.2-4.7 3.2-8.1Z"
              />
              <path
                fill="#34A853"
                d="M12 23c3 0 5.5-1 7.4-2.7l-3.6-2.8a6.8 6.8 0 0 1-10.1-3.6H2v2.9A11.2 11.2 0 0 0 12 23Z"
              />
              <path
                fill="#FBBC05"
                d="M5.7 13.9a6.7 6.7 0 0 1 0-4V7H2a11 11 0 0 0 0 9.8l3.7-2.9Z"
              />
              <path
                fill="#EA4335"
                d="M12 5.3c1.6 0 3.1.5 4.2 1.6l3.2-3.1A10.6 10.6 0 0 0 12 1 11.2 11.2 0 0 0 2 7l3.7 2.9A6.7 6.7 0 0 1 12 5.3Z"
              />
            </svg>{" "}
            CONTINUAR CON GOOGLE
          </Action>
          <div className="login-divider"><span>O CORREO</span></div>
          <form className="email-login" onSubmit={submitEmail}>
            <label>
              Correo
              <input required type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@correo.com" />
            </label>
            <label>
              Contraseña
              <input required minLength={6} type="password" autoComplete={registering ? "new-password" : "current-password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" />
            </label>
            <button type="submit" className="email-submit">{registering ? "CREAR CUENTA" : "INICIAR SESIÓN"}</button>
          </form>
          <button type="button" className="link-button" onClick={() => { setRegistering((value) => !value); setFormError(""); }}>
            {registering ? "Ya tengo una cuenta" : "Crear cuenta con correo"}
          </button>
        </div>
        {!configured && (
          <p className="setup">
            Garage listo para conectar. Configura las variables de Firebase en{" "}
            <code>.env.local</code> y habilita Google Sign-In.
          </p>
        )}
        {(error || formError) && <p className="error">{formError || error}</p>}
        <small>
          Al entrar se guarda tu nombre, correo y actividad del club. Puedes
          solicitar la eliminación desde soporte.
        </small>
      </div>
      <div className="login-bottom">
        CAMILO GUERRA CARS <span>EST. 2026</span>
      </div>
    </main>
  );
}
function Shell() {
  const { profile } = useSession();
  const location = useLocation();
  return (
    <>
      <header className="topbar">
        <Link to="/garage" className="wordmark"><img src={`${import.meta.env.BASE_URL}branding/logo-camilo.png`} alt="Camilo Guerra Cars" /><span>/ CLUB OFICIAL</span></Link>
        <Link to="/profile" className="avatar" aria-label="Mi perfil">
          {profile?.photoURL ? (
            <img src={profile.photoURL} alt="" referrerPolicy="no-referrer" />
          ) : (
            <UserRound size={20} />
          )}
        </Link>
      </header>
      <main className="content page-transition" key={location.pathname}>
        <Routes>
          <Route path="/garage" element={<Garage />} />
          <Route path="/events" element={<Events />} />
          <Route path="/early" element={<Early />} />
          <Route path="/showroom" element={<Showroom />} />
          <Route path="/profile" element={<ProfileView />} />
          <Route
            path="/staff"
            element={
              profile?.role !== "member" ? <Staff /> : <Navigate to="/garage" />
            }
          />
          <Route path="*" element={<Navigate to="/garage" />} />
        </Routes>
      </main>
      <nav className="dock" aria-label="Navegación principal">
        {[
          ["/garage", Home, "Garage"],
          ["/events", CalendarDays, "Meets"],
          ["/early", Play, "Exclusivo"],
          ["/showroom", ShoppingBag, "Showroom"],
          ["/profile", UserRound, "Perfil"],
        ].map(([path, Icon, title]) => {
          const I = Icon as typeof Home;
          return (
            <NavLink
              key={String(path)}
              to={String(path)}
              aria-label={String(title)}
            >
              <I size={21} />
              <span>{String(title)}</span>
            </NavLink>
          );
        })}
      </nav>
    </>
  );
}
function Garage() {
  const { profile } = useSession();
  const [showWeather, setShowWeather] = useState(true);
  const state = useLoad(() => api.list<Trivia>("trivias", "createdAt", 5), []);
  return (
    <>
      <div className="weather-row">
        <span className="eyebrow">CLIMA DEL GARAGE</span>
        <button className="text-btn weather-toggle" onClick={() => setShowWeather((visible) => !visible)}>
          {showWeather ? "OCULTAR CLIMA" : "MOSTRAR CLIMA"}
        </button>
      </div>
      {showWeather && <WeatherHero />}
      <div className="greeting">
        <span className="eyebrow">
          <span className="dot" /> EL GARAGE ESTÁ ABIERTO
        </span>
        <h1>
          Qué onda,
          <br />
          <em>{profile?.displayName.split(" ")[0]}.</em>
          <RocketAnimation />
        </h1>
        <p>La pasión se vive. Aquí empieza tu siguiente ruta.</p>
      </div>
      <div className="section-title">
        <h2>
          <Flame size={18} /> Dinámicas flash
        </h2>
        <SyncButton onClick={state.reload} />
      </div>
      <AsyncState {...state} empty={!state.data?.length} />
      {state.data?.map((t) => (
        <TriviaCard key={t.id} trivia={t} />
      ))}
      <div className="quick-grid">
        <Link className="glass" to="/early">
          <Play />
          <h3>Antes que nadie.</h3>
          <p>El contenido del círculo</p>
          <ArrowUpRight />
        </Link>
        <Link className="glass" to="/showroom">
          <ShoppingBag />
          <h3>Garage select.</h3>
          <p>Merch, autos y piezas</p>
          <ArrowUpRight />
        </Link>
      </div>
      {profile?.role !== "member" && (
        <Link className="staff-link" to="/staff">
          <ShieldCheck size={20} /> CONSOLA{" "}
          {profile?.role === "camilo_owner" ? "CAMILO" : "SPOTTER STAFF"}{" "}
          <ChevronRight />
        </Link>
      )}
      <div className="club-note">
        NO TODOS LO ENTIENDEN.
        <br />
        <strong>TÚ YA ESTÁS DENTRO.</strong>
        <Flag size={22} />
      </div>
    </>
  );
}
function RocketAnimation() {
  return <span className="rocket" aria-hidden="true"><span className="rocket-body"><span className="rocket-body-shape" /><span className="rocket-fin rocket-fin-left" /><span className="rocket-fin rocket-fin-right" /><span className="rocket-window" /></span><span className="rocket-flame" /><span className="rocket-star rocket-star-one" /><span className="rocket-star rocket-star-two" /><span className="rocket-star rocket-star-three" /></span>;
}
function TriviaCard({ trivia: t }: { trivia: Trivia }) {
  const { profile, notify } = useSession();
  const [answer, setAnswer] = useState("");
  const state = useLoad(
    () => api.read<Submission>(`trivias/${t.id}/submissions/${profile!.id}`),
    [t.id],
  );
  const active = t.status === "active" && t.expiresAt.toMillis() > Date.now();
  return (
    <article className={`trivia glass ${active ? "live" : ""}`}>
      <div className="row">
        <span className="eyebrow">
          {active ? "● EN VIVO / UN SOLO INTENTO" : "BANDERA A CUADROS"}
        </span>
        <Timer until={t.status === "closed" ? 0 : t.expiresAt.toMillis()} />
      </div>
      <h2>{t.question}</h2>
      <div className="prize">
        <Trophy size={17} />
        {t.prize}
      </div>
      {!active && t.winnerName && <div className="trivia-winner-public"><Trophy size={16} /><span>GANADOR: <strong>{t.winnerName}</strong></span>{t.winnerAt && <time>{t.winnerAt.toDate().toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" })}</time>}</div>}
      {state.error && <p className="error">{state.error}</p>}
      {state.data ? (
        <p className="success">Respuesta registrada. Espera los resultados.</p>
      ) : (
        active && (
          <form onSubmit={(e) => e.preventDefault()}>
            <label className="sr-only" htmlFor={`answer-${t.id}`}>
              Tu respuesta
            </label>
            <input
              id={`answer-${t.id}`}
              maxLength={200}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="¿Te sabes la respuesta?"
            />
            <Action
              disabled={!answer.trim() || state.loading || !!state.error}
              className="btn primary"
              onClick={async () => {
                await api.submitAnswer(t.id, answer, profile!);
                state.reload();
                notify("Respuesta enviada. Buena suerte, piloto.");
              }}
            >
              ENVIAR RESPUESTA <ArrowUpRight size={17} />
            </Action>
          </form>
        )
      )}
    </article>
  );
}
function Events() {
  const state = useLoad(() => api.list<Meet>("events", "date"), []);
  return (
    <>
      <Heading
        eyebrow="NOS VEMOS EN EL ASFALTO"
        title="La próxima ruta."
        reload={state.reload}
      />
      <AsyncState {...state} empty={!state.data?.length} />
      {state.data?.map((e) => (
        <EventCard key={e.id} meet={e} />
      ))}
    </>
  );
}
function EventCard({ meet: m }: { meet: Meet }) {
  const { profile } = useSession();
  const [show, setShow] = useState(false);
  const [calendarPrompt, setCalendarPrompt] = useState(false);
  const state = useLoad(
    () => api.read<Registration>(`events/${m.id}/registrations/${profile!.id}`),
    [m.id],
  );
  return (
    <article className="glass event">
      <div className="row">
        <span className="pill">
          {m.mode === "open"
            ? "ACCESO LIBRE"
            : m.mode === "limited"
              ? "CUPO LIMITADO"
              : "POR SORTEO"}
        </span>
        <Flag size={22} />
      </div>
      <div className="event-date">
        {m.date
          .toDate()
          .toLocaleDateString("es-MX", { day: "2-digit", month: "short" })}
        <small>
          {m.date
            .toDate()
            .toLocaleTimeString("es-MX", {
              hour: "2-digit",
              minute: "2-digit",
            })}
        </small>
      </div>
      <h2>{m.title}</h2>
      <p>
        <MapPin size={15} />
        {m.location}
      </p>
      <p className="description">{m.description}</p>
      {safeUrl(m.mapUrl) && (
        <a
          className="text-link"
          href={safeUrl(m.mapUrl)}
          target="_blank"
          rel="noreferrer"
        >
          ABRIR UBICACIÓN <ArrowUpRight size={15} />
        </a>
      )}
      <div className="event-footer">
        <span>
          {m.mode === "limited"
            ? `${m.confirmedCount} / ${m.capacity} lugares`
            : m.mode === "raffle"
              ? "VIP: 2 boletos · Miembros: 1 boleto"
              : "La comunidad se reúne."}
        </span>
      </div>
      {state.error && <p className="error">{state.error}</p>}
      {state.data ? (
        state.data.status === "confirmed" ? (
          <>
            <button className="btn primary" onClick={() => setShow(true)}>
              <QrCode size={18} /> VER MI PASE{" "}
              {state.data.checkedIn && "· UTILIZADO"}
            </button>
            {calendarPrompt && <div className="calendar-confirmation"><strong>Asistencia confirmada</strong><small>Agrega este Meet a tu calendario.</small><CalendarActions meet={m} onDone={() => setCalendarPrompt(false)} /></div>}
          </>
        ) : (
          <p className="success">
            Estás en la lista del sorteo. Actualiza para consultar el resultado.
          </p>
        )
      ) : (
        <Action
          className="btn primary"
          disabled={
            state.loading ||
            !!state.error ||
            m.date.toMillis() <= Date.now() ||
            (m.mode === "raffle" && m.raffleDrawn)
          }
          onClick={async () => {
            await api.register(m, profile!);
            state.reload();
            setCalendarPrompt(true);
          }}
        >
          QUIERO ESTAR AHÍ <ArrowUpRight size={18} />
        </Action>
      )}
      {show && state.data && (
        <Modal title="Tu pase al garage" close={() => setShow(false)}>
          <div className="boarding">
            <span className="eyebrow">CAMILO GUERRA CARS · ADMIT ONE</span>
            <h2>{m.title}</h2>
            <div className="qr">
              <QRCodeSVG
                size={224}
                level="M"
                value={JSON.stringify({
                  eventId: m.id,
                  uid: profile!.id,
                  token: state.data.token,
                })}
              />
            </div>
            <h3>{profile?.displayName}</h3>
            <p>
              {state.data.checkedIn
                ? "PASE UTILIZADO"
                : "CONFIRMADO · Muestra este QR en la entrada"}
            </p>
            <small>Este pase es personal. No compartas su captura.</small>
            <CalendarActions meet={m} />
          </div>
        </Modal>
      )}
    </article>
  );
}
function CalendarActions({ meet, onDone }: { meet: Meet; onDone?: () => void }) {
  const done = () => onDone?.();
  return <div className="calendar-actions"><button className="btn calendar-btn" onClick={() => { openGoogleCalendar(meet); done(); }}><CalendarPlus size={16} /> GOOGLE CALENDAR</button><button className="btn calendar-btn" onClick={() => { downloadCalendarFile(meet); done(); }}><CalendarDays size={16} /> APPLE / .ICS</button></div>;
}
function calendarStamp(date: Date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}
function openGoogleCalendar(meet: Meet) {
  const start = meet.date.toDate();
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
  const url = new URL("https://calendar.google.com/calendar/render");
  url.searchParams.set("action", "TEMPLATE");
  url.searchParams.set("text", `Camilo Guerra Cars · ${meet.title}`);
  url.searchParams.set("dates", `${calendarStamp(start)}/${calendarStamp(end)}`);
  url.searchParams.set("details", meet.description);
  url.searchParams.set("location", meet.location);
  window.open(url.toString(), "_blank", "noopener,noreferrer");
}
function downloadCalendarFile(meet: Meet) {
  const start = meet.date.toDate();
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
  const escape = (value: string) => value.replace(/[\\;,]/g, (match) => `\\${match}`).replace(/\n/g, "\\n");
  const content = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Camilo Guerra Cars//Club Oficial//ES", "BEGIN:VEVENT", `UID:${meet.id}@camilo-guerra-cars`, `DTSTAMP:${calendarStamp(new Date())}`, `DTSTART:${calendarStamp(start)}`, `DTEND:${calendarStamp(end)}`, `SUMMARY:${escape(`Camilo Guerra Cars · ${meet.title}`)}`, `LOCATION:${escape(meet.location)}`, `DESCRIPTION:${escape(meet.description)}`, "END:VEVENT", "END:VCALENDAR"].join("\r\n");
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${meet.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "camilo-meet"}.ics`;
  link.click();
  URL.revokeObjectURL(link.href);
}
function videoEmbed(url: string) {
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be")
      return `https://www.youtube-nocookie.com/embed/${u.pathname.slice(1).replace(/[^\w-]/g, "")}`;
    if (["www.youtube.com", "youtube.com"].includes(u.hostname)) {
      const id = u.searchParams.get("v") || u.pathname.split("/").pop();
      return `https://www.youtube-nocookie.com/embed/${id?.replace(/[^\w-]/g, "")}`;
    }
    if (["vimeo.com", "www.vimeo.com", "player.vimeo.com"].includes(u.hostname))
      return `https://player.vimeo.com/video/${u.pathname.split("/").pop()?.replace(/\D/g, "")}`;
  } catch {
    return "";
  }
  return "";
}
function Early() {
  const state = useLoad(() => api.list<Post>("earlyAccess"), []);
  return (
    <>
      <Heading
        eyebrow="SOLO DENTRO DEL CÍRCULO"
        title="Primero aquí."
        reload={state.reload}
      />
      <p className="intro">
        Los proyectos. Las pruebas. Lo que todavía no sale en redes.
      </p>
      <AsyncState {...state} empty={!state.data?.length} />
      {state.data?.map((p) => (
        <PostCard key={p.id} post={p} />
      ))}
    </>
  );
}
function PostCard({ post: p }: { post: Post }) {
  const { profile, notify } = useSession();
  const [open, setOpen] = useState(false),
    [text, setText] = useState("");
  const comments = useLoad(
    () => api.list<Comment>(`earlyAccess/${p.id}/comments`, "createdAt", 20),
    [p.id],
  );
  const reaction = useLoad(
    () =>
      api.read<{ emoji: string }>(
        `earlyAccess/${p.id}/reactions/${profile!.id}`,
      ),
    [p.id],
  );
  const embed = videoEmbed(p.url);
  return (
    <article className="glass post">
      {safeUrl(p.thumbnail) && (
        <button
          className="post-image"
          onClick={() => setOpen(!open)}
          aria-label="Reproducir video"
        >
          <img src={safeUrl(p.thumbnail)} alt={p.title} loading="lazy" />
          <span>
            <Play fill="currentColor" />
          </span>
        </button>
      )}
      <div className="post-body">
        <div className="row">
          <span className="eyebrow">EARLY ACCESS</span>
          <Timer until={p.exclusiveUntil.toMillis()} />
        </div>
        <h2>{p.title}</h2>
        <button className="btn" onClick={() => setOpen(!open)}>
          {open ? "CERRAR VIDEO" : "VER CONTENIDO"} <Play size={16} />
        </button>
        {open &&
          (embed ? (
            <iframe
              title={p.title}
              src={embed}
              allow="fullscreen; picture-in-picture"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          ) : /\.mp4(?:\?|$)/i.test(p.url) && safeUrl(p.url) ? (
            <video controls playsInline src={safeUrl(p.url)} />
          ) : (
            <a
              href={safeUrl(p.url)}
              target="_blank"
              rel="noreferrer"
              className="text-link"
            >
              ABRIR VIDEO <ArrowUpRight size={16} />
            </a>
          ))}
        <div className="reactions">
          {["🔥", "🏁", "🚀"].map((emoji) => (
            <Action
              key={emoji}
              className={reaction.data?.emoji === emoji ? "selected" : ""}
              onClick={async () => {
                await api.reactTo(p.id, profile!.id, emoji);
                reaction.reload();
              }}
            >
              {emoji}
            </Action>
          ))}
        </div>
        <details>
          <summary>
            Conversación del garage <MessageCircle size={16} />
          </summary>
          <AsyncState {...comments} />
          {comments.data?.map((c) => (
            <div className="comment" key={c.id}>
              <strong>{c.displayName}</strong>
              <p>{c.text}</p>
              {(profile!.role !== "member" || c.uid === profile!.id) && (
                <Action
                  className="text-btn"
                  onClick={async () => {
                    await api.remove(`earlyAccess/${p.id}/comments/${c.id}`);
                    comments.reload();
                  }}
                >
                  ELIMINAR
                </Action>
              )}
            </div>
          ))}
          <input
            aria-label="Comentario"
            maxLength={500}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Tu comentario…"
          />
          <Action
            disabled={!text.trim()}
            className="btn"
            onClick={async () => {
              await api.create(`earlyAccess/${p.id}/comments`, {
                uid: profile!.id,
                displayName: profile!.displayName,
                text: text.trim(),
              });
              setText("");
              comments.reload();
              notify("Comentario publicado.");
            }}
          >
            PUBLICAR <ArrowRight size={16} />
          </Action>
        </details>
      </div>
    </article>
  );
}
function whatsapp(message: string) {
  const phone = WHATSAPP_NUMBER;
  if (!/^\d{10,15}$/.test(phone || ""))
    throw new Error("Camilo debe configurar el número de WhatsApp del club.");
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
function Showroom() {
  const state = useLoad(() => api.list<Item>("marketplace"), []);
  const [category, setCategory] = useState("todos"),
    [search, setSearch] = useState("");
  const [watching, setWatching] = useState(""),
    [liveItem, setLiveItem] = useState<Item | null>(null);
  const { notify } = useSession();
  useEffect(() => {
    setLiveItem(null);
    if (!watching) return;
    return api.watchItem(watching, setLiveItem, notify);
  }, [watching]);
  const rows = state.data?.filter(
    (i) =>
      i.active &&
      (category === "todos" || i.category === category) &&
      `${i.title} ${i.description}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  return (
    <>
      <Heading
        eyebrow="CURADO POR CAMILO"
        title="Garage select."
        reload={state.reload}
      />
      <label className="search">
        <Search size={18} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Encuentra tu próximo upgrade…"
        />
      </label>
      <div className="chips">
        {["todos", "merch", "autos", "piezas"].map((c) => (
          <button
            className={category === c ? "active" : ""}
            key={c}
            onClick={() => setCategory(c)}
          >
            {c.toUpperCase()}
          </button>
        ))}
      </div>
      <div className="section-title">
        <h2>Featured inventory</h2>
        <span>{rows?.length || "0"} SELECTS</span>
      </div>
      <AsyncState {...state} empty={!rows?.length} />
      {rows?.map((item) => (
        <Product
          key={item.id}
          item={liveItem?.id === item.id ? liveItem : item}
          live={watching === item.id}
          watch={() => setWatching(item.id)}
          reload={state.reload}
        />
      ))}
    </>
  );
}
function Product({
  item: i,
  reload,
  live,
  watch,
}: {
  item: Item;
  reload: () => void;
  live: boolean;
  watch: () => void;
}) {
  const { profile } = useSession();
  const [size, setSize] = useState(Object.keys(i.stock)[0] || "Única"),
    [receipt, setReceipt] = useState<{ id: string; url: string } | null>(null);
  return (
    <article className="product">
      <div className="product-visual">
        <img src={safeUrl(i.image)} alt={i.title} loading="lazy" />
        <div>
          <span className="eyebrow">
            {i.category === "autos"
              ? "DRIVEN BY PASSION"
              : "OFFICIAL CLUB DROP"}
          </span>
          <h2>{i.title}</h2>
          <p>{i.description}</p>
        </div>
        <span className="product-tag">{i.category.toUpperCase()}</span>
      </div>
      {i.category !== "autos" && (
        <div className="sizes">
          {Object.entries(i.stock).map(([s, n]) => (
            <button
              key={s}
              disabled={n < 1}
              className={size === s ? "active" : ""}
              onClick={() => {
                setSize(s);
                watch();
              }}
            >
              {s}
            </button>
          ))}
          <button className="stock-watch" onClick={watch}>
            {i.stock[size] || 0} disponibles ·{" "}
            {live ? "EN VIVO" : "VER STOCK EN VIVO"}
          </button>
        </div>
      )}
      <div className="product-price">
        <div>
          <small>
            {i.category === "autos" ? "PRECIO / MXN" : "DROP OFICIAL / MXN"}
          </small>
          <strong>{money(i.price)}</strong>
        </div>
        {i.category === "autos" ? (
          <Action
            className="round"
            onClick={async () => {
              setReceipt({
                id: "Consulta de vehículo",
                url: whatsapp(
                  `Hola Camilo, vengo de la App Oficial (Miembro: ${profile!.displayName}) y me interesa el ${i.title} de ${money(i.price)}`,
                ),
              });
            }}
          >
            <ArrowUpRight size={22} />
          </Action>
        ) : (
          <Action
            className="round"
            disabled={!(i.stock[size] > 0) || !!receipt}
            onClick={async () => {
              const url =
                safeUrl(i.paymentUrl) ||
                whatsapp(
                  `Hola Camilo, soy ${profile!.displayName}. Quiero ${i.title}, talla ${size}, ${money(i.price)}.`,
                );
              const id = await api.order(i, size, profile!);
              setReceipt({
                id,
                url: url.includes("wa.me")
                  ? `${url}${encodeURIComponent(` Folio: ${id}`)}`
                  : url,
              });
              reload();
            }}
          >
            <ShoppingBag size={20} />
          </Action>
        )}
      </div>
      {receipt && (
        <div className="receipt">
          <strong>{receipt.id}</strong>
          <p>Reserva registrada. El pago se confirma con el equipo.</p>
          <a
            className="btn"
            href={receipt.url}
            target="_blank"
            rel="noreferrer"
          >
            CONTINUAR <ArrowUpRight size={16} />
          </a>
        </div>
      )}
    </article>
  );
}
function ProfileView() {
  const { profile: p, refresh, notify } = useSession();
  const board = useLoad(() => api.list<Profile>("users", "rpmPoints", 10), []);
  const orders = useLoad(() => api.myOrders(p!.id), [p!.id]);
  const staff = useLoad(() => api.listStaff(), []);
  const currentRank = p!.rpmPoints >= 8000 ? "Ferrari / Lamborghini" : p!.rpmPoints >= 5000 ? "Porsche Club" : p!.rpmPoints >= 3000 ? "Tsuru Tuneado" : p!.rpmPoints >= 2000 ? "Tsuru" : p!.rpmPoints >= 1000 ? "Chevy Pop" : "Motor de Arranque";
  return (
    <>
      <Heading
        eyebrow="TU HISTORIA EN EL GARAGE"
        title="Hecho de pasión."
        reload={() => {
          refresh().catch((e) => notify(errorText(e)));
          board.reload();
          orders.reload();
          staff.reload();
        }}
      />
      <div className="profile-card glass">
        <div className="profile-avatar">
          {p?.photoURL ? (
            <img src={p.photoURL} alt="" referrerPolicy="no-referrer" />
          ) : (
            <UserRound />
          )}
        </div>
        <h2>{p?.displayName}</h2>
        <span className="pill">
          {p?.role === "spotter_mod"
            ? "SPOTTER STAFF"
            : p?.role === "camilo_owner"
              ? "CAMILO / OWNER"
              : "MIEMBRO OFICIAL"}
        </span>
        <div className="tachometer">
          <svg
            viewBox="0 0 240 140"
            role="img"
            aria-label={`${p?.rpmPoints} RPM, nivel ${level(p!.rpmPoints)}`}
          >
            <path className="gauge-track" d="M25 120 A95 95 0 0 1 215 120" />
            <path
              className="gauge-fill"
              d="M25 120 A95 95 0 0 1 215 120"
              pathLength="100"
              strokeDasharray={`${Math.min(p!.rpmPoints / 100, 100)} 100`}
            />
            {Array.from({ length: 11 }, (_, i) => (
              <line
                key={i}
                x1="120"
                y1="24"
                x2="120"
                y2="30"
                transform={`rotate(${i * 18 - 90} 120 120)`}
                stroke={i > 7 ? "#c5d856" : "#69734a"}
              />
            ))}
            <text x="120" y="106" textAnchor="middle">
              {p?.rpmPoints.toLocaleString()}
            </text>
            <text className="gauge-label" x="120" y="125" textAnchor="middle">
              RPM / {level(p!.rpmPoints).toUpperCase()}
            </text>
          </svg>
        </div>
        <div className="rpm-levels">
          0 <span>2K</span>
          <span>5K</span>
          <span>8K+</span>
        </div>
        <p>+500 RPM por meet · +1,000 RPM por trivia ganada</p>
      </div>
      <div className="section-title">
        <h2>Tus insignias</h2>
        <Trophy size={18} />
      </div>
      <p className="current-rank">RANGO ACTUAL · <strong>{currentRank}</strong></p>
      <div className="badges badge-list">
        {["Motor de Arranque", "Chevy Pop", "Tsuru", "Tsuru Tuneado", "Jetta en el Tianguis", "Porsche Club", "Ferrari / Lamborghini"].map((b, index) => {
          const Icon = [Gauge, CarFront, Wrench, Zap, Trophy, Crown, Sparkles][index];
          return <details key={b} className={p!.badges.includes(b) ? "unlocked" : ""}><summary><Icon size={22} /><span>{b}</span><small>{["0–999 RPM", "1,000–1,999 RPM", "2,000–2,999 RPM", "3,000–4,999 RPM", "5,000–6,999 RPM", "7,000–7,999 RPM", "8,000+ RPM"][index]}</small></summary><p>{["Primer encendido del club.", "Llegaste con estilo urbano.", "Participación constante.", "Ya traes el proyecto afinado.", "Veterano de rutas y meets.", "Nivel premium del garage.", "Redline VIP: prioridad en experiencias."][index]}</p></details>;
        })}
      </div>
      <div className="section-title">
        <h2>Redline / Top 10</h2>
        <Flag size={18} />
      </div>
      <AsyncState {...board} />
      <div className="glass leaderboard">
        {board.data?.map((u, n) => (
          <div key={u.id}>
            <span className={n < 3 ? "accent" : ""}>
              {String(n + 1).padStart(2, "0")}
            </span>
            <strong>{u.displayName}</strong>
            <span>
              {u.rpmPoints.toLocaleString()} <small>RPM</small>
            </span>
          </div>
        ))}
      </div>
      <div className="section-title">
        <h2>Equipo del club</h2>
        <ShieldCheck size={18} />
      </div>
      <AsyncState {...staff} />
      <div className="glass staff-directory">
        {staff.data?.map((member) => (
          <div className="staff-person" key={member.id}>
            <div className="profile-avatar small">
              {member.photoURL ? <img src={member.photoURL} alt="" referrerPolicy="no-referrer" /> : <UserRound />}
            </div>
            <div><strong>{member.displayName}</strong><span>{member.role === "camilo_owner" ? "CAMILO / OWNER" : "SPOTTER STAFF"}</span></div>
            <div className="staff-socials">
              {member.socials?.instagram && <a href={safeUrl(member.socials.instagram)} target="_blank" rel="noreferrer" aria-label={`Instagram de ${member.displayName}`}>IG</a>}
              {member.socials?.youtube && <a href={safeUrl(member.socials.youtube)} target="_blank" rel="noreferrer" aria-label={`YouTube de ${member.displayName}`}>YT</a>}
              {member.socials?.tiktok && <a href={safeUrl(member.socials.tiktok)} target="_blank" rel="noreferrer" aria-label={`TikTok de ${member.displayName}`}>TK</a>}
            </div>
          </div>
        ))}
      </div>
      <details className="glass order-list">
        <summary>Mis reservas de merch</summary>
        <AsyncState {...orders} empty={!orders.data?.length} />
        {orders.data?.map((o) => (
          <p key={o.id}>
            {o.title} / {o.size}
            <br />
            <small>
              {o.id} · {o.status}
            </small>
          </p>
        ))}
      </details>
      <Action
        className="btn"
        onClick={async () => {
          await api.enablePush(p!.id);
          notify("Alertas activadas en este dispositivo.");
        }}
      >
        <Bell size={18} /> ACTIVAR ALERTAS
      </Action>
      {p!.role !== "member" && (
        <Link className="btn primary" to="/staff">
          <ShieldCheck size={18} /> CONSOLA DEL CLUB
        </Link>
      )}
      <Action
        className="btn logout"
        onClick={async () => {
          await api.logout();
        }}
      >
        <LogOut size={16} /> CERRAR SESIÓN
      </Action>
    </>
  );
}
export function Support() {
  const { profile: p } = useSession();
  const [question, setQuestion] = useState("");
  const state = useLoad(
    async () => (await api.tickets(p!)) as Ticket[],
    [p!.id],
  );
  return (
    <details className="glass support">
      <summary>
        <MessageCircle size={18} /> Box de soporte
      </summary>
      <p>Los Spotters te responden aquí.</p>
      <AsyncState {...state} />
      {state.data?.map((t) => (
        <div className="comment" key={t.id}>
          <strong>
            {t.displayName} · {t.status === "resolved" ? "RESUELTO" : "ABIERTO"}
          </strong>
          <p>{t.question}</p>
          {t.answer && <p className="success">STAFF / {t.answer}</p>}
          {p!.role !== "member" && t.status === "open" && (
            <div>
              <TicketAnswer id={t.id} reload={state.reload} />
            </div>
          )}
        </div>
      ))}
      <textarea
        aria-label="Tu duda"
        maxLength={1000}
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="¿En qué te ayudamos?"
      />
      <Action
        className="btn"
        disabled={!question.trim()}
        onClick={async () => {
          await api.create("supportTickets", {
            uid: p!.id,
            displayName: p!.displayName,
            question: question.trim(),
            answer: "",
            status: "open",
          });
          setQuestion("");
          state.reload();
        }}
      >
        ENVIAR A LOS SPOTTERS <ArrowRight size={16} />
      </Action>
    </details>
  );
}
function TicketAnswer({ id, reload }: { id: string; reload: () => void }) {
  const [answer, setAnswer] = useState("");
  return (
    <>
      <input
        placeholder="Respuesta del staff"
        aria-label="Respuesta del staff"
        value={answer}
        maxLength={1000}
        onChange={(e) => setAnswer(e.target.value)}
      />
      <Action
        className="btn"
        disabled={!answer.trim()}
        onClick={async () => {
          await api.patch(`supportTickets/${id}`, {
            answer: answer.trim(),
            status: "resolved",
            resolvedAt: serverTimestamp(),
          });
          reload();
        }}
      >
        RESPONDER Y RESOLVER
      </Action>
      <Action
        className="btn danger"
        onClick={async () => {
          await api.patch(`supportTickets/${id}`, {
            answer: answer.trim(),
            status: "resolved",
            resolvedAt: serverTimestamp(),
          });
          reload();
        }}
      >
        CERRAR TICKET SIN RESPONDER
      </Action>
    </>
  );
}
function InstallPrompt() {
  const [install, setInstall] = useState<
      (Event & { prompt: () => Promise<void> }) | null
    >(null),
    [ios, setIos] = useState(false),
    [dismissed, setDismissed] = useState(
      () => sessionStorage.getItem("install-dismissed") === "1",
    );
  useEffect(() => {
    const standalone =
      matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone;
    setIos(/iPad|iPhone|iPod/.test(navigator.userAgent) && !standalone);
    const handler = (e: Event) => {
      e.preventDefault();
      setInstall(e as Event & { prompt: () => Promise<void> });
    };
    const installed = () => {
      setInstall(null);
      setIos(false);
    };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", installed);
    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installed);
    };
  }, []);
  if (dismissed || (!ios && !install)) return null;
  return (
    <aside className="install glass">
      <button
        className="icon"
        aria-label="Descartar instalación"
        onClick={() => {
          setDismissed(true);
          sessionStorage.setItem("install-dismissed", "1");
        }}
      >
        <X size={16} />
      </button>
      <strong>El garage en tu bolsillo.</strong>
      <p>
        {ios
          ? "Para recibir alertas de dinámicas y rutas, toca Compartir y luego “Agregar a Inicio”. Abre la app instalada y activa las alertas desde tu perfil (iOS 16.4+)."
          : "Instala el club para entrar más rápido. Activa las alertas desde tu perfil."}
      </p>
      {install && (
        <Action
          className="btn"
          onClick={async () => {
            await install.prompt();
            setInstall(null);
          }}
        >
          INSTALAR APP <ArrowUpRight size={16} />
        </Action>
      )}
    </aside>
  );
}
function Staff() {
  const { profile: p, notify } = useSession();
  const [modal, setModal] = useState("");
  const [scan, setScan] = useState(false);
  const ts = useLoad(() => api.list<Trivia>("trivias", "createdAt", 15), []);
  const es = useLoad(() => api.list<Meet>("events", "date", 15), []);
  const items = useLoad(
    () => api.list<Item>("marketplace", "createdAt", 30),
    [],
  );
  return (
    <>
      <Heading
        eyebrow={
          p!.role === "camilo_owner"
            ? "CONTROL TOTAL / CAMILO"
            : "SPOTTER STAFF / CONTROL"
        }
        title="Pit control."
      />
      <div className="admin-actions">
        <button className="glass" onClick={() => setScan(true)}>
          <ScanLine />
          <strong>Escanear pase</strong>
          <small>Cámara de acceso</small>
        </button>
        <button className="glass" onClick={() => setModal("trivia")}>
          <Flame />
          <strong>Nueva trivia</strong>
          <small>Listo en 15 segundos</small>
        </button>
        {p!.role === "camilo_owner" && (
          <>
            {[
              ["event", CalendarDays, "Crear meet"],
              ["post", Play, "Early access"],
              ["item", ShoppingBag, "Publicar drop"],
              ["access", ShieldCheck, "Equipo Spotters"],
            ].map(([key, Icon, title]) => {
              const I = Icon as typeof Home;
              return (
                <button
                  key={String(key)}
                  className="glass"
                  onClick={() => setModal(String(key))}
                >
                  <I />
                  <strong>{String(title)}</strong>
                  <small>
                    <Plus size={12} /> NUEVO
                  </small>
                </button>
              );
            })}
          </>
        )}
      </div>
      <div className="section-title">
        <h2>Trivias / Control en vivo</h2>
        <SyncButton onClick={ts.reload} />
      </div>
      <AsyncState {...ts} />
      {ts.data?.map((t) => (
        <StaffTrivia key={t.id} trivia={t} reload={ts.reload} />
      ))}
      {p!.role === "camilo_owner" && (
        <>
          <div className="section-title">
            <h2>Meets / Sorteos</h2>
            <SyncButton onClick={es.reload} />
          </div>
          <AsyncState {...es} />
          {es.data?.map((e) => (
            <StaffEvent key={e.id} meet={e} reload={es.reload} />
          ))}
          <details className="glass support">
            <summary>Inventario / Cerrar publicaciones</summary>
            <AsyncState {...items} />
            {items.data?.map((i) => (
              <div className="comment" key={i.id}>
                <strong>{i.title}</strong>
                <Action
                  className="btn"
                  onClick={async () => {
                    await api.patch(`marketplace/${i.id}`, {
                      active: !i.active,
                    });
                    items.reload();
                  }}
                >
                  {i.active ? "RETIRAR DEL SHOWROOM" : "PUBLICAR DE NUEVO"}
                </Action>
              </div>
            ))}
          </details>
        </>
      )}
      <OrderControl />
      {scan && (
        <Modal title="Control de acceso" close={() => setScan(false)}>
          <Scanner />
        </Modal>
      )}
      {modal && (
        <Modal
          title={
            {
              trivia: "Trivia flash",
              event: "Crear meet",
              post: "Early access",
              item: "Publicar en showroom",
              access: "Equipo de confianza",
            }[modal] || ""
          }
          close={() => setModal("")}
        >
          <AdminForm
            kind={modal}
            done={() => {
              setModal("");
              ts.reload();
              es.reload();
              items.reload();
              notify("Guardado en el garage.");
            }}
          />
        </Modal>
      )}
    </>
  );
}
function StaffTrivia({
  trivia: t,
  reload,
}: {
  trivia: Trivia;
  reload: () => void;
}) {
  const { profile } = useSession();
  const [results, setResults] = useState<Submission[] | null>(null);
  const [submissions, setSubmissions] = useState<Submission[] | null>(null);
  const loadSubmissions = async () => {
    const [all, top] = await Promise.all([
      api.triviaSubmissions(t.id),
      api.winners(t.id),
    ]);
    setSubmissions(all);
    setResults(top);
  };
  return (
    <div className="glass staff-card">
      <span className="eyebrow">{t.status.toUpperCase()}</span>
      <h3>{t.question}</h3>
      <Timer until={t.expiresAt.toMillis()} />
      {t.status === "active" && (
        <Action
          className="btn danger"
          onClick={async () => {
            await api.patch(`trivias/${t.id}`, { status: "closed" });
            reload();
          }}
        >
          CERRAR TRIVIA AHORA
        </Action>
      )}
      {profile?.role === "camilo_owner" && <Action className="btn danger" onClick={async () => { if (!window.confirm("¿Eliminar esta trivia y todas sus respuestas?")) return; await api.deleteTrivia(t.id); reload(); }}>ELIMINAR TRIVIA</Action>}
      <Action
        className="btn"
        onClick={loadSubmissions}
      >
        <Trophy size={16} /> VER TODAS LAS RESPUESTAS
      </Action>
      {submissions?.length === 0 && <p>Esta trivia todavía no tiene respuestas.</p>}
      {submissions?.map((s) => <div className="submission-row" key={s.id}>
        <div><strong>{s.displayName}</strong><small>Respuesta: {s.answer}</small><time>{s.submittedAt?.toDate().toLocaleString("es-MX", { dateStyle: "short", timeStyle: "medium" })}</time></div>
        <Action className="btn" disabled={s.accepted} onClick={async () => { await api.acceptTriviaAnswer(t.id, s.uid); await loadSubmissions(); }}>
          {s.accepted ? "MARCADA CORRECTA" : "MARCAR CORRECTA"}
        </Action>
      </div>)}
      {results && <div className="trivia-top3"><h4><Trophy size={15} /> TOP 3 VERIFICADO</h4>{results.length === 0 ? <p>Sin respuestas correctas verificadas.</p> : results.map((s, i) => <div key={s.id}><strong>#{i + 1} {s.displayName}</strong><time>{s.submittedAt?.toDate().toLocaleString("es-MX", { dateStyle: "short", timeStyle: "medium" })}</time></div>)}</div>}
      {results?.length === 0 && <p>Sin respuestas correctas registradas.</p>}
      {results?.map((s, i) => (
        <div key={s.id} className="winner">
          <strong>
            #{i + 1} {s.displayName}
          </strong>
          <time>{s.submittedAt?.toDate().toISOString()}</time>
          <small>
            Orden de recepción del servidor · empates no garantizan orden de
            envío
          </small>
          <Action
            disabled={s.awarded || t.status !== "closed"}
            className="btn"
            onClick={async () => {
              await api.awardTrivia(t.id, s);
              setResults(await api.winners(t.id));
            }}
          >
            {s.awarded ? "RPM ACREDITADOS" : "+1,000 RPM"}
          </Action>
          <Action
            disabled={s.delivered || t.status !== "closed"}
            className="btn"
            onClick={async () => {
              await api.patch(`trivias/${t.id}/submissions/${s.uid}`, {
                delivered: true,
              });
              setResults(await api.winners(t.id));
            }}
          >
            {s.delivered ? "PREMIO ENTREGADO" : "MARCAR ENTREGADO"}
          </Action>
        </div>
      ))}
    </div>
  );
}
function StaffEvent({ meet: e, reload }: { meet: Meet; reload: () => void }) {
  const [count, setCount] = useState(1);
  const [showRegistrations, setShowRegistrations] = useState(false);
  const registrations = useLoad(
    () => (showRegistrations ? api.eventRegistrations(e.id) : Promise.resolve([] as Registration[])),
    [showRegistrations, e.id],
  );
  return (
    <div className="glass staff-card">
      <h3>{e.title}</h3>
      <p>
        {e.confirmedCount} confirmados · {e.mode}
      </p>
      <button className="btn" onClick={() => setShowRegistrations((value) => !value)}>
        {showRegistrations ? "OCULTAR REGISTRADOS" : "VER PERSONAS REGISTRADAS"}
      </button>
      {showRegistrations && <div className="registrations-list">
        <AsyncState {...registrations} empty={!registrations.data?.length} />
        {registrations.data?.map((person, index) => <div className="registration-row" key={person.id}>
          <strong>{index + 1}. {person.displayName}</strong>
          <span className={`status-pill ${person.status}`}>{person.status === "confirmed" ? "CONFIRMADO" : "LISTA DE ESPERA"}</span>
          {person.checkedIn && <small>✓ Check-in realizado</small>}
        </div>)}
      </div>}
      {e.mode === "raffle" && !e.raffleDrawn && (
        <>
          <label>
            Ganadores
            <input
              type="number"
              min="1"
              max="400"
              value={count}
              onChange={(v) => setCount(Number(v.target.value))}
            />
          </label>
          <Action
            className="btn primary"
            onClick={async () => {
              await api.raffle(e.id, count);
              reload();
            }}
          >
            EJECUTAR SORTEO DEFINITIVO
          </Action>
          <small>
            Selección criptográficamente aleatoria. La operación no se puede
            repetir.
          </small>
        </>
      )}
      {e.raffleLocked && !e.raffleDrawn && (
        <Action
          className="btn danger"
          onClick={async () => {
            await api.patch(`events/${e.id}`, { raffleLocked: false });
            reload();
          }}
        >
          RECUPERAR SORTEO INTERRUMPIDO
        </Action>
      )}
      {e.raffleDrawn && <p className="success">Sorteo ejecutado.</p>}
    </div>
  );
}
function Field({
  name,
  label,
  type = "text",
  required = true,
  maxLength = 500,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  maxLength?: number;
}) {
  return (
    <label>
      {label}
      <input
        name={name}
        type={type}
        required={required}
        maxLength={maxLength}
        min={type === "number" ? "0" : undefined}
        step={type === "number" ? "any" : undefined}
      />
    </label>
  );
}
function AdminForm({ kind, done }: { kind: string; done: () => void }) {
  const { notify } = useSession();
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget),
      s = (name: string) => String(f.get(name) || "").trim();
    setBusy(true);
    try {
      if (kind === "trivia")
        await api.createTrivia(
          s("question"),
          s("answer"),
          s("prize"),
          Number(s("hours")),
        );
      if (kind === "event") {
        const date = new Date(s("date"));
        if (date.getTime() <= Date.now())
          throw new Error("Elige una fecha futura.");
        const capacity = Number(s("capacity"));
        if (
          s("mode") === "limited" &&
          (!Number.isInteger(capacity) || capacity < 1)
        )
          throw new Error("Define un cupo entero mayor que cero.");
        await api.create("events", {
          title: s("title"),
          date: api.Timestamp.fromDate(date),
          location: s("location"),
          mapUrl: safeUrl(s("mapUrl")),
          description: s("description"),
          mode: s("mode"),
          capacity,
          confirmedCount: 0,
          raffleDrawn: false,
          raffleLocked: false,
        });
      }
      if (kind === "post") {
        if (!safeUrl(s("url")) || !safeUrl(s("thumbnail")))
          throw new Error("Usa enlaces HTTPS válidos.");
        await api.create("earlyAccess", {
          title: s("title"),
          url: s("url"),
          thumbnail: s("thumbnail"),
          exclusiveUntil: api.Timestamp.fromMillis(
            Date.now() + Number(s("hours")) * 3600000,
          ),
        });
      }
      if (kind === "item") {
        const stock: Record<string, number> = {};
        if (s("category") !== "autos")
          for (const entry of s("stock").split(",")) {
            const [size, qty] = entry.split(":").map((x) => x.trim());
            if (!size || !/^\d+$/.test(qty || ""))
              throw new Error("Stock: S:10, M:10, L:5, XL:5");
            stock[size] = Number(qty);
          }
        if (!safeUrl(s("image"))) throw new Error("Usa una imagen HTTPS.");
        await api.create("marketplace", {
          title: s("title"),
          category: s("category"),
          image: s("image"),
          description: s("description"),
          price: Number(s("price")),
          stock,
          paymentUrl: safeUrl(s("paymentUrl")),
          active: true,
        });
      }
      if (kind === "access")
        await api.setAccess(s("email"), s("role") as Role | "remove");
      done();
    } catch (e) {
      notify(errorText(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="admin-form" onSubmit={submit}>
      {kind === "trivia" && (
        <>
          <Field name="question" label="Pregunta" />
          <Field name="answer" label="Respuesta correcta (privada)" />
          <Field name="prize" label="Premio" />
          <label>
            Duración
            <select name="hours">
              {[1, 3, 6, 12, 24].map((h) => (
                <option key={h} value={h}>
                  {h} horas
                </option>
              ))}
            </select>
          </label>
        </>
      )}
      {kind === "event" && (
        <>
          <Field name="title" label="Nombre del meet" />
          <Field name="date" label="Fecha y hora local" type="datetime-local" />
          <Field name="location" label="Punto de reunión" />
          <Field
            name="mapUrl"
            label="Enlace de Maps / Waze (HTTPS)"
            type="url"
          />
          <label>
            Descripción y reglas
            <textarea name="description" required maxLength={2000} />
          </label>
          <label>
            Acceso
            <select name="mode">
              <option value="open">Abierto</option>
              <option value="limited">Cupo limitado</option>
              <option value="raffle">Sorteo</option>
            </select>
          </label>
          <Field
            name="capacity"
            label="Cupo (0 si es abierto o sorteo)"
            type="number"
          />
        </>
      )}
      {kind === "post" && (
        <>
          <Field name="title" label="Título" />
          <Field
            name="url"
            label="Video YouTube, Vimeo o MP4 (HTTPS)"
            type="url"
          />
          <Field name="thumbnail" label="URL de miniatura (HTTPS)" type="url" />
          <label>
            Exclusividad
            <select name="hours">
              {[1, 3, 6, 12, 24].map((h) => (
                <option key={h} value={h}>
                  {h} horas
                </option>
              ))}
            </select>
          </label>
        </>
      )}
      {kind === "item" && (
        <>
          <Field name="title" label="Nombre del producto o auto" />
          <label>
            Categoría
            <select name="category">
              <option value="merch">Merch</option>
              <option value="autos">Autos</option>
              <option value="piezas">Piezas</option>
            </select>
          </label>
          <Field name="image" label="URL de foto (HTTPS)" type="url" />
          <Field name="description" label="Especificaciones" />
          <Field name="price" label="Precio MXN" type="number" />
          <Field
            name="stock"
            label="Stock por talla: S:10, M:10, L:5, XL:5 (vacío para autos)"
            required={false}
          />
          <Field
            name="paymentUrl"
            label="Enlace de pago (opcional; usa WhatsApp si está vacío)"
            type="url"
            required={false}
          />
        </>
      )}
      {kind === "access" && (
        <>
          <p>
            Los permisos se aplican en el servidor inmediatamente. El usuario
            debe volver a iniciar sesión para actualizar su consola. El límite
            de 11 Spotters se controla con un registro atómico.
          </p>
          <Field name="email" label="Correo Google" type="email" />
          <label>
            Rol
            <select name="role">
              <option value="spotter_mod">Spotter staff</option>
              <option value="member">Miembro</option>
              <option value="remove">Revocar acceso especial</option>
            </select>
          </label>
        </>
      )}
      <button className="btn primary" disabled={busy}>
        {busy ? "GUARDANDO…" : "PUBLICAR / GUARDAR"} <ArrowUpRight size={18} />
      </button>
    </form>
  );
}
function Scanner() {
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(
      null,
    ),
    [error, setError] = useState(""),
    [started, setStarted] = useState(false);
  useEffect(() => {
    if (!started) return;
    let scanner: import("html5-qrcode").Html5Qrcode | null = null,
      disposed = false,
      processing = false;
    const setup = async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (disposed) return;
        scanner = new Html5Qrcode("qr-reader");
        await scanner.start(
          { facingMode: "environment" },
          { fps: 8, qrbox: { width: 230, height: 230 } },
          async (text) => {
            if (processing || disposed) return;
            processing = true;
            scanner?.pause(true);
            try {
              const name = await api.checkIn(text);
              if (!disposed) {
                setResult({ ok: true, text: `ACCESO AUTORIZADO · ${name}` });
                navigator.vibrate?.(200);
              }
            } catch (e) {
              if (!disposed) setResult({ ok: false, text: errorText(e) });
            }
          },
          () => {},
        );
        if (disposed && scanner.isScanning) await scanner.stop();
      } catch (e) {
        if (!disposed) setError(`No se pudo abrir la cámara. ${errorText(e)}`);
      }
    };
    void setup();
    return () => {
      disposed = true;
      if (scanner?.isScanning) void scanner.stop().catch(() => {});
    };
  }, [started]);
  return (
    <>
      <p>
        Escanea el pase del asistente. El acceso y los RPM se registran una sola
        vez.
      </p>
      {!started && (
        <button
          className="btn primary"
          onClick={() => {
            setError("");
            setStarted(true);
          }}
        >
          <ScanLine /> ABRIR CÁMARA TRASERA
        </button>
      )}
      <div id="qr-reader" />
      {error && <p className="error">{error}</p>}
      {result && (
        <div role="alert" className={`scan-result ${result.ok ? "ok" : "bad"}`}>
          <ShieldCheck size={60} />
          <h2>{result.text}</h2>
          <button
            className="btn"
            onClick={() => {
              setResult(null);
              setStarted(false);
            }}
          >
            SIGUIENTE PASE
          </button>
        </div>
      )}
    </>
  );
}
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
if ("serviceWorker" in navigator)
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`)
      .catch(() => {});
  });

function OrderControl() {
  const state = useLoad(
    () =>
      api.list<{
        id: string;
        title: string;
        size: string;
        uid: string;
        status: string;
      }>("orders", "createdAt", 30),
    [],
  );
  return (
    <details className="glass support">
      <summary>Órdenes / Pagos y entregas</summary>
      <SyncButton onClick={state.reload} />
      <AsyncState {...state} empty={!state.data?.length} />
      {state.data?.map((o) => (
        <div className="comment" key={o.id}>
          <strong>
            {o.title} / {o.size}
          </strong>
          <p>
            {o.id}
            <br />
            {o.status}
          </p>
          {o.status === "reserved" && (
            <>
              <Action
                className="btn"
                onClick={async () => {
                  await api.settleOrder(o.id, "paid");
                  state.reload();
                }}
              >
                CONFIRMAR PAGO RECIBIDO
              </Action>
              <Action
                className="btn danger"
                onClick={async () => {
                  await api.settleOrder(o.id, "cancelled");
                  state.reload();
                }}
              >
                CANCELAR Y REPONER STOCK
              </Action>
            </>
          )}
          {o.status === "paid" && (
            <Action
              className="btn primary"
              onClick={async () => {
                await api.settleOrder(o.id, "fulfilled");
                state.reload();
              }}
            >
              ENTREGAR Y ACREDITAR INSIGNIA
            </Action>
          )}
        </div>
      ))}
    </details>
  );
}
