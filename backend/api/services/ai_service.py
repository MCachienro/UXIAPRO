import ollama
from django.conf import settings
import requests
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

class UXIAIService:
    def __init__(self):
        self.base_url = os.getenv("http://192.168.1.24:8765")
        self.token = self._authenticate()

        def _authenticate(self):
            # Implementar la llamada a /auth/login
            payload = {
                "username": os.getenv("UXIA_USERNAME"),
                "password": os.getenv("UXIA_PASSWORD")
            }
            response = requests.post(f"{self.base_url}/auth/login", data=payload)
            return response.json().get('access_token')
        
        def upload_expo_dataset(self, expo):
            # Recorre los items y ftoos y los sube a UXIA
            headers = {"Authorization": f"Bearer {self.token}"}
            for item in expo.items.all():
                for img in items.imatges.all():
                    with open(img.url_imatge.path, 'rb') as f:
                        requests.post(
                            f"{self.base_url}/dataset/images",
                            headers = headers,
                            files = {'file': f},
                            data = {'label': item.nom}
                        )

        def start_training(self):
            headers = {"Authorization": f"Bearer {self.token}"}
            return requests.post(f"{self.base_url}/train", headers = headers)

        def check_status(self):
            headers = {"Authorization": f"Bearer {self.token}"}
            response = requests.get(f"{self.base_url}/train/check", headers = headers)
            return response.json() # Devolverá IDLE, RUNNING, OK, etc.