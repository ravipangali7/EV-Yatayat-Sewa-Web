import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SearchableSelect, MultiSelect } from '@/components/common/SearchableSelect';

export interface FieldSchema {
  name: string;
  type: 'text' | 'number' | 'email' | 'tel' | 'select' | 'multiselect' | 'textarea' | 'switch' | 'file' | 'date' | 'decimal';
  label: string;
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  relation?: string; // For foreign keys - will fetch options from API
  relationApi?: () => Promise<Array<{ id: string; [key: string]: any }>>;
  relationLabelField?: string; // Field to use as label from relation
  relationValueField?: string; // Field to use as value from relation (default: 'id')
  disabled?: boolean;
  step?: number;
  min?: number;
  max?: number;
  rows?: number;
  accept?: string; // For file inputs
  helpText?: string;
}

export interface DynamicFormProps {
  schema: FieldSchema[];
  data: Record<string, any>;
  onChange: (field: string, value: any) => void;
  errors?: Record<string, string>;
  className?: string;
}

export const DynamicForm: React.FC<DynamicFormProps> = ({
  schema,
  data,
  onChange,
  errors = {},
  className = '',
}) => {
  const [relationOptions, setRelationOptions] = React.useState<Record<string, Array<{ value: string; label: string }>>>({});

  // Load relation options
  React.useEffect(() => {
    const loadRelations = async () => {
      const relationsToLoad = schema.filter(f => f.relation && f.relationApi);
      
      for (const field of relationsToLoad) {
        if (!relationOptions[field.name] && field.relationApi) {
          try {
            const items = await field.relationApi();
            const labelField = field.relationLabelField || 'name';
            const valueField = field.relationValueField || 'id';
            
            const options = items.map(item => ({
              value: String(item[valueField]),
              label: String(item[labelField] || item[valueField]),
            }));
            
            setRelationOptions(prev => ({
              ...prev,
              [field.name]: options,
            }));
          } catch (error) {
            console.error(`Failed to load options for ${field.name}:`, error);
          }
        }
      }
    };

    loadRelations();
  }, [schema]);

  const renderField = (field: FieldSchema) => {
    const value = data[field.name];
    const error = errors[field.name];
    const fieldId = `field-${field.name}`;

    const commonProps = {
      id: fieldId,
      disabled: field.disabled,
    };

    switch (field.type) {
      case 'text':
      case 'email':
      case 'tel':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={fieldId}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              {...commonProps}
              type={field.type}
              value={value || ''}
              onChange={(e) => onChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              required={field.required}
              className={error ? 'border-destructive' : ''}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            {field.helpText && !error && <p className="text-sm text-muted-foreground">{field.helpText}</p>}
          </div>
        );

      case 'number':
      case 'decimal':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={fieldId}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              {...commonProps}
              type="number"
              value={value || ''}
              onChange={(e) => {
                const val = field.type === 'decimal' 
                  ? parseFloat(e.target.value) || 0
                  : parseInt(e.target.value) || 0;
                onChange(field.name, val);
              }}
              placeholder={field.placeholder}
              required={field.required}
              step={field.step || (field.type === 'decimal' ? 0.01 : 1)}
              min={field.min}
              max={field.max}
              className={error ? 'border-destructive' : ''}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            {field.helpText && !error && <p className="text-sm text-muted-foreground">{field.helpText}</p>}
          </div>
        );

      case 'textarea':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={fieldId}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Textarea
              {...commonProps}
              value={value || ''}
              onChange={(e) => onChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              required={field.required}
              rows={field.rows || 3}
              className={error ? 'border-destructive' : ''}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            {field.helpText && !error && <p className="text-sm text-muted-foreground">{field.helpText}</p>}
          </div>
        );

      case 'switch':
        return (
          <div key={field.name} className="flex items-center gap-3 space-y-0">
            <Switch
              id={fieldId}
              checked={value || false}
              onCheckedChange={(checked) => onChange(field.name, checked)}
              disabled={field.disabled}
            />
            <Label htmlFor={fieldId} className="cursor-pointer">
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            {error && <p className="text-sm text-destructive">{error}</p>}
            {field.helpText && !error && <p className="text-sm text-muted-foreground">{field.helpText}</p>}
          </div>
        );

      case 'select':
        const selectOptions = field.options || relationOptions[field.name] || [];
        return (
          <div key={field.name} className="space-y-2">
            <Label>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <SearchableSelect
              options={selectOptions}
              value={value || ''}
              onChange={(val) => onChange(field.name, val)}
              placeholder={field.placeholder || `Select ${field.label.toLowerCase()}...`}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            {field.helpText && !error && <p className="text-sm text-muted-foreground">{field.helpText}</p>}
          </div>
        );

      case 'multiselect':
        const multiSelectOptions = field.options || relationOptions[field.name] || [];
        return (
          <div key={field.name} className="space-y-2">
            <Label>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <MultiSelect
              options={multiSelectOptions}
              value={Array.isArray(value) ? value : []}
              onChange={(val) => onChange(field.name, val)}
              placeholder={field.placeholder || `Select ${field.label.toLowerCase()}...`}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            {field.helpText && !error && <p className="text-sm text-muted-foreground">{field.helpText}</p>}
          </div>
        );

      case 'file':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={fieldId}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              {...commonProps}
              type="file"
              accept={field.accept}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  onChange(field.name, file);
                }
              }}
              required={field.required}
              className={error ? 'border-destructive' : ''}
            />
            {value && typeof value === 'string' && (
              <img src={value} alt="Preview" className="mt-2 h-32 w-auto rounded-lg border border-border" />
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
            {field.helpText && !error && <p className="text-sm text-muted-foreground">{field.helpText}</p>}
          </div>
        );

      case 'date':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={fieldId}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              {...commonProps}
              type="date"
              value={value || ''}
              onChange={(e) => onChange(field.name, e.target.value)}
              required={field.required}
              className={error ? 'border-destructive' : ''}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            {field.helpText && !error && <p className="text-sm text-muted-foreground">{field.helpText}</p>}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {schema.map(field => renderField(field))}
    </div>
  );
};
