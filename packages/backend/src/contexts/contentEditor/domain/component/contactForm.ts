import { randomUUID } from 'node:crypto';
import { ComponentReader } from './componentReader';

export const FORM_FIELD_TYPES = ['text', 'email', 'textarea'] as const;
export const MAX_FORM_FIELDS = 20;

export const DEFAULT_FORM_FIELDS = [
    { id: 'name', label: 'Nom', type: 'text', required: true },
    { id: 'email', label: 'Email', type: 'email', required: true },
    { id: 'message', label: 'Message', type: 'textarea', required: true },
] as const;

export const DEFAULT_FORM_TITLE = 'Me contacter';
export const DEFAULT_SUBMIT_LABEL = 'Envoyer';
export const DEFAULT_SUCCESS_MESSAGE = 'Merci, votre message a bien été envoyé.';

export function formFields(component: ComponentReader): Record<string, unknown>[] {
    const fields = component.list('fields').map((field, index) => ({
        id: field.nonEmptyString('id', component.isStrict() ? randomUUID() : `field-${index}`),
        label: field.string('label'),
        type: field.oneOf('type', FORM_FIELD_TYPES, 'text'),
        required: field.boolean('required', false),
    }));
    if (fields.length > MAX_FORM_FIELDS) {
        return component.invalid('fields', `at most ${MAX_FORM_FIELDS} fields`, fields.slice(0, MAX_FORM_FIELDS));
    }
    return fields.length > 0 ? fields : DEFAULT_FORM_FIELDS.map(field => ({ ...field }));
}
