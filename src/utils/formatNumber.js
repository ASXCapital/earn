function formatNumber(value, maximumFractionDigits = 2) {
    return new Intl.NumberFormat('en-US', {
      maximumFractionDigits,
      minimumFractionDigits: maximumFractionDigits,
    }).format(value);
  }
  