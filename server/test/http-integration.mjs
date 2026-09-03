const api = process.env.DOCFLOW_API_URL ?? 'http://localhost:3000/api';

async function request(path, options = {}) {
  const response = await fetch(`${api}${path}`, options);
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(`${options.method ?? 'GET'} ${path} -> ${response.status}: ${JSON.stringify(body)}`);
  }
  return { response, body };
}

const health = (await request('/health')).body;
const users = (await request('/users')).body;
const owner = users.find((user) => user.email === 'owner@docflow.test');
const collaborator = users.find((user) => user.email === 'collaborator@docflow.test');

if (!owner || !collaborator) throw new Error('Expected seeded reviewer users');

const ownerHeaders = {
  'content-type': 'application/json',
  'x-user-id': owner.id,
};
const collaboratorHeaders = {
  'content-type': 'application/json',
  'x-user-id': collaborator.id,
};
const richText =
  '<h1>Launch plan</h1><p><strong>Containerized</strong> and persistent.</p>' +
  '<ul><li>Angular</li><li>NestJS</li><li>PostgreSQL</li></ul>';

const created = (
  await request('/documents', {
    method: 'POST',
    headers: ownerHeaders,
    body: JSON.stringify({ title: 'Assessment launch plan' }),
  })
).body;

await request(`/documents/${created.id}`, {
  method: 'PATCH',
  headers: ownerHeaders,
  body: JSON.stringify({ title: created.title, content: richText }),
});

const reopened = (
  await request(`/documents/${created.id}`, { headers: ownerHeaders })
).body;

const ownerPresence = (
  await request(`/documents/${created.id}/presence`, {
    method: 'POST',
    headers: ownerHeaders,
    body: '{}',
  })
).body;

const form = new FormData();
form.append(
  'file',
  new Blob(['# Imported evidence\n\nThe Markdown fixture is persistent.'], {
    type: 'text/markdown',
  }),
  'import-sample.md',
);
const imported = (
  await request('/documents/import', {
    method: 'POST',
    headers: { 'x-user-id': owner.id },
    body: form,
  })
).body;

await request(`/documents/${created.id}/shares`, {
  method: 'POST',
  headers: ownerHeaders,
  body: JSON.stringify({
    email: collaborator.email,
    permission: 'VIEWER',
  }),
});

const collaboratorDocuments = (
  await request('/documents', { headers: collaboratorHeaders })
).body;
const sharedDocument = collaboratorDocuments.shared.find(
  (document) => document.id === created.id,
);
if (!sharedDocument) throw new Error('Shared document was not listed');

const sharedReopened = (
  await request(`/documents/${created.id}`, { headers: collaboratorHeaders })
).body;

const collaboratorPresence = (
  await request(`/documents/${created.id}/presence`, {
    method: 'POST',
    headers: collaboratorHeaders,
    body: '{}',
  })
).body;
const versions = (
  await request(`/documents/${created.id}/versions`, { headers: collaboratorHeaders })
).body;

const viewerEdit = await fetch(`${api}/documents/${created.id}`, {
  method: 'PATCH',
  headers: collaboratorHeaders,
  body: JSON.stringify({ title: 'Unauthorized change' }),
});

if (viewerEdit.status !== 403) {
  throw new Error(`Expected viewer update status 403, received ${viewerEdit.status}`);
}
if (versions.length < 2) throw new Error('Expected a creation and save version');
if (!ownerPresence.some((person) => person.id === owner.id && person.online)) {
  throw new Error('Owner presence was not reported online');
}
if (!collaboratorPresence.some((person) => person.id === collaborator.id && person.online)) {
  throw new Error('Collaborator presence was not reported online');
}

console.log(
  JSON.stringify(
    {
      health: health.status,
      usersSeeded: users.length,
      createdTitle: created.title,
      richTextPersisted: reopened.content === richText,
      importedTitle: imported.title,
      sharedDocumentListed: true,
      reopenedAccess: sharedReopened.access,
      viewerEditStatus: viewerEdit.status,
      versionCount: versions.length,
      activeCollaborators: collaboratorPresence.filter((person) => person.online).length,
    },
    null,
    2,
  ),
);
