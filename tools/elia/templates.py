"""Plantillas de preguntas, SOLO para entrenamiento.

Cruza ~62 plantillas (mitad ES, mitad EN) con los keys (fuertes y débiles) y los títulos de cada intención
de content.js: impersonales ("qué es {X}", "what is {X}") y, sobre Esteban, cada una en tercera y en
segunda persona ("¿Esteban ha trabajado en {X}?" / "¿has trabajado en {X}?", "do you know {X}"…). Las filas generadas pasan después por
augment.py (typos, tildes, sinónimos) igual que las preguntas originales.

Nunca entran a validación: se generan a partir de content.js, no de las preguntas del pliegue
evaluado, y train.py solo las agrega al lado de entrenamiento.

  python tools/elia/templates.py          muestra ejemplos por intención
"""
from __future__ import annotations

import random
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import load_elia  # noqa: E402

# Plantillas impersonales (no hablan de nadie): (idioma, how, plantilla). how = 1 si preguntan cómo se hizo.
NEUTRAL = [
    ("es", 0, "qué es {X}"), ("es", 0, "{X}?"), ("es", 0, "info sobre {X}"), ("es", 0, "de qué se trata {X}"),
    ("es", 0, "quiero saber de {X}"), ("es", 0, "cuéntame de {X}"), ("es", 0, "cuéntame sobre {X}"),
    ("es", 0, "explícame {X}"),
    ("es", 1, "cómo funciona {X}"), ("es", 1, "con qué está hecho {X}"), ("es", 1, "cuál es la metodología de {X}"),
    ("en", 0, "what is {X}"), ("en", 0, "{X}?"), ("en", 0, "info on {X}"), ("en", 0, "what's {X} about"),
    ("en", 0, "anything on {X}"), ("en", 0, "tell me about {X}"), ("en", 0, "explain {X}"),
    ("en", 0, "i want to know about {X}"),
    ("en", 1, "how does {X} work"), ("en", 1, "how was {X} made"), ("en", 1, "what is {X} built with"),
]

# Plantillas sobre Esteban: (idioma, how, tercera persona, segunda persona). Cada una tiene sus dos versiones,
# porque los visitantes le preguntan tanto a EL·IA por Esteban como a Esteban de tú / you.
PAIRS = [
    ("es", 0, "cuéntame qué hizo Esteban en {X}", "cuéntame qué hiciste en {X}"),
    ("es", 0, "qué sabe Esteban de {X}", "qué sabes de {X}"),
    ("es", 0, "Esteban ha trabajado en {X}?", "has trabajado en {X}?"),
    ("es", 0, "Esteban sabe {X}?", "sabes {X}?"),
    ("es", 0, "Esteban tiene experiencia en {X}?", "tienes experiencia en {X}?"),
    ("es", 0, "háblame de {X} de Esteban", "háblame de tu {X}"),
    ("es", 0, "qué ha hecho Esteban con {X}", "qué has hecho con {X}"),
    ("es", 1, "cómo hizo Esteban {X}", "cómo hiciste {X}"),
    ("es", 1, "cómo construyó Esteban {X}", "cómo construiste {X}"),
    ("es", 1, "qué usó Esteban para {X}", "qué usaste para {X}"),
    ("en", 0, "tell me about Esteban's work on {X}", "tell me about your work on {X}"),
    ("en", 0, "what does Esteban know about {X}", "what do you know about {X}"),
    ("en", 0, "has Esteban worked on {X}", "have you worked on {X}"),
    ("en", 0, "does Esteban know {X}", "do you know {X}"),
    ("en", 0, "what's Esteban's experience with {X}", "what's your experience with {X}"),
    ("en", 0, "what has he done with {X}", "what have you done with {X}"),
    ("en", 0, "is he familiar with {X}", "are you familiar with {X}"),
    ("en", 1, "how did Esteban build {X}", "how did you build {X}"),
    ("en", 1, "how did he make {X}", "how did you make {X}"),
    ("en", 1, "what did Esteban use for {X}", "what did you use for {X}"),
]

TEMPLATES = NEUTRAL + [(lg, how, t) for lg, how, third, second in PAIRS for t in (third, second)]

# Intenciones donde "qué es {X}" no tiene sentido (personales, listas, conversación): sin plantillas.
SKIP = {"who", "job_current", "contact", "location", "languages", "latest", "list_papers", "list_projects",
        "hire", "interests", "education", "cv", "greeting", "goodbye", "thanks", "out_of_scope"}


def generate(intents: list[dict], rng: random.Random, per_intent: int = 30) -> list[dict]:
    """→ [{text, intent, how, lang}]: per_intent filas por intención, mitad ES y mitad EN.
    Las plantillas de "cómo" solo se usan en intenciones que tienen respuesta `how`."""
    rows = []
    for it in intents:
        if it["id"] in SKIP:
            continue
        xs = list(dict.fromkeys(list(it.get("keys", [])) + list(it.get("weak", [])) + [it["t"]["es"], it["t"]["en"]]))
        if not xs:
            continue
        tpl = [t for t in TEMPLATES if t[1] == 0 or "how" in it]
        for n in range(per_intent):
            lang = "es" if n % 2 == 0 else "en"
            _, how, t = rng.choice([t for t in tpl if t[0] == lang])
            rows.append({"text": t.replace("{X}", rng.choice(xs)), "intent": it["id"], "how": how, "lang": lang})
    return rows


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    intents = load_elia()["intents"]
    rows = generate(intents, random.Random(1), per_intent=4)
    print(f"{len(TEMPLATES)} plantillas · {len({r['intent'] for r in rows})} intenciones con plantillas")
    for r in rows[:60]:
        print(f"  {r['intent']:<18} how={r['how']}  {r['text']}")
