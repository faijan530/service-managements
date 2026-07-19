export const normalizeEmail = (email: string): string => email.trim().toLowerCase();

export const validateRegistrationInput = (name: string, email: string, password: string) => {
  const trimmedName = name.trim();
  const normalizedEmail = normalizeEmail(email);

  if (!trimmedName || trimmedName.length < 2) {
    return { valid: false, error: 'Name must be at least 2 characters long.' };
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(normalizedEmail)) {
    return { valid: false, error: 'Please provide a valid email address.' };
  }

  if (password.length < 8 || !/[A-Z]/.test(password) || !/\d/.test(password)) {
    return { valid: false, error: 'Password must be at least 8 characters and contain an uppercase letter and a number.' };
  }

  return { valid: true, normalizedName: trimmedName, normalizedEmail };
};
