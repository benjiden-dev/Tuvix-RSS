import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SettingsFieldProps {
  id: string;
  label: string;
  description?: string;
  type?: "text" | "number" | "select";
  value: string | number;
  onChange: (value: string) => void;
  min?: string | number;
  max?: string | number;
  options?: Array<{ value: string; label: string }>;
  disabled?: boolean;
}

export function SettingsField({
  id,
  label,
  description,
  type = "text",
  value,
  onChange,
  min,
  max,
  options,
  disabled,
}: SettingsFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {type === "select" && options ? (
        <Select
          value={String(value)}
          onValueChange={onChange}
          disabled={disabled}
        >
          <SelectTrigger id={id}>
            <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          min={min}
          max={max}
          disabled={disabled}
        />
      )}
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  );
}
