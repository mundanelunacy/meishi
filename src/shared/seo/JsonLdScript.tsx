type JsonLdNode = Record<string, unknown>;

export function JsonLdScript({ graph }: { graph: JsonLdNode[] }) {
  const payload = JSON.stringify({ "@context": "https://schema.org", "@graph": graph }).replace(
    /</g,
    "\\u003c",
  );

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: payload }}
    />
  );
}