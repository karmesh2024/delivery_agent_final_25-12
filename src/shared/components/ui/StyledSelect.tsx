import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { Check, ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

// نستورد المكونات الأصلية ولكن نصدرها بأسماء جديدة مؤقتًا لتجنب التعارض
const OriginalSelect = SelectPrimitive.Root
const OriginalSelectGroup = SelectPrimitive.Group
const OriginalSelectValue = SelectPrimitive.Value

// *** StyledSelectTrigger ***
// مكون Trigger مخصص مع التنسيقات الافتراضية المطلوبة
const StyledSelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    // تطبيق التنسيقات الافتراضية هنا بالإضافة إلى أي classes ممررة
    className={cn(
      "flex h-10 w-full items-center justify-between rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
      className // <-- دمج classes الممررة للمرونة
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-4 w-4 opacity-50" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
))
StyledSelectTrigger.displayName = "StyledSelectTrigger" // اسم للعرض في أدوات التطوير

// *** StyledSelectContent ***
// مكون Content مخصص مع التنسيقات الافتراضية المطلوبة
const StyledSelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      // تطبيق التنسيقات الافتراضية هنا
      className={cn(
        "relative z-50 min-w-[8rem] overflow-hidden rounded-md border bg-green-50 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        position === "popper" &&
          "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
        className // <-- دمج classes الممررة
      )}
      position={position}
      {...props}
    >
      <SelectPrimitive.Viewport
        className={cn(
          "p-1",
          position === "popper" &&
            "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
))
StyledSelectContent.displayName = "StyledSelectContent"

// *** StyledSelectItem ***
// مكون Item مخصص (يمكن تعديله إذا لزم الأمر، لكن سنبقيه كما هو الآن غالبًا)
const StyledSelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </SelectPrimitive.ItemIndicator>
    </span>

    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
))
StyledSelectItem.displayName = SelectPrimitive.Item.displayName

// *** إعادة التصدير ***
// نصدر المكونات الأصلية والمكونات المخصصة بأسماء واضحة
export {
  OriginalSelect as Select, // يمكن استخدامه إذا احتجت الأصل
  OriginalSelectGroup as SelectGroup,
  OriginalSelectValue as SelectValue,
  StyledSelectTrigger as SelectTrigger, // <-- استخدام هذا
  StyledSelectContent as SelectContent, // <-- استخدام هذا
  StyledSelectItem as SelectItem      // <-- استخدام هذا
} 