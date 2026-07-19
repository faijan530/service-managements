export type RequestStatus = 'OPEN' | 'IN_REVIEW' | 'IN_PROGRESS' | 'RESOLVED' | 'CANCELLED';

const STATUS_ORDER: RequestStatus[] = ['OPEN', 'IN_REVIEW', 'IN_PROGRESS', 'RESOLVED'];

export const canTransitionStatus = (fromStatus: RequestStatus, toStatus: RequestStatus): boolean => {
  if (fromStatus === 'CANCELLED' || toStatus === 'CANCELLED') {
    return fromStatus === 'OPEN' && toStatus === 'CANCELLED';
  }

  if (fromStatus === 'RESOLVED') {
    return false;
  }

  const fromIndex = STATUS_ORDER.indexOf(fromStatus);
  const toIndex = STATUS_ORDER.indexOf(toStatus);

  if (fromIndex === -1 || toIndex === -1) {
    return false;
  }

  return toIndex === fromIndex + 1;
};

export const getAllowedNextStatuses = (currentStatus: RequestStatus): RequestStatus[] => {
  if (currentStatus === 'CANCELLED' || currentStatus === 'RESOLVED') {
    return [];
  }

  const currentIndex = STATUS_ORDER.indexOf(currentStatus);
  if (currentIndex === -1) {
    return [];
  }

  const nextStatus = STATUS_ORDER[currentIndex + 1];
  return nextStatus ? [nextStatus] : [];
};
