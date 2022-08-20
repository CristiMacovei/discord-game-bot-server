module.exports = {
  periodToString: function (ms) {
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);

    let string = '';

    if (days > 0) {
      string += `${days}d `;
    }

    if (hours > 0) {
      string += `${hours}h `;
    }

    if (minutes > 0) {
      string += `${minutes}m `;
    }

    if (seconds > 0) {
      string += `${seconds}s`;
    }

    return string;
  }
};
