import ollama
from django.conf import settings
import os

def analizar_coche_con_ai(ruta_imagen):
    """
    Envía la imagen a Ollama y devuelve la descripción.
    """
    # Construimos la ruta absoluta real del archivo
    ruta_absoluta = os.path.join(settings.MEDIA_ROOT, ruta_imagen)
    
    client = ollama.Client(host='http://192.168.1.24:11434')
    
    # Prompt optimizado para que te devuelva datos limpios
    prompt = (
        "Eres un experto en automoción. Identifica la marca, el modelo y el año (si es posible) "
        "del coche en esta imagen. Devuelve una descripción breve y clara. "
        "Formato: [Marca] [Modelo] - [Breve descripción]"
    )
    
    try:
        response = client.chat(
            model='qwen3-vl:30b', 
            messages=[{
                'role': 'user',
                'content': prompt,
                'images': [ruta_absoluta]
            }]
        )
        return response['message']['content']
    except Exception as e:
        return f"Error conectando con la IA: {str(e)}"