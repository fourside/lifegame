export async function compress(source: string): Promise<ArrayBuffer> {
  const stream = new CompressionStream("gzip");
  const writer = stream.writable.getWriter();
  await writer.write(new TextEncoder().encode(source));
  await writer.close();
  const blob = await new Response(stream.readable).blob();
  return blob.arrayBuffer();
}

export async function decompress(source: ArrayBuffer): Promise<string> {
  const stream = new DecompressionStream("gzip");
  const writer = stream.writable.getWriter();
  await writer.write(new Uint8Array(source));
  await writer.close();
  return await new Response(stream.readable).text();
}
