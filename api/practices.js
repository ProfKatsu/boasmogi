import { sql } from '@vercel/postgres';

export default async function handler(request, response) {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
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
        escola,
        autor,
        funcao,
        componente_curricular,
        tem_impacto_indice,
        nome_indice,
        titulo,
        descricao,
        arquivo_url,
        arquivo_nome, // <- Correção feita aqui (de name para nome)
        termo_aceite
      } = request.body;

      // Injeção de dados parametrizada (com proteção extra contra undefined)
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

  return response.status(405).json({ error: 'Método HTTP não suportado.' });
}
