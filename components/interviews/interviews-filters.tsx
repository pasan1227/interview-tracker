// components/interviews/interviews-filters.tsx

"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { InterviewStatus, InterviewType } from "@/lib/generated/prisma/browser";
import { FilterIcon, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";

export function InterviewsFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  
  const currentStatus = searchParams.get("status") || "";
  const currentType = searchParams.get("type") || "";
  const currentDate = searchParams.get("date") || "";
  
  // For date range picker
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  
  const handleStatusChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    
    if (value) {
      params.set("status", value);
    } else {
      params.delete("status");
    }
    
    // Reset to first page when filtering
    params.delete("page");
    
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };
  
  const handleTypeChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    
    if (value) {
      params.set("type", value);
    } else {
      params.delete("type");
    }
    
    // Reset to first page when filtering
    params.delete("page");
    
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };
  
  const handleDateChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    
    if (value) {
      params.set("date", value);
    } else {
      params.delete("date");
    }
    
    // Reset to first page when filtering
    params.delete("page");
    
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };
  
  const handleDateRangeApply = () => {
    if (!dateRange?.from) return;
    
    const params = new URLSearchParams(searchParams);
    
    if (dateRange.to) {
      // Date range (format: "2025-05-10|2025-05-15")
      const fromStr = format(dateRange.from, "yyyy-MM-dd");
      const toStr = format(dateRange.to, "yyyy-MM-dd");
      params.set("date", `${fromStr}|${toStr}`);
    } else {
      // Single day
      const fromStr = format(dateRange.from, "yyyy-MM-dd");
      params.set("date", `${fromStr}|${fromStr}`);
    }
    
    // Reset to first page when filtering
    params.delete("page");
    
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };
  
  const handleClearFilters = () => {
    const params = new URLSearchParams(searchParams);
    params.delete("status");
    params.delete("type");
    params.delete("date");
    params.delete("page");
    
    setDateRange(undefined);
    
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };
  
  const isFiltered = currentStatus || currentType || currentDate;
  
  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <FilterIcon className="mr-2 h-4 w-4" />
            Filters
            {isFiltered && <span className="ml-1 text-xs">(Active)</span>}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Status</DropdownMenuLabel>
          <DropdownMenuCheckboxItem
            checked={!currentStatus}
            onCheckedChange={() => handleStatusChange("")}
          >
            All Statuses
          </DropdownMenuCheckboxItem>
          {Object.values(InterviewStatus).map((status) => (
            <DropdownMenuCheckboxItem
              key={status}
              checked={currentStatus === status}
              onCheckedChange={() => handleStatusChange(status)}
            >
              {status.replace(/_/g, " ")}
            </DropdownMenuCheckboxItem>
          ))}
          
          <DropdownMenuSeparator />
          
          <DropdownMenuLabel>Type</DropdownMenuLabel>
          <DropdownMenuCheckboxItem
            checked={!currentType}
            onCheckedChange={() => handleTypeChange("")}
          >
            All Types
          </DropdownMenuCheckboxItem>
          {Object.values(InterviewType).map((type) => (
            <DropdownMenuCheckboxItem
              key={type}
              checked={currentType === type}
              onCheckedChange={() => handleTypeChange(type)}
            >
              {type.replace(/_/g, " ")}
            </DropdownMenuCheckboxItem>
          ))}
          
          <DropdownMenuSeparator />
          
          <DropdownMenuLabel>Date</DropdownMenuLabel>
          <DropdownMenuCheckboxItem
            checked={!currentDate}
            onCheckedChange={() => handleDateChange("")}
          >
            All Dates
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={currentDate === "today"}
            onCheckedChange={() => handleDateChange("today")}
          >
            Today
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={currentDate === "tomorrow"}
            onCheckedChange={() => handleDateChange("tomorrow")}
          >
            Tomorrow
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={currentDate === "this-week"}
            onCheckedChange={() => handleDateChange("this-week")}
          >
            This Week
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={currentDate === "next-week"}
            onCheckedChange={() => handleDateChange("next-week")}
          >
            Next Week
          </DropdownMenuCheckboxItem>
          
          {isFiltered && (
            <>
              <DropdownMenuSeparator />
              <div className="p-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={handleClearFilters}
                  disabled={isPending}
                >
                  Clear Filters
                </Button>
              </div>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm">
            <CalendarIcon className="mr-2 h-4 w-4" />
            Date Range
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="range"
            selected={dateRange}
            onSelect={setDateRange}
            numberOfMonths={2}
          />
          <div className="border-t p-3 flex justify-end space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDateRange(undefined)}
            >
              Clear
            </Button>
            <Button
              size="sm"
              onClick={handleDateRangeApply}
              disabled={!dateRange?.from}
            >
              Apply
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}