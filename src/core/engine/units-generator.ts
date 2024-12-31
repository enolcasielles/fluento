import { Difficulty } from "../enums/difficulty.enum";
import { CustomError } from "../errors";
import { openai } from "../lib/openai";

interface Props {
  difficulty: Difficulty;
  topic?: string;
  grammarStructures?: string;
  numberOfUnits?: number;
}

interface Response {
  questionText: string;
  answerText: string;
}

export async function generateUnits(props: Props): Promise<Response[]> {
  try {
    const {
      difficulty,
      topic = "Temática general",
      grammarStructures = "Cualquier estructura gramatical",
      numberOfUnits = 10,
    } = props;

    const prompt = `
    Actúa como un profesor de inglés experto. Genera ${numberOfUnits} pares de frases para practicar inglés utilizando la metodología de traducción de Español a Inglés.
    
    Debes generar las frases cumpliendo los siguientes requisitos:
    - Nivel de dificultad: ${difficulty}. Posibles niveles: ${Object.values(Difficulty).join(", ")}
    - Temática a utilizar en las frases: ${topic}
    - Estructuras gramaticales a practicar: ${grammarStructures}
    
    Para cada par, necesito:
    1. Una frase en español (questionText)
    2. Su traducción correcta al inglés (answerText)
    
    Las frases deben:
    - Ser naturales y de uso común
    - Tener una longitud apropiada para el nivel
    - Enfocarse en el tema especificado
    - Utilizar las estructuras gramaticales indicadas
    
    Responde en formato JSON con este esquema:
    {
      "units": [
        {
          "questionText": "Frase en español",
          "answerText": "Correct English translation"
        }
      ]
    }
    `;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-4o-mini-2024-07-18",
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    const response = completion.choices[0].message.content;
    if (!response) {
      throw new CustomError({
        message: "No se pudieron generar las unidades",
      });
    }

    const parsedResponse = JSON.parse(response);
    if (!parsedResponse.units || !Array.isArray(parsedResponse.units)) {
      throw new CustomError({
        message: "El formato de respuesta no es válido",
      });
    }

    return parsedResponse.units;
  } catch (error) {
    if (error instanceof CustomError) {
      throw error;
    }
    throw new CustomError({
      message: "Error al generar las unidades",
    });
  }
}