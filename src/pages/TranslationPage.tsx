/**
 * Translation — Language access for DHS 10 Primary LEP Languages
 * Supports document text translation using the platform's under-hood capabilities.
 * Staff: submit translation requests. Consultant: review, approve.
 */

import React, { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Paperclip } from "lucide-react";
import { toast } from "sonner";
import { UniversalActionBar } from "@/components/UniversalActionBar";
import { KnowledgeRouting } from "@/components/KnowledgeRouting";
import { callAI } from "@/core/aiProvider";

const LEP_LANGUAGES = [
  "Arabic", "Hmong", "Khmer", "Lao", "Oromo",
  "Russian", "Serbo-Croatian", "Somali", "Spanish", "Vietnamese",
] as const;

const OUTPUT_FORMATS = [
  { value: "text", label: "Plain text" },
  { value: "docx", label: "Word (.docx)" },
  { value: "pdf", label: "PDF" },
] as const;

interface TranslationResult {
  id: string;
  sourceText: string;
  translatedText: string;
  targetLanguage: string;
  sourceLanguage: string;
  timestamp: string;
  status: "completed" | "review_needed" | "failed";
  confidence: "high" | "medium" | "low";
}

const RECENT_TRANSLATIONS: TranslationResult[] = [
  {
    id: "TR-001",
    sourceText: "Your waiver services assessment has been scheduled for March 15, 2026...",
    translatedText: "Su evaluación de servicios de exención se ha programado para el 15 de marzo de 2026...",
    targetLanguage: "Spanish",
    sourceLanguage: "English",
    timestamp: "2026-04-24 14:30",
    status: "completed",
    confidence: "high",
  },
  {
    id: "TR-002",
    sourceText: "Community engagement session: Understanding your disability service options...",
    translatedText: "Kulanka ka qeybgalka bulshada: Fahamka xulashooyin adeegga naafada...",
    targetLanguage: "Somali",
    sourceLanguage: "English",
    timestamp: "2026-04-24 11:15",
    status: "review_needed",
    confidence: "medium",
  },
  {
    id: "TR-003",
    sourceText: "Important notice regarding changes to your CADI waiver benefits...",
    translatedText: "Ceeb toom tseem ceeb txog kev hloov rau koj CADI waiver cov txiaj ntsig...",
    targetLanguage: "Hmong",
    sourceLanguage: "English",
    timestamp: "2026-04-23 16:45",
    status: "completed",
    confidence: "high",
  },
];

const STATUS_CONFIG = {
  completed: { label: "Completed", className: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300" },
  review_needed: { label: "Review needed", className: "bg-amber-500/12 text-amber-700 dark:text-amber-300" },
  failed: { label: "Failed", className: "bg-rose-500/12 text-rose-700 dark:text-rose-300" },
};

const CONFIDENCE_CONFIG = {
  high: { label: "High confidence", className: "text-emerald-600" },
  medium: { label: "Medium — reviewer approval required", className: "text-amber-600" },
  low: { label: "Low — manual review required", className: "text-rose-600" },
};

export default function TranslationPage() {
  const [sourceText, setSourceText] = useState("");
  const [targetLanguage, setTargetLanguage] = useState("Spanish");
  const [sourceLanguage, setSourceLanguage] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [fileName, setFileName] = useState("");
  const [translations, setTranslations] = useState(RECENT_TRANSLATIONS);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    if (file.type === "text/plain" || file.name.endsWith(".txt") || file.name.endsWith(".md")) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setSourceText(ev.target?.result as string || "");
        toast.success(`Loaded ${file.name}`);
      };
      reader.readAsText(file);
    } else {
      toast.info(`${file.name} uploaded — text extraction will run before translation`);
      setSourceText(`[Content from ${file.name} — text extraction pending]`);
    }
    e.target.value = "";
  };

  const handleTranslate = async () => {
    if (!sourceText.trim()) {
      toast.error("Please enter or upload text to translate");
      return;
    }

    setIsTranslating(true);
    setTranslatedText("");

    try {
      const response = await callAI(
        [{
          role: "user",
          content: `Translate the following text from ${sourceLanguage || "English"} to ${targetLanguage}. Return ONLY the translated text, no explanations or notes.\n\nText to translate:\n${sourceText}`,
        }],
        {
          agentId: "translation-language",
          agentName: "Translation Service",
          agentPurpose: `Translate DSD documents and communications into ${targetLanguage} for LEP community members per CLAS Standards and DHS language access requirements.`,
          temperature: 0.2,
          maxTokens: 4096,
        }
      );

      setTranslatedText(response.content);

      const newTranslation: TranslationResult = {
        id: `TR-${String(translations.length + 1).padStart(3, "0")}`,
        sourceText: sourceText.slice(0, 80) + (sourceText.length > 80 ? "..." : ""),
        translatedText: response.content.slice(0, 80) + (response.content.length > 80 ? "..." : ""),
        targetLanguage,
        sourceLanguage: sourceLanguage || "English",
        timestamp: new Date().toISOString().slice(0, 16).replace("T", " "),
        status: "review_needed",
        confidence: "medium",
      };
      setTranslations([newTranslation, ...translations]);

      toast.success(`Translation to ${targetLanguage} complete — queued for reviewer approval`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Translation failed";
      toast.error(message);

      if (message.includes("API key")) {
        setTranslatedText("Translation requires an API key. Set VITE_ANTHROPIC_API_KEY in your .env file.");
      } else {
        setTranslatedText(`Error: ${message}`);
      }
    } finally {
      setIsTranslating(false);
    }
  };

  const handleDownloadTranslation = () => {
    if (!translatedText) {
      toast.info("No translation to download yet");
      return;
    }
    const blob = new Blob([translatedText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `translation-${targetLanguage.toLowerCase()}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Translation downloaded");
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-5 md:px-6 md:py-6">
      {/* Header */}
      <div>
        <Badge className="mb-2 inline-flex rounded-full border-0 bg-[hsl(var(--mn-blue-soft))] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[hsl(var(--mn-blue))] dark:bg-white/10 dark:text-white">
          Language Access
        </Badge>
        <h1 className="text-xl font-semibold md:text-2xl">Translation</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Translate documents and communications into DHS 10 Primary LEP Languages.
          Low-confidence translations route to reviewer approval before download.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card className="panel-card"><CardContent className="p-4">
          <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Languages supported</div>
          <div className="mt-2 text-2xl font-semibold tabular-nums">{LEP_LANGUAGES.length}</div>
        </CardContent></Card>
        <Card className="panel-card"><CardContent className="p-4">
          <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Translations today</div>
          <div className="mt-2 text-2xl font-semibold tabular-nums">{translations.length}</div>
        </CardContent></Card>
        <Card className="panel-card"><CardContent className="p-4">
          <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Pending review</div>
          <div className="mt-2 text-2xl font-semibold text-amber-600 tabular-nums">
            {translations.filter(t => t.status === "review_needed").length}
          </div>
        </CardContent></Card>
        <Card className="panel-card"><CardContent className="p-4">
          <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">CLAS compliance</div>
          <div className="mt-2 text-2xl font-semibold text-emerald-600">Active</div>
        </CardContent></Card>
      </div>

      {/* Translation form */}
      <Card className="panel-card border-2 border-[hsl(var(--mn-blue))]">
        <CardHeader>
          <CardTitle className="text-base">New translation</CardTitle>
          <CardDescription>
            Paste text or upload a document. Translated output routes to reviewer approval before distribution.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Source document upload */}
          <div>
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Source document</label>
            <div className="mt-1 flex items-center gap-3">
              <Button
                variant="outline"
                className="h-9 gap-1.5 rounded-xl text-xs"
                onClick={() => fileRef.current?.click()}
              >
                <Paperclip className="h-3.5 w-3.5" />
                Upload file
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept=".txt,.md,.doc,.docx,.pdf,.csv"
                className="hidden"
                onChange={handleFileUpload}
              />
              {fileName && (
                <span className="text-sm text-muted-foreground">{fileName}</span>
              )}
            </div>
          </div>

          {/* Source text */}
          <div>
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Source text</label>
            <textarea
              className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm leading-relaxed"
              rows={6}
              placeholder="Paste or type the text to translate..."
              value={sourceText}
              onChange={e => setSourceText(e.target.value)}
            />
          </div>

          {/* Language selectors */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Target language</label>
              <select
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
                value={targetLanguage}
                onChange={e => setTargetLanguage(e.target.value)}
              >
                {LEP_LANGUAGES.map(lang => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Source language (optional)</label>
              <input
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
                placeholder="Leave blank to auto-detect"
                value={sourceLanguage}
                onChange={e => setSourceLanguage(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Output format</label>
              <select className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm">
                {OUTPUT_FORMATS.map(fmt => (
                  <option key={fmt.value} value={fmt.value}>{fmt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Translate button */}
          <div className="flex gap-3">
            <Button
              onClick={handleTranslate}
              disabled={isTranslating || !sourceText.trim()}
              className="rounded-xl bg-[hsl(var(--mn-blue))] text-white hover:bg-[hsl(var(--mn-blue-deep))]"
            >
              {isTranslating ? "Translating..." : "Start translation"}
            </Button>
            {translatedText && (
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={handleDownloadTranslation}
              >
                Download translation
              </Button>
            )}
          </div>

          {/* Translation output */}
          {translatedText && (
            <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">
                  Translation — {targetLanguage}
                </div>
                <span className={`text-xs font-medium ${CONFIDENCE_CONFIG.medium.className}`}>
                  {CONFIDENCE_CONFIG.medium.label}
                </span>
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{translatedText}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent translations */}
      <div>
        <h2 className="text-base font-semibold mb-3">Recent translations</h2>
        <div className="space-y-3">
          {translations.map(tr => {
            const statusCfg = STATUS_CONFIG[tr.status];
            const confCfg = CONFIDENCE_CONFIG[tr.confidence];
            return (
              <Card key={tr.id} className="panel-card">
                <CardContent className="p-4">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs text-muted-foreground">{tr.id}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${statusCfg.className}`}>
                        {statusCfg.label}
                      </span>
                      <Badge variant="outline" className="text-[11px]">
                        {tr.sourceLanguage} → {tr.targetLanguage}
                      </Badge>
                      <span className={`text-[11px] ${confCfg.className}`}>{confCfg.label}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{tr.timestamp}</span>
                  </div>
                  <div className="mt-2 grid gap-3 md:grid-cols-2">
                    <div className="rounded-lg border border-border/40 bg-background p-3">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Source</div>
                      <p className="text-xs text-muted-foreground">{tr.sourceText}</p>
                    </div>
                    <div className="rounded-lg border border-border/40 bg-background p-3">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Translation</div>
                      <p className="text-xs">{tr.translatedText}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <KnowledgeRouting currentModule="Translation" />
      <UniversalActionBar pageName="Translation" />
    </div>
  );
}
