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
        # Asegúrate de que esta IP es la correcta (cambió de la .24 a la .10)
        self.base_url = "http://192.168.1.24:8765"
        self.username = getattr(settings, 'UXIA_USERNAME', None)
        self.password = getattr(settings, 'UXIA_PASSWORD', None)
        self.token = self._authenticate()

    def _authenticate(self):
        url = f"{self.base_url}/auth/login"
        # CORRECCIÓN: Añadimos "device" como pide tu ejemplo
        payload = {
            "username": self.username,
            "password": self.password,
            "device": "django-backend" 
        }
        try:
            response = requests.post(url, data=payload, timeout=10)
            if response.status_code == 200:
                return response.json().get('access_token')
            print(f"Error Auth ({response.status_code}): {response.text}")
            return None
        except Exception as e:
            print(f"Excepción en Auth: {e}")
            return None
    
    def upload_expo_dataset(self, expo):
        if not self.token: return False
        headers = {"Authorization": f"Bearer {self.token}"}

        # PASO 2 del ejemplo: Limpiar dataset anterior
        try:
            requests.delete(f"{self.base_url}/dataset/default", headers=headers, timeout=10)
        except:
            pass
        
        items = expo.items.all()
        for item in items:
            # Importante: filter(es_publica=True) asumiendo que el campo existe
            for img in item.imatges.filter(es_publica=True):
                try:
                    if not os.path.exists(img.url_imatge.path):
                        continue

                    with open(img.url_imatge.path, 'rb') as f:
                        files = {'files': (os.path.basename(img.url_imatge.name), f, 'image/jpeg')}
                        data = {'labels': item.nom}

                        # Enviamos el label como parte de 'data', no 'json', al usar archivos
                        requests.post(
                            f"{self.base_url}/dataset/images",
                            headers=headers,
                            files=files,
                            data=data,
                            timeout=20                        
                        )
                except Exception as e:
                    print(f"Error subiendo imagen: {e}")
    def start_training(self):
        if not self.token: return None
        headers = {"Authorization": f"Bearer {self.token}"}
        try:
            # Usar json={} vacío si la API es estricta con el método POST
            return requests.post(f"{self.base_url}/train", headers=headers, json={}, timeout=30)
        except Exception as e:
            print(f"Error al iniciar entrenamiento: {e}")
            return None

    def check_status(self):
        if not self.token: return {"status": "ERROR", "message": "No token"}
        headers = {"Authorization": f"Bearer {self.token}"}
        try:
            response = requests.get(f"{self.base_url}/train/check", headers=headers, timeout=10)
            return response.json()
        except Exception as e:
            return {"status": "ERROR", "message": str(e)}