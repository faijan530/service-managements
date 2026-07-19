export const normalizeEmail = (email: string): string => email.trim().toLowerCase();

export const validateRegistrationInput = (name: string, email: string, password: string) => {
  const trimmedName = name.trim();
  const normalizedEmail = normalizeEmail(email);

  if (!trimmedName || trimmedName.length < 2 || trimmedName.length > 50) {
    return { valid: false, error: 'Name must be between 2 and 50 characters long.' };
  }

  const emailPattern = /^\S+@\S+\.\S+$/;
  if (!emailPattern.test(normalizedEmail)) {
    return { valid: false, error: 'Please provide a valid email address.' };
  }

  if (password.length < 8 || password.length > 128 || !/[A-Z]/.test(password) || !/\d/.test(password)) {
    return { valid: false, error: 'Password must be between 8 and 128 characters and contain an uppercase letter and a number.' };
  }

  return { valid: true, normalizedName: trimmedName, normalizedEmail };
};
