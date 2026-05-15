export const formatMoney = (value, currency = "DH") => `${Number(value || 0).toFixed(2)} ${currency}`;

export const formatDate = (value) => new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "medium",
  timeStyle: "short"
}).format(new Date(value));
