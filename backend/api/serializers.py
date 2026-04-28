# serializers.py
from rest_framework import serializers
from .models import Expo, Item, Imatge

class ImatgeSerializer(serializers.ModelSerializer):
    url_imatge_absolute = serializers.SerializerMethodField()
    
    class Meta:
        model = Imatge
        fields = ['id', 'url_imatge', 'url_imatge_absolute', 'tipus', 'es_publica']
    
    def get_url_imatge_absolute(self, obj):
        request = self.context.get('request')
        if request and obj.url_imatge:
            return request.build_absolute_uri(obj.url_imatge.url)
        return None

class ItemSerializer(serializers.ModelSerializer):
    # Esto te permite ver la imagen dentro del ítem
    imatge_destacada = ImatgeSerializer(read_only=True)
    imatges = ImatgeSerializer(many=True, read_only=True)

    class Meta:
        model = Item
        fields = ['id', 'nom', 'descripcio', 'imatge_destacada', 'imatges', 'expo']

class ExpoSerializer(serializers.ModelSerializer):
    # Esto hace "la magia": incluye la lista de ítems dentro de la expo
    items = ItemSerializer(many=True, read_only=True)

    class Meta:
        model = Expo
        fields = ['id', 'nom', 'descripcio', 'estat', 'items', 'propietari']