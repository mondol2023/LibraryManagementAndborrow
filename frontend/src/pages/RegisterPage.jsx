import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useForm, rules, createValidator } from '../hooks/useForm';
import { useMutation } from '../hooks/useMutation';
import { useToast } from '../hooks/useToast';
import { Button, Card, FormField, Select, Alert, ErrorAlert } from '../components/ui';
import { Role, SIGNUP_ROLES } from '../domain/roles';

/** Mirrors `RegisterSerializer` — same fields, same names, same order. */
const INITIAL_VALUES = {
  username: '',
  email: '',
  first_name: '',
  last_name: '',
  phone_number: '',
  reference_number: '',
  role: Role.STUDENT,
  password: '',
  password2: '',
};

const validate = createValidator({
  username: [rules.required('Username'), rules.minLength('Username', 3)],
  email: [rules.required('Email'), rules.email()],
  password: [rules.required('Password'), rules.minLength('Password', 8)],
  password2: [
    rules.required('Confirm password'),
    rules.matches('password', 'Passwords do not match.'),
  ],
});

/** Roles the backend creates as inactive, pending an admin's approval. */
const ROLES_NEEDING_APPROVAL = [Role.ADMIN, Role.STAFF];

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [pendingApproval, setPendingApproval] = useState(false);

  const signUp = useMutation(register, {
    onSuccess: (_data, values) => {
      if (ROLES_NEEDING_APPROVAL.includes(values.role)) {
        setPendingApproval(true);
        return;
      }
      toast.success('Account created. Sign in to continue.');
      navigate('/login', { replace: true });
    },
  });

  const form = useForm({
    initialValues: INITIAL_VALUES,
    validate,
    onSubmit: signUp.mutate,
  });

  if (pendingApproval) {
    return (
      <Card className="p-8">
        <h1 className="text-xl font-semibold text-slate-900">Almost there</h1>
        <Alert tone="info" className="mt-4">
          Accounts with elevated roles are created inactive. An existing admin has to activate
          <span className="font-medium"> {form.values.username} </span>
          before you can sign in.
        </Alert>
        <Link
          to="/login"
          className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
        >
          Back to sign in
        </Link>
      </Card>
    );
  }

  return (
    <Card className="p-8">
      <h1 className="text-xl font-semibold text-slate-900">Create an account</h1>
      <p className="mt-1 text-sm text-slate-500">It takes a minute.</p>

      <form onSubmit={form.handleSubmit} className="mt-6 space-y-4">
        <ErrorAlert error={signUp.error} />

        <FormField form={form} name="username" label="Username" autoComplete="username" required />
        <FormField form={form} name="email" label="Email" type="email" autoComplete="email" required />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField form={form} name="first_name" label="First name" autoComplete="given-name" />
          <FormField form={form} name="last_name" label="Last name" autoComplete="family-name" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField form={form} name="phone_number" label="Phone" autoComplete="tel" />
          <FormField
            form={form}
            name="reference_number"
            label="Reference number"
            hint="Student / staff ID, if you have one."
          />
        </div>

        <FormField as={Select} form={form} name="role" label="Role" options={SIGNUP_ROLES} required />

        {ROLES_NEEDING_APPROVAL.includes(form.values.role) && (
          <Alert tone="warning">
            This role is created inactive and needs an admin to approve it before first sign-in.
          </Alert>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            form={form}
            name="password"
            label="Password"
            type="password"
            autoComplete="new-password"
            required
          />
          <FormField
            form={form}
            name="password2"
            label="Confirm password"
            type="password"
            autoComplete="new-password"
            required
          />
        </div>

        <Button type="submit" size="lg" className="w-full" isLoading={signUp.isPending}>
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Already registered?{' '}
        <Link to="/login" className="font-medium text-brand-700 hover:underline">
          Sign in
        </Link>
      </p>
    </Card>
  );
}
