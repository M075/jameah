"use client";

import { useActionState, useRef, useState, useEffect } from "react";
import { saveSignature, type AdminActionState } from "@/app/admin/actions";

const MAX_BYTES = 2 * 1024 * 1024; // 2 MB
const ACCEPTED = ["image/png", "image/jpeg", "image/webp", "image/gif"];

export default function SignatureForm({
  currentSignature,
}: {
  currentSignature: string;
}) {
  const [state, formAction, pending] = useActionState<AdminActionState, FormData>(
    saveSignature,
    {},
  );
  const [preview, setPreview] = useState<string>(currentSignature);
  const [localError, setLocalError] = useState<string>("");
  const fileRef = useRef<HTMLInputElement>(null);

  // Keep the preview in sync when the server returns a freshly saved value.
  useEffect(() => {
    setPreview(currentSignature);
  }, [currentSignature]);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    setLocalError("");
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ACCEPTED.includes(file.type)) {
      setLocalError("Please choose a PNG, JPEG, WebP or GIF image.");
      e.target.value = "";
      return;
    }
    if (file.size > MAX_BYTES) {
      setLocalError("Image is too large (max 2 MB).");
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPreview(String(reader.result));
    reader.readAsDataURL(file);
  }

  return (
    <div className="mt-4">
      {preview ? (
        <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Principal's signature preview"
            className="max-h-32 object-contain"
          />
        </div>
      ) : (
        <div className="mb-4 rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center text-sm text-gray-400">
          No signature uploaded yet.
        </div>
      )}

      <form action={formAction} className="space-y-4">
        <input
          ref={fileRef}
          type="file"
          name="signatureFile"
          accept="image/png,image/jpeg,image/webp,image/gif"
          onChange={onFile}
          className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-md file:border-0 file:bg-emerald-700 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-emerald-800"
        />

        {/* The file is converted to a base64 data URL in the browser and
            submitted as `signature` so no separate upload/storage step is
            needed. */}
        <input type="hidden" name="signature" value={preview} />

        {localError ? (
          <p className="text-sm text-red-700">{localError}</p>
        ) : null}
        {state.errors ? (
          <ul className="space-y-1 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {state.errors.map((er, i) => (
              <li key={i}>• {er}</li>
            ))}
          </ul>
        ) : null}
        {state.ok ? (
          <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            Signature saved.
          </p>
        ) : null}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={pending || !preview}
            className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-60"
          >
            {pending ? "Saving…" : "Save signature"}
          </button>
          {preview ? (
            <button
              type="button"
              onClick={() => {
                setPreview("");
                if (fileRef.current) fileRef.current.value = "";
              }}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Clear
            </button>
          ) : null}
        </div>
      </form>
    </div>
  );
}
