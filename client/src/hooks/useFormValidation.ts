import { useState, useCallback } from 'react';

interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
}

interface ValidationRules {
  [key: string]: ValidationRule | ValidationRule[];
}

export function useFormValidation<T extends Record<string, any>>(
  initialState: T,
  rules: ValidationRules,
) {
  const [formData, setFormData] = useState(initialState);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateField = useCallback((name: string, value: any): string | null => {
    const fieldRules = rules[name];
    if (!fieldRules) return null;

    const ruleArray = Array.isArray(fieldRules) ? fieldRules : [fieldRules];

    for (const rule of ruleArray) {
      if (rule.required && (!value || value.trim() === '')) {
        return 'This field is required';
      }
      if (rule.minLength && value?.length < rule.minLength) {
        return `Minimum ${rule.minLength} characters required`;
      }
      if (rule.maxLength && value?.length > rule.maxLength) {
        return `Maximum ${rule.maxLength} characters allowed`;
      }
      if (rule.pattern && !rule.pattern.test(value)) {
        return 'Invalid format';
      }
      if (rule.custom) {
        const error = rule.custom(value);
        if (error) return error;
      }
    }

    return null;
  }, [rules]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    const error = validateField(name, value);
    setErrors(prev => ({
      ...prev,
      [name]: error || '',
    }));
  }, [validateField]);

  const validateAll = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    Object.keys(rules).forEach(name => {
      const error = validateField(name, formData[name]);
      if (error) {
        newErrors[name] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [rules, formData, validateField]);

  return {
    formData,
    setFormData,
    errors,
    handleChange,
    validateAll,
  };
}
