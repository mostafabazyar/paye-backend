"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type Props<T extends string | number> = {
  values: T[];
  value: T;
  onChange: (v: T) => void;
  labelFor?: (v: T) => string;
  width?: string;
  itemHeight?: number;
  visibleCount?: number;
};

export function ScrollWheel<T extends string | number>({
  values,
  value,
  onChange,
  labelFor,
  width = "w-20",
  itemHeight = 40,
  visibleCount = 5,
}: Props<T>) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const scrollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastWheelAt = useRef(0);

  // Drag state
  const isDragging = useRef(false);
  const dragStartY = useRef(0);
  const dragStartScrollTop = useRef(0);
  const lastMoveY = useRef(0);
  const lastMoveTime = useRef(0);

  const height = itemHeight * visibleCount;
  const padding = (height - itemHeight) / 2;

  const selectedIndex = Math.max(0, values.indexOf(value));

  /** Move selection by delta items (clamped) */
  function moveBy(delta: number) {
    const next = Math.max(
      0,
      Math.min(values.length - 1, selectedIndex + delta)
    );
    if (next !== selectedIndex) {
      onChange(values[next]);
    }
  }

  // Programmatic scroll to keep the active item centered
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const target = selectedIndex * itemHeight;
    if (Math.abs(el.scrollTop - target) > 2) {
      el.scrollTo({ top: target, behavior: "smooth" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIndex, itemHeight]);

  // Wheel: one item per tick, prevent page scroll
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    function onWheel(e: WheelEvent) {
      if (Math.abs(e.deltaY) < Math.abs(e.deltaX)) return;
      e.preventDefault();

      const now = Date.now();
      if (now - lastWheelAt.current < 100) return;
      lastWheelAt.current = now;

      moveBy(e.deltaY > 0 ? 1 : -1);
    }

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIndex, values]);

  // Snap on scroll end (works for both touch-scroll and mouse-drag release)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    function handleScroll() {
      if (!el) return;
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
      scrollTimeout.current = setTimeout(() => {
        const idx = Math.round(el.scrollTop / itemHeight);
        const clamped = Math.max(0, Math.min(values.length - 1, idx));
        if (values[clamped] !== value) {
          onChange(values[clamped]);
        }
        el.scrollTo({ top: clamped * itemHeight, behavior: "smooth" });
      }, 120);
    }

    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", handleScroll);
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, values, itemHeight, onChange]);

  /* -------------------- Mouse drag -------------------- */

  function onMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    // Only left mouse button
    if (e.button !== 0) return;
    const el = containerRef.current;
    if (!el) return;

    isDragging.current = true;
    dragStartY.current = e.clientY;
    dragStartScrollTop.current = el.scrollTop;
    lastMoveY.current = e.clientY;
    lastMoveTime.current = Date.now();

    // Prevent native text selection while dragging
    document.body.style.userSelect = "none";
    document.body.style.cursor = "grabbing";
  }

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!isDragging.current) return;
    const el = containerRef.current;
    if (!el) return;

    const dy = e.clientY - dragStartY.current;
    el.scrollTop = dragStartScrollTop.current - dy;

    lastMoveY.current = e.clientY;
    lastMoveTime.current = Date.now();
  }

  function endDrag() {
    if (!isDragging.current) return;
    isDragging.current = false;

    document.body.style.userSelect = "";
    document.body.style.cursor = "";

    const el = containerRef.current;
    if (!el) return;

    // Snap to nearest item
    const idx = Math.round(el.scrollTop / itemHeight);
    const clamped = Math.max(0, Math.min(values.length - 1, idx));
    el.scrollTo({ top: clamped * itemHeight, behavior: "smooth" });

    if (values[clamped] !== value) {
      onChange(values[clamped]);
    }
  }

  // Release drag if the pointer leaves the window
  useEffect(() => {
    function onUp() {
      endDrag();
    }
    window.addEventListener("mouseup", onUp);
    window.addEventListener("blur", onUp);
    return () => {
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("blur", onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, values]);

  /* -------------------- Render -------------------- */

  return (
    <div className={cn("relative select-none", width)}>
      <div
        ref={containerRef}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={endDrag}
        onMouseLeave={endDrag}
        onDragStart={(e) => e.preventDefault()}
        className={cn(
          "no-scrollbar overflow-y-scroll snap-y snap-mandatory",
          isDragging.current ? "cursor-grabbing" : "cursor-grab"
        )}
        style={{
          height,
          paddingTop: padding,
          paddingBottom: padding,
          scrollbarWidth: "none",
          touchAction: "pan-y",
        }}
      >
        {values.map((v) => {
          const isActive = v === value;
          return (
            <div
              key={String(v)}
              className={cn(
                "snap-center flex items-center justify-center text-sm transition-colors select-none",
                isActive
                  ? "text-slate-900 font-semibold"
                  : "text-slate-400 hover:text-slate-600"
              )}
              style={{ height: itemHeight }}
              // Only fire click-to-select if not dragging
              onClick={() => {
                if (!isDragging.current) onChange(v);
              }}
            >
              {labelFor ? labelFor(v) : String(v)}
            </div>
          );
        })}
      </div>

      {/* Selection highlight band */}
      <div
        className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 border-y border-slate-200 bg-slate-50/40"
        style={{ height: itemHeight }}
      />

      {/* Fade top/bottom */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-white to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white to-transparent" />
    </div>
  );
}