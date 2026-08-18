const http = require('http');
const req = http.request('http://127.0.0.1:8765/api/internal/worker/events', { method: 'GET' }, (res) => {
    res.on('data', (chunk) => {
        console.log('WORKER_SSE:', chunk.toString());
    });
});
req.end();

setTimeout(() => {
    const postData = JSON.stringify({
        workflowPath: 'c:\\\\Users\\\\pn.tund2\\\\Documents\\\\Repository\\\\automa-ecosystem\\\\automa-vault\\\\google.com\\\\workflows\\\\search.workflow.json'
    });
    const req2 = http.request('http://127.0.0.1:8765/api/jobs/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) }
    });
    req2.write(postData);
    req2.end();
}, 1000);
