# PurpleFinance

Aplicação de gestão financeira pessoal com Vue.js e Tailwind CSS

## ✨ Funcionalidades

- Controle de transações (receitas/despesas)
- Acompanhamento de metas financeiras
- Painel com gráficos interativos
- Persistência local dos dados

## 🚀 Tecnologias

- **Frontend**:
  - Vue.js 3 (Options API)
  - Tailwind CSS
  - Chart.js
  - LocalStorage API

- **Ferramentas**:
  - CDN (jsDelivr, unpkg)
  - Intl API para formatação

## 🛠️ Como Executar

1. Clone o repositório
2. Abra o arquivo `index.html` no navegador
3. Os dados são salvos automaticamente no localStorage

## 📊 Estrutura do Código

```plaintext
purple-finance/
│
├── public/
│   ├── index.html          # Arquivo HTML principal
│   └── assets/
│       ├── css/            # Estilos adicionais (se necessário)
│       └── images/         # Imagens do projeto
│
├── src/
│   ├── components/         # Componentes Vue
│   │   ├── Navbar.vue
│   │   ├── Dashboard.vue
│   │   ├── Transactions.vue
│   │   └── Goals.vue
│   │
│   ├── composables/        # Lógica reutilizável
│   │   ├── useCharts.js
│   │   └── useFormValidation.js
│   │
│   ├── utils/             # Utilitários
│   │   ├── formatters.js  # Formatação de moeda e datas
│   │   └── storage.js     # LocalStorage helpers
│   │
│   └── main.js            # Ponto de entrada da aplicação
│
├── README.md              # Documentação do projeto
└── package.json           # Dependências e scripts
Melhorias Futuras
Adicionar autenticação

Implementar backend com Firebase

Criar versão PWA
