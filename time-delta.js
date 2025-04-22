document.getElementById('calculate-delta').addEventListener('click', () => {
    const start = document.getElementById('start').value;
    const end = document.getElementById('end').value;

    if (!start || !end) {
        alert('Please fill in both start and end fields.');
        return;
    }

    const { minutes, seconds } = getTimeDelta(start, end);

    document.getElementById('delta-output').textContent = 
        `Time Delta: ${minutes} minutes and ${seconds} seconds.`;
});