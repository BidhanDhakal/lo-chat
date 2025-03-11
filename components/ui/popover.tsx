"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface PopoverProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const PopoverContext = React.createContext<{
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  triggerRef: React.RefObject<HTMLElement>;
}>({
  open: false,
  setOpen: () => {},
  triggerRef: { current: null },
});

const Popover = ({ 
  children, 
  open: controlledOpen, 
  onOpenChange 
}: PopoverProps) => {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLElement>(null);
  
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;
  
  const setOpen = React.useCallback((value: boolean | ((prev: boolean) => boolean)) => {
    if (!isControlled) {
      setUncontrolledOpen(value);
    }
    if (onOpenChange) {
      const newValue = typeof value === 'function' ? value(open) : value;
      onOpenChange(newValue);
    }
  }, [isControlled, onOpenChange, open]);

  return (
    <PopoverContext.Provider value={{ open, setOpen, triggerRef }}>
      {children}
    </PopoverContext.Provider>
  );
};

const PopoverTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }
>(({ asChild, ...props }, forwardedRef) => {
  const { setOpen, open, triggerRef } = React.useContext(PopoverContext);
  
  // Handle ref forwarding
  const ref = React.useRef<HTMLButtonElement>(null);
  React.useImperativeHandle(forwardedRef, () => ref.current as HTMLButtonElement);
  
  // Set triggerRef for positioning
  React.useEffect(() => {
    if (ref.current) {
      triggerRef.current = ref.current;
    }
  }, [triggerRef]);

  if (asChild) {
    return React.cloneElement(props.children as React.ReactElement, {
      ref,
      onClick: (e: React.MouseEvent) => {
        const originalOnClick = (props.children as React.ReactElement).props.onClick;
        if (originalOnClick) originalOnClick(e);
        setOpen(!open);
      },
    });
  }

  return (
    <button
      ref={ref}
      type="button"
      {...props}
      onClick={(e) => {
        props.onClick?.(e);
        setOpen(!open);
      }}
    />
  );
});
PopoverTrigger.displayName = "PopoverTrigger";

const PopoverContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    align?: "start" | "center" | "end";
    side?: "top" | "right" | "bottom" | "left";
    sideOffset?: number;
  }
>(({ 
  className, 
  align = "center", 
  side = "bottom", 
  sideOffset = 4,
  ...props 
}, ref) => {
  const { open, triggerRef } = React.useContext(PopoverContext);
  const contentRef = React.useRef<HTMLDivElement>(null);
  
  // Position the content relative to the trigger
  React.useEffect(() => {
    if (open && contentRef.current && triggerRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const contentRect = contentRef.current.getBoundingClientRect();
      
      let top = 0;
      let left = 0;
      
      // Calculate position based on side
      switch (side) {
        case "top":
          top = triggerRect.top - contentRect.height - sideOffset;
          break;
        case "bottom":
          top = triggerRect.bottom + sideOffset;
          break;
        case "left":
          left = triggerRect.left - contentRect.width - sideOffset;
          top = triggerRect.top;
          break;
        case "right":
          left = triggerRect.right + sideOffset;
          top = triggerRect.top;
          break;
      }
      
      // Adjust horizontal alignment for top and bottom
      if (side === "top" || side === "bottom") {
        switch (align) {
          case "start":
            left = triggerRect.left;
            break;
          case "center":
            left = triggerRect.left + (triggerRect.width / 2) - (contentRect.width / 2);
            break;
          case "end":
            left = triggerRect.right - contentRect.width;
            break;
        }
      }
      
      // Adjust vertical alignment for left and right
      if (side === "left" || side === "right") {
        switch (align) {
          case "start":
            top = triggerRect.top;
            break;
          case "center":
            top = triggerRect.top + (triggerRect.height / 2) - (contentRect.height / 2);
            break;
          case "end":
            top = triggerRect.bottom - contentRect.height;
            break;
        }
      }
      
      // Apply position
      contentRef.current.style.position = "fixed";
      contentRef.current.style.top = `${top}px`;
      contentRef.current.style.left = `${left}px`;
      
      // Ensure it's visible
      contentRef.current.style.zIndex = "50";
    }
  }, [open, align, side, sideOffset]);
  
  // Close on outside click
  React.useEffect(() => {
    if (!open) return;
    
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        contentRef.current && 
        !contentRef.current.contains(e.target as Node) &&
        triggerRef.current && 
        !triggerRef.current.contains(e.target as Node)
      ) {
        const { setOpen } = React.useContext(PopoverContext);
        setOpen(false);
      }
    };
    
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [open]);
  
  if (!open) return null;
  
  return (
    <div
      ref={(node) => {
        // Handle both refs
        if (typeof ref === 'function') ref(node);
        else if (ref) ref.current = node;
        contentRef.current = node;
      }}
      className={cn(
        "z-50 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none",
        "animate-in fade-in-0 zoom-in-95",
        className
      )}
      {...props}
    />
  );
});
PopoverContent.displayName = "PopoverContent";

export { Popover, PopoverTrigger, PopoverContent } 