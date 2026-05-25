import { sql } from '@vercel/postgres';
import { del } from '@vercel/blob'; // Adicionado para apagar o arquivo e liberar espaço

export default async function handler(request, response) {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  // OPERAÇÃO LEITURA (GET) - Mural de Práticas
  if (request.method === 'GET') {
    try {
      const { rows } = await sql`SELECT * FROM boas_praticas ORDER BY id DESC;`;
      return response.status(200).json(rows);
    } catch (error) {
      console.error(error);
      return response.status(500).json({ error: 'Falha interna ao consultar base de dados.' });
    }
  }

  // OPERAÇÃO ESCRITA (POST) - Registro da Prática
  if (request.method === 'POST') {
    try {
      const {
        escola, autor, funcao, componente_curricular, tem_impacto_indice, 
        nome_indice, titulo, descricao, arquivo_url, arquivo_nome, termo_aceite
      } = request.body;

      await sql`
        INSERT INTO boas_praticas (
          escola, autor, funcao, componente_curricular, tem_impacto_indice, 
          nome_indice, titulo, descricao, arquivo_url, arquivo_nome, termo_aceite
        ) VALUES (
          ${escola}, ${autor}, ${funcao}, ${componente_curricular}, ${tem_impacto_indice}, 
          ${nome_indice || null}, ${titulo}, ${descricao}, ${arquivo_url || null}, ${arquivo_nome || null}, ${termo_aceite}
        );
      `;
      return response.status(201).json({ success: true, message: 'Registro gravado com sucesso!' });
    } catch (error) {
      console.error(error);
      return response.status(500).json({ error: 'Erro de processamento na inserção dos dados.', details: error.message });
    }
  }

  // OPERAÇÃO EXCLUSÃO (DELETE) - Acesso Restrito ao Administrador
  if (request.method === 'DELETE') {
    try {
      const { id, senha } = request.body;

      // Trava de Segurança: Verifica se a senha bate com a variável de ambiente da Vercel
      if (senha !== process.env.SENHA_ADMIN) {
        return response.status(401).json({ error: 'Senha de administrador incorreta. Acesso negado.' });
      }

      // 1. Busca qual é a URL do arquivo para podermos apagá-lo do Vercel Blob
      const { rows } = await sql`SELECT arquivo_url FROM boas_praticas WHERE id = ${id}`;
      const arquivoUrl = rows[0]?.arquivo_url;

      // 2. Apaga o registro de texto do banco de dados Postgres
      await sql`DELETE FROM boas_praticas WHERE id = ${id}`;

      // 3. Se havia um arquivo anexado, apaga do Blob para liberar seu limite de 1GB
      if (arquivoUrl) {
        await del(arquivoUrl);
      }

      return response.status(200).json({ success: true, message: 'Prática e arquivos excluídos com sucesso!' });
    } catch (error) {
      console.error(error);
      return response.status(500).json({ error: 'Erro no servidor ao tentar excluir.', details: error.message });
    }
  }

  return response.status(405).json({ error: 'Método HTTP não suportado.' });
}
