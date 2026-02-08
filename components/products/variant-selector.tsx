"use client";

interface OptionType {
  id: string;
  name: string;
  values: { id: string; value: string }[];
}

interface Variant {
  id: string;
  sku: string | null;
  price: string;
  compareAtPrice: string | null;
  stock: number;
  optionValueIds: string[] | null;
}

interface VariantSelectorProps {
  optionTypes: OptionType[];
  variants: Variant[];
  selectedOptions: Record<string, string>;
  onOptionChange: (optionTypeId: string, valueId: string) => void;
}

export function VariantSelector({
  optionTypes,
  variants,
  selectedOptions,
  onOptionChange,
}: VariantSelectorProps) {
  if (optionTypes.length === 0) return null;

  return (
    <div className="space-y-4">
      {optionTypes.map((optionType) => (
        <div key={optionType.id}>
          <label className="text-sm font-medium text-foreground">
            {optionType.name}
          </label>
          <div className="mt-2 flex flex-wrap gap-2">
            {optionType.values.map((value) => {
              const isSelected = selectedOptions[optionType.id] === value.id;

              // Check if this option value is available in any variant
              const isAvailable = variants.some(
                (v) =>
                  (v.optionValueIds ?? []).includes(value.id) && v.stock > 0
              );

              return (
                <button
                  key={value.id}
                  onClick={() => onOptionChange(optionType.id, value.id)}
                  disabled={!isAvailable}
                  className={`rounded-md border px-4 py-2 text-sm transition-colors ${
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground"
                      : isAvailable
                      ? "border-border hover:border-primary"
                      : "border-border/30 text-muted-foreground/50 cursor-not-allowed line-through"
                  }`}
                >
                  {value.value}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
