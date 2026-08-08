"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { api, apiPost } from "@/lib/api-client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/suite/PageHeader";
import {
  CalendarDays, ChevronLeft, ChevronRight, Plus, Trash2, Loader2, Mic2, Wand2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  startAt: string;
  endAt: string | null;
  allDay: boolean;
  color: string;
}

const COLORS = ["#6366F1", "#10B981", "#F59E0B", "#EF4444", "#EC4899", "#06B6D4"];

export default function CalendarPage() {
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  // Hydration-safe "today": set after mount so the server and first client
  // render agree (a raw new Date() in render can differ at a day boundary).
  const [todayStr, setTodayStr] = useState("");
  useEffect(() => {
    setTodayStr(new Date().toDateString());
  }, []);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [title, setTitle] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [transcript, setTranscript] = useState("");
  const [notesLoading, setNotesLoading] = useState(false);
  const [notes, setNotes] = useState("");

  const load = useCallback(async () => {
    try {
      setEvents(await api<CalendarEvent[]>("/api/calendar"));
    } catch {
      toast.error("Failed to load calendar");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const grid = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const start = new Date(first);
    start.setDate(start.getDate() - first.getDay());
    const days: Date[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      days.push(d);
    }
    return days;
  }, [month]);

  const eventsFor = (day: Date) =>
    events.filter((e) => {
      const start = new Date(e.startAt);
      return (
        start.getFullYear() === day.getFullYear() &&
        start.getMonth() === day.getMonth() &&
        start.getDate() === day.getDate()
      );
    });

  const addEvent = async () => {
    if (!selectedDay || !title.trim()) return;
    try {
      const event = await apiPost<CalendarEvent>("/api/calendar", {
        title: title.trim(),
        startAt: selectedDay.toISOString(),
        allDay: true,
        color,
      });
      setEvents((prev) => [...prev, event]);
      setTitle("");
      setSelectedDay(null);
    } catch {
      toast.error("Failed to add event");
    }
  };

  const removeEvent = async (id: string) => {
    try {
      await api(`/api/calendar/${id}`, { method: "DELETE" });
      setEvents((prev) => prev.filter((e) => e.id !== id));
    } catch {
      toast.error("Failed to delete event");
    }
  };

  const generateNotes = async () => {
    if (!transcript.trim()) return;
    setNotesLoading(true);
    try {
      const result = await apiPost<{ content: string }>("/api/ai/assist", {
        action: "meeting_notes",
        text: transcript,
      });
      setNotes(result.content);
    } catch {
      toast.error("Failed to generate meeting notes");
    } finally {
      setNotesLoading(false);
    }
  };

  const addNotesAsEvent = () => {
    const match = notes.match(/^#+\s*(.+)$/m);
    const day = new Date();
    setSelectedDay(day);
    setTitle(match ? match[1] : "Meeting notes");
    setColor(COLORS[1]);
    setNotes(notes); // keep notes visible
  };

  const dayLabel = selectedDay?.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-6xl mx-auto space-y-5">
        <PageHeader
          title="Calendar"
          description="Plan your week and turn meeting transcripts into action items"
          icon={<CalendarDays className="w-4 h-4" />}
          actions={
            <Button onClick={addNotesAsEvent} variant="outline" className="gap-1.5">
              <Wand2 className="w-4 h-4 text-primary" /> Add notes to calendar
            </Button>
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5 items-start">
          {/* Month grid */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold capitalize">
                  {month.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </h2>
                <div className="flex items-center gap-1">
                  <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="p-1.5 rounded-md hover:bg-muted/60" aria-label="Previous month">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button onClick={() => setMonth(new Date())} className="px-2 py-1 text-xs rounded-md hover:bg-muted/60">
                    Today
                  </button>
                  <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="p-1.5 rounded-md hover:bg-muted/60" aria-label="Next month">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-1 mb-1">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                  <div key={d} className="text-center text-[10px] font-semibold uppercase text-muted-foreground/60 py-1">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {grid.map((day, i) => {
                  const dayEvents = eventsFor(day);
                  const isToday =
                    todayStr !== "" && day.toDateString() === todayStr;
                  const isOtherMonth = day.getMonth() !== month.getMonth();
                  return (
                    <button
                      key={i}
                      onClick={() => setSelectedDay(day)}
                      className={cn(
                        "min-h-[72px] rounded-lg border border-border/30 p-1.5 text-left transition-all hover:border-primary/40 hover:bg-muted/20",
                        isOtherMonth && "opacity-40",
                        isToday && "border-primary/50 bg-primary/5",
                        selectedDay?.toDateString() === day.toDateString() && "ring-2 ring-primary/50"
                      )}
                    >
                      <span className={cn("text-xs font-medium", isToday ? "text-primary" : "text-muted-foreground")}>
                        {day.getDate()}
                      </span>
                      <div className="space-y-1 mt-1">
                        {dayEvents.slice(0, 2).map((e) => (
                          <div
                            key={e.id}
                            className="text-[9px] leading-tight rounded px-1 py-0.5 truncate text-white"
                            style={{ backgroundColor: e.color }}
                          >
                            {e.title}
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <div className="text-[9px] text-muted-foreground px-1">+{dayEvents.length - 2} more</div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Side: selected day + AI meeting notes */}
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4 space-y-3">
                <h3 className="text-sm font-semibold">
                  {dayLabel ?? "Select a day"}
                </h3>
                {selectedDay && (
                  <>
                    <div className="flex gap-2">
                      <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Event title…"
                        onKeyDown={(e) => e.key === "Enter" && addEvent()}
                        className="h-9 text-sm"
                      />
                      <Button size="sm" onClick={addEvent} disabled={!title.trim()}><Plus className="w-4 h-4" /></Button>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {COLORS.map((c) => (
                        <button
                          key={c}
                          onClick={() => setColor(c)}
                          className="w-5 h-5 rounded-full transition-all"
                          style={{ backgroundColor: c, outline: color === c ? "2px solid var(--foreground)" : undefined }}
                          aria-label={`Color ${c}`}
                        />
                      ))}
                    </div>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {eventsFor(selectedDay).map((e) => (
                        <div key={e.id} className="flex items-center gap-2 rounded-lg border border-border/30 p-2 group">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: e.color }} />
                          <span className="flex-1 text-xs truncate">{e.title}</span>
                          <button onClick={() => removeEvent(e.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive" aria-label="Delete event">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                      {eventsFor(selectedDay).length === 0 && (
                        <p className="text-xs text-muted-foreground/60 py-2">No events this day.</p>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Mic2 className="w-4 h-4 text-primary" /> AI Meeting Notes
                </h3>
                <textarea
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  rows={5}
                  placeholder="Paste a meeting transcript — get decisions, action items, and owners…"
                  className="w-full rounded-lg border border-border/40 bg-muted/20 px-3 py-2 text-xs outline-none focus-visible:ring-1 focus-visible:ring-primary/50 resize-none"
                />
                <Button onClick={generateNotes} disabled={notesLoading || !transcript.trim()} className="w-full gap-1.5" size="sm">
                  {notesLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                  {notesLoading ? "Analyzing…" : "Generate notes"}
                </Button>
                {notes && (
                  <div className="rounded-lg border border-border/30 bg-muted/20 p-3 max-h-64 overflow-y-auto text-xs leading-relaxed prose prose-sm dark:prose-invert max-w-none">
                    {notes.split("\n").map((line, i) => {
                      if (line.startsWith("## ")) return <h3 key={i} className="font-semibold mt-2 first:mt-0">{line.slice(3)}</h3>;
                      if (line.startsWith("- ")) return <li key={i} className="list-disc ml-4">{line.slice(2)}</li>;
                      return <p key={i}>{line}</p>;
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
