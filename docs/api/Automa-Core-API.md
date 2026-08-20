---
title: Automa Core API v1.0.0
language_tabs:
  - shell: Shell
  - javascript: JavaScript
  - rust: Rust
language_clients:
  - shell: ""
  - javascript: ""
  - rust: ""
toc_footers: []
includes: []
search: false
highlight_theme: darkula
headingLevel: 2

---

<!-- Generator: Widdershins v4.0.1 -->

<h1 id="automa-core-api">Automa Core API v1.0.0</h1>

> Scroll down for code samples, example requests and responses. Select a language for code samples from the tabs above or the mobile navigation menu.

API documentation for Automa Core Daemon

 License: 

<h1 id="automa-core-api-events">Events</h1>

## sse_handler

<a id="opIdsse_handler"></a>

> Code samples

```shell
# You can also use wget
curl -X GET /api/events \
  -H 'Accept: text/event-stream'

```

```javascript

const headers = {
  'Accept':'text/event-stream'
};

fetch('/api/events',
{
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

`GET /api/events`

> Example responses

<h3 id="sse_handler-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Server-Sent Events stream for task logs and progress|None|

<h3 id="sse_handler-responseschema">Response Schema</h3>

<aside class="success">
This operation does not require authentication
</aside>

<h1 id="automa-core-api-system">System</h1>

## health_handler

<a id="opIdhealth_handler"></a>

> Code samples

```shell
# You can also use wget
curl -X GET /api/health \
  -H 'Accept: application/json'

```

```javascript

const headers = {
  'Accept':'application/json'
};

fetch('/api/health',
{
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

`GET /api/health`

> Example responses

> 200 Response

```json
{
  "message": "string",
  "status": "string",
  "version": "string"
}
```

<h3 id="health_handler-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Check daemon health status|[HealthResponse](#schemahealthresponse)|

<aside class="success">
This operation does not require authentication
</aside>

## kill_browsers_handler

<a id="opIdkill_browsers_handler"></a>

> Code samples

```shell
# You can also use wget
curl -X DELETE /api/system/browsers \
  -H 'Accept: application/json'

```

```javascript

const headers = {
  'Accept':'application/json'
};

fetch('/api/system/browsers',
{
  method: 'DELETE',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

`DELETE /api/system/browsers`

> Example responses

> 200 Response

```json
{
  "message": "string",
  "success": true
}
```

<h3 id="kill_browsers_handler-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Browsers killed successfully|[SystemResponse](#schemasystemresponse)|

<aside class="success">
This operation does not require authentication
</aside>

## install_browser_handler

<a id="opIdinstall_browser_handler"></a>

> Code samples

```shell
# You can also use wget
curl -X POST /api/system/install-browser \
  -H 'Accept: application/json'

```

```javascript

const headers = {
  'Accept':'application/json'
};

fetch('/api/system/install-browser',
{
  method: 'POST',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

`POST /api/system/install-browser`

> Example responses

> 200 Response

```json
{
  "message": "string",
  "success": true
}
```

<h3 id="install_browser_handler-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Browser installed successfully|[SystemResponse](#schemasystemresponse)|

<aside class="success">
This operation does not require authentication
</aside>

## open_studio_handler

<a id="opIdopen_studio_handler"></a>

> Code samples

```shell
# You can also use wget
curl -X POST /api/system/open-studio \
  -H 'Accept: application/json'

```

```javascript

const headers = {
  'Accept':'application/json'
};

fetch('/api/system/open-studio',
{
  method: 'POST',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

`POST /api/system/open-studio`

> Example responses

> 200 Response

```json
{
  "message": "string",
  "success": true
}
```

<h3 id="open_studio_handler-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Studio opened successfully|[SystemResponse](#schemasystemresponse)|

<aside class="success">
This operation does not require authentication
</aside>

<h1 id="automa-core-api-history">History</h1>

## get_history_handler

<a id="opIdget_history_handler"></a>

> Code samples

```shell
# You can also use wget
curl -X GET /api/history \
  -H 'Accept: application/json'

```

```javascript

const headers = {
  'Accept':'application/json'
};

fetch('/api/history',
{
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

`GET /api/history`

<h3 id="get_history_handler-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|limit|query|integer,null(int64)|false|none|

> Example responses

> 200 Response

```json
[
  {
    "createdAt": "string",
    "id": "string",
    "name": "string",
    "status": "string",
    "updatedAt": "string"
  }
]
```

<h3 id="get_history_handler-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Get job history|Inline|

<h3 id="get_history_handler-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|*anonymous*|[[JobHistoryItem](#schemajobhistoryitem)]|false|none|none|
|» createdAt|string|true|none|none|
|» id|string|true|none|none|
|» name|string|true|none|none|
|» status|string|true|none|none|
|» updatedAt|string|true|none|none|

<aside class="success">
This operation does not require authentication
</aside>

## clear_history_handler

<a id="opIdclear_history_handler"></a>

> Code samples

```shell
# You can also use wget
curl -X DELETE /api/history

```

```javascript

fetch('/api/history',
{
  method: 'DELETE'

})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

`DELETE /api/history`

<h3 id="clear_history_handler-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|All job history cleared successfully|None|

<aside class="success">
This operation does not require authentication
</aside>

## delete_history_item_handler

<a id="opIddelete_history_item_handler"></a>

> Code samples

```shell
# You can also use wget
curl -X DELETE /api/history/{job_id}

```

```javascript

fetch('/api/history/{job_id}',
{
  method: 'DELETE'

})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

`DELETE /api/history/{job_id}`

<h3 id="delete_history_item_handler-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|job_id|path|string|true|Job ID to delete|

<h3 id="delete_history_item_handler-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Job history deleted successfully|None|

<aside class="success">
This operation does not require authentication
</aside>

## get_logs_handler

<a id="opIdget_logs_handler"></a>

> Code samples

```shell
# You can also use wget
curl -X GET /api/history/{job_id}/logs \
  -H 'Accept: application/json'

```

```javascript

const headers = {
  'Accept':'application/json'
};

fetch('/api/history/{job_id}/logs',
{
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

`GET /api/history/{job_id}/logs`

<h3 id="get_logs_handler-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|job_id|path|string|true|Job ID to fetch logs for|

> Example responses

> 200 Response

```json
{}
```

<h3 id="get_logs_handler-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Get job logs|Inline|

<h3 id="get_logs_handler-responseschema">Response Schema</h3>

<aside class="success">
This operation does not require authentication
</aside>

<h1 id="automa-core-api-jobs">Jobs</h1>

## Listen to Worker Events

<a id="opIdListen to Worker Events"></a>

> Code samples

```shell
# You can also use wget
curl -X GET /api/internal/worker/events

```

```javascript

fetch('/api/internal/worker/events',
{
  method: 'GET'

})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

`GET /api/internal/worker/events`

<h3 id="listen-to-worker-events-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|SSE Stream for Worker jobs|None|

<aside class="success">
This operation does not require authentication
</aside>

## Get Active Jobs

<a id="opIdGet Active Jobs"></a>

> Code samples

```shell
# You can also use wget
curl -X GET /api/jobs \
  -H 'Accept: application/json'

```

```javascript

const headers = {
  'Accept':'application/json'
};

fetch('/api/jobs',
{
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

`GET /api/jobs`

<h3 id="get-active-jobs-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|status|query|string|false|Filter by status|

> Example responses

> 200 Response

```json
[
  {
    "jobId": "string"
  }
]
```

<h3 id="get-active-jobs-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|List of active jobs|Inline|

<h3 id="get-active-jobs-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|*anonymous*|[[ActiveJobResponse](#schemaactivejobresponse)]|false|none|none|
|» jobId|string|true|none|none|

<aside class="success">
This operation does not require authentication
</aside>

## Submit Job

<a id="opIdSubmit Job"></a>

> Code samples

```shell
# You can also use wget
curl -X POST /api/jobs/submit \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json'

```

```javascript
const inputBody = '{
  "options": {
    "variables": {
      "keyword": "automa automation"
    }
  },
  "workflowPath": "C:\\Users\\pn.tund2\\Documents\\Repository\\automa-ecosystem\\automa-vault\\google.com\\workflows\\search.workflow.json"
}';
const headers = {
  'Content-Type':'application/json',
  'Accept':'application/json'
};

fetch('/api/jobs/submit',
{
  method: 'POST',
  body: inputBody,
  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

`POST /api/jobs/submit`

> Body parameter

```json
{
  "options": {
    "variables": {
      "keyword": "automa automation"
    }
  },
  "workflowPath": "C:\\Users\\pn.tund2\\Documents\\Repository\\automa-ecosystem\\automa-vault\\google.com\\workflows\\search.workflow.json"
}
```

<h3 id="submit-job-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[SubmitJobPayload](#schemasubmitjobpayload)|true|none|

> Example responses

> 200 Response

```json
{
  "jobId": "string",
  "message": "string",
  "status": "string"
}
```

<h3 id="submit-job-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Job submitted successfully|[SubmitJobResponse](#schemasubmitjobresponse)|

<aside class="success">
This operation does not require authentication
</aside>

## Kill Job

<a id="opIdKill Job"></a>

> Code samples

```shell
# You can also use wget
curl -X DELETE /api/jobs/{job_id}

```

```javascript

fetch('/api/jobs/{job_id}',
{
  method: 'DELETE'

})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

`DELETE /api/jobs/{job_id}`

<h3 id="kill-job-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|job_id|path|string|true|Job ID|

<h3 id="kill-job-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Job killed successfully|None|

<aside class="success">
This operation does not require authentication
</aside>

## Finish Job

<a id="opIdFinish Job"></a>

> Code samples

```shell
# You can also use wget
curl -X POST /api/jobs/{job_id}/finish

```

```javascript

fetch('/api/jobs/{job_id}/finish',
{
  method: 'POST'

})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

`POST /api/jobs/{job_id}/finish`

<h3 id="finish-job-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|job_id|path|string|true|none|

<h3 id="finish-job-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Job marked as finished|None|

<aside class="success">
This operation does not require authentication
</aside>

## Append Job Logs

<a id="opIdAppend Job Logs"></a>

> Code samples

```shell
# You can also use wget
curl -X POST /api/jobs/{job_id}/logs \
  -H 'Content-Type: application/json'

```

```javascript
const inputBody = '{
  "logs": [
    {
      "details": "Node 1 finished",
      "timestamp": 123456789
    }
  ],
  "message": "Execution started",
  "type": "info"
}';
const headers = {
  'Content-Type':'application/json'
};

fetch('/api/jobs/{job_id}/logs',
{
  method: 'POST',
  body: inputBody,
  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

`POST /api/jobs/{job_id}/logs`

> Body parameter

```json
{
  "logs": [
    {
      "details": "Node 1 finished",
      "timestamp": 123456789
    }
  ],
  "message": "Execution started",
  "type": "info"
}
```

<h3 id="append-job-logs-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|job_id|path|string|true|none|
|body|body|[JobLogPayload](#schemajoblogpayload)|true|none|

<h3 id="append-job-logs-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Log received|None|

<aside class="success">
This operation does not require authentication
</aside>

## Get Job Status

<a id="opIdGet Job Status"></a>

> Code samples

```shell
# You can also use wget
curl -X GET /api/jobs/{job_id}/status \
  -H 'Accept: application/json'

```

```javascript

const headers = {
  'Accept':'application/json'
};

fetch('/api/jobs/{job_id}/status',
{
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

`GET /api/jobs/{job_id}/status`

<h3 id="get-job-status-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|job_id|path|string|true|Job ID|

> Example responses

> 200 Response

```json
{
  "status": "string"
}
```

<h3 id="get-job-status-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Job status|[JobStatusResponse](#schemajobstatusresponse)|

<aside class="success">
This operation does not require authentication
</aside>

<h1 id="automa-core-api-lint">Lint</h1>

## lint_workflow_handler

<a id="opIdlint_workflow_handler"></a>

> Code samples

```shell
# You can also use wget
curl -X POST /api/lint \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json'

```

```javascript
const inputBody = 'null';
const headers = {
  'Content-Type':'application/json',
  'Accept':'application/json'
};

fetch('/api/lint',
{
  method: 'POST',
  body: inputBody,
  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

`POST /api/lint`

> Body parameter

```json
null
```

<h3 id="lint_workflow_handler-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|any|true|none|

> Example responses

> 200 Response

```json
{
  "issues": [
    {
      "message": "string",
      "path": "string",
      "severity": "string"
    }
  ],
  "valid": true
}
```

<h3 id="lint_workflow_handler-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Linting results|[LintResponse](#schemalintresponse)|

<aside class="success">
This operation does not require authentication
</aside>

<h1 id="automa-core-api-profiles">Profiles</h1>

## get_profiles_handler

<a id="opIdget_profiles_handler"></a>

> Code samples

```shell
# You can also use wget
curl -X GET /api/profiles \
  -H 'Accept: application/json'

```

```javascript

const headers = {
  'Accept':'application/json'
};

fetch('/api/profiles',
{
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

`GET /api/profiles`

> Example responses

> 200 Response

```json
[
  {
    "created_at": "string",
    "id": "string",
    "is_online": true,
    "name": "string",
    "timezone": "string",
    "updated_at": "string",
    "user_agent": "string"
  }
]
```

<h3 id="get_profiles_handler-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|List of all profiles|Inline|

<h3 id="get_profiles_handler-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|*anonymous*|[[ProfileResponse](#schemaprofileresponse)]|false|none|none|
|» created_at|string|true|none|none|
|» id|string|true|none|none|
|» is_online|boolean|true|none|none|
|» name|string|true|none|none|
|» timezone|string,null|false|none|none|
|» updated_at|string|true|none|none|
|» user_agent|string,null|false|none|none|

<aside class="success">
This operation does not require authentication
</aside>

## create_profile_handler

<a id="opIdcreate_profile_handler"></a>

> Code samples

```shell
# You can also use wget
curl -X POST /api/profiles \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json'

```

```javascript
const inputBody = '{
  "id": "string",
  "name": "string",
  "timezone": "string",
  "user_agent": "string"
}';
const headers = {
  'Content-Type':'application/json',
  'Accept':'application/json'
};

fetch('/api/profiles',
{
  method: 'POST',
  body: inputBody,
  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

`POST /api/profiles`

> Body parameter

```json
{
  "id": "string",
  "name": "string",
  "timezone": "string",
  "user_agent": "string"
}
```

<h3 id="create_profile_handler-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[CreateProfileRequest](#schemacreateprofilerequest)|true|none|

> Example responses

> 500 Response

```json
null
```

<h3 id="create_profile_handler-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Profile created successfully|None|
|500|[Internal Server Error](https://tools.ietf.org/html/rfc7231#section-6.6.1)|Failed to create profile|Inline|

<h3 id="create_profile_handler-responseschema">Response Schema</h3>

<aside class="success">
This operation does not require authentication
</aside>

## get_profile_detail_handler

<a id="opIdget_profile_detail_handler"></a>

> Code samples

```shell
# You can also use wget
curl -X GET /api/profiles/{id} \
  -H 'Accept: application/json'

```

```javascript

const headers = {
  'Accept':'application/json'
};

fetch('/api/profiles/{id}',
{
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

`GET /api/profiles/{id}`

<h3 id="get_profile_detail_handler-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|id|path|string|true|Profile ID|

> Example responses

> 200 Response

```json
{
  "created_at": "string",
  "id": "string",
  "is_online": true,
  "name": "string",
  "timezone": "string",
  "updated_at": "string",
  "user_agent": "string"
}
```

<h3 id="get_profile_detail_handler-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Profile details|[ProfileResponse](#schemaprofileresponse)|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|Profile not found|Inline|

<h3 id="get_profile_detail_handler-responseschema">Response Schema</h3>

<aside class="success">
This operation does not require authentication
</aside>

## update_profile_handler

<a id="opIdupdate_profile_handler"></a>

> Code samples

```shell
# You can also use wget
curl -X PUT /api/profiles/{id} \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json'

```

```javascript
const inputBody = '{
  "name": "string",
  "timezone": "string",
  "user_agent": "string"
}';
const headers = {
  'Content-Type':'application/json',
  'Accept':'application/json'
};

fetch('/api/profiles/{id}',
{
  method: 'PUT',
  body: inputBody,
  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

`PUT /api/profiles/{id}`

> Body parameter

```json
{
  "name": "string",
  "timezone": "string",
  "user_agent": "string"
}
```

<h3 id="update_profile_handler-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|id|path|string|true|Profile ID|
|body|body|[UpdateProfileRequest](#schemaupdateprofilerequest)|true|none|

> Example responses

> 500 Response

```json
null
```

<h3 id="update_profile_handler-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Profile updated successfully|None|
|500|[Internal Server Error](https://tools.ietf.org/html/rfc7231#section-6.6.1)|Failed to update profile|Inline|

<h3 id="update_profile_handler-responseschema">Response Schema</h3>

<aside class="success">
This operation does not require authentication
</aside>

## delete_profile_handler

<a id="opIddelete_profile_handler"></a>

> Code samples

```shell
# You can also use wget
curl -X DELETE /api/profiles/{id} \
  -H 'Accept: application/json'

```

```javascript

const headers = {
  'Accept':'application/json'
};

fetch('/api/profiles/{id}',
{
  method: 'DELETE',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

`DELETE /api/profiles/{id}`

<h3 id="delete_profile_handler-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|id|path|string|true|Profile ID|

> Example responses

> 500 Response

```json
null
```

<h3 id="delete_profile_handler-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Profile deleted successfully|None|
|500|[Internal Server Error](https://tools.ietf.org/html/rfc7231#section-6.6.1)|Failed to delete profile|Inline|

<h3 id="delete_profile_handler-responseschema">Response Schema</h3>

<aside class="success">
This operation does not require authentication
</aside>

<h1 id="automa-core-api-secrets">Secrets</h1>

## encrypt_secret_handler

<a id="opIdencrypt_secret_handler"></a>

> Code samples

```shell
# You can also use wget
curl -X POST /api/secrets/encrypt \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json'

```

```javascript
const inputBody = '{
  "passphrase": "optional_master_password",
  "plaintext": "my_super_secret_api_key"
}';
const headers = {
  'Content-Type':'application/json',
  'Accept':'application/json'
};

fetch('/api/secrets/encrypt',
{
  method: 'POST',
  body: inputBody,
  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

`POST /api/secrets/encrypt`

> Body parameter

```json
{
  "passphrase": "optional_master_password",
  "plaintext": "my_super_secret_api_key"
}
```

<h3 id="encrypt_secret_handler-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[EncryptSecretRequest](#schemaencryptsecretrequest)|true|none|

> Example responses

> 200 Response

```json
{
  "encrypted_secret": "string"
}
```

<h3 id="encrypt_secret_handler-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Secret encrypted successfully|[EncryptSecretResponse](#schemaencryptsecretresponse)|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad Request|[ErrorResponse](#schemaerrorresponse)|
|500|[Internal Server Error](https://tools.ietf.org/html/rfc7231#section-6.6.1)|Internal Server Error|[ErrorResponse](#schemaerrorresponse)|

<aside class="success">
This operation does not require authentication
</aside>

<h1 id="automa-core-api-vault">Vault</h1>

## get_credentials_handler

<a id="opIdget_credentials_handler"></a>

> Code samples

```shell
# You can also use wget
curl -X GET /api/vault/credentials \
  -H 'Accept: application/json'

```

```javascript

const headers = {
  'Accept':'application/json'
};

fetch('/api/vault/credentials',
{
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

`GET /api/vault/credentials`

> Example responses

> 200 Response

```json
[
  {
    "id": "string",
    "key": "string",
    "name": "string",
    "value": "string"
  }
]
```

<h3 id="get_credentials_handler-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|List credentials|Inline|

<h3 id="get_credentials_handler-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|*anonymous*|[[VaultCredential](#schemavaultcredential)]|false|none|none|
|» id|string,null|false|none|none|
|» key|string,null|false|none|none|
|» name|string,null|false|none|none|
|» value|string|true|none|none|

<aside class="success">
This operation does not require authentication
</aside>

## add_credential_handler

<a id="opIdadd_credential_handler"></a>

> Code samples

```shell
# You can also use wget
curl -X POST /api/vault/credentials \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json'

```

```javascript
const inputBody = '{
  "id": "string",
  "key": "string",
  "name": "string",
  "value": "string"
}';
const headers = {
  'Content-Type':'application/json',
  'Accept':'application/json'
};

fetch('/api/vault/credentials',
{
  method: 'POST',
  body: inputBody,
  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

`POST /api/vault/credentials`

> Body parameter

```json
{
  "id": "string",
  "key": "string",
  "name": "string",
  "value": "string"
}
```

<h3 id="add_credential_handler-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[VaultCredential](#schemavaultcredential)|true|none|

> Example responses

> 200 Response

```json
{
  "id": "string",
  "key": "string",
  "name": "string",
  "value": "string"
}
```

<h3 id="add_credential_handler-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Add credential|[VaultCredential](#schemavaultcredential)|

<aside class="success">
This operation does not require authentication
</aside>

## delete_credential_handler

<a id="opIddelete_credential_handler"></a>

> Code samples

```shell
# You can also use wget
curl -X DELETE /api/vault/credentials/{id}

```

```javascript

fetch('/api/vault/credentials/{id}',
{
  method: 'DELETE'

})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

`DELETE /api/vault/credentials/{id}`

<h3 id="delete_credential_handler-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|id|path|string|true|Credential ID or Name|

<h3 id="delete_credential_handler-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Credential deleted|None|

<aside class="success">
This operation does not require authentication
</aside>

## get_tables_handler

<a id="opIdget_tables_handler"></a>

> Code samples

```shell
# You can also use wget
curl -X GET /api/vault/tables \
  -H 'Accept: application/json'

```

```javascript

const headers = {
  'Accept':'application/json'
};

fetch('/api/vault/tables',
{
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

`GET /api/vault/tables`

> Example responses

> 200 Response

```json
[
  {
    "columns": null,
    "columnsIndex": null,
    "createdAt": 0,
    "id": "string",
    "items": null,
    "modifiedAt": 0,
    "name": "string"
  }
]
```

<h3 id="get_tables_handler-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|List tables|Inline|

<h3 id="get_tables_handler-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|*anonymous*|[[VaultTable](#schemavaulttable)]|false|none|none|
|» columns|any|false|none|none|
|» columnsIndex|any|false|none|none|
|» createdAt|integer,null(int64)|false|none|none|
|» id|string,null|false|none|none|
|» items|any|false|none|none|
|» modifiedAt|integer,null(int64)|false|none|none|
|» name|string,null|false|none|none|

<aside class="success">
This operation does not require authentication
</aside>

## add_table_handler

<a id="opIdadd_table_handler"></a>

> Code samples

```shell
# You can also use wget
curl -X POST /api/vault/tables \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json'

```

```javascript
const inputBody = '{
  "columns": null,
  "columnsIndex": null,
  "createdAt": 0,
  "id": "string",
  "items": null,
  "modifiedAt": 0,
  "name": "string"
}';
const headers = {
  'Content-Type':'application/json',
  'Accept':'application/json'
};

fetch('/api/vault/tables',
{
  method: 'POST',
  body: inputBody,
  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

`POST /api/vault/tables`

> Body parameter

```json
{
  "columns": null,
  "columnsIndex": null,
  "createdAt": 0,
  "id": "string",
  "items": null,
  "modifiedAt": 0,
  "name": "string"
}
```

<h3 id="add_table_handler-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[VaultTable](#schemavaulttable)|true|none|

> Example responses

> 200 Response

```json
{
  "columns": null,
  "columnsIndex": null,
  "createdAt": 0,
  "id": "string",
  "items": null,
  "modifiedAt": 0,
  "name": "string"
}
```

<h3 id="add_table_handler-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Add table|[VaultTable](#schemavaulttable)|

<aside class="success">
This operation does not require authentication
</aside>

## delete_table_handler

<a id="opIddelete_table_handler"></a>

> Code samples

```shell
# You can also use wget
curl -X DELETE /api/vault/tables/{id}

```

```javascript

fetch('/api/vault/tables/{id}',
{
  method: 'DELETE'

})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

`DELETE /api/vault/tables/{id}`

<h3 id="delete_table_handler-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|id|path|string|true|Table ID|

<h3 id="delete_table_handler-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Table deleted|None|

<aside class="success">
This operation does not require authentication
</aside>

## get_variables_handler

<a id="opIdget_variables_handler"></a>

> Code samples

```shell
# You can also use wget
curl -X GET /api/vault/variables \
  -H 'Accept: application/json'

```

```javascript

const headers = {
  'Accept':'application/json'
};

fetch('/api/vault/variables',
{
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

`GET /api/vault/variables`

> Example responses

> 200 Response

```json
[
  {
    "id": "string",
    "key": "string",
    "name": "string",
    "value": null
  }
]
```

<h3 id="get_variables_handler-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|List variables|Inline|

<h3 id="get_variables_handler-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|*anonymous*|[[VaultVariable](#schemavaultvariable)]|false|none|none|
|» id|string,null|false|none|none|
|» key|string,null|false|none|none|
|» name|string,null|false|none|none|
|» value|any|true|none|none|

<aside class="success">
This operation does not require authentication
</aside>

## add_variable_handler

<a id="opIdadd_variable_handler"></a>

> Code samples

```shell
# You can also use wget
curl -X POST /api/vault/variables \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json'

```

```javascript
const inputBody = '{
  "id": "string",
  "key": "string",
  "name": "string",
  "value": null
}';
const headers = {
  'Content-Type':'application/json',
  'Accept':'application/json'
};

fetch('/api/vault/variables',
{
  method: 'POST',
  body: inputBody,
  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

`POST /api/vault/variables`

> Body parameter

```json
{
  "id": "string",
  "key": "string",
  "name": "string",
  "value": null
}
```

<h3 id="add_variable_handler-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[VaultVariable](#schemavaultvariable)|true|none|

> Example responses

> 200 Response

```json
{
  "id": "string",
  "key": "string",
  "name": "string",
  "value": null
}
```

<h3 id="add_variable_handler-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Add variable|[VaultVariable](#schemavaultvariable)|

<aside class="success">
This operation does not require authentication
</aside>

## delete_variable_handler

<a id="opIddelete_variable_handler"></a>

> Code samples

```shell
# You can also use wget
curl -X DELETE /api/vault/variables/{id}

```

```javascript

fetch('/api/vault/variables/{id}',
{
  method: 'DELETE'

})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

`DELETE /api/vault/variables/{id}`

<h3 id="delete_variable_handler-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|id|path|string|true|Variable ID or Name|

<h3 id="delete_variable_handler-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Variable deleted|None|

<aside class="success">
This operation does not require authentication
</aside>

# Schemas

<h2 id="tocS_ActiveJobResponse">ActiveJobResponse</h2>
<!-- backwards compatibility -->
<a id="schemaactivejobresponse"></a>
<a id="schema_ActiveJobResponse"></a>
<a id="tocSactivejobresponse"></a>
<a id="tocsactivejobresponse"></a>

```json
{
  "jobId": "string"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|jobId|string|true|none|none|

<h2 id="tocS_CreateProfileRequest">CreateProfileRequest</h2>
<!-- backwards compatibility -->
<a id="schemacreateprofilerequest"></a>
<a id="schema_CreateProfileRequest"></a>
<a id="tocScreateprofilerequest"></a>
<a id="tocscreateprofilerequest"></a>

```json
{
  "id": "string",
  "name": "string",
  "timezone": "string",
  "user_agent": "string"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|id|string|true|none|none|
|name|string|true|none|none|
|timezone|string,null|false|none|none|
|user_agent|string,null|false|none|none|

<h2 id="tocS_EncryptSecretRequest">EncryptSecretRequest</h2>
<!-- backwards compatibility -->
<a id="schemaencryptsecretrequest"></a>
<a id="schema_EncryptSecretRequest"></a>
<a id="tocSencryptsecretrequest"></a>
<a id="tocsencryptsecretrequest"></a>

```json
{
  "passphrase": "optional_master_password",
  "plaintext": "my_super_secret_api_key"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|passphrase|string,null|false|none|none|
|plaintext|string|true|none|none|

<h2 id="tocS_EncryptSecretResponse">EncryptSecretResponse</h2>
<!-- backwards compatibility -->
<a id="schemaencryptsecretresponse"></a>
<a id="schema_EncryptSecretResponse"></a>
<a id="tocSencryptsecretresponse"></a>
<a id="tocsencryptsecretresponse"></a>

```json
{
  "encrypted_secret": "string"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|encrypted_secret|string|true|none|none|

<h2 id="tocS_ErrorResponse">ErrorResponse</h2>
<!-- backwards compatibility -->
<a id="schemaerrorresponse"></a>
<a id="schema_ErrorResponse"></a>
<a id="tocSerrorresponse"></a>
<a id="tocserrorresponse"></a>

```json
{
  "error": "string"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|error|string|true|none|none|

<h2 id="tocS_HealthResponse">HealthResponse</h2>
<!-- backwards compatibility -->
<a id="schemahealthresponse"></a>
<a id="schema_HealthResponse"></a>
<a id="tocShealthresponse"></a>
<a id="tocshealthresponse"></a>

```json
{
  "message": "string",
  "status": "string",
  "version": "string"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|message|string|true|none|none|
|status|string|true|none|none|
|version|string|true|none|none|

<h2 id="tocS_JobDetails">JobDetails</h2>
<!-- backwards compatibility -->
<a id="schemajobdetails"></a>
<a id="schema_JobDetails"></a>
<a id="tocSjobdetails"></a>
<a id="tocsjobdetails"></a>

```json
{
  "error": "string",
  "job": {},
  "logs": [
    null
  ],
  "results": null
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|error|string,null|false|none|none|
|job|any|false|none|none|

oneOf

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» *anonymous*|null|false|none|none|

xor

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» *anonymous*|[JobInfo](#schemajobinfo)|false|none|none|

continued

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|logs|array,null|false|none|none|
|results|any|false|none|none|

<h2 id="tocS_JobHistoryItem">JobHistoryItem</h2>
<!-- backwards compatibility -->
<a id="schemajobhistoryitem"></a>
<a id="schema_JobHistoryItem"></a>
<a id="tocSjobhistoryitem"></a>
<a id="tocsjobhistoryitem"></a>

```json
{
  "createdAt": "string",
  "id": "string",
  "name": "string",
  "status": "string",
  "updatedAt": "string"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|createdAt|string|true|none|none|
|id|string|true|none|none|
|name|string|true|none|none|
|status|string|true|none|none|
|updatedAt|string|true|none|none|

<h2 id="tocS_JobInfo">JobInfo</h2>
<!-- backwards compatibility -->
<a id="schemajobinfo"></a>
<a id="schema_JobInfo"></a>
<a id="tocSjobinfo"></a>
<a id="tocsjobinfo"></a>

```json
{
  "createdAt": "string",
  "duration": 0,
  "endedAt": "string",
  "id": "string",
  "name": "string",
  "status": "string",
  "workflowId": "string"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|createdAt|string|true|none|none|
|duration|integer,null(int64)|false|none|none|
|endedAt|string|true|none|none|
|id|string|true|none|none|
|name|string|true|none|none|
|status|string|true|none|none|
|workflowId|string|true|none|none|

<h2 id="tocS_JobLogPayload">JobLogPayload</h2>
<!-- backwards compatibility -->
<a id="schemajoblogpayload"></a>
<a id="schema_JobLogPayload"></a>
<a id="tocSjoblogpayload"></a>
<a id="tocsjoblogpayload"></a>

```json
{
  "logs": [
    {
      "details": "Node 1 finished",
      "timestamp": 123456789
    }
  ],
  "message": "Execution started",
  "type": "info"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|logs|array,null|false|none|none|
|message|string,null|false|none|none|
|type|string|true|none|none|

<h2 id="tocS_JobStatusResponse">JobStatusResponse</h2>
<!-- backwards compatibility -->
<a id="schemajobstatusresponse"></a>
<a id="schema_JobStatusResponse"></a>
<a id="tocSjobstatusresponse"></a>
<a id="tocsjobstatusresponse"></a>

```json
{
  "status": "string"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|status|string|true|none|none|

<h2 id="tocS_LintIssue">LintIssue</h2>
<!-- backwards compatibility -->
<a id="schemalintissue"></a>
<a id="schema_LintIssue"></a>
<a id="tocSlintissue"></a>
<a id="tocslintissue"></a>

```json
{
  "message": "string",
  "path": "string",
  "severity": "string"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|message|string|true|none|none|
|path|string,null|false|none|none|
|severity|string|true|none|none|

<h2 id="tocS_LintRequest">LintRequest</h2>
<!-- backwards compatibility -->
<a id="schemalintrequest"></a>
<a id="schema_LintRequest"></a>
<a id="tocSlintrequest"></a>
<a id="tocslintrequest"></a>

```json
{
  "workflowData": "{\"nodes\": [], \"edges\": []}"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|workflowData|string|true|none|none|

<h2 id="tocS_LintResponse">LintResponse</h2>
<!-- backwards compatibility -->
<a id="schemalintresponse"></a>
<a id="schema_LintResponse"></a>
<a id="tocSlintresponse"></a>
<a id="tocslintresponse"></a>

```json
{
  "issues": [
    {
      "message": "string",
      "path": "string",
      "severity": "string"
    }
  ],
  "valid": true
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|issues|[[LintIssue](#schemalintissue)]|true|none|none|
|valid|boolean|true|none|none|

<h2 id="tocS_LogItem">LogItem</h2>
<!-- backwards compatibility -->
<a id="schemalogitem"></a>
<a id="schema_LogItem"></a>
<a id="tocSlogitem"></a>
<a id="tocslogitem"></a>

```json
{
  "createdAt": "string",
  "id": 0,
  "jobId": "string",
  "message": "string",
  "type": "string"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|createdAt|string|true|none|none|
|id|integer(int64)|true|none|none|
|jobId|string|true|none|none|
|message|string|true|none|none|
|type|string|true|none|none|

<h2 id="tocS_Profile">Profile</h2>
<!-- backwards compatibility -->
<a id="schemaprofile"></a>
<a id="schema_Profile"></a>
<a id="tocSprofile"></a>
<a id="tocsprofile"></a>

```json
{
  "created_at": "string",
  "id": "string",
  "name": "string",
  "timezone": "string",
  "updated_at": "string",
  "user_agent": "string"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|created_at|string|true|none|none|
|id|string|true|none|none|
|name|string|true|none|none|
|timezone|string,null|false|none|none|
|updated_at|string|true|none|none|
|user_agent|string,null|false|none|none|

<h2 id="tocS_ProfileResponse">ProfileResponse</h2>
<!-- backwards compatibility -->
<a id="schemaprofileresponse"></a>
<a id="schema_ProfileResponse"></a>
<a id="tocSprofileresponse"></a>
<a id="tocsprofileresponse"></a>

```json
{
  "created_at": "string",
  "id": "string",
  "is_online": true,
  "name": "string",
  "timezone": "string",
  "updated_at": "string",
  "user_agent": "string"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|created_at|string|true|none|none|
|id|string|true|none|none|
|is_online|boolean|true|none|none|
|name|string|true|none|none|
|timezone|string,null|false|none|none|
|updated_at|string|true|none|none|
|user_agent|string,null|false|none|none|

<h2 id="tocS_SubmitJobPayload">SubmitJobPayload</h2>
<!-- backwards compatibility -->
<a id="schemasubmitjobpayload"></a>
<a id="schema_SubmitJobPayload"></a>
<a id="tocSsubmitjobpayload"></a>
<a id="tocssubmitjobpayload"></a>

```json
{
  "options": {
    "variables": {
      "keyword": "automa automation"
    }
  },
  "workflowPath": "C:\\Users\\pn.tund2\\Documents\\Repository\\automa-ecosystem\\automa-vault\\google.com\\workflows\\search.workflow.json"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|options|object,null|false|none|none|
|workflowPath|string|true|none|none|

<h2 id="tocS_SubmitJobResponse">SubmitJobResponse</h2>
<!-- backwards compatibility -->
<a id="schemasubmitjobresponse"></a>
<a id="schema_SubmitJobResponse"></a>
<a id="tocSsubmitjobresponse"></a>
<a id="tocssubmitjobresponse"></a>

```json
{
  "jobId": "string",
  "message": "string",
  "status": "string"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|jobId|string|true|none|none|
|message|string,null|false|none|none|
|status|string|true|none|none|

<h2 id="tocS_SystemResponse">SystemResponse</h2>
<!-- backwards compatibility -->
<a id="schemasystemresponse"></a>
<a id="schema_SystemResponse"></a>
<a id="tocSsystemresponse"></a>
<a id="tocssystemresponse"></a>

```json
{
  "message": "string",
  "success": true
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|message|string|true|none|none|
|success|boolean|true|none|none|

<h2 id="tocS_UpdateProfileRequest">UpdateProfileRequest</h2>
<!-- backwards compatibility -->
<a id="schemaupdateprofilerequest"></a>
<a id="schema_UpdateProfileRequest"></a>
<a id="tocSupdateprofilerequest"></a>
<a id="tocsupdateprofilerequest"></a>

```json
{
  "name": "string",
  "timezone": "string",
  "user_agent": "string"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|name|string|true|none|none|
|timezone|string,null|false|none|none|
|user_agent|string,null|false|none|none|

<h2 id="tocS_VaultCredential">VaultCredential</h2>
<!-- backwards compatibility -->
<a id="schemavaultcredential"></a>
<a id="schema_VaultCredential"></a>
<a id="tocSvaultcredential"></a>
<a id="tocsvaultcredential"></a>

```json
{
  "id": "string",
  "key": "string",
  "name": "string",
  "value": "string"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|id|string,null|false|none|none|
|key|string,null|false|none|none|
|name|string,null|false|none|none|
|value|string|true|none|none|

<h2 id="tocS_VaultTable">VaultTable</h2>
<!-- backwards compatibility -->
<a id="schemavaulttable"></a>
<a id="schema_VaultTable"></a>
<a id="tocSvaulttable"></a>
<a id="tocsvaulttable"></a>

```json
{
  "columns": null,
  "columnsIndex": null,
  "createdAt": 0,
  "id": "string",
  "items": null,
  "modifiedAt": 0,
  "name": "string"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|columns|any|false|none|none|
|columnsIndex|any|false|none|none|
|createdAt|integer,null(int64)|false|none|none|
|id|string,null|false|none|none|
|items|any|false|none|none|
|modifiedAt|integer,null(int64)|false|none|none|
|name|string,null|false|none|none|

<h2 id="tocS_VaultVariable">VaultVariable</h2>
<!-- backwards compatibility -->
<a id="schemavaultvariable"></a>
<a id="schema_VaultVariable"></a>
<a id="tocSvaultvariable"></a>
<a id="tocsvaultvariable"></a>

```json
{
  "id": "string",
  "key": "string",
  "name": "string",
  "value": null
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|id|string,null|false|none|none|
|key|string,null|false|none|none|
|name|string,null|false|none|none|
|value|any|true|none|none|

