import { useState } from "react";
import { ArrowUp, LoaderCircle, Plus, Sparkles, X } from "lucide-react";
import { fileUrl } from "../api";
import { STYLIST } from "../../shared/catalog";

const roundButton = "flex size-8 items-center justify-center rounded-full";

// Ask for an outfit: write what it's for, and pin pieces that must be in it.
// The chat with Stella shows inside the box.
export default function OutfitPrompt({
  wardrobe,
  isGenerating,
  chat,
  onSubmit,
}) {
  const [text, setText] = useState("");
  const [pinnedIds, setPinnedIds] = useState([]);
  const [pickerOpen, setPickerOpen] = useState(false);

  const pinned = wardrobe.filter((item) => pinnedIds.includes(item.id));

  function togglePin(id) {
    setPinnedIds(
      pinnedIds.includes(id)
        ? pinnedIds.filter((x) => x !== id)
        : [...pinnedIds, id],
    );
  }

  function submit(e) {
    e.preventDefault();
    if (isGenerating) return;
    setPickerOpen(false);
    onSubmit(text.trim(), pinnedIds);
    // Like a chat: the question moves down into the bubble
    setText("");
  }

  return (
    <form
      onSubmit={submit}
      className="relative mt-5 rounded-2xl border border-line bg-canvas/60 p-3 focus-within:border-brand/40"
    >
      {/* The chat with Stella. flex-col-reverse keeps it scrolled to the newest message. */}
      {chat.length > 0 && (
        <div className="mb-3 flex max-h-72 flex-col-reverse overflow-y-auto border-b border-line pb-3">
          <div className="flex flex-col gap-2 text-sm">
            {chat.map((message, index) => (
              <div key={index} className="flex flex-col gap-2">
                {message.question && (
                  <p className="max-w-md self-end rounded-2xl rounded-br-md bg-brand px-4 py-2 text-white">
                    {message.question}
                  </p>
                )}
                <div className="flex max-w-md items-start gap-2">
                  <span
                    title={STYLIST}
                    className="grid size-7 shrink-0 place-items-center rounded-full bg-selected text-brand"
                  >
                    <Sparkles size={14} />
                  </span>
                  <p
                    className={`rounded-2xl rounded-tl-md bg-surface px-4 py-2 whitespace-pre-line ${
                      message.answer ? "" : "animate-pulse text-muted"
                    }`}
                  >
                    {message.answer ?? `${STYLIST} is styling your fit…`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pinned pieces */}
      {pinned.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {pinned.map((item) => (
            <span
              key={item.id}
              className="flex items-center gap-1.5 rounded-lg border border-line bg-surface py-1 pr-1 pl-1 text-xs"
            >
              <img
                src={fileUrl(item.image)}
                alt=""
                className="size-6 object-contain"
              />
              {item.name}
              <button
                type="button"
                onClick={() => togglePin(item.id)}
                aria-label={`Remove ${item.name}`}
                className="rounded p-0.5 text-muted hover:text-ink"
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        // Enter sends, Shift+Enter makes a new line
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) submit(e);
        }}
        rows={2}
        placeholder={`Style with ${STYLIST}: dinner tonight, something smart…`}
        className="w-full resize-none bg-transparent text-sm outline-none placeholder:text-muted"
      />

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setPickerOpen(!pickerOpen)}
          aria-label="Add pieces from your wardrobe"
          className={`${roundButton} border border-line bg-surface text-brand hover:bg-selected`}
        >
          <Plus size={16} />
        </button>
        <button
          type="submit"
          disabled={isGenerating}
          aria-label="Generate outfit"
          className={`${roundButton} bg-brand text-white hover:bg-brand-hover disabled:opacity-50`}
        >
          {isGenerating ? (
            <LoaderCircle size={16} className="animate-spin" />
          ) : (
            <ArrowUp size={16} />
          )}
        </button>
      </div>

      {/* Wardrobe picker, opens above the box */}
      {pickerOpen && (
        <div className="absolute bottom-full left-0 z-10 mb-2 w-full max-w-sm rounded-2xl border border-line bg-surface p-3 shadow-lg">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium">Must include</p>
            <button
              type="button"
              onClick={() => setPickerOpen(false)}
              className="text-xs text-brand"
            >
              Done
            </button>
          </div>
          <div className="grid max-h-64 grid-cols-4 gap-2 overflow-y-auto">
            {wardrobe.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => togglePin(item.id)}
                title={item.name}
                className={`aspect-square rounded-xl border p-1.5 ${
                  pinnedIds.includes(item.id)
                    ? "border-brand bg-selected"
                    : "border-line hover:border-brand/40"
                }`}
              >
                <img
                  src={fileUrl(item.image)}
                  alt={item.name}
                  className="size-full object-contain"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </form>
  );
}
