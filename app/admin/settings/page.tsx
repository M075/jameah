import { getSettings } from "@/lib/models";
import { getRequestContext } from "@/lib/auth/context";
import SignatureForm from "@/components/admin/SignatureForm";

export default async function AdminSettingsPage() {
  await getRequestContext(); // enforces auth (proxy also guards /admin)
  const settings = await getSettings();

  return (
    <div>
      <h1 className="text-xl font-semibold text-emerald-900">Settings</h1>
      <p className="mt-1 text-sm text-gray-600">
        Configure institute-wide options applied to every report.
      </p>

      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-emerald-900">
          Principal&apos;s signature
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          Upload an image of the principal&apos;s signature. It is shown on the
          &ldquo;Principal&apos;s signature&rdquo; line of every student report
          (on screen and in the PDF).
        </p>

        <SignatureForm currentSignature={settings.signatureDataUrl || ""} />
      </div>
    </div>
  );
}
