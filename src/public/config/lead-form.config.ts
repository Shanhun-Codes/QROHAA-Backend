export type PublicLeadFormFieldType = 'TEXT' | 'EMAIL' | 'TEL';

export type PublicLeadFormField = {
  key: 'firstName' | 'lastName' | 'email' | 'phone';
  label: string;
  type: PublicLeadFormFieldType;
  required: boolean;
};

export const publicLeadForm = {
  fields: [
    { key: 'firstName', label: 'First Name', type: 'TEXT', required: false },
    { key: 'lastName', label: 'Last Name', type: 'TEXT', required: false },
    { key: 'email', label: 'Email', type: 'EMAIL', required: false },
    { key: 'phone', label: 'Phone', type: 'TEL', required: false },
  ] satisfies PublicLeadFormField[],
};