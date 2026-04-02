import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function EmailDemo() {
  const [recipientEmail, setRecipientEmail] = useState("customer@test.com");
  const [status, setStatus] = useState<string>("");
  const [letterHtml, setLetterHtml] = useState<string>("");

  const sendWelcomeEmail = async () => {
    setStatus("Sending...");
    try {
      const res = await fetch("/api/notifications/send", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("auth_token")}` },
        body: JSON.stringify({
          userId: "customer-1",
          type: "welcome",
          data: { role: "customer" },
        }),
      });
      const data = await res.json();
      setStatus(res.ok ? "✅ Email sent!" : `❌ ${data.message}`);
    } catch (err) {
      setStatus(`❌ Error: ${err}`);
    }
  };

  const generatePrescriptionLetter = async () => {
    setStatus("Generating...");
    try {
      const res = await fetch("/api/documents/prescription-letter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("auth_token")}`,
        },
        body: JSON.stringify({
          recipientName: "John Doe",
          recipientEmail,
          prescriptionId: "RX-2026-001",
          medicines: [
            { name: "Paracetamol 500mg", dosage: "500mg", frequency: "3x daily", duration: "7 days" },
            { name: "Amoxicillin 250mg", dosage: "250mg", frequency: "2x daily", duration: "10 days" },
          ],
          pharmacistName: "Dr. Sarah Banda",
          instructions: "Take with water after meals. Do not take if allergic to penicillin.",
        }),
      });

      if (res.ok) {
        const html = await res.text();
        setLetterHtml(html);
        setStatus("✅ Letter generated!");
      } else {
        setStatus("❌ Failed to generate letter");
      }
    } catch (err) {
      setStatus(`❌ Error: ${err}`);
    }
  };

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-bold">📧 Email & Document System Demo</h1>

      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">✉️ Send Email</h2>
        <div className="space-y-4">
          <Button onClick={sendWelcomeEmail} className="w-full">
            Send Welcome Email
          </Button>
          <p className="text-sm text-gray-600">{status}</p>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">📄 Generate Prescription Letter</h2>
        <div className="space-y-4">
          <Input
            placeholder="Recipient email"
            value={recipientEmail}
            onChange={(e) => setRecipientEmail(e.target.value)}
          />
          <Button onClick={generatePrescriptionLetter} className="w-full">
            Generate Professional Letter
          </Button>
          <p className="text-sm text-gray-600">{status}</p>
        </div>
      </Card>

      {letterHtml && (
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">📋 Generated Letter Preview</h2>
          <iframe
            srcDoc={letterHtml}
            className="w-full h-96 border rounded"
            title="prescription-letter"
          />
          <Button
            onClick={() => {
              const blob = new Blob([letterHtml], { type: "text/html" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "prescription-letter.html";
              a.click();
            }}
            className="mt-4 w-full"
          >
            Download Letter
          </Button>
        </Card>
      )}
    </div>
  );
}
