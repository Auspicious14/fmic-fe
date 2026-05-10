export interface Customer {
  _id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  tag?: string;
  notes?: string;
  outstandingBalance: number;
  lastTransactionDate?: string;
}

export interface CustomerFormData {
  name: string;
  phone: string;
  email: string;
  address: string;
  tag: string;
  notes: string;
}

export const EMPTY_FORM: CustomerFormData = {
  name: "",
  phone: "",
  email: "",
  address: "",
  tag: "",
  notes: "",
};
