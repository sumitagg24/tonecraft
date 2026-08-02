"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowRight, ArrowLeft, Check } from "lucide-react";
import { api } from "@/lib/api-client";
import { toast } from "sonner";

const WRITING_TYPES = [
  { id: "professional", label: "Professional", emoji: "💼", description: "Work emails, reports, proposals" },
  { id: "business", label: "Business", emoji: "📊", description: "Marketing, sales, partnerships" },
  { id: "social_media", label: "Social Media", emoji: "📱", description: "Posts, stories, captions" },
  { id: "dating", label: "Dating", emoji: "❤️", description: "Messages, bios, conversations" },
  { id: "education", label: "Education", emoji: "🎓", description: "Essays, academic writing" },
  { id: "general", label: "General", emoji: "✨", description: "Everyday communication" },
];

const LANGUAGES = [
  { id: "english", label: "English", flag: "🇺🇸" },
  { id: "hindi", label: "Hindi", flag: "🇮🇳" },
  { id: "hinglish", label: "Hinglish", flag: "🇮🇳" },
];

const TONES = [
  { id: "professional", label: "Professional", color: "#3b82f6", emoji: "💼" },
  { id: "friendly", label: "Friendly", color: "#10b981", emoji: "😊" },
  { id: "funny", label: "Funny", color: "#f97316", emoji: "😂" },
  { id: "corporate", label: "Corporate", color: "#6366f1", emoji: "🏢" },
  { id: "romantic", label: "Romantic", color: "#f43f5e", emoji: "❤️" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [writingType, setWritingType] = useState("");
  const [language, setLanguage] = useState("");
  const [tone, setTone] = useState("");
  const [saving, setSaving] = useState(false);

  const canNext =
    (step === 1 && writingType) ||
    (step === 2 && language) ||
    (step === 3 && tone);

  const handleComplete = async () => {
    setSaving(true);
    try {
      await api("/api/user/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ writingType, language, tone }),
      });
      router.push("/chat");
    } catch {
      toast.error("Failed to save preferences. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
      <Card className="w-full max-w-lg">
        <CardContent className="p-8">
          {/* Progress */}
          <div className="flex items-center gap-2 mb-8">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    s < step
                      ? "bg-primary text-primary-foreground"
                      : s === step
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {s < step ? <Check className="w-4 h-4" /> : s}
                </div>
                {s < 3 && (
                  <div
                    className={`flex-1 h-0.5 rounded-full transition-colors ${
                      s < step ? "bg-primary" : "bg-muted"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {/* Step 1: Writing Type */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h2 className="text-2xl font-bold mb-2">What do you mostly write?</h2>
                <p className="text-muted-foreground mb-6">
                  We&apos;ll customize your experience based on your needs.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {WRITING_TYPES.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setWritingType(type.id)}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        writingType === type.id
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border hover:border-border/80 hover:bg-muted/30"
                      }`}
                    >
                      <span className="text-2xl">{type.emoji}</span>
                      <p className="font-medium mt-2">{type.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {type.description}
                      </p>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 2: Language */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h2 className="text-2xl font-bold mb-2">Preferred language</h2>
                <p className="text-muted-foreground mb-6">
                  Choose the language you write in most often.
                </p>
                <div className="space-y-3">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.id}
                      onClick={() => setLanguage(lang.id)}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${
                        language === lang.id
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border hover:border-border/80 hover:bg-muted/30"
                      }`}
                    >
                      <span className="text-3xl">{lang.flag}</span>
                      <span className="font-medium text-lg">{lang.label}</span>
                      {language === lang.id && (
                        <Badge className="ml-auto" variant="secondary">
                          Selected
                        </Badge>
                      )}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 3: Default Tone */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h2 className="text-2xl font-bold mb-2">Default tone</h2>
                <p className="text-muted-foreground mb-6">
                  Pick a default tone. You can always change this later.
                </p>
                <div className="space-y-3">
                  {TONES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTone(t.id)}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${
                        tone === t.id
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border hover:border-border/80 hover:bg-muted/30"
                      }`}
                    >
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                        style={{ backgroundColor: `${t.color}15` }}
                      >
                        {t.emoji}
                      </div>
                      <span className="font-medium">{t.label}</span>
                      {tone === t.id && (
                        <Badge className="ml-auto" variant="secondary">
                          Selected
                        </Badge>
                      )}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8">
            {step > 1 ? (
              <Button
                variant="ghost"
                onClick={() => setStep(step - 1)}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            ) : (
              <div />
            )}
            {step < 3 ? (
              <Button
                onClick={() => setStep(step + 1)}
                disabled={!canNext}
                className="gap-2"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                disabled={!canNext || saving}
                className="gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Get Started
                <Check className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
