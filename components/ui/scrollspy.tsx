import { ReactNode, RefObject, useCallback, useEffect, useRef } from "react";

type ScrollspyProps = {
  children: ReactNode;
  targetRef?: RefObject<
    HTMLElement | HTMLDivElement | Document | null | undefined
  >;
  onUpdate?: (id: string) => void;
  offset?: number;
  smooth?: boolean;
  className?: string;
  dataAttribute?: string;
  history?: boolean;
  throttleTime?: number;
};

export function Scrollspy({
  children,
  targetRef,
  onUpdate,
  className,
  offset = 0,
  smooth = true,
  dataAttribute = "scrollspy",
  history = true,
}: ScrollspyProps) {
  const selfRef = useRef<HTMLDivElement | null>(null);
  const anchorElementsRef = useRef<Element[] | null>(null);
  const prevIdTracker = useRef<string | null>(null);

  // Sets active nav, hash, prevIdTracker, and calls onUpdate
  const setActiveSection = useCallback(
    (sectionId: string | null, force = false) => {
      if (!sectionId) return;
      anchorElementsRef.current?.forEach((item) => {
        const id = item.getAttribute(`data-${dataAttribute}-anchor`);
        if (id === sectionId) {
          item.setAttribute("data-active", "true");
        } else {
          item.removeAttribute("data-active");
        }
      });
      if (onUpdate) onUpdate(sectionId);
      if (history && (force || prevIdTracker.current !== sectionId)) {
        window.history.replaceState({}, "", `#${sectionId}`);
      }
      prevIdTracker.current = sectionId;
    },
    [anchorElementsRef, dataAttribute, history, onUpdate]
  );

  const handleScroll = useCallback(() => {
    if (!anchorElementsRef.current || anchorElementsRef.current.length === 0)
      return;

    const navHeight = 160; // Approximate height of sticky headers
    const checkPoint = navHeight + 50; // The point on screen we use to determine "active" section

    // Default active index
    let activeIdx = 0;

    // Find which section contains our checkpoint
    const foundIdx = anchorElementsRef.current.findIndex((anchor) => {
      const sectionId = anchor.getAttribute(`data-${dataAttribute}-anchor`);
      const sectionElement = document.getElementById(sectionId!);
      if (!sectionElement) return false;

      const rect = sectionElement.getBoundingClientRect();

      // Is the checkpoint inside this section?
      // rect.top <= checkPoint : Section starts above or at the checkpoint
      // rect.bottom > checkPoint : Section ends below the checkpoint
      return rect.top <= checkPoint && rect.bottom > checkPoint;
    });

    if (foundIdx !== -1) {
      activeIdx = foundIdx;
    } else {
      // Fallback: If no section contains the checkpoint (e.g. in a margin gap)
      // Find the first section that is mostly below the checkpoint
      let closestIdx = -1;
      let minDistance = Infinity;

      anchorElementsRef.current.forEach((anchor, idx) => {
        const sectionId = anchor.getAttribute(`data-${dataAttribute}-anchor`);
        const sectionElement = document.getElementById(sectionId!);
        if (!sectionElement) return;

        const rect = sectionElement.getBoundingClientRect();

        // Find section whose top is closest to checkpoint (but below it)
        // or whose bottom is closest to checkpoint (but above it)
        if (rect.top > checkPoint) {
          const dist = rect.top - checkPoint;
          if (dist < minDistance) {
            minDistance = dist;
            closestIdx = idx;
          }
        } else if (rect.bottom <= checkPoint) {
          const dist = checkPoint - rect.bottom;
          if (dist < minDistance) {
            minDistance = dist;
            closestIdx = idx;
          }
        }
      });

      if (closestIdx !== -1) {
        activeIdx = closestIdx;
      }
    }

    // Special case: if at very top, force first
    const scrollY = window.scrollY || document.documentElement.scrollTop;
    if (scrollY < 50) {
      activeIdx = 0;
    }

    // Special case: if at bottom, force last anchor
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = window.innerHeight;
    if (scrollY + clientHeight >= scrollHeight - 5) {
      activeIdx = anchorElementsRef.current.length - 1;
    }

    // Set active state
    const activeAnchor = anchorElementsRef.current[activeIdx];
    const sectionId =
      activeAnchor?.getAttribute(`data-${dataAttribute}-anchor`) || null;
    setActiveSection(sectionId);

    // Update data-active attributes
    anchorElementsRef.current.forEach((item, idx) => {
      if (idx === activeIdx) {
        item.setAttribute("data-active", "true");
      } else {
        item.removeAttribute("data-active");
      }
    });
  }, [anchorElementsRef, dataAttribute, setActiveSection]);

  const scrollTo = useCallback(
    (anchorElement: HTMLElement) => (event?: Event) => {
      if (event) event.preventDefault();
      const sectionId =
        anchorElement
          .getAttribute(`data-${dataAttribute}-anchor`)
          ?.replace("#", "") || null;
      if (!sectionId) return;
      const sectionElement = document.getElementById(sectionId);
      if (!sectionElement) return;

      const scrollToElement =
        targetRef?.current === document ? window : targetRef?.current;

      let customOffset = offset;
      const dataOffset = anchorElement.getAttribute(
        `data-${dataAttribute}-offset`
      );
      if (dataOffset) {
        customOffset = parseInt(dataOffset, 10);
      }

      const scrollTop = sectionElement.offsetTop - customOffset;

      if (scrollToElement && "scrollTo" in scrollToElement) {
        scrollToElement.scrollTo({
          top: scrollTop,
          left: 0,
          behavior: smooth ? "smooth" : "auto",
        });
      }
      setActiveSection(sectionId, true);
    },
    [dataAttribute, offset, smooth, targetRef, setActiveSection]
  );

  // Scroll to the section if the ID is present in the URL hash
  const scrollToHashSection = useCallback(() => {
    const hash = CSS.escape(window.location.hash.replace("#", ""));

    if (hash) {
      const targetElement = document.querySelector(
        `[data-${dataAttribute}-anchor="${hash}"]`
      ) as HTMLElement;
      if (targetElement) {
        scrollTo(targetElement)();
      }
    }
  }, [dataAttribute, scrollTo]);

  useEffect(() => {
    // Query elements and store them in the ref, avoiding unnecessary re-renders
    if (selfRef.current) {
      anchorElementsRef.current = Array.from(
        selfRef.current.querySelectorAll(`[data-${dataAttribute}-anchor]`)
      );
    }

    // Attach click event listeners to anchors
    anchorElementsRef.current?.forEach((item) => {
      // Remove existing listeners first to prevent duplicates if re-running
      item.removeEventListener("click", scrollTo(item as HTMLElement));
      item.addEventListener("click", scrollTo(item as HTMLElement));
    });

    // Determine the scrollable element
    // Default to window if targetRef is not provided or current is null
    const target = targetRef?.current;
    const scrollElement = target
      ? target === document
        ? window
        : target
      : window;

    // Attach the scroll event to the correct scrollable element
    scrollElement.addEventListener("scroll", handleScroll);

    // Check if there's a hash in the URL and scroll to the corresponding section
    setTimeout(() => {
      scrollToHashSection();
      // Wait for scroll to settle, then update nav highlighting
      setTimeout(() => {
        handleScroll();
      }, 100);
    }, 100); // Adding a slight delay to ensure content is fully rendered

    return () => {
      scrollElement.removeEventListener("scroll", handleScroll);
      anchorElementsRef.current?.forEach((item) => {
        item.removeEventListener("click", scrollTo(item as HTMLElement));
      });
    };
  }, [
    targetRef,
    selfRef,
    handleScroll,
    dataAttribute,
    scrollTo,
    scrollToHashSection,
    children,
  ]); // Added children dependency,

  return (
    <div data-slot="scrollspy" className={className} ref={selfRef}>
      {children}
    </div>
  );
}
