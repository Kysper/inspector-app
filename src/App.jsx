import { useEffect, useRef, useState } from "react";
import "./assets/style.css";
import Login from "./Login";
import checklist from "./checklist.json";

const initialItems = checklist.map((item) => ({
  ...item,
  status: "pending",
  note: "",
  photos: [],
}));
const chunkSize = 3;
const zipLocations = {
  "66203": { city: "Merriam", state: "KS" },
  "97209": { city: "Portland", state: "OR" },
  "10001": { city: "New York", state: "NY" },
  "60601": { city: "Chicago", state: "IL" },
};
const inspectionHistory = [
  { property: "18 Hawthorn Lane", location: "Merriam, KS 66203", date: "Jun 1, 2024", status: "In progress", progress: "0/5" },
  { property: "42 Oak Street", location: "Overland Park, KS 66210", date: "May 28, 2024", status: "Complete", progress: "5/5" },
  { property: "907 Riverbend Drive", location: "Kansas City, MO 64111", date: "May 17, 2024", status: "Needs follow-up", progress: "4/5" },
  { property: "311 Cedar Court", location: "Shawnee, KS 66216", date: "May 9, 2024", status: "Complete", progress: "5/5" },
];
const draftStorageKey = "inspector-draft-024";

function readDraft() {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(window.localStorage.getItem(draftStorageKey));
  } catch {
    return null;
  }
}

function App() {
  const [user, setUser] = useState(null);

  const savedDraft = readDraft();
  const [items, setItems] = useState(savedDraft?.items || initialItems);
  const [activeIndex, setActiveIndex] = useState(0);
  const [listening, setListening] = useState(false);
  const [speechError, setSpeechError] = useState("");
  const [report, setReport] = useState(false);
  const [chunkIndex, setChunkIndex] = useState(0);
  const [property, setProperty] = useState(savedDraft?.property || "N/A");
  const [zipCode, setZipCode] = useState(savedDraft?.zipCode || "N/A");
  const [showHistory, setShowHistory] = useState(false);
  const recognitionRef = useRef(null);
  const listenIntentRef = useRef(false);
  const activeItem = items[activeIndex];
  const location = zipLocations[zipCode] || { city: "Location pending", state: "" };
  const chunks = Array.from(
    { length: Math.ceil(items.length / chunkSize) },
    (_, index) => items.slice(index * chunkSize, (index + 1) * chunkSize),
  );
  const visibleItems = chunks[chunkIndex] || [];
  const completed = items.filter((item) => item.status === "complete").length;
  const progress = Math.round((completed / items.length) * 100);
  useEffect(() => {
    window.localStorage.setItem(
      draftStorageKey,
      JSON.stringify({
        property,
        zipCode,
        items: items.map((item) => ({ ...item, photos: [] })),
      }),
    );
  }, [items, property, zipCode]);
  const updateActive = (changes) =>
    setItems((current) =>
      current.map((item, index) =>
        index === activeIndex ? { ...item, ...changes } : item,
      ),
    );
  const toggleListening = async () => {
    if (listening) {
      listenIntentRef.current = false;
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechError(
        "In-app dictation is not supported here. Try Chrome on Android, or tap the microphone on your phone keyboard while typing notes.",
      );
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setSpeechError(
        "This browser cannot access a microphone. Use your phone keyboard microphone to dictate into the notes field instead.",
      );
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
    } catch (error) {
      const permissionMessage =
        error.name === "NotAllowedError"
          ? "Microphone access is blocked. Allow microphone access for this site, then try again."
          : error.name === "NotFoundError"
            ? "No microphone was found. Check that a microphone is connected and try again."
            : "The microphone could not be opened. Check your browser and system microphone settings.";
      setSpeechError(permissionMessage);
      return;
    }
    const recognition = new SpeechRecognition();
    let committedNote = activeItem.note;
    setSpeechError("");
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onresult = (event) => {
      const results = Array.from(event.results).slice(event.resultIndex);
      const finalText = results
        .filter((result) => result.isFinal)
        .map((result) => result[0].transcript)
        .join(" ")
        .trim();
      const interimText = results
        .filter((result) => !result.isFinal)
        .map((result) => result[0].transcript)
        .join(" ")
        .trim();
      if (finalText)
        committedNote = `${committedNote}${committedNote ? " " : ""}${finalText}`;
      const displayNote = `${committedNote}${interimText ? `${committedNote ? " " : ""}${interimText}` : ""}`;
      setItems((current) =>
        current.map((item, index) =>
          index === activeIndex ? { ...item, note: displayNote } : item,
        ),
      );
    };
    recognition.onstart = () => setListening(true);
    recognition.onend = () => {
      if (listenIntentRef.current) {
        window.setTimeout(() => {
          if (listenIntentRef.current) recognition.start();
        }, 150);
      } else setListening(false);
    };
    recognition.onerror = (event) => {
      if (
        event.error === "not-allowed" ||
        event.error === "service-not-allowed"
      )
        setSpeechError(
          "Microphone access is blocked. Allow microphone access in your browser, then try again.",
        );
      else if (event.error === "audio-capture")
        setSpeechError(
          "No microphone was found. Check that a microphone is connected and try again.",
        );
      else if (event.error === "network")
        setSpeechError(
          "Voice transcription needs a speech service connection. Check your network and try again.",
        );
      else if (event.error === "aborted")
        setSpeechError(
          "The browser ended voice capture before hearing audio. Check your microphone input and try again.",
        );
      else if (event.error === "language-not-supported")
        setSpeechError(
          "This browser does not support English voice recognition. Type your notes instead.",
        );
      else if (event.error !== "no-speech")
        setSpeechError(
          `Voice transcription error (${event.error}). Check your microphone and try again.`,
        );
      if (event.error !== "no-speech") {
        listenIntentRef.current = false;
        setListening(false);
      }
    };
    recognitionRef.current = recognition;
    listenIntentRef.current = true;
    recognition.start();
    setListening(true);
  };
  const addPhotos = (event) => {
    const photos = Array.from(event.target.files || []).map((file) => ({
      name: file.name,
      url: URL.createObjectURL(file),
    }));
    updateActive({ photos: [...activeItem.photos, ...photos] });
    event.target.value = "";
  };
  const selectChunk = (index) => {
    setChunkIndex(index);
    setActiveIndex(index * chunkSize);
  };
  const completeStep = () => {
    updateActive({ status: "complete" });
    if (activeIndex < items.length - 1) {
      const nextIndex = activeIndex + 1;
      setActiveIndex(nextIndex);
      setChunkIndex(Math.floor(nextIndex / chunkSize));
    } else setReport(true);
  };
  const previousStep = () => {
    if (activeIndex === 0) return;
    const previousIndex = activeIndex - 1;
    setActiveIndex(previousIndex);
    setChunkIndex(Math.floor(previousIndex / chunkSize));
  };
  if (report)
    return (
      <Report
        items={items}
        completed={completed}
        property={property}
        onBack={() => setReport(false)}
      />
    );
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-symbol">+</span>
          <span>Inspector</span>
        </div>
        <div className="workspace-label">WORKSPACE</div>
        <nav>
          <button
            className={`nav-item ${showHistory ? "" : "active"}`}
            onClick={() => setShowHistory(false)}
          >
            <span>◈</span> Current inspection
          </button>
          <button
            className={`nav-item ${showHistory ? "active" : ""}`}
            onClick={() => setShowHistory(true)}
          >
            <span>▣</span> Inspection history
          </button>
        </nav>
        <div className="sidebar-bottom">
          <Login
            user={user}
            onLogin={(name) => setUser({ name, isLoggedin: true })}
            onLogout={() => setUser(null)}
          />
        </div>
      </aside>
      <main className="main-content">
        {showHistory ? (
          <History onBack={() => setShowHistory(false)} />
        ) : (
          <>
        <header className="topbar">
          <div>
            <span className="eyebrow">FIELD WORKSPACE / INSPECTION 024</span>
            <h1>Site inspection</h1>
          </div>
          <div className="header-actions">
            <span className="save-state">
              <i /> Saved just now
            </span>
            <button className="outline-button" onClick={() => setReport(true)}>
              View report
            </button>
          </div>
        </header>
        <section className="inspection-meta">
          <label>
            PROPERTY NAME
            <input
              value={property}
              onChange={(event) => setProperty(event.target.value)}
            />
          </label>
          <label>
            ZIP CODE
            <input
              value={zipCode}
              inputMode="numeric"
              maxLength={5}
              onChange={(event) => setZipCode(event.target.value.replace(/\D/g, ""))}
            />
          </label>
          <Meta
            icon="⌖"
            label="Location"
            value={`${location.city}${location.state ? `, ${location.state}` : ""} ${zipCode}`}
          />
          <Meta icon="◷" label="Started" value="Today, 9:42 AM" />
        </section>
        <div className="progress-row">
          <div className="progress-copy">
            <strong>
              {completed === items.length
                ? "Inspection complete"
                : `Step ${activeIndex + 1} of ${items.length}`}
            </strong>
            <span>{progress}% complete</span>
          </div>
          <div className="progress-track">
            <div style={{ width: `${Math.max(progress, 4)}%` }} />
          </div>
        </div>
        <section className="inspection-layout">
          <Checklist
            items={visibleItems}
            activeIndex={activeIndex - chunkIndex * chunkSize}
            onSelect={(index) => setActiveIndex(chunkIndex * chunkSize + index)}
            areas={chunks}
            areaIndex={chunkIndex}
            onSelectArea={selectChunk}
          />
          <div className="work-panel">
            <div className="work-heading">
              <div>
                <span className="step-kicker">STEP 0{activeIndex + 1}</span>
                <h2>{activeItem.title}</h2>
                <p>{activeItem.prompt}</p>
              </div>
              <span className="active-dot">● Live</span>
            </div>
            <div className="note-label">
              <span>FIELD NOTES</span>
              <span>Voice enabled</span>
            </div>
            <div className={`note-box ${listening ? "listening" : ""}`}>
              <textarea
                value={activeItem.note}
                onChange={(event) => updateActive({ note: event.target.value })}
                placeholder="Describe what you see, or use the microphone to dictate..."
              />
              <button className="mic-button" onClick={toggleListening}>
                <span>{listening ? "■" : "●"}</span>
                {listening ? "Stop recording" : "Start dictation"}
              </button>
            </div>
            {listening && (
              <div className="listening-status">
                <span className="pulse" /> Listening for notes... speak
                naturally
              </div>
            )}
            {speechError && (
              <div className="speech-error" role="alert">
                {speechError}
              </div>
            )}
            <div className="evidence-heading">
              <div>
                <span className="eyebrow">VISUAL EVIDENCE</span>
                <strong>Photos</strong>
              </div>
              <span>{activeItem.photos.length} attached</span>
            </div>
            <div className="photo-grid">
              {activeItem.photos.map((photo) => (
                <div className="photo-thumb" key={photo.url}>
                  <img src={photo.url} alt={photo.name} />
                </div>
              ))}
              <label className="upload-box">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  multiple
                  onChange={addPhotos}
                />
                <span>＋</span>
                <strong>Add photos</strong>
                <small>JPG, PNG up to 10MB</small>
              </label>
            </div>
            <div className="work-footer">
              <button
                className="previous-button"
                onClick={previousStep}
                disabled={activeIndex === 0}
              >
                Previous
              </button>
              <button
                className="skip-button"
                onClick={() => {
                  if (activeIndex < items.length - 1) {
                    const nextIndex = activeIndex + 1;
                    setActiveIndex(nextIndex);
                    setChunkIndex(Math.floor(nextIndex / chunkSize));
                  }
                }}
              >
                Skip for now
              </button>
              <button className="complete-button" onClick={completeStep}>
                {activeIndex === items.length - 1
                  ? "Complete inspection  ✓"
                  : "Mark complete  →"}
              </button>
            </div>
          </div>
        </section>
          </>
        )}
      </main>
    </div>
  );
}

function Meta({ icon, label, value }) {
  return (
    <div className="meta-detail">
      <span className="meta-icon">{icon}</span>
      <div>
        <small>{label}</small>
        <strong>{value}</strong>
      </div>
    </div>
  );
}
function History({ onBack }) {
  return (
    <div className="history-page">
      <header className="topbar">
        <div>
          <span className="eyebrow">WORKSPACE / ARCHIVE</span>
          <h1>Inspection history</h1>
        </div>
        <button className="outline-button" onClick={onBack}>
          Current inspection
        </button>
      </header>
      <div className="history-intro">
        <span className="eyebrow">PROPERTY RECORDS</span>
        <p>Review recent walkthroughs, findings, and report status.</p>
      </div>
      <div className="history-list">
        {inspectionHistory.map((inspection) => (
          <article className="history-row" key={inspection.property}>
            <div className="history-property">
              <strong>{inspection.property}</strong>
              <small>{inspection.location}</small>
            </div>
            <div className="history-date">
              <small>INSPECTED</small>
              <span>{inspection.date}</span>
            </div>
            <div className="history-progress">
              <small>CHECKS</small>
              <span>{inspection.progress}</span>
            </div>
            <span className={`history-status ${inspection.status === "Complete" ? "complete" : "attention"}`}>
              {inspection.status}
            </span>
          </article>
        ))}
      </div>
    </div>
  );
}
function Checklist({ items, activeIndex, onSelect, areas, areaIndex, onSelectArea }) {
  return (
    <div className="checklist-panel">
      <div className="section-heading">
        <div>
            <span className="eyebrow">INSPECTION AREA</span>
          <h2>{items.length} property checks</h2>
        </div>
        <span className="count-badge">
          {items.filter((item) => item.status === "complete").length} /{" "}
          {items.length}
        </span>
      </div>
      <div className="checklist">
        {items.map((item, index) => (
          <button
            className={`check-row ${index === activeIndex ? "selected" : ""}`}
            onClick={() => onSelect(index)}
            key={item.title}
          >
            <span className={`check-icon ${item.status}`}>
              {item.status === "complete" ? "✓" : `${index + 1}`}
            </span>
            <span className="check-text">
              <strong>{item.title}</strong>
              <small>
                {item.status === "complete" ? "Completed" : "Ready to inspect"}
              </small>
            </span>
            <span className="chevron">›</span>
          </button>
        ))}
      </div>
      <div className="tip">
        <span>✦</span>
        <p>
          <strong>Inspector tip</strong>
          <br />
          Capture a photo whenever you flag an issue. It will be attached to the
          final report automatically.
        </p>
      </div>
      <div className="area-pips" aria-label="Inspection page progress">
        {areas.map((_, index) => (
          <button
            type="button"
            className={index === areaIndex ? "active" : ""}
            onClick={() => onSelectArea(index)}
            aria-label={`Go to inspection section ${index + 1}`}
            aria-current={index === areaIndex ? "page" : undefined}
            key={index}
          />
        ))}
      </div>
    </div>
  );
}
function Report({ items, completed, property, onBack }) {
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  return (
    <main className="report-page">
      <div className="report-toolbar no-print">
        <button className="text-button" onClick={onBack}>
          ← Back to inspection
        </button>
        <button className="primary-button" onClick={() => window.print()}>
          ↓ Download PDF
        </button>
      </div>
      <section className="report-sheet">
        <div className="report-heading">
          <div>
            <span className="eyebrow">FIELD REPORT / {new Date().toLocaleDateString()}</span>
            <h1>Inspection summary</h1>
            <p>{property}</p>
          </div>
          <span className="report-mark">
            INSPECT<span>O</span>R
          </span>
        </div>
        <div className="report-stats">
          <div>
            <strong>
              {completed}/{items.length}
            </strong>
            <span>Checks complete</span>
          </div>
          <div>
            <strong>
              {items.reduce((total, item) => total + item.photos.length, 0)}
            </strong>
            <span>Photos attached</span>
          </div>
          <div>
            <strong>Ready</strong>
            <span>Report status</span>
          </div>
        </div>
        <h2>Checklist findings</h2>
        <div className="report-findings">
          {items.map((item, index) => (
            <article className="finding" key={item.title}>
              <div className="finding-title">
                <span className="step-number">0{index + 1}</span>
                <strong>{item.title}</strong>
                <span
                  className={
                    item.status === "complete" ? "status complete" : "status"
                  }
                >
                  {item.status === "complete" ? "Complete" : "Pending"}
                </span>
              </div>
              <p>{item.note || "No notes recorded."}</p>
              {item.photos.length > 0 && (
                <div className="report-photos">
                  {item.photos.map((photo) => (
                    <button
                      className="report-photo-button"
                      onClick={() => setSelectedPhoto(photo)}
                      aria-label={`Enlarge ${photo.name}`}
                      key={photo.url}
                    >
                      <img src={photo.url} alt={photo.name} />
                    </button>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
        <footer>Generated with Inspector · {property}</footer>
      </section>
      {selectedPhoto && (
        <div
          className="photo-lightbox no-print"
          role="dialog"
          aria-modal="true"
          aria-label="Expanded inspection photo"
          onClick={() => setSelectedPhoto(null)}
        >
          <button
            className="lightbox-close"
            onClick={() => setSelectedPhoto(null)}
            aria-label="Close expanded photo"
          >
            ×
          </button>
          <img
            src={selectedPhoto.url}
            alt={selectedPhoto.name}
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}
    </main>
  );
}

export default App;
