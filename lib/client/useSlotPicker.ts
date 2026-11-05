"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { addMinutes, dotted, isoDate, localDate } from "./format";
import { ApiFailure } from "./api";

export type PickerState = "loading" | "grid" | "empty" | "error";

export function useSlotPicker(load: (() => Promise<Record<string, string[]>>) | null, options: { preselect?: { date: string; time: string } | null; durationMin?: number } = {}) {
  const [state, setState] = useState<PickerState>(load ? "loading" : "grid");
  const [slots, setSlots] = useState<Record<string, string[]>>({});
  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState("");
  const [taken, setTaken] = useState<string | null>(null);
  const loader = useRef(load);
  loader.current = load;
  const preselect = useRef(options.preselect);
  preselect.current = options.preselect;

  const refresh = useCallback(async () => {
    if (!loader.current) return;
    setState("loading");
    try {
      const next = await loader.current();
      setSlots(next);
      const dates = Object.keys(next).sort();
      const wanted = preselect.current;
      if (wanted && next[wanted.date]?.includes(wanted.time)) {
        setDate(localDate(wanted.date));
        setTime(wanted.time);
      } else {
        setDate(dates[0] ? localDate(dates[0]) : null);
        setTime("");
      }
      setState(dates.length > 0 ? "grid" : "empty");
    } catch (failure) {
      if (!(failure instanceof ApiFailure) || failure.status !== 401) setState("error");
    }
  }, []);

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load === null]);

  const dateKey = date ? isoDate(date) : "";
  const times = slots[dateKey] ?? [];
  const duration = options.durationMin ?? 30;

  return {
    state,
    slots,
    refresh,
    date,
    dateKey,
    time,
    times,
    taken,
    setTaken,
    pickDate: (next: Date) => {
      setDate(next);
      setTime("");
    },
    pickTime: setTime,
    availableDates: Object.keys(slots).filter((key) => slots[key].length > 0).map(localDate),
    dateLabel: dateKey ? dotted(dateKey) : "בחר יום ביומן",
    countLabel: `${times.length} מועדים פנויים`,
    confirmLabel: time ? `אישור מועד ${time} - ${addMinutes(time, duration)}` : "אישור מועד",
    markTaken: async () => {
      setTaken(time);
      await refresh();
    },
  };
}
