# Guia de Deploy Automático — DrenoDay

Este guia explica como configurar o deploy automático do teu projecto usando
**GitHub Actions** + **Docker** + **ghcr.io**.

## Arquitectura

```
Git Push → GitHub Actions → Build Docker → ghcr.io → POST /deploy → Docker Run
```

O código **NUNCA** é enviado para a VPS. Toda a compilação acontece nos
servidores do GitHub. A VPS apenas faz `docker pull` e `docker run`.

## Passo 1 — Criar uma App na Plataforma

1. Faz login em [drenoday.enor.tech](https://drenoday.enor.tech)
2. Cria um novo projecto
3. Guarda o **APP_NAME** (o subdomínio da tua app) e o **PLATFORM_TOKEN**
   (token de deploy gerado automaticamente)

> O **APP_NAME** será o nome do container e o subdomínio: `https://<app>.enor.tech`
> O **PLATFORM_TOKEN** é único por projecto e usado para autenticar o deploy.

## Passo 2 — Dockerfile

Garante que o teu repositório tem um `Dockerfile` na raiz. Exemplo:

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "index.js"]
```

## Passo 3 — Configurar Secrets no GitHub

1. Vai ao teu repositório no GitHub
2. **Settings → Secrets and variables → Actions**
3. Adiciona estes dois secrets:
   - `PLATFORM_TOKEN` — o token que recebeste ao criar a app
   - `APP_NAME` — o nome da tua app (subdomínio)

## Passo 4 — Copiar o Workflow

Cria o ficheiro `.github/workflows/deploy.yml` no teu repositório com o
conteúdo do ficheiro de exemplo (`docs/github-actions-example.yml` neste
projecto).

O workflow faz:
1. `checkout` do código
2. `login` no ghcr.io
3. `docker build` da imagem
4. `docker push` para ghcr.io
5. `curl` para a API da plataforma com o `APP_NAME` e a imagem

## Passo 5 — Fazer Git Push

```
git add .
git commit -m "configura deploy automático"
git push origin main
```

O deploy acontece automaticamente. Verifica o estado em:
**https://<app>.enor.tech**

## Troubleshooting

### O deploy falhou?
- Verifica os logs da Action no GitHub
- Confirma que o `Dockerfile` existe na raiz
- Confirma que a porta exposta no `Dockerfile` corresponde à `port` do deploy

### A app não responde?
- O container pode estar a usar uma porta diferente de 3000
- No `curl` do workflow, ajusta o campo `"port"` para a porta correcta

### Quero fazer deploy de outra branch?
Altera o `branches: [main]` no workflow para a branch desejada.
