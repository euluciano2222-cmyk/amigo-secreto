/* =========================================================
   PARTE 1 — Funções puras: não mexem na tela, só calculam.
   ========================================================= */

// Número inteiro aleatório de 0 até n-1, usando o gerador seguro do navegador.
function randInt(n) {
  const max = Math.floor(0xFFFFFFFF / n) * n;
  const buf = new Uint32Array(1);
  let x;
  do {
    crypto.getRandomValues(buf);
    x = buf[0];
  } while (x >= max); // descarta a sobra para todos os números terem a mesma chance
  return x % n;
}

// O SORTEIO.
// Devolve um array "to": a pessoa da posição i tirou a pessoa da posição to[i].
// 1) monta [0, 1, 2, ...]  2) embaralha  3) se alguém caiu na própria posição
// (tirou a si mesmo), embaralha de novo.
// Como é um embaralhamento, cada pessoa aparece exatamente uma vez:
// ninguém é tirado duas vezes e ninguém fica de fora.
function drawPairs(n) {
  if (n < 3) throw new Error("mínimo de 3 participantes");
  for (;;) {
    const to = Array.from({ length: n }, (_, i) => i);
    // Embaralhamento de Fisher-Yates
    for (let i = n - 1; i > 0; i--) {
      const j = randInt(i + 1);
      [to[i], to[j]] = [to[j], to[i]];
    }
    if (to.every((t, i) => t !== i)) return to;
  }
}

// Transforma um objeto em texto seguro para ir dentro de um link.
function encodeData(obj) {
  const bytes = new TextEncoder().encode(JSON.stringify(obj));
  let bin = "";
  bytes.forEach(b => { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// O caminho inverso: lê o texto do link e devolve o objeto.
function decodeData(str) {
  const b64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64 + "=".repeat((4 - b64.length % 4) % 4));
  const bytes = Uint8Array.from(bin, c => c.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

// Deixa só os dígitos; número brasileiro sem código do país ganha o 55.
function normalizePhone(raw) {
  const d = (raw || "").replace(/\D/g, "");
  if (!d) return "";
  if (d.length === 10 || d.length === 11) return "55" + d;
  return d;
}

// "2026-12-24" vira "24/12/2026".
function formatDate(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || "");
  return m ? `${m[3]}/${m[2]}/${m[1]}` : "";
}

/* =========================================================
   PARTE 2 — A tela: eventos, listas e troca de telas.
   ========================================================= */
if (typeof document !== "undefined") (function () {
  const KEY = "amigo-secreto-natal-v1"; // nome da gaveta no localStorage
  const $ = id => document.getElementById(id);
  const views = ["view-setup", "view-send", "view-reveal", "view-error"];
  const show = id => views.forEach(v => { $(v).hidden = v !== id; });

  // O "estado": tudo o que o site precisa lembrar.
  let state = { group: "", value: "", date: "", people: [], drawn: null };

  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(KEY));
      if (s && Array.isArray(s.people)) state = s;
    } catch (e) { /* sem armazenamento: segue só na memória */ }
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
  }

  /* ---------- Neve ---------- */
  function makeSnow() {
    const snow = $("snow");
    for (let i = 0; i < 36; i++) {
      const f = document.createElement("span");
      f.className = "flake";
      f.textContent = "❄";
      f.style.left = Math.random() * 100 + "%";
      f.style.fontSize = 8 + Math.random() * 14 + "px";
      f.style.animationDuration = 7 + Math.random() * 9 + "s";
      f.style.animationDelay = -Math.random() * 16 + "s";
      snow.appendChild(f);
    }
  }

  /* ---------- Tela do participante ---------- */
  function renderReveal(code) {
    let d;
    try { d = decodeData(code); } catch (e) { d = null; }
    if (!d || !d.n || !d.t) { show("view-error"); return; }

    $("r-group").textContent = "Amigo Secreto" + (d.g ? " · " + d.g : "");
    $("r-hello").textContent = "Oi, " + d.n + "!";
    $("r-target").textContent = d.t;

    const parts = [];
    if (d.v) parts.push("Valor do presente: " + d.v);
    if (d.d) parts.push("Troca em " + formatDate(d.d));
    $("r-details").textContent = parts.join(" · ");
    document.title = "Amigo Secreto — " + d.n;

    const box = $("r-box"), btn = $("r-btn");
    btn.onclick = () => {
      const abrir = box.hidden;
      box.hidden = !abrir;
      box.classList.toggle("show", abrir);
      btn.textContent = abrir ? "Esconder" : "Ver quem eu tirei";
    };
    show("view-reveal");
  }

  /* ---------- Tela de cadastro ---------- */
  function renderSetup() {
    $("group").value = state.group;
    $("value").value = state.value;
    $("date").value = state.date;

    const ul = $("people");
    ul.textContent = "";
    state.people.forEach((p, i) => {
      const li = document.createElement("li");
      li.className = "person";

      const who = document.createElement("div");
      const name = document.createElement("div");
      name.className = "name";
      name.textContent = p.name;
      who.appendChild(name);
      if (p.phone) {
        const ph = document.createElement("div");
        ph.className = "phone";
        ph.textContent = "+" + p.phone;
        who.appendChild(ph);
      }

      const x = document.createElement("button");
      x.className = "remove";
      x.type = "button";
      x.setAttribute("aria-label", "Remover " + p.name);
      x.textContent = "×";
      x.onclick = () => { state.people.splice(i, 1); save(); renderSetup(); };

      li.append(who, x);
      ul.appendChild(li);
    });

    const n = state.people.length;
    $("count").textContent = n === 0 ? "" : n + (n === 1 ? " participante" : " participantes");
    $("draw").disabled = n < 3;
    $("file-warning").hidden = location.protocol !== "file:";
    show("view-setup");
  }

  ["group", "value", "date"].forEach(id => {
    $(id).addEventListener("input", e => { state[id] = e.target.value.trim(); save(); });
  });

  $("add-form").addEventListener("submit", e => {
    e.preventDefault(); // impede o formulário de recarregar a página
    const name = $("p-name").value.trim().replace(/\s+/g, " ");
    const phone = normalizePhone($("p-phone").value);
    const msg = $("add-msg");
    msg.textContent = "";

    if (!name) { msg.textContent = "Digite o nome."; return; }
    if (state.people.some(p => p.name.toLowerCase() === name.toLowerCase())) {
      msg.textContent = "Já existe alguém com esse nome. Use um sobrenome ou apelido.";
      return;
    }
    if ($("p-phone").value.trim() && phone.length < 12) {
      msg.textContent = "Número incompleto. Use DDD + número.";
      return;
    }

    state.people.push({ name, phone, sent: false });
    save();
    $("p-name").value = "";
    $("p-phone").value = "";
    renderSetup();
    $("p-name").focus();
  });

  $("draw").addEventListener("click", () => {
    if (!state.group) {
      $("draw-msg").textContent = "Dê um nome ao grupo antes de sortear.";
      $("group").focus();
      return;
    }
    $("draw-msg").textContent = "";
    state.drawn = drawPairs(state.people.length);
    state.people.forEach(p => { p.sent = false; });
    save();
    renderSend();
    window.scrollTo(0, 0);
  });

  /* ---------- Tela de envio ---------- */
  function linkFor(i) {
    const p = state.people[i];
    const t = state.people[state.drawn[i]];
    const data = { g: state.group, n: p.name, t: t.name };
    if (state.value) data.v = state.value;
    if (state.date) data.d = state.date;
    return location.origin + location.pathname + "#r=" + encodeData(data);
  }

  function messageFor(i) {
    const p = state.people[i];
    return "🎄 Amigo Secreto — " + state.group + "\n\n" +
      "Oi, " + p.name + "! O sorteio foi feito. Abra o link para ver quem você tirou " +
      "(é só seu, não mostre para ninguém 🤫):\n" + linkFor(i);
  }

  function renderSend() {
    $("send-title").textContent = state.group || "Amigo Secreto";
    const ul = $("send-list");
    ul.textContent = "";

    state.people.forEach((p, i) => {
      const li = document.createElement("li");
      li.className = "send";

      const head = document.createElement("div");
      head.className = "send-head";
      const name = document.createElement("span");
      name.className = "name";
      name.textContent = p.name;
      const sent = document.createElement("span");
      sent.className = "sent";
      sent.textContent = p.sent ? "✓ enviado" : "";
      head.append(name, sent);

      const actions = document.createElement("div");
      actions.className = "actions";

      const wa = document.createElement("a");
      wa.className = "btn whats small";
      wa.target = "_blank";
      wa.rel = "noopener";
      wa.href = "https://wa.me/" + (p.phone || "") + "?text=" + encodeURIComponent(messageFor(i));
      wa.textContent = "WhatsApp";
      wa.addEventListener("click", () => { p.sent = true; save(); sent.textContent = "✓ enviado"; });

      const copy = document.createElement("button");
      copy.className = "btn outline small";
      copy.type = "button";
      copy.textContent = "Copiar mensagem";
      copy.onclick = async () => {
        try {
          await navigator.clipboard.writeText(messageFor(i));
          copy.textContent = "Copiado!";
        } catch (e) {
          copy.textContent = "Não deu para copiar";
        }
        setTimeout(() => { copy.textContent = "Copiar mensagem"; }, 1800);
      };

      actions.append(wa, copy);
      li.append(head, actions);
      ul.appendChild(li);
    });
    show("view-send");
  }

  // Apagar pede dois toques, para ninguém perder o sorteio sem querer.
  let armed = false;
  $("reset").addEventListener("click", () => {
    const btn = $("reset");
    if (!armed) {
      armed = true;
      btn.textContent = "Tem certeza? Toque de novo para apagar";
      setTimeout(() => { armed = false; btn.textContent = "Apagar e começar outro grupo"; }, 4000);
      return;
    }
    armed = false;
    btn.textContent = "Apagar e começar outro grupo";
    state = { group: "", value: "", date: "", people: [], drawn: null };
    save();
    renderSetup();
    window.scrollTo(0, 0);
  });

  /* ---------- Qual tela mostrar? ---------- */
  // Se o endereço tem "#r=...", é um participante abrindo o link dele.
  // Se não tem, é o organizador.
  function route() {
    const m = /^#r=(.+)$/.exec(location.hash);
    if (m) { renderReveal(m[1]); return; }
    load();
    if (state.drawn && state.drawn.length === state.people.length) renderSend();
    else { state.drawn = null; renderSetup(); }
  }

  makeSnow();
  window.addEventListener("hashchange", route);
  route();
})();