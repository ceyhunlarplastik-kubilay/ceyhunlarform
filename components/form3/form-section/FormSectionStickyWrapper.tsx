import { cn } from "@/lib/utils";
import { FormSectionHeader } from "./FormSectionHeader";

interface FormSectionStickyWrapperProps {
  children: React.ReactNode;
  title: string;
  description: string;
  tabContainerRef?: React.RefObject<HTMLDivElement | null>;
  tabRefs?: React.RefObject<Record<string, HTMLButtonElement | null>>;
  groups?: Array<{ groupId: string; name: string }>;
  activeGroupId?: string;
  /** form.watch("uretimGrubu") değeri */
  selectedGroupId?: string;
  scrollToGroup?: (groupId: string) => void;
}

export const FormSectionStickyWrapper = ({
  children,
  title,
  description,
  tabContainerRef,
  tabRefs,
  groups,
  activeGroupId,
  selectedGroupId,
  scrollToGroup,
}: FormSectionStickyWrapperProps) => {
  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-20 bg-white pt-4 pb-3 border-b shadow-sm space-y-4">
        <FormSectionHeader title={title} description={description} />

        {/* TAB BAR - opsiyonel */}
        {groups && groups.length > 0 && (
          <div
            ref={tabContainerRef}
            className="flex gap-2 overflow-x-auto py-2 px-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
          >
            {groups.map((g) => {
              // Önce scroll spy (activeGroupId), yoksa form değeri
              const isSelected =
                (activeGroupId ?? selectedGroupId) === g.groupId;

              return (
                <button
                  key={g.groupId}
                  ref={(el) => {
                    if (tabRefs?.current) {
                      tabRefs.current[g.groupId] = el;
                    }
                  }}
                  type="button"
                  onClick={() => scrollToGroup?.(g.groupId)}
                  className={cn(
                    "whitespace-nowrap px-4 py-2 rounded-full border text-sm transition-all",
                    "hover:bg-primary/10 hover:border-primary",
                    isSelected
                      ? "bg-primary text-white border-primary shadow"
                      : "bg-white border-gray-300 text-gray-700"
                  )}
                >
                  {g.name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div>{children}</div>
    </div>
  );
};
