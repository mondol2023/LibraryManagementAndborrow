import { useMemo } from 'react';
import { Card, CardHeader, CardBody, CardFooter, Button, FormField, EmptyState, ErrorAlert, SkeletonList } from '../ui';
import { useForm, rules, createValidator } from '../../hooks/useForm';
import { pluralize } from '../../lib/format';

/**
 * Authors and categories are the same screen: a list plus a small create form.
 * The panel takes its fields as data, so a third lookup table would be a config
 * entry rather than a third component.
 */
export function LookupPanel({
  title,
  icon,
  itemLabel,
  fields,
  items,
  isLoading,
  error,
  onCreate,
  isPending,
  createError,
  canManage,
  renderMeta,
}) {
  const initialValues = useMemo(
    () => Object.fromEntries(fields.map((field) => [field.name, ''])),
    [fields],
  );

  const validate = useMemo(
    () =>
      createValidator(
        Object.fromEntries(
          fields
            .filter((field) => field.required)
            .map((field) => [field.name, [rules.required(field.label)]]),
        ),
      ),
    [fields],
  );

  const form = useForm({
    initialValues,
    validate,
    onSubmit: async (values) => {
      const result = await onCreate(values);
      if (result?.ok) form.reset();
      return result;
    },
  });

  return (
    <Card className="flex flex-col">
      <CardHeader
        title={
          <span className="flex items-center gap-2">
            <span aria-hidden="true">{icon}</span>
            {title}
          </span>
        }
        description={isLoading ? 'Loading…' : pluralize(items.length, itemLabel)}
      />

      <CardBody className="flex-1 p-0">
        <ErrorAlert error={error} className="mx-5 mt-4" />

        {isLoading ? (
          <SkeletonList rows={4} className="p-5" />
        ) : items.length === 0 ? (
          <EmptyState icon={icon} title={`No ${itemLabel} yet`} description="Add the first one below." />
        ) : (
          <ul className="max-h-72 divide-y divide-slate-100 overflow-y-auto">
            {items.map((item) => (
              <li key={item.id} className="px-5 py-3">
                <p className="text-sm font-medium text-slate-800">{item.name}</p>
                {renderMeta?.(item)}
              </li>
            ))}
          </ul>
        )}
      </CardBody>

      {canManage && (
        <CardFooter>
          <form onSubmit={form.handleSubmit} className="w-full space-y-3">
            <ErrorAlert error={createError} />

            {fields.map((field) => (
              <FormField
                key={field.name}
                as={field.as}
                form={form}
                name={field.name}
                label={field.label}
                placeholder={field.placeholder}
                required={field.required}
              />
            ))}

            <Button type="submit" size="sm" isLoading={isPending} className="w-full">
              Add {itemLabel}
            </Button>
          </form>
        </CardFooter>
      )}
    </Card>
  );
}
