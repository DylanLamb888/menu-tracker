"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X } from "lucide-react";

export interface ItemChange {
  itemName: string;
  oldValue: string;
  newValue: string;
}

interface ItemChangesInputProps {
  changes: ItemChange[];
  onChange: (changes: ItemChange[]) => void;
}

export function ItemChangesInput({ changes, onChange }: ItemChangesInputProps) {
  function addChange() {
    onChange([...changes, { itemName: "", oldValue: "", newValue: "" }]);
  }

  function removeChange(index: number) {
    onChange(changes.filter((_, i) => i !== index));
  }

  function updateChange(index: number, field: keyof ItemChange, value: string) {
    const updated = changes.map((change, i) =>
      i === index ? { ...change, [field]: value } : change
    );
    onChange(updated);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-[#3D2E2E]">Item Changes (optional)</Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={addChange}
          className="text-[#E07A5F] hover:text-[#E07A5F]/80 hover:bg-[#E07A5F]/10"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Item
        </Button>
      </div>

      {changes.length === 0 ? (
        <p className="text-sm text-[#3D2E2E]/50 italic">
          Track specific changes like price updates or new items
        </p>
      ) : (
        <div className="space-y-3">
          {changes.map((change, index) => (
            <div
              key={index}
              className="flex gap-2 items-start p-3 bg-[#3D2E2E]/5 rounded-lg"
            >
              <div className="flex-1 grid gap-2 sm:grid-cols-3">
                <div>
                  <Input
                    placeholder="Item name"
                    value={change.itemName}
                    onChange={(e) =>
                      updateChange(index, "itemName", e.target.value)
                    }
                    className="border-[#3D2E2E]/20 bg-white text-sm"
                  />
                </div>
                <div>
                  <Input
                    placeholder="Old value"
                    value={change.oldValue}
                    onChange={(e) =>
                      updateChange(index, "oldValue", e.target.value)
                    }
                    className="border-[#3D2E2E]/20 bg-white text-sm"
                  />
                </div>
                <div>
                  <Input
                    placeholder="New value"
                    value={change.newValue}
                    onChange={(e) =>
                      updateChange(index, "newValue", e.target.value)
                    }
                    className="border-[#3D2E2E]/20 bg-white text-sm"
                  />
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeChange(index)}
                className="text-[#3D2E2E]/50 hover:text-red-600 hover:bg-red-50 p-1 h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
