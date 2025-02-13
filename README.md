# 🚔 CrimeDash

Dashboard analítico para monitoramento de crimes desenvolvido com React, Typescript e Supabase.

![Dashboard Preview](https://raw.githubusercontent.com/flaviokosta79/crimedash/master/docs/dashboard.png)

## 🌟 Funcionalidades

- 📊 **Dashboard Analítico**: Visualização em tempo real dos indicadores criminais
- 🎯 **Gestão de Metas**: Configuração e acompanhamento de metas por unidade
- 📈 **Gráficos Interativos**: Análise temporal da evolução dos crimes
- 🗺️ **Visualização por Batalhão**: Dados específicos por unidade policial
- 📱 **Design Responsivo**: Interface adaptável para todos os dispositivos
- 📥 **Importação de Dados**: Suporte para importação de planilhas XLSX

## 🔍 Indicadores Monitorados

- Letalidade Violenta
- Roubo de Veículo
- Roubo de Rua
- Roubo de Carga

## 🛠️ Tecnologias Utilizadas

- **Frontend**:
  - React 18
  - TypeScript
  - Tailwind CSS
  - Vite
  - React Router DOM
  - Recharts (gráficos)
  - XLSX (importação de dados)

- **Backend**:
  - Supabase (Banco de dados PostgreSQL)
  - Row Level Security (RLS)
  - Políticas de Segurança
  - Funções SQL

## 📦 Instalação

1. Clone o repositório:
```bash
git clone https://github.com/flaviokosta79/crimedash.git
cd crimedash
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
   - Crie um arquivo `.env` na raiz do projeto
   - Adicione suas credenciais do Supabase:
```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
VITE_SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role_do_supabase  # Necessária para importação de dados
```

4. Execute o script SQL de configuração:
   - Acesse o SQL Editor do seu projeto no Supabase
   - Execute os scripts na ordem:
     1. `supabase/setup_tables.sql`
     2. `supabase/migrations/20240212_create_targets.sql`

5. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

## 🚀 Uso

1. Acesse o dashboard em `http://localhost:5173`
2. Use o botão "Importar" para carregar dados de uma planilha XLSX
3. Configure as metas na página "Configurar Metas"
4. Utilize os filtros para análises específicas
5. Clique nos cards dos batalhões para ver detalhes individuais

## 📄 Estrutura do Projeto

```
crimedash/
├── src/
│   ├── components/     # Componentes React reutilizáveis
│   ├── pages/         # Páginas da aplicação
│   ├── services/      # Serviços e lógica de negócio
│   ├── config/        # Configurações (Supabase, etc)
│   └── types/         # Definições de tipos TypeScript
├── supabase/
│   ├── migrations/    # Scripts de migração do banco
│   └── setup_*.sql   # Scripts de configuração
└── public/           # Arquivos estáticos
```

## 🤝 Contribuição

1. Faça um Fork do projeto
2. Crie sua Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a Branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👤 Autor

**Flavio Costa**

* Github: [@flaviokosta79](https://github.com/flaviokosta79)

---
⭐️ From [flaviokosta79](https://github.com/flaviokosta79)
