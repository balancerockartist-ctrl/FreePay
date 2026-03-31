import { useEffect, useState, useCallback } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import axios from "axios";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Copy, Key, Trash2, Settings, BookOpen, Plus, CheckCircle2 } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => toast.success("Copied to clipboard"));
}

// ---------------------------------------------------------------------------
// KeysTab – create & list FreePay API keys
// ---------------------------------------------------------------------------

function KeysTab() {
  const [keys, setKeys] = useState([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchKeys = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/keys`);
      setKeys(res.data);
    } catch (e) {
      toast.error("Failed to load API keys");
    }
  }, []);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  const createKey = async () => {
    if (!name || !email) {
      toast.error("Name and email are required");
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${API}/keys`, { name, owner_email: email });
      toast.success("API key created!");
      setName("");
      setEmail("");
      fetchKeys();
    } catch (e) {
      toast.error("Failed to create API key");
    } finally {
      setLoading(false);
    }
  };

  const deleteKey = async (id) => {
    try {
      await axios.delete(`${API}/keys/${id}`);
      toast.success("API key deactivated");
      fetchKeys();
    } catch (e) {
      toast.error("Failed to deactivate key");
    }
  };

  return (
    <div className="space-y-6">
      {/* Create form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create Universal API Key
          </CardTitle>
          <CardDescription>
            Get a single <code className="bg-muted px-1 rounded">fp_</code> key that works
            with OpenAI, Anthropic, and Google AI — no SDK changes needed.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-1">
            <Label htmlFor="key-name">Key name</Label>
            <Input
              id="key-name"
              placeholder="My project key"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="key-email">Owner email</Label>
            <Input
              id="key-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <Button onClick={createKey} disabled={loading} className="w-full">
              {loading ? "Creating…" : "Generate Key"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Keys list */}
      <div className="space-y-3">
        {keys.length === 0 && (
          <p className="text-center text-muted-foreground py-10">
            No keys yet — create one above.
          </p>
        )}
        {keys.map((k) => (
          <Card key={k.id} className={k.is_active ? "" : "opacity-50"}>
            <CardContent className="pt-4">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Key className="h-4 w-4 shrink-0 text-primary" />
                    <span className="font-semibold">{k.name}</span>
                    {!k.is_active && <Badge variant="secondary">Inactive</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">{k.owner_email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <code className="text-xs bg-muted px-2 py-1 rounded font-mono break-all">
                      {k.key}
                    </code>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 shrink-0"
                      onClick={() => copyToClipboard(k.key)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  {k.configured_providers.length > 0 && (
                    <div className="flex gap-1 flex-wrap mt-2">
                      {k.configured_providers.map((p) => (
                        <Badge key={p} variant="outline" className="text-xs capitalize gap-1">
                          <CheckCircle2 className="h-3 w-3 text-green-500" />
                          {p}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  {k.is_active && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteKey(k.id)}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Revoke
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ProvidersTab – attach real provider keys to a FreePay key
// ---------------------------------------------------------------------------

function ProvidersTab() {
  const [keys, setKeys] = useState([]);
  const [selectedKeyId, setSelectedKeyId] = useState("");
  const [openaiKey, setOpenaiKey] = useState("");
  const [anthropicKey, setAnthropicKey] = useState("");
  const [googleKey, setGoogleKey] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    axios.get(`${API}/keys`).then((res) => setKeys(res.data)).catch(() => {});
  }, []);

  const save = async () => {
    if (!selectedKeyId) {
      toast.error("Select a FreePay key first");
      return;
    }
    const payload = {};
    if (openaiKey) payload.openai = openaiKey;
    if (anthropicKey) payload.anthropic = anthropicKey;
    if (googleKey) payload.google = googleKey;
    if (Object.keys(payload).length === 0) {
      toast.error("Enter at least one provider API key");
      return;
    }
    setSaving(true);
    try {
      await axios.put(`${API}/keys/${selectedKeyId}/providers`, payload);
      toast.success("Provider keys saved!");
      setOpenaiKey("");
      setAnthropicKey("");
      setGoogleKey("");
    } catch (e) {
      toast.error("Failed to save provider keys");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configure Provider Keys
          </CardTitle>
          <CardDescription>
            Link your real provider API keys to a FreePay key. The gateway will use them
            when proxying requests — your callers only ever see the FreePay key.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label>FreePay key to configure</Label>
            <select
              className="w-full border rounded px-3 py-2 text-sm bg-background"
              value={selectedKeyId}
              onChange={(e) => setSelectedKeyId(e.target.value)}
            >
              <option value="">— Select a key —</option>
              {keys
                .filter((k) => k.is_active)
                .map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.name} ({k.key.slice(0, 18)}…)
                  </option>
                ))}
            </select>
          </div>

          <Separator />

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1">
              <Label htmlFor="openai-key">OpenAI API key</Label>
              <Input
                id="openai-key"
                type="password"
                placeholder="sk-..."
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Used for gpt-*, o1-*, o3-*, o4-* models</p>
            </div>
            <div className="space-y-1">
              <Label htmlFor="anthropic-key">Anthropic API key</Label>
              <Input
                id="anthropic-key"
                type="password"
                placeholder="sk-ant-..."
                value={anthropicKey}
                onChange={(e) => setAnthropicKey(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Used for claude-* models</p>
            </div>
            <div className="space-y-1">
              <Label htmlFor="google-key">Google AI API key</Label>
              <Input
                id="google-key"
                type="password"
                placeholder="AIza..."
                value={googleKey}
                onChange={(e) => setGoogleKey(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Used for gemini-* models</p>
            </div>
          </div>

          <Button onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save Provider Keys"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// UsageTab – code examples
// ---------------------------------------------------------------------------

const PROXY_URL = `${BACKEND_URL}/api/proxy/v1`;

function CodeBlock({ code }) {
  return (
    <div className="relative">
      <pre className="bg-muted rounded-lg p-4 text-xs overflow-x-auto font-mono">{code}</pre>
      <Button
        size="icon"
        variant="ghost"
        className="absolute top-2 right-2 h-6 w-6"
        onClick={() => copyToClipboard(code)}
      >
        <Copy className="h-3 w-3" />
      </Button>
    </div>
  );
}

function UsageTab() {
  const pythonOpenAI = `from openai import OpenAI

client = OpenAI(
    api_key="fp_YOUR_FREEPAY_KEY",   # your FreePay key
    base_url="${PROXY_URL}",          # FreePay gateway
)

# Works with ANY supported model – just change the model name
response = client.chat.completions.create(
    model="gpt-4o",          # → routed to OpenAI
    # model="claude-3-5-sonnet-20241022",  # → routed to Anthropic
    # model="gemini-1.5-pro",              # → routed to Google
    messages=[{"role": "user", "content": "Hello!"}],
)
print(response.choices[0].message.content)`;

  const pythonLangChain = `from langchain_openai import ChatOpenAI

llm = ChatOpenAI(
    model="claude-3-5-sonnet-20241022",
    openai_api_key="fp_YOUR_FREEPAY_KEY",
    openai_api_base="${PROXY_URL}",
)

print(llm.invoke("Hello!").content)`;

  const curlExample = `curl ${PROXY_URL}/chat/completions \\
  -H "Authorization: Bearer fp_YOUR_FREEPAY_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "gpt-4o",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'`;

  const jsExample = `import OpenAI from "openai";

const client = new OpenAI({
  apiKey: "fp_YOUR_FREEPAY_KEY",
  baseURL: "${PROXY_URL}",
  dangerouslyAllowBrowser: true,
});

const response = await client.chat.completions.create({
  model: "gemini-1.5-pro",  // switch providers just by changing the model
  messages: [{ role: "user", content: "Hello!" }],
});
console.log(response.choices[0].message.content);`;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            How the Universal Key Works
          </CardTitle>
          <CardDescription>
            Set your FreePay key and the FreePay base URL once. Switch AI providers by
            changing the model name — zero other code changes required.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3 text-sm text-center">
            {[
              { label: "OpenAI models", models: "gpt-4o, o1-mini, o3-mini…", color: "bg-green-100 dark:bg-green-900" },
              { label: "Anthropic models", models: "claude-3-5-sonnet…", color: "bg-blue-100 dark:bg-blue-900" },
              { label: "Google models", models: "gemini-1.5-pro…", color: "bg-yellow-100 dark:bg-yellow-900" },
            ].map(({ label, models, color }) => (
              <div key={label} className={`rounded-lg p-3 ${color}`}>
                <p className="font-semibold">{label}</p>
                <p className="text-xs text-muted-foreground mt-1">{models}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="font-semibold">Python – OpenAI SDK</h3>
        <CodeBlock code={pythonOpenAI} />

        <h3 className="font-semibold">Python – LangChain</h3>
        <CodeBlock code={pythonLangChain} />

        <h3 className="font-semibold">JavaScript / TypeScript</h3>
        <CodeBlock code={jsExample} />

        <h3 className="font-semibold">cURL</h3>
        <CodeBlock code={curlExample} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main layout
// ---------------------------------------------------------------------------

const Home = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3">
          <Key className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-xl font-bold leading-none">FreePay</h1>
            <p className="text-xs text-muted-foreground">Universal AI API Gateway</p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <Tabs defaultValue="keys">
          <TabsList className="mb-6">
            <TabsTrigger value="keys">
              <Key className="h-4 w-4 mr-1" /> API Keys
            </TabsTrigger>
            <TabsTrigger value="providers">
              <Settings className="h-4 w-4 mr-1" /> Providers
            </TabsTrigger>
            <TabsTrigger value="usage">
              <BookOpen className="h-4 w-4 mr-1" /> Usage
            </TabsTrigger>
          </TabsList>

          <TabsContent value="keys">
            <KeysTab />
          </TabsContent>
          <TabsContent value="providers">
            <ProvidersTab />
          </TabsContent>
          <TabsContent value="usage">
            <UsageTab />
          </TabsContent>
        </Tabs>
      </main>

      <Toaster />
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />}>
            <Route index element={<Home />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
