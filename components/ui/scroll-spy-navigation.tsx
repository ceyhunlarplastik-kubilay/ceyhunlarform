"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

/**
 * SCROLL SPY NAVIGATION
 *
 * Logic & Animation Explanation:
 *
 * 1. **Scroll Detection (IntersectionObserver)**:
 *    - We observe all section elements defined in `tabs`.
 *    - The `threshold` and `rootMargin` are tuned to detect which section is "mostly" visible.
 *    - When a section intersects, we update `activeId`.
 *
 * 2. **Smooth Scrolling (Click)**:
 *    - verify element exists, then `element.scrollIntoView({ behavior: 'smooth' })`.
 *
 * 3. **Active Tab Indicator (motion.div)**:
 *    - We use `layoutId="active-tab-indicator"` on a motion.div.
 *    - When `activeId` changes, Framer Motion automatically animates the indicator
 *      from the old tab to the new one using a layout animation.
 *    - This is performant as it uses transforms.
 *
 * 4. **Auto-Scroll Active Tab**:
 *    - When `activeId` changes, we check if the active tab button is out of view
 *      in the scrollable nav container.
 *    - If so, we scroll the nav container to center the active tab.
 */

interface TabItem {
  id: string; // ID of the section to scroll to
  label: string;
}

interface ScrollSpyNavigationProps {
  tabs: TabItem[];
  className?: string;
  defaultActiveId?: string;
  offset?: number; // Offset for sticky headers, ScrollIntoView adjustments
  onActiveChange?: (id: string) => void;
}

export function ScrollSpyNavigation({
  tabs,
  className,
  defaultActiveId,
  offset = 0,
  onActiveChange,
}: ScrollSpyNavigationProps) {
  const [activeId, setActiveId] = useState<string>(
    defaultActiveId || tabs[0]?.id || ""
  );
  // ... (refs)

  // Call onActiveChange when activeId changes
  useEffect(() => {
    onActiveChange?.(activeId);
  }, [activeId, onActiveChange]);

  const navRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  // Prevent observer updates when clicking to scroll
  const isClickScrolling = useRef(false);
  const clickTimeout = useRef<NodeJS.Timeout>(null);

  /* -------------------------------------------------------------------------- */
  /*                      SCROLL TO SECTION HANDLER                             */
  /* -------------------------------------------------------------------------- */
  const handleTabClick = (id: string) => {
    setActiveId(id); // Trigger effect
    isClickScrolling.current = true;

    // ...

    // Clear any existing timeout
    if (clickTimeout.current) clearTimeout(clickTimeout.current);

    // Reset lock after animation duration (approx 800ms)
    clickTimeout.current = setTimeout(() => {
      isClickScrolling.current = false;
    }, 800);

    const element = document.getElementById(id);
    if (element) {
      // Calculate offset position manually for better control than scrollIntoView
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  /* -------------------------------------------------------------------------- */
  /*                    INTERSECTION OBSERVER (Spy Logic)                       */
  /* -------------------------------------------------------------------------- */
  useEffect(() => {
    if (!tabs.length) return;

    const observerOptions = {
      root: null,
      // Adjust rootMargin to trigger earlier/later.
      // "-20% 0px -60% 0px" means "active when top 20% to bottom 60% of viewport"
      rootMargin: "-20% 0px -60% 0px",
      threshold: 0,
    };

    const observer = new IntersectionObserver((entries) => {
      if (isClickScrolling.current) return;

      // Find the entry that is most visible or intersecting
      // For simple spy, we can just check isIntersecting
      // Typically, multiple frames might fire. We pick the first intersecting one.

      const visibleEntry = entries.find((entry) => entry.isIntersecting);
      if (visibleEntry) {
        setActiveId(visibleEntry.target.id);
      }
    }, observerOptions);

    tabs.forEach((tab) => {
      const el = document.getElementById(tab.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [tabs]);

  /* -------------------------------------------------------------------------- */
  /*                  AUTO-SCROLL ACTIVE TAB INTO VIEW                          */
  /* -------------------------------------------------------------------------- */
  useEffect(() => {
    const activeTab = tabRefs.current[activeId];
    const navContainer = navRef.current;

    if (activeTab && navContainer) {
      const tabLeft = activeTab.offsetLeft;
      const tabWidth = activeTab.offsetWidth;
      const navWidth = navContainer.offsetWidth;
      const scrollLeft = navContainer.scrollLeft;

      // Check if tab is out of view
      const isOutOfViewLeft = tabLeft < scrollLeft;
      const isOutOfViewRight = tabLeft + tabWidth > scrollLeft + navWidth;

      if (isOutOfViewLeft || isOutOfViewRight) {
        // Center the tab
        navContainer.scrollTo({
          left: tabLeft - navWidth / 2 + tabWidth / 2,
          behavior: "smooth",
        });
      }
    }
  }, [activeId]);

  /* -------------------------------------------------------------------------- */
  /*                                RENDER                                      */
  /* -------------------------------------------------------------------------- */
  return (
    <nav
      ref={navRef}
      className={cn(
        "flex w-full overflow-x-auto scrollbar-none items-center gap-1 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40",
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = activeId === tab.id;

        return (
          <button
            type="button"
            key={tab.id}
            ref={(el) => {
              tabRefs.current[tab.id] = el;
            }}
            onClick={() => handleTabClick(tab.id)}
            className={cn(
              "relative px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-ring",
              isActive
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}

            {isActive && (
              <motion.div
                layoutId="active-tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                initial={false}
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 30,
                }}
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}
