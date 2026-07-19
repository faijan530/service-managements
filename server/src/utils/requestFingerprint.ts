export const buildRequestFingerprint = (title: string, description: string) => {
  const normalizedTitle = title.toLowerCase().replace(/\s+/g, ' ').trim();
  const normalizedDescription = description.toLowerCase().replace(/\s+/g, ' ').trim();
  return `${normalizedTitle}|${normalizedDescription}`;
};
