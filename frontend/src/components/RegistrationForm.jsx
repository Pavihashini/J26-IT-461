import React, { useState } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { registerUser } from '../services/api.js';
import './RegistrationForm.css';

const initialValues = { title: 'Mr.', firstName: '', lastName: '', country: 'Sri Lanka', phone: '', email: '', password: '', confirm: '', emailUsername: false, mobileUsername: false };
const namePattern = /^[\p{L}\p{M}][\p{L}\p{M} '’.-]*$/u;

function validate(values) {
  const errors = {};
  if (!['Mr.', 'Mrs.', 'Ms.', 'Miss', 'Dr.', 'Mx.'].includes(values.title)) errors.title = 'Select your title.';
  for (const [key, label, max] of [['firstName', 'First name', 59], ['lastName', 'Last name', 60]]) {
    if (!values[key].trim()) errors[key] = `${label} is required.`;
    else if (!namePattern.test(values[key].trim())) errors[key] = 'Use letters, spaces, apostrophes, hyphens or initials.';
    else if (values[key].trim().length > max) errors[key] = `Use at most ${max} characters.`;
  }
  if (values.country !== 'Sri Lanka') errors.country = 'Select Sri Lanka.';
  if (!values.phone.trim()) errors.phone = 'Mobile number is required.';
  else if (!/^(?:\+94|94|0)?7\d{8}$/.test(values.phone.replace(/[\s()-]/g, ''))) errors.phone = 'Enter a valid Sri Lankan mobile number, e.g. 0771234567.';
  if (!values.email.trim()) errors.email = 'Email is required.';
  else if (values.email.trim().length > 254 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(values.email.trim())) errors.email = 'Enter a valid email address.';
  if (values.password.length < 8 || values.password.length > 128) errors.password = 'Use between 8 and 128 characters.';
  else if (!/\p{L}/u.test(values.password) || !/\p{N}/u.test(values.password)) errors.password = 'Include at least one letter and one number.';
  if (!values.confirm) errors.confirm = 'Confirm your password.';
  else if (values.confirm !== values.password) errors.confirm = 'Passwords do not match.';
  if (!values.emailUsername && !values.mobileUsername) errors.usernameOptions = 'Please select one or more username options.';
  return errors;
}

function FormField({ name, label, error, hint, children }) {
  return <div className={`registration-field ${error ? 'has-error' : ''}`}>
    <label htmlFor={`register-${name}`}>{label} <span aria-hidden="true">*</span></label>
    {children}
    {hint && <small id={`register-${name}-hint`} className="registration-hint">{hint}</small>}
    {error && <small id={`register-${name}-error`} className="registration-error">{error}</small>}
  </div>;
}

export default function RegistrationForm({ onAuthenticated, onSignIn }) {
  const [values, setValues] = useState(initialValues);
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const errors = validate(values);
  const errorFor = name => submitted || touched[name] ? errors[name] : undefined;
  const update = (name, value) => { setValues(previous => ({ ...previous, [name]: value })); setServerError(''); };
  const fieldProps = (name, hasHint = false) => ({
    id: `register-${name}`, name, value: values[name], required: true,
    onChange: event => update(name, event.target.value),
    onBlur: () => setTouched(previous => ({ ...previous, [name]: true })),
    'aria-invalid': Boolean(errorFor(name)),
    'aria-describedby': [hasHint && `register-${name}-hint`, errorFor(name) && `register-${name}-error`].filter(Boolean).join(' ') || undefined,
  });

  const submit = async event => {
    event.preventDefault();
    if (loading) return;
    setSubmitted(true);
    setServerError('');
    if (Object.keys(errors).length) {
      document.getElementById(`register-${Object.keys(errors)[0]}`)?.focus();
      return;
    }
    setLoading(true);
    try {
      const firstName = values.firstName.trim().replace(/\s+/g, ' ');
      const lastName = values.lastName.trim().replace(/\s+/g, ' ');
      const session = await registerUser(`${firstName} ${lastName}`, values.email.trim(), values.password, {
        title: values.title, first_name: firstName, last_name: lastName,
        country: values.country, country_code: '+94', phone_number: values.phone,
        use_email_username: values.emailUsername, use_mobile_username: values.mobileUsername,
      });
      onAuthenticated(session);
    } catch (error) {
      setServerError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return <main className="registration-main"><form className="registration-card" onSubmit={submit} noValidate aria-labelledby="registration-title" aria-busy={loading}>
    <h1 id="registration-title">Become a member</h1>
    <p className="registration-intro">Join SmartPlate and give good food a second chance.</p>
    {serverError && <div className="registration-banner error" role="alert">{serverError}</div>}
    {submitted && Object.keys(errors).length > 0 && <div className="registration-banner error" role="alert">Please check the highlighted fields before registering.</div>}
    <fieldset className="registration-fields" disabled={loading}>
      <legend className="registration-sr-only">Your account details</legend>
      <FormField name="title" label="Title" error={errorFor('title')}><select {...fieldProps('title')}>{['Mr.', 'Mrs.', 'Ms.', 'Miss', 'Dr.', 'Mx.'].map(title => <option key={title}>{title}</option>)}</select></FormField>
      <FormField name="firstName" label="First name" error={errorFor('firstName')}><input {...fieldProps('firstName')} type="text" autoComplete="given-name" placeholder="First name" maxLength={59} /></FormField>
      <FormField name="lastName" label="Last name" error={errorFor('lastName')}><input {...fieldProps('lastName')} type="text" autoComplete="family-name" placeholder="Last name" maxLength={60} /></FormField>
      <FormField name="country" label="Country" error={errorFor('country')}><select {...fieldProps('country')} autoComplete="country-name"><option>Sri Lanka</option></select></FormField>
      <div className="registration-phone-row">
        <div className="registration-field"><label htmlFor="register-country-code">Code <span aria-hidden="true">*</span></label><input id="register-country-code" type="text" value="+94" readOnly autoComplete="tel-country-code" /></div>
        <FormField name="phone" label="Phone no" error={errorFor('phone')} hint="Sri Lankan mobile number, e.g. 0771234567."><input {...fieldProps('phone', true)} type="tel" inputMode="tel" autoComplete="tel-national" placeholder="771234567" maxLength={30} /></FormField>
      </div>
      <FormField name="email" label="Email" error={errorFor('email')} hint="Required for your account, even when you sign in with your mobile number."><input {...fieldProps('email', true)} type="email" autoComplete="email" placeholder="Your email" maxLength={254} /></FormField>
      <FormField name="password" label="Password" error={errorFor('password')} hint="8–128 characters, including at least one letter and one number."><div className="registration-password"><input {...fieldProps('password', true)} type={showPassword ? 'text' : 'password'} autoComplete="new-password" maxLength={128} /><button type="button" aria-label={showPassword ? 'Hide passwords' : 'Show passwords'} onClick={() => setShowPassword(show => !show)}>{showPassword ? <EyeOff size={19} /> : <Eye size={19} />}</button></div></FormField>
      <FormField name="confirm" label="Confirm password" error={errorFor('confirm')}><input {...fieldProps('confirm')} type={showPassword ? 'text' : 'password'} autoComplete="new-password" maxLength={128} /></FormField>
      <fieldset id="register-usernameOptions" className="registration-usernames" tabIndex={-1} aria-describedby={!values.emailUsername && !values.mobileUsername ? 'register-usernameOptions-error' : undefined} aria-invalid={Boolean(errorFor('usernameOptions'))}>
        <legend className="registration-sr-only">Select at least one way to sign in</legend>
        <label><input type="checkbox" checked={values.emailUsername} onChange={event => update('emailUsername', event.target.checked)} />Use email as username</label>
        <label><input type="checkbox" checked={values.mobileUsername} onChange={event => update('mobileUsername', event.target.checked)} />Use mobile number as username</label>
      </fieldset>
      {!values.emailUsername && !values.mobileUsername && <div id="register-usernameOptions-error" className={`registration-banner ${submitted ? 'error' : 'warning'}`} role={submitted ? 'alert' : 'status'}>Please select one or more username options.</div>}
      <button type="submit" className="registration-submit" disabled={loading}>{loading ? <><Loader2 size={18} className="spin" /> Registering…</> : 'Register'}</button>
    </fieldset>
    <p className="registration-signin">Already a member? <button type="button" onClick={onSignIn} disabled={loading}>Sign in</button></p>
  </form></main>;
}
