// 1) Paste your Firebase web-app configuration below (Firebase Console > Project settings).
const firebaseConfig = {
  apiKey: "PASTE_API_KEY",
  authDomain: "PASTE_PROJECT_ID.firebaseapp.com",
  projectId: "PASTE_PROJECT_ID",
  storageBucket: "PASTE_PROJECT_ID.appspot.com",
  messagingSenderId: "PASTE_SENDER_ID",
  appId: "PASTE_APP_ID"
};

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const $ = (id) => document.getElementById(id);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentGrade = "10";
let unsubscribeMessages = null;
let currentUser = null;

const questionBank = {
  "10": {
    "Physics": [
      ["State Ohm's law.", "At constant temperature, the current through a conductor is directly proportional to the potential difference across its ends: V = IR."],
      ["What is the SI unit of electric power?", "The SI unit of electric power is watt (W). P = VI."],
      ["State the laws of reflection.", "The angle of incidence equals the angle of reflection, and the incident ray, reflected ray and normal lie in the same plane."]
    ],
    "Chemistry": [
      ["What is a chemical reaction?", "A process in which one or more substances (reactants) are converted into new substances (products)."],
      ["Define oxidation and reduction.", "Oxidation is addition of oxygen or removal of hydrogen. Reduction is removal of oxygen or addition of hydrogen."],
      ["What is pH?", "pH is a measure of how acidic or basic an aqueous solution is."]
    ],
    "Biology": [
      ["What is photosynthesis?", "The process by which green plants use sunlight and chlorophyll to prepare food from carbon dioxide and water, releasing oxygen."],
      ["Name the functional unit of the kidney.", "The nephron is the structural and functional unit of the kidney."],
      ["What is heredity?", "Heredity is the transmission of traits from parents to their offspring."]
    ]
  },
  "12": {
    "Physics": [
      ["State Gauss's law.", "The total electric flux through any closed surface is equal to 1/ε₀ times the net charge enclosed: ΦE = qₑₙc/ε₀."],
      ["Define electric potential.", "Electric potential at a point is the work done per unit positive test charge in bringing it from infinity to that point, without acceleration."],
      ["What is the condition for total internal reflection?", "Light must travel from an optically denser to a rarer medium, and the angle of incidence must exceed the critical angle."]
    ],
    "Chemistry": [
      ["Define molarity.", "Molarity is the number of moles of solute present in one litre of solution. M = moles of solute / volume of solution in litres."],
      ["What is the order of a reaction?", "The sum of the powers of concentration terms in the experimentally determined rate law."],
      ["What is a peptide bond?", "The –CO–NH– linkage formed between the carboxyl group of one amino acid and the amino group of another."]
    ],
    "Biology": [
      ["What is double fertilisation?", "In angiosperms, one male gamete fuses with the egg (syngamy) and the other fuses with the polar nuclei (triple fusion). Together these events are called double fertilisation."],
      ["What is DNA replication?", "The process by which DNA makes an identical copy of itself, usually before cell division."],
      ["Define ecosystem.", "An ecosystem is a functional unit of nature where living organisms interact with one another and with the physical environment."]
    ]
  }
};

function renderSubjects() {
  $("subjectGrid").innerHTML = "";
  const subjects = [
    ["⚡","Physics","Concepts, laws and numericals"],
    ["🧪","Chemistry","Reactions and key definitions"],
    ["🧬","Biology","Life processes and concepts"]
  ];
  for (const [icon,name,desc] of subjects) {
    const button = document.createElement("button");
    button.className = "subject-card";
    button.innerHTML = `<span class="subject-icon">${icon}</span><strong>${name}</strong><small>${desc}</small>`;
    button.addEventListener("click", () => showQuestions(name));
    $("subjectGrid").append(button);
  }
}
function setGrade(grade) {
  currentGrade = grade;
  document.querySelectorAll(".grade-tab").forEach(b => b.classList.toggle("selected", b.dataset.grade === grade));
  document.querySelectorAll(".side-item").forEach(b => b.classList.toggle("active", b.dataset.grade === grade));
  $("questionArea").hidden = true;
  $("subjectGrid").parentElement.hidden = false;
}
function showQuestions(subject) {
  $("subjectGrid").parentElement.hidden = true;
  $("questionArea").hidden = false;
  $("topicHeading").textContent = `Class ${currentGrade} · ${subject}`;
  const qs = questionBank[currentGrade][subject] || [];
  $("questionList").innerHTML = "";
  qs.forEach(([q,a],i) => {
    const details = document.createElement("details");
    details.className = "question-card";
    const summary = document.createElement("summary");
    summary.textContent = `${i+1}. ${q}`;
    const answer = document.createElement("div");
    answer.className = "answer";
    answer.textContent = a;
    details.append(summary,answer);
    $("questionList").append(details);
  });
}
document.querySelectorAll(".grade-tab").forEach(b => b.addEventListener("click", () => setGrade(b.dataset.grade)));
document.querySelectorAll(".side-item").forEach(b => b.addEventListener("click", () => {setGrade(b.dataset.grade); $("sidebar").classList.remove("open"); $("studyView").hidden=false; $("privateView").hidden=true;}));
$("backHome").addEventListener("click", () => { $("questionArea").hidden=true; $("subjectGrid").parentElement.hidden=false; });
$("homeBtn").addEventListener("click", () => { setGrade(currentGrade); $("studyView").hidden=false; $("privateView").hidden=true; });
$("menuBtn").addEventListener("click", () => $("sidebar").classList.toggle("open"));

function openModal(){ $("unlockModal").hidden=false; $("loginError").textContent=""; }
function closeModal(){ $("unlockModal").hidden=true; }
$("openUnlock").addEventListener("click", openModal);
$("closeUnlock").addEventListener("click", closeModal);
$("unlockModal").addEventListener("click", e => {if(e.target === $("unlockModal")) closeModal();});

$("loginForm").addEventListener("submit", async e => {
  e.preventDefault();
  $("loginButton").disabled = true;
  $("loginError").textContent = "Checking account…";
  try {
    await signInWithEmailAndPassword(auth, $("email").value.trim(), $("password").value);
    sessionStorage.setItem("privateChatUnlocked", "yes");
    closeModal();
    await showPrivateChat();
  } catch (err) {
    $("loginError").textContent = "Could not unlock. Check the email/password and Firebase setup.";
  } finally {
    $("loginButton").disabled = false;
  }
});

async function showPrivateChat() {
  if (!auth.currentUser || sessionStorage.getItem("privateChatUnlocked") !== "yes") return;
  currentUser = auth.currentUser;
  $("studyView").hidden = true;
  $("privateView").hidden = false;
  $("sidebar").classList.remove("open");
  if (unsubscribeMessages) unsubscribeMessages();
  const messagesRef = collection(db, "privateMessages");
  const q = query(messagesRef, orderBy("createdAt", "asc"));
  unsubscribeMessages = onSnapshot(q, snapshot => {
    $("messages").innerHTML = "";
    if (snapshot.empty) {
      const empty = document.createElement("div");
      empty.className = "empty-chat";
      empty.textContent = "No messages yet. Start the conversation.";
      $("messages").append(empty);
      return;
    }
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      const bubble = document.createElement("div");
      bubble.className = "message" + (data.uid === currentUser.uid ? " mine" : "");
      const body = document.createElement("div");
      body.textContent = data.text || "";
      const meta = document.createElement("div");
      meta.className = "message-meta";
      const date = data.createdAt?.toDate ? data.createdAt.toDate() : new Date();
      meta.textContent = `${data.email || "User"} · ${date.toLocaleString()}`;
      bubble.append(body,meta);
      $("messages").append(bubble);
    });
    $("messages").scrollTop = $("messages").scrollHeight;
  }, () => {
    $("messages").textContent = "Unable to load messages. Check Firestore security rules.";
  });
}
$("messageForm").addEventListener("submit", async e => {
  e.preventDefault();
  const text = $("messageInput").value.trim();
  if (!text || !currentUser || sessionStorage.getItem("privateChatUnlocked") !== "yes") return;
  $("messageInput").value = "";
  try {
    await addDoc(collection(db, "privateMessages"), {
      text, uid: currentUser.uid, email: currentUser.email || "User", createdAt: serverTimestamp()
    });
  } catch (err) {
    alert("Message not sent. Check your internet connection and Firestore rules.");
  }
});

async function lockPrivateChat() {
  sessionStorage.removeItem("privateChatUnlocked");
  if (unsubscribeMessages) { unsubscribeMessages(); unsubscribeMessages = null; }
  currentUser = null;
  $("privateView").hidden = true;
  $("studyView").hidden = false;
  try { await signOut(auth); } catch {}
}
$("lockNow").addEventListener("click", lockPrivateChat);
$("backStudy").addEventListener("click", lockPrivateChat);

// A new tab/session starts locked, even if Firebase remembers the previous sign-in.
onAuthStateChanged(auth, user => {
  if (user && sessionStorage.getItem("privateChatUnlocked") === "yes") showPrivateChat();
  else if (user) signOut(auth);
});

window.addEventListener("pagehide", () => {
  sessionStorage.removeItem("privateChatUnlocked");
});
renderSubjects();
setGrade("10");
