import { ArrowDownAZ, Clock, RefreshCw } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SortMode } from "@/lib/sticky-notes";

interface SortDropdownProps {
  value: SortMode;
  onChange: (mode: SortMode) => void;
}

export function SortDropdown({ value, onChange }: SortDropdownProps) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as SortMode)}>
      <SelectTrigger className="w-[180px]" aria-label="Sort notes">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="updated">
          <span className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" /> Recently updated
          </span>
        </SelectItem>
        <SelectItem value="created">
          <span className="flex items-center gap-2">
            <Clock className="h-4 w-4" /> Newest first
          </span>
        </SelectItem>
        <SelectItem value="title">
          <span className="flex items-center gap-2">
            <ArrowDownAZ className="h-4 w-4" /> Title A–Z
          </span>
        </SelectItem>
      </SelectContent>
    </Select>
  );
}
