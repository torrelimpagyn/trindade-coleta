# Coleta Trindade · acompanhamento do dia

Página para celular (iPhone e Android) com o andamento da coleta domiciliar de Trindade:
percentual executado de cada setor (INLOG), entrada no setor, veículo, distância, velocidade média,
tempo de parada e mapa com o que já foi feito e o que falta.

## Como funciona
- `coletor/coletor.py` entra na INLOG, busca os setores de Trindade do dia e gera `docs/dados.enc.json` (criptografado com a senha do site).
- `.github/workflows/coleta.yml` roda o coletor a cada 15 min (04h às 00h45) e publica a pasta `docs` no GitHub Pages.
- `docs/index.html` pede a senha, descriptografa os dados no próprio celular e se atualiza sozinha a cada 2 min.

## Configuração (uma vez)
1. **Secrets** (Settings › Secrets and variables › Actions › New repository secret):
   - `INLOG_USUARIO` e `INLOG_SENHA`: login da INLOG usado pelo coletor.
   - `SENHA_SITE`: senha que as pessoas vão digitar para abrir a página.
2. **Pages** (Settings › Pages › Source): **GitHub Actions**.
   Repositório privado com Pages exige plano GitHub Pro (ou superior).
3. Rodar a primeira vez: Actions › Coleta Trindade › Run workflow.

O endereço da página aparece em Settings › Pages. Os dados ficam criptografados: sem a senha ninguém consegue lê-los, mesmo com o link.

## Consumo de minutos
Cada execução leva cerca de 1 min. A cada 15 min, das 04h às 01h, são ~2.500 min/mês
(o GitHub Pro inclui 3.000 min/mês em repositórios privados).
