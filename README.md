Configuração do Projeto
--------------------------

### Pré-requisitos

Para executar o projeto localmente, certifique-se de que você possui as seguintes ferramentas instaladas:

*   **Node.js** (Versão LTS recomendada: v18 ou superior).
    
*   **npm** (Gerenciador de pacotes do Node.js).
    
*   **Credenciais de Desenvolvedor do Spotify:** É necessário um **Client ID** e um **Client Secret** obtidos no \[Spotify Developer Dashboard\].
    

### 1\. Instalação

1.  git clone https://github.com/MarcosVini762/Activity-QA3.git
    
2.  Instale o Jest, Axios e o dotenv (para carregar variáveis de ambiente):Bashnpm install
    

### 2\. Variáveis de Ambiente

Para que o projeto consiga obter o token de autenticação e interagir com a API do Spotify, você deve configurar suas credenciais.

Crie um arquivo chamado **.env** na raiz do projeto com as seguintes informações:

▶️ Execução dos Testes
----------------------

O projeto utiliza scripts definidos no package.json para facilitar a execução.

### Executar Todos os Testes

Para rodar o conjunto completo de testes:

Bash

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   npm test   `

