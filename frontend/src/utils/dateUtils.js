export const getTodayDate = () => {
  return new Date().toISOString().split('T')[0];
};

export const formatDateForInput = (date) => {
  if (!date) return '';
  return new Date(date).toISOString().split('T')[0];
};

export const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString();
};

export const formatTime = (time) => {
  if (!time) return '';
  return new Date(`1970-01-01T${time}`).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const calculateBatchProgress = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const today = new Date();

  if (today < start) return 0;
  if (today > end) return 100;

  const totalDays = (end - start) / (1000 * 60 * 60 * 24);
  const daysElapsed = (today - start) / (1000 * 60 * 60 * 24);
  return Math.round((daysElapsed / totalDays) * 100);
}; 