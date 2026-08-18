const http = require('http');
const req = http.request('http://127.0.0.1:8765/api/events', { method: 'GET' }, (res) => {
    res.on('data', (chunk) => {
        const lines = chunk.toString().split('\n');
        for (const line of lines) {
            if (line.startsWith('data: ')) {
                console.log('Received:', line.substring(6));
                if (line.includes('workflow_finished')) {
                    console.log('SUCCESS! Got workflow_finished');
                    process.exit(0);
                }
            }
        }
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
    }, (res) => {
        console.log('Job submitted, status:', res.statusCode);
    });
    req2.write(postData);
    req2.end();
}, 1000);

setTimeout(() => {
    console.log('TIMEOUT waiting for workflow_finished');
    process.exit(1);
}, 15000);
