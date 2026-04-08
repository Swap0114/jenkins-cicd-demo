const express = require('express');
const app = express();

app.get('/', (req, res) => {
    res.json({ message: 'Hello from Jenkins CI/CD pipeline! Testing auto-trigger', status: 'ok' });
});

app.get('/health', (req, res) => {
    res.json({ status: 'healthy' });
});

// Only start the server if this file is run directly
// (not when imported by tests)
if (require.main === module) {
    app.listen(3000, () => {
        console.log('App running on port 3000');
    });
}

module.exports = app;
