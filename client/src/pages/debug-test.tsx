import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function DebugTest() {
  const [results, setResults] = useState<Record<string, any>>({});

  const testEndpoint = async (name: string, url: string, method: string = "GET", body?: any) => {
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json();
      setResults(prev => ({ ...prev, [name]: { status: res.status, data } }));
    } catch (error) {
      setResults(prev => ({ ...prev, [name]: { error: String(error) } }));
    }
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">API Endpoint Tester</h1>
      <div className="grid grid-cols-2 gap-2">
        <Button onClick={() => testEndpoint("Health", "/health")}>Test /health</Button>
        <Button onClick={() => testEndpoint("Ready", "/ready")}>Test /ready</Button>
        <Button onClick={() => testEndpoint("Products", "/api/products")}>Test /api/products</Button>
        <Button onClick={() => testEndpoint("Login", "/api/login", "POST", { email: "customer@thandizo.com", password: "test" })}>
          Test /api/login
        </Button>
      </div>
      <div className="space-y-4">
        {Object.entries(results).map(([name, result]: any) => (
          <Card key={name} className="p-4">
            <h3 className="font-bold">{name}</h3>
            <pre className="text-sm overflow-auto bg-slate-100 dark:bg-slate-800 p-2 rounded mt-2">
              {JSON.stringify(result, null, 2)}
            </pre>
          </Card>
        ))}
      </div>
    </div>
  );
}
