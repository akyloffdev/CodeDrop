import PasteViewer from './PasteViewer';

async function getPaste(id: string) {
  const host = process.env.NEXT_PUBLIC_API_HOST || 'http://localhost:8080';
  const url = host.includes('://') ? host : `https://${host}`;
  try {
    const res = await fetch(`${url}/api/pastes/${id}`, { 
      cache: 'no-store',
      headers: {
        'X-CodeDrop-Token': 'secure-access-v1'
      }
    });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

export default async function Page({ params }: { params: { id: string } }) {
  const paste = await getPaste(params.id);
  if (!paste) return <div className="text-center py-20">Paste not found</div>;
  return <PasteViewer paste={paste} />;
}

