import { useMemo } from 'react';
import { useForm, rules, createValidator } from '../../hooks/useForm';
import { FormField, Select, Textarea, Button, ErrorAlert } from '../ui';
import { toOptions } from '../../lib/options';

const validate = createValidator({
  title: [rules.required('Title'), rules.minLength('Title', 2)],
  total_copies: [rules.required('Total copies'), rules.min('Total copies', 0)],
  available_copies: [rules.required('Available copies'), rules.min('Available copies', 0)],
});

const toFormValues = (book) => ({
  title: book?.title ?? '',
  description: book?.description ?? '',
  author: book?.author != null ? String(book.author) : '',
  category: book?.category != null ? String(book.category) : '',
  total_copies: book?.total_copies ?? 1,
  available_copies: book?.available_copies ?? 1,
});

/** Blank FK selections must go to the API as null, not "". */
const toPayload = (values) => ({
  title: values.title.trim(),
  description: values.description?.trim() || '',
  author: values.author ? Number(values.author) : null,
  category: values.category ? Number(values.category) : null,
  total_copies: Number(values.total_copies),
  available_copies: Number(values.available_copies),
});

/**
 * Create and edit share this form: the difference is which mutation is handed
 * in, not a second component.
 */
export function BookForm({ book, authors, categories, onSubmit, onCancel, isPending, error }) {
  const initialValues = useMemo(() => toFormValues(book), [book]);

  const form = useForm({
    initialValues,
    validate,
    onSubmit: (values) => onSubmit(toPayload(values)),
  });

  return (
    <form onSubmit={form.handleSubmit} className="space-y-4">
      <ErrorAlert error={error} />

      <FormField form={form} name="title" label="Title" required placeholder="e.g. Clean Architecture" />

      <FormField
        as={Textarea}
        form={form}
        name="description"
        label="Description"
        placeholder="A short summary of the book"
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          as={Select}
          form={form}
          name="author"
          label="Author"
          placeholder="No author"
          options={toOptions(authors)}
        />
        <FormField
          as={Select}
          form={form}
          name="category"
          label="Category"
          placeholder="No category"
          options={toOptions(categories)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField form={form} name="total_copies" label="Total copies" type="number" min="0" required />
        <FormField
          form={form}
          name="available_copies"
          label="Available copies"
          type="number"
          min="0"
          required
          hint="Borrowing decrements this automatically."
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isPending}>
          {book ? 'Save changes' : 'Add book'}
        </Button>
      </div>
    </form>
  );
}
