import { handleUpload } from '@vercel/blob/client';

export default async function handler(request, response) {
  try {
    const jsonResponse = await handleUpload({
      body: request.body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        // Camada interna de segurança: validação dos formatos permitidos e tamanho exato solicitados
        return {
          allowedContentTypes: [
            'application/pdf',
            'image/jpeg',
            'image/png',
            'image/webp',
            'text/plain',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'video/mp4',
            'video/mpeg',
            'video/quicktime'
          ],
          maximumSizeInBytes: 15 * 1024 * 1024, // Limite rígido de 15 Megabytes
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // Disparado de maneira assíncrona após o upload ser concluído no servidor de arquivos
        console.log('Upload concluído com sucesso:', blob.url);
      },
    });

    return response.status(200).json(jsonResponse);
  } catch (error) {
    return response.status(400).json({ error: error.message });
  }
}
