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
        self.base_url = "http://192.168.56.10:8765"
        self.username = getattr(settings, 'UXIA_USERNAME', None)
        self.password = getattr(settings, 'UXIA_PASSWORD', None)
        self.token = self._authenticate()

    def _authenticate(self):
        """ Obtiene el token JWT usando las credenciales de settings.py """
        if not self.username or not self.password:
            print("Error: Credenciales de UXIA no configuradas en settings.py")
            return None
        
        try:
            payload = {
                "username": self.username,
                "password": self.password
            }
            # Enviamos como data (form-encoded) según los ejemplos anteriores
            response = requests.post(f"{self.base_url}/auth/login", json=payload)
            response.raise_for_status()
            return response.json().get('access_token')
        except Exception as e:
            print(f"Error en la autenticación con UXIA: {e}")
            return None
    
    def upload_expo_dataset(self, expo):
        """ Sube todas las imágenes de los items de una exposición a UXIA """
        if not self.token: return False
        
        headers = {"Authorization": f"Bearer {self.token}"}
        items = expo.items.all()
        
        for item in items:
            # Filtramos solo por imágenes públicas para el entrenamiento
            for img in item.imatges.filter(es_publica=True):
                try:
                    with open(img.url_imatge.path, 'rb') as f:
                        requests.post(
                            f"{self.base_url}/dataset/images",
                            headers=headers,
                            files={'file': f},
                            data={'label': item.nom}
                        )
                except Exception as e:
                    print(f"Error subiendo imagen de {item.nom}: {e}")

    def start_training(self):
        """ Inicia el proceso de entrenamiento en el servidor """
        if not self.token: return None
        headers = {"Authorization": f"Bearer {self.token}"}
        return requests.post(f"{self.base_url}/train", headers=headers)

    def check_status(self):
        """ Consulta el estado actual del entrenamiento """
        if not self.token: return {"status": "ERROR", "message": "No token"}
        headers = {"Authorization": f"Bearer {self.token}"}
        try:
            response = requests.get(f"{self.base_url}/train/check", headers=headers)
            return response.json() # Retorna: {"status": "RUNNING", ...}
        except Exception as e:
            return {"status": "ERROR", "message": str(e)}