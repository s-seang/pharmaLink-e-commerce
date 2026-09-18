import {
  Camera,
  FileText,
  Image,
  Mic,
  Paperclip,
  Phone,
  Play,
  Send,
  Square,
  Trash2,
  Video,
  X,
} from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import type { Store } from "../data";
import { telHref } from "../lib/geo";
import { CameraCapture, type CaptureKind } from "./CameraCapture";
import { StoreLogo } from "./StoreLogo";

type AttachKind = "image" | "video" | "audio" | "file";

/**
 * Something picked, shot, or dropped, sitting in the composer as a draft. It is
 * not a message yet — nothing here has been sent, and removing it is free.
 */
interface Attachment {
  id: string;
  kind: AttachKind;
  /** Object URL, revoked when the sheet goes away. */
  url: string;
  name: string;
  seconds?: number;
  /** Set while it plays its removal animation, just before it is dropped. */
  leaving?: boolean;
}

interface Message {
  id: number;
  from: "you" | "store";
  text: string;
  at: Date;
  attachments?: Attachment[];
}

/** Voice notes need both halves of the API; older browsers get no mic button. */
const CAN_RECORD =
  typeof window !== "undefined" &&
  "MediaRecorder" in window &&
  typeof navigator.mediaDevices?.getUserMedia === "function";

/**
 * Speech to text, where the browser has it. What comes back is typed into the
 * field for review — dictation fills the box, it never presses Send.
 */
interface Dictation {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult:
    | ((event: {
        results: ArrayLike<ArrayLike<{ transcript: string }>>;
      }) => void)
    | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
}

type DictationMaker = new () => Dictation;

const DICTATION: DictationMaker | undefined =
  typeof window === "undefined"
    ? undefined
    : ((
        window as unknown as {
          SpeechRecognition?: DictationMaker;
          webkitSpeechRecognition?: DictationMaker;
        }
      ).SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition?: DictationMaker })
        .webkitSpeechRecognition);

/** "0:07" */
function clock(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

function kindOf(type: string): AttachKind {
  if (type.startsWith("image/")) return "image";
  if (type.startsWith("video/")) return "video";
  if (type.startsWith("audio/")) return "audio";
  return "file";
}

/** How far the sheet must be pulled down before releasing dismisses it. */
const DISMISS_AT = 120;

/** Long enough for the shrink-out to finish, short enough to feel immediate. */
const REMOVE_MS = 160;

/**
 * Pull-up chat sheet for a store. It covers the products and everything below,
 * but stops underneath the navy band, so the store's name and rating stay
 * visible while you type. The top edge tracks the band as the page scrolls, and
 * clamps to the top of the viewport once the band has scrolled away.
 */
export function StoreChatSheet({
  store,
  open,
  onClose,
}: {
  store: Store;
  open: boolean;
  onClose: () => void;
}) {
  const top = useBandBottom();
  const [draft, setDraft] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      from: "store",
      text: `Hi, you're chatting with ${store.name}. How can we help today?`,
      at: new Date(),
    },
  ]);

  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [attaching, setAttaching] = useState(false);
  /** Which camera is open, if any. 'any' lets it do photo or video. */
  const [camera, setCamera] = useState<CaptureKind | "any" | null>(null);
  const [recording, setRecording] = useState(false);
  const [listening, setListening] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [micError, setMicError] = useState("");
  const [dropping, setDropping] = useState(false);

  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<BlobPart[]>([]);
  const secondsTimer = useRef<number>(0);
  const dictation = useRef<Dictation | null>(null);
  /** What was already typed when dictation started, so it appends. */
  const spokenFrom = useRef("");
  /** Kept so they can be revoked — an object URL outlives the blob otherwise. */
  const urls = useRef<string[]>([]);
  const nextId = useRef(0);

  /** One hidden input per source, because each takes a different `accept`. */
  const photoPicker = useRef<HTMLInputElement>(null);
  const videoPicker = useRef<HTMLInputElement>(null);
  const filePicker = useRef<HTMLInputElement>(null);

  const keep = (
    blob: Blob,
    kind: AttachKind,
    name: string,
    length?: number,
  ) => {
    const url = URL.createObjectURL(blob);
    urls.current.push(url);
    nextId.current += 1;
    const item: Attachment = {
      id: `a${nextId.current}`,
      kind,
      url,
      name,
      seconds: length,
    };
    setAttachments((current) => [...current, item]);
  };

  /**
   * Everything picked, shot, dropped or pasted lands here — as a draft in the
   * composer. Nothing is sent until Send is pressed.
   */
  const addFiles = (files: FileList | File[] | null | undefined) => {
    const chosen = files ? Array.from(files) : [];
    if (chosen.length === 0) return;

    chosen.forEach((file) =>
      keep(file, kindOf(file.type), file.name || "Attachment"),
    );
    setAttaching(false);
    inputRef.current?.focus();
  };

  const remove = (id: string) => {
    setAttachments((current) =>
      current.map((item) =>
        item.id === id ? { ...item, leaving: true } : item,
      ),
    );
    window.setTimeout(() => {
      setAttachments((current) => current.filter((item) => item.id !== id));
    }, REMOVE_MS);
  };

  const pick = (input: React.RefObject<HTMLInputElement | null>) => {
    setAttaching(false);
    input.current?.click();
  };

  const stopStream = () => {
    recorder.current?.stream.getTracks().forEach((track) => track.stop());
    recorder.current = null;
    window.clearInterval(secondsTimer.current);
    setRecording(false);
  };

  const startRecording = async () => {
    setMicError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const media = new MediaRecorder(stream);
      chunks.current = [];
      media.ondataavailable = (event) => chunks.current.push(event.data);
      media.start();
      recorder.current = media;
      setSeconds(0);
      setRecording(true);
      secondsTimer.current = window.setInterval(
        () => setSeconds((n) => n + 1),
        1000,
      );
    } catch {
      setMicError("Microphone access is needed to record a voice message.");
    }
  };

  /**
   * Stop, and either hand what was captured to the composer or throw it away.
   * Even a finished recording waits there for review.
   */
  const finishRecording = (keepIt: boolean) => {
    const media = recorder.current;
    if (!media) return;
    const held = seconds;

    media.onstop = () => {
      if (keepIt && chunks.current.length > 0) {
        keep(
          new Blob(chunks.current, { type: media.mimeType }),
          "audio",
          "Voice message",
          held,
        );
      }
      chunks.current = [];
    };

    media.stop();
    stopStream();
  };

  /** Dictate into the field. The words go in the box; Send stays yours. */
  const startDictation = () => {
    setMicError("");
    if (!DICTATION) {
      startRecording();
      return;
    }

    const engine = new DICTATION();
    engine.lang = navigator.language || "en-US";
    engine.interimResults = true;
    engine.continuous = true;
    spokenFrom.current = draft ? `${draft.replace(/\s+$/, "")} ` : "";

    engine.onresult = (event) => {
      let said = "";
      for (let i = 0; i < event.results.length; i += 1)
        said += event.results[i][0].transcript;
      setDraft(spokenFrom.current + said);
    };
    engine.onerror = () => {
      setMicError(
        "We could not hear that. Check microphone access and try again.",
      );
      setListening(false);
    };
    engine.onend = () => setListening(false);

    try {
      engine.start();
    } catch {
      setMicError("Dictation could not start.");
      return;
    }

    dictation.current = engine;
    setListening(true);
    inputRef.current?.focus();
  };

  const stopDictation = () => {
    dictation.current?.stop();
    dictation.current = null;
    setListening(false);
  };

  // Drag-to-dismiss: pull the sheet down past DISMISS_AT and it closes.
  const [drag, setDrag] = useState(0);
  const dragFrom = useRef<number | null>(null);

  const startDrag = (event: React.PointerEvent) => {
    dragFrom.current = event.clientY;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const moveDrag = (event: React.PointerEvent) => {
    if (dragFrom.current === null) return;
    // Downward only — dragging up should not lift the sheet off its anchor.
    setDrag(Math.max(0, event.clientY - dragFrom.current));
  };

  const endDrag = () => {
    if (dragFrom.current === null) return;
    dragFrom.current = null;
    if (drag > DISMISS_AT) onClose();
    setDrag(0);
  };

  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      // The menu is the innermost thing open, so it closes first.
      setAttaching((menu) => {
        if (!menu) onClose();
        return false;
      });
    };

    document.addEventListener("keydown", onKey);
    inputRef.current?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, attachments]);

  // The field grows with what is typed, up to a few lines, then scrolls.
  useEffect(() => {
    const node = inputRef.current;
    if (!node) return;
    node.style.height = "auto";
    // Empty goes back to its one-row height rather than whatever the last
    // measurement was, so the bar closes as cleanly as it opened.
    node.style.height = draft ? `${Math.min(node.scrollHeight, 120)}px` : "";
  }, [draft]);

  useEffect(
    () => () => {
      window.clearInterval(secondsTimer.current);
      dictation.current?.stop();
      recorder.current?.stream.getTracks().forEach((track) => track.stop());
      urls.current.forEach((url) => URL.revokeObjectURL(url));
    },
    [],
  );

  const ready = attachments.filter((item) => !item.leaving);
  const canSend = draft.trim().length > 0 || ready.length > 0;

  /** The only way a message leaves this sheet. */
  const send = (event?: FormEvent) => {
    event?.preventDefault();
    const text = draft.trim();
    if (!text && ready.length === 0) return;

    setDraft("");
    setAttachments([]);
    if (listening) stopDictation();
    setMessages((current) => [
      ...current,
      {
        id: current.length,
        from: "you",
        text,
        at: new Date(),
        attachments: ready.length > 0 ? ready : undefined,
      },
    ]);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter sends; Shift+Enter is a new line.
    if (event.key !== "Enter" || event.shiftKey) return;
    event.preventDefault();
    send();
  };

  const onPaste = (event: React.ClipboardEvent) => {
    const pasted = Array.from(event.clipboardData.files);
    if (pasted.length === 0) return;
    // Let the picture in, but leave any text on the clipboard alone.
    event.preventDefault();
    addFiles(pasted);
  };

  const multiline = draft.includes("\n") || draft.length > 42;

  /**
   * Non-breaking spaces hold the placeholder to one line. A textarea wraps it
   * where the input this replaced did not, and a wrapped placeholder opens the
   * bar to two lines before anything has been typed.
   */
  const placeholder = (
    listening ? "Listening…" : `Message ${store.name}…`
  ).replace(/ /g, " ");

  return (
    <>
      <div
        onClick={onClose}
        aria-hidden="true"
        style={{ top }}
        className={`fixed inset-x-0 bottom-0 z-[55] bg-black/40 transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        role="dialog"
        aria-modal="false"
        aria-label={`Chat with ${store.name}`}
        aria-hidden={!open}
        style={{
          top,
          transform: drag ? `translateY(${drag}px)` : undefined,
          transition: drag ? "none" : undefined,
        }}
        /* Full width on a phone. On a laptop it becomes a column of its own:
           a conversation read across 1400px is worse, not better. Centred with
           left/right insets rather than a translate, because the drag-to-
           dismiss writes its own transform. */
        className={`fixed inset-x-0 bottom-0 z-[56] flex flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl transition-transform duration-300 ease-out motion-reduce:transition-none lg:inset-x-[max(1.5rem,calc(50%-24rem))] xl:inset-x-[calc(50%-27rem)] ${
          open ? "translate-y-0" : "pointer-events-none translate-y-full"
        }`}
      >
        {/* Grab handle. Drag this or the header downwards to dismiss. */}
        <div
          onPointerDown={startDrag}
          onPointerMove={moveDrag}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          className="flex cursor-grab touch-none justify-center py-2.5 active:cursor-grabbing"
          role="button"
          tabIndex={-1}
          aria-label="Drag down to close chat"
        >
          <span className="h-1 w-10 rounded-full bg-line" aria-hidden="true" />
        </div>

        <header
          onPointerDown={startDrag}
          onPointerMove={moveDrag}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          className="flex touch-none items-center gap-3 border-b border-line px-4 pb-3"
        >
          <StoreLogo store={store} size={40} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink">
              {store.name}
            </p>
            <p className="truncate text-xs text-muted">
              Usually replies within a few minutes
            </p>
          </div>
          <a
            href={telHref(store.phone)}
            aria-label={`Call ${store.name}`}
            title={`Call ${store.name}`}
            className="rounded-full bg-teal-tint p-2 text-teal transition-colors hover:bg-teal hover:text-white"
          >
            <Phone size={18} />
          </a>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted transition-colors hover:bg-surface hover:text-ink"
            aria-label="Close chat"
          >
            <X size={20} />
          </button>
        </header>

        <div
          ref={listRef}
          className="flex flex-1 flex-col overflow-y-auto bg-surface px-4 py-4 lg:px-6 lg:py-5"
        >
          {/* `mt-auto` keeps a short conversation sitting on the composer
              rather than stranded at the top of a tall laptop panel. It still
              scrolls from the top once there is more than fits. */}
          <div className="mt-auto space-y-3">
            {messages.map((message) => {
              const carried = message.attachments ?? [];
              return (
                <div
                  key={message.id}
                  className={`flex ${message.from === "you" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm lg:max-w-[72%] ${
                      carried.length > 0
                        ? "rounded-br-sm border border-line bg-white text-ink"
                        : message.from === "you"
                          ? "rounded-br-sm bg-teal text-white"
                          : "rounded-bl-sm border border-line bg-white text-ink"
                    }`}
                  >
                    {carried.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {carried.map((item) => (
                          // One attachment gets the room; several share it, so a
                          // handful of photos does not fill the whole thread.
                          <SentAttachment
                            key={item.id}
                            item={item}
                            tight={carried.length > 1}
                          />
                        ))}
                      </div>
                    )}

                    {message.text && (
                      <p
                        className={`whitespace-pre-wrap ${carried.length > 0 ? "mt-2" : ""}`}
                      >
                        {message.text}
                      </p>
                    )}

                    <p
                      className={`mt-1 text-[11px] ${
                        message.from === "you" && carried.length === 0
                          ? "text-white/60"
                          : "text-muted"
                      }`}
                    >
                      {message.at.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {micError && (
          <p className="border-t border-line bg-surface px-4 py-2 text-xs text-sale">
            {micError}
          </p>
        )}

        {/* One bar, in the same place it has always been. Drafts stack inside
            it, so the review step and the place you type are the same thing. */}
        <form
          onSubmit={send}
          onDragOver={(event) => {
            if (!event.dataTransfer.types.includes("Files")) return;
            event.preventDefault();
            setDropping(true);
          }}
          onDragLeave={(event) => {
            if (
              event.currentTarget.contains(event.relatedTarget as Node | null)
            )
              return;
            setDropping(false);
          }}
          onDrop={(event) => {
            event.preventDefault();
            setDropping(false);
            addFiles(event.dataTransfer.files);
          }}
          className="relative border-t border-line p-3 lg:px-4 lg:py-3.5"
        >
          {/* Anywhere else dismisses the menu, the way a menu should. */}
          {attaching && (
            <button
              type="button"
              aria-label="Close attachment menu"
              onClick={() => setAttaching(false)}
              className="fixed inset-0 z-10 cursor-default"
            />
          )}

          {attaching && (
            <div className="menu-in absolute bottom-full left-3 z-20 mb-2 w-52 overflow-hidden rounded-xl border border-line bg-white shadow-xl">
              <AttachOption
                icon={Image}
                label="Photo"
                onClick={() => pick(photoPicker)}
              />
              <AttachOption
                icon={Video}
                label="Video"
                onClick={() => pick(videoPicker)}
              />
              <AttachOption
                icon={Camera}
                label="Camera"
                onClick={() => {
                  setAttaching(false);
                  setCamera("any");
                }}
              />
              <AttachOption
                icon={FileText}
                label="File"
                onClick={() => pick(filePicker)}
              />
            </div>
          )}

          {/* Grows from nothing to whatever the strip needs, so the bar opens
              upward rather than jumping to its new height. */}
          <div className="grow-strip" data-open={attachments.length > 0}>
            <div>
              <div className="no-scrollbar mb-2 flex gap-2 overflow-x-auto pb-1 pt-0.5">
                {attachments.map((item) => (
                  <DraftAttachment
                    key={item.id}
                    item={item}
                    onRemove={() => remove(item.id)}
                  />
                ))}
              </div>
            </div>
          </div>

          {recording ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => finishRecording(false)}
                className="btn shrink-0 rounded-full px-3 py-3 text-muted hover:bg-surface hover:text-sale"
                aria-label="Discard recording"
              >
                <Trash2 size={18} />
              </button>

              <p
                className="flex flex-1 items-center gap-2 text-sm font-medium text-ink"
                aria-live="polite"
              >
                <span
                  className="h-2.5 w-2.5 animate-pulse rounded-full bg-sale"
                  aria-hidden="true"
                />
                Recording… {clock(seconds)}
              </p>

              <button
                type="button"
                onClick={() => finishRecording(true)}
                className="btn shrink-0 rounded-full bg-teal px-3.5 py-3 text-white hover:bg-teal/90"
                aria-label="Stop recording and add it to the message"
              >
                <Square size={18} fill="currentColor" />
              </button>
            </div>
          ) : (
            <div className="flex items-end gap-2">
              <button
                type="button"
                onClick={() => setAttaching((on) => !on)}
                aria-expanded={attaching}
                aria-label="Attach a photo, video or file"
                className={`btn shrink-0 rounded-full px-3 py-3 transition-transform active:scale-95 ${
                  attaching
                    ? "bg-teal-tint text-teal"
                    : "text-teal hover:bg-teal-tint"
                }`}
              >
                <Paperclip size={18} />
              </button>

              <textarea
                ref={inputRef}
                rows={1}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={onKeyDown}
                onPaste={onPaste}
                placeholder={placeholder}
                aria-label="Your message"
                /* `min-w-0` because a textarea's intrinsic width is wide enough
                   to push the send button off a phone screen otherwise. */
                className={`input max-h-[120px] min-w-0 flex-1 resize-none py-2.5 focus:border-teal ${
                  multiline ? "rounded-2xl" : "rounded-full"
                }`}
              />

              {CAN_RECORD && !draft.trim() && !listening && (
                <button
                  type="button"
                  onClick={startDictation}
                  className="btn shrink-0 rounded-full px-3 py-3 text-teal transition-transform hover:bg-teal-tint active:scale-95"
                  aria-label={
                    DICTATION ? "Dictate a message" : "Record a voice message"
                  }
                >
                  <Mic size={18} />
                </button>
              )}

              {listening && (
                <button
                  type="button"
                  onClick={stopDictation}
                  className="btn shrink-0 animate-pulse rounded-full bg-sale/10 px-3 py-3 text-sale"
                  aria-label="Stop dictating"
                >
                  <Square size={18} fill="currentColor" />
                </button>
              )}

              <button
                type="submit"
                disabled={!canSend}
                className="btn shrink-0 rounded-full bg-teal px-3.5 py-3 text-white transition-transform hover:bg-teal/90 active:scale-90"
                aria-label="Send message"
              >
                <Send size={18} />
              </button>
            </div>
          )}

          {dropping && (
            <div className="shade-in pointer-events-none absolute inset-1.5 flex items-center justify-center rounded-xl border-2 border-dashed border-teal bg-teal-tint/90 text-sm font-semibold text-teal">
              Drop to attach
            </div>
          )}

          <input
            ref={photoPicker}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(event) => {
              addFiles(event.target.files);
              event.target.value = "";
            }}
          />
          <input
            ref={videoPicker}
            type="file"
            accept="video/*"
            multiple
            hidden
            onChange={(event) => {
              addFiles(event.target.files);
              event.target.value = "";
            }}
          />
          <input
            ref={filePicker}
            type="file"
            multiple
            hidden
            onChange={(event) => {
              addFiles(event.target.files);
              event.target.value = "";
            }}
          />
        </form>
      </aside>

      {camera && (
        <CameraCapture
          kind={camera === "any" ? undefined : camera}
          onCapture={(blob, shotKind) =>
            keep(
              blob,
              shotKind,
              shotKind === "video" ? "Camera video" : "Camera photo",
            )
          }
          onClose={() => setCamera(null)}
        />
      )}
    </>
  );
}

/** A draft sitting in the composer, with the X that takes it back out. */
function DraftAttachment({
  item,
  onRemove,
}: {
  item: Attachment;
  onRemove: () => void;
}) {
  return (
    <div
      className={`relative shrink-0 ${item.leaving ? "chip-out" : "chip-in"}`}
      data-attachment={item.kind}
    >
      {item.kind === "image" && (
        <img
          src={item.url}
          alt={item.name}
          className="h-16 w-16 rounded-lg border border-line object-cover lg:h-20 lg:w-20"
        />
      )}

      {item.kind === "video" && (
        <div className="relative h-16 w-16 overflow-hidden rounded-lg border border-line bg-black lg:h-20 lg:w-20">
          <video
            src={item.url}
            muted
            preload="metadata"
            className="h-full w-full object-cover"
          >
            <track kind="captions" />
          </video>
          <span className="absolute inset-0 flex items-center justify-center bg-black/25 text-white">
            <Play size={18} fill="currentColor" />
          </span>
        </div>
      )}

      {(item.kind === "audio" || item.kind === "file") && (
        <div className="flex h-16 w-36 flex-col justify-center gap-0.5 rounded-lg border border-line bg-surface px-2.5 lg:h-20 lg:w-44">
          {item.kind === "audio" ? (
            <Mic size={15} className="text-teal" />
          ) : (
            <FileText size={15} className="text-teal" />
          )}
          <p className="truncate text-[11px] font-medium text-ink">
            {item.name}
          </p>
          {item.seconds !== undefined && (
            <p className="text-[10px] text-muted">{clock(item.seconds)}</p>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${item.name}`}
        className="absolute -right-1.5 -top-1.5 rounded-full bg-ink/80 p-0.5 text-white shadow transition-colors hover:bg-ink"
      >
        <X size={13} />
      </button>
    </div>
  );
}

/** The same attachment once it has been sent. */
function SentAttachment({
  item,
  tight,
}: {
  item: Attachment;
  tight?: boolean;
}) {
  // Sized for the panel it sits in: a phone bubble, or the wider one a
  // laptop gets. Never beyond the bubble, so nothing scrolls sideways.
  const frame = tight
    ? "h-28 w-28 object-cover lg:h-36 lg:w-36"
    : "max-h-56 w-56 max-w-full lg:max-h-72 lg:w-72";

  if (item.kind === "image") {
    return (
      <img
        src={item.url}
        alt={item.name}
        className={`rounded-lg object-cover ${frame}`}
      />
    );
  }

  if (item.kind === "video") {
    return (
      <video controls src={item.url} className={`rounded-lg bg-black ${frame}`}>
        <track kind="captions" />
      </video>
    );
  }

  if (item.kind === "audio") {
    return (
      <div>
        <p className="flex items-center gap-1.5 text-xs font-medium text-muted">
          <Mic size={13} className="text-teal" />
          Voice message
          {item.seconds !== undefined ? ` · ${clock(item.seconds)}` : ""}
        </p>
        <audio
          controls
          src={item.url}
          className="mt-1.5 h-9 w-48 max-w-full lg:w-64"
        >
          <track kind="captions" />
        </audio>
      </div>
    );
  }

  return (
    <a
      href={item.url}
      download={item.name}
      className="flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-xs font-medium text-ink"
    >
      <FileText size={15} className="shrink-0 text-teal" />
      <span className="max-w-[12rem] truncate lg:max-w-[18rem]">
        {item.name}
      </span>
    </a>
  );
}

function AttachOption({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof Camera;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-ink transition-colors hover:bg-surface"
    >
      <Icon size={17} className="shrink-0 text-teal" />
      {label}
    </button>
  );
}

/** Bottom edge of the store's navy band, in viewport coordinates. */
function useBandBottom(): number {
  const [top, setTop] = useState(0);

  useEffect(() => {
    let frame = 0;

    const measure = () => {
      frame = 0;
      const band = document.querySelector("[data-store-band]");
      const next = band
        ? Math.max(0, Math.round(band.getBoundingClientRect().bottom))
        : 0;
      setTop((current) => (current === next ? current : next));
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  return top;
}
