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
        # Usamos la IP que sí hace ping y dio 200 en la shell
        self.base_url = "http://192.168.1.24:8765"
        self.username = getattr(settings, 'UXIA_USERNAME', None)
        self.password = getattr(settings, 'UXIA_PASSWORD', None)
        self.token = self._authenticate()

    def _authenticate(self):
        """ Obtiene el token JWT usando el formato verificado en la shell """
        url = f"{self.base_url}/auth/login"
        if not self.username or not self.password:
            print("❌ Error: Credenciales de UXIA no configuradas en settings.py")
            return None

        payload = {
            "username": self.username,
            "password": self.password,
            "device": "django-backend" 
        }
        
        try:
            # Usamos json=payload (confirmado que funciona con 200)
            response = requests.post(url, json=payload, timeout=10)
            if response.status_code == 200:
                token = response.json().get('access_token')
                print(f"✅ Autenticación exitosa. Token obtenido.")
                return token
            
            print(f"❌ Error Auth ({response.status_code}): {response.text}")
            return None
        except Exception as e:
            print(f"❌ Excepción en Auth: {e}")
            return None

    def upload_expo_dataset(self, expo):
        """ Sube imágenes limpiando el dataset previo como indica el ejemplo """
        if not self.token: 
            print("⚠️ Abortando subida: No hay token de autenticación.")
            return False
            
        headers = {"Authorization": f"Bearer {self.token}"}

        # 1. Limpiar dataset anterior (Paso 2 del manual)
        try:
            requests.delete(f"{self.base_url}/dataset/default", headers=headers, timeout=10)
            print("🧹 Dataset previo limpiado correctamente.")
        except Exception as e:
            print(f"⚠️ Nota: No se pudo limpiar el dataset (puede que ya estuviera vacío): {e}")

        # 2. Subir imágenes
        items = expo.items.all()
        count = 0
        for item in items:
            for img in item.imatges.filter(es_publica=True):
                try:
                    if not img.url_imatge or not os.path.exists(img.url_imatge.path):
                        continue

                    with open(img.url_imatge.path, 'rb') as f:
                        # La API espera 'files' y 'labels' en plural (multipart/form-data)
                        files = {'files': (os.path.basename(img.url_imatge.name), f, 'image/jpeg')}
                        data = {'labels': item.nom}

                        res = requests.post(
                            f"{self.base_url}/dataset/images",
                            headers=headers,
                            files=files,
                            data=data,
                            timeout=30
                        )
                        if res.status_code == 200:
                            count += 1
                except Exception as e:
                    print(f"❌ Error subiendo imagen de {item.nom}: {e}")
        
        print(f"🚀 Subida finalizada: {count} imágenes cargadas.")
        return True

    def start_training(self):
        """ Inicia el entrenamiento """
        if not self.token: return None
        headers = {"Authorization": f"Bearer {self.token}"}
        try:
            # Algunas APIs requieren un JSON aunque sea vacío en el POST
            response = requests.post(f"{self.base_url}/train", headers=headers, json={}, timeout=30)
            print(f"🧠 Respuesta entrenamiento: {response.status_code}")
            return response
        except Exception as e:
            print(f"❌ Error al iniciar entrenamiento: {e}")
            return None

    def check_status(self):
        """ Consulta el estado """
        if not self.token: return {"status": "ERROR", "message": "No token"}
        headers = {"Authorization": f"Bearer {self.token}"}
        try:
            response = requests.get(f"{self.base_url}/train/check", headers=headers, timeout=10)
            return response.json()
        except Exception as e:
            return {"status": "ERROR", "message": str(e)}