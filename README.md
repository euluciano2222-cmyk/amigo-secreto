# 🎄 Amigo Secreto de Natal

Site para organizar o amigo secreto da família: você cadastra os participantes, o sorteio é feito na hora e cada pessoa recebe pelo WhatsApp um link pessoal que revela quem ela tirou.

**Acesse:** https://euluciano2222-cmyk.github.io/amigo-secreto/

![Prévia do Amigo Secreto de Natal](preview.jpg)

## Funcionalidades

- Cadastro do grupo com nome, valor do presente e dia do amigo secreto
- Sorteio em que cada pessoa tira exatamente uma outra e ninguém tira a si mesmo
- Família/casa por participante: quem é da mesma família não tira um ao outro (ex.: mãe e filhos)
- Link individual por participante, com botão para enviar direto no WhatsApp
- Tela de revelação que só mostra o nome depois de um toque
- O organizador não vê o resultado, então também pode participar
- Sorteio salvo no navegador, para reenviar um link sem sortear de novo
- Cartão de prévia quando o link é compartilhado
- Layout pensado primeiro para celular, com tema de Natal

## Como usar

1. Abra o site e informe o nome do grupo.
2. Adicione os participantes (mínimo de 3). O WhatsApp de cada um é opcional.
3. Se precisar, informe a família/casa de cada um; pessoas da mesma família não se tiram.
4. Toque em **Sortear**.
5. Envie para cada pessoa o link dela, em conversa privada.

## Como funciona

O projeto não tem servidor nem banco de dados: tudo roda no navegador.

- **Sorteio:** a lista de participantes é embaralhada com o algoritmo de Fisher-Yates, usando `crypto.getRandomValues`. Se alguém cair na própria posição ou tirar alguém da própria família/casa, o embaralhamento é refeito. Com muitas restrições, um algoritmo de emparelhamento (Kuhn) encontra uma combinação válida ou avisa que ela não existe.
- **Links:** o resultado de cada pessoa é codificado em Base64 e colocado depois do `#` no endereço. Essa parte do link não é enviada ao servidor.
- **Persistência:** o grupo e o sorteio ficam no `localStorage` do navegador do organizador.

## Limitações

- O resultado é embaralhado no link, não criptografado. Quem tiver acesso ao link de outra pessoa consegue ver quem ela tirou.
- O sorteio fica salvo apenas no navegador de quem organizou. Limpar os dados do navegador apaga a tela de reenvio (os links já enviados continuam funcionando).
- Um novo sorteio invalida os resultados dos links enviados antes.

## Tecnologias

- HTML5
- CSS3 (variáveis, grid, flexbox, animações)
- JavaScript puro, sem bibliotecas
- GitHub Pages para a hospedagem

## Rodando no seu computador

```bash
git clone https://github.com/euluciano2222-cmyk/amigo-secreto.git
```

Depois abra o `index.html` no navegador. Para que os links funcionem para outras pessoas, o site precisa estar publicado.

## Próximos passos

- Lista de desejos por participante
- Banco de dados para guardar o sorteio na nuvem e proteger o resultado

## Autor

Luciano — [@euluciano2222-cmyk](https://github.com/euluciano2222-cmyk)
