# Notion · banco "Atendimentos"

Um database só, várias views. O n8n preenche o que vem da ficha; o tatuador mexe só em Status e nos campos dele.

## Propriedades

| Propriedade | Tipo | Quem preenche |
| --- | --- | --- |
| Cliente | Título | n8n |
| Status | Select: 🆕 Novo · 👀 Triagem · 💬 Orçado · 💰 Aguardando sinal · 📅 Agendado · 🖤 Feito · ❌ Perdido · 🙅 Não é meu estilo | tatuador |
| Termômetro | Select: 🔥 Quente · 🌤 Morno · ❄️ Frio | n8n |
| Score | Número | n8n |
| Por que essa nota | Texto | n8n |
| Instagram · WhatsApp | URL (clicável, `wa.me` pronto) | n8n |
| Cidade | Texto | n8n |
| Região | Select: 🏠 Grande Vitória · 🚗 Fora da Grande Vitória | n8n |
| Experiência · Local do corpo · Tamanho · Cor · Faixa de investimento · Prazo · Origem | Select | n8n |
| Ideia · Disponibilidade | Texto | n8n |
| Cobertura | Checkbox | n8n |
| Referências · Foto do local · Cover atual | Arquivos | n8n |
| Data limite | Data | n8n |
| Entrou em | Data (vem do `createdAt` do Tally) | n8n |
| Parado há | Fórmula | Notion |
| Valor orçado · Sinal pago · Data da sessão | Número · Checkbox · Data | tatuador |
| Notas do Russo · Motivo da perda | Texto · Select | tatuador |

Opções de select não podem ter vírgula (a API rejeita): use `·`.

## Fórmula "Parado há"

```
let(dias, dateBetween(now(), prop("Entrou em"), "days"),
  if(prop("Status") == "🆕 Novo" or prop("Status") == "👀 Triagem" or prop("Status") == "💬 Orçado",
    if(dias >= 3, "🔴 " + format(dias) + "d parado",
    if(dias >= 2, "🟡 " + format(dias) + "d",
                  "🟢 " + format(dias) + "d")),
    ""))
```

## Views

| View | Tipo | Configuração |
| --- | --- | --- |
| 📥 Responder hoje | Board por Termômetro | Status é Novo ou Triagem · mais antigo primeiro |
| 🎯 Pipeline | Board por Status | mais antigo primeiro |
| 📅 Agenda | Calendário por Data da sessão | Status é Agendado ou Feito |
| 🖼 Referências | Galeria | capa = Referências |
| 💀 Perdidos | Lista agrupada por Motivo da perda | Status é Perdido ou Não é meu estilo |

Dado de saúde (anamnese) não entra aqui: é dado sensível pela LGPD e fica na ficha assinada no estúdio.
