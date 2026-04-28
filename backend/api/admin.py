from django.contrib import admin
from django.utils.html import mark_safe
from .models import *
from django.utils.html import format_html # Importante para formatear el link
from django.urls import reverse # Importante para generar la URL

# Helper reutilizable para vistas previas basadas en FileField/ImageField.
def image_preview(file_field):
    if file_field:
        return format_html(
            '<img src="{}" style="width: 100px; height: auto; border-radius: 4px; border: 1px solid #ccc;" />',
            file_field.url,
        )
    return "No hay imagen"

# --- Helper para generar el HTML de la imagen ---
def get_preview_html(obj):
    """Genera el HTML con la imagen clicable hacia su edición."""
    if obj.imatge_destacada and obj.imatge_destacada.url_imatge:
        url = reverse('admin:api_imatge_change', args=[obj.imatge_destacada.id])
        return format_html(
            '<a href="{}"><img src="{}" style="width: 150px; height: auto; border-radius: 4px; border: 1px solid #ccc;" /></a>',
            url,
            obj.imatge_destacada.url_imatge.url
        )
    return "Sin imagen"

# --- Inlines ---

class ImatgeInline(admin.TabularInline):
    model = Imatge
    extra = 1 # Espacio para añadir una nueva imagen
    readonly_fields = ('image_preview_inline',)

    def image_preview_inline(self, obj):
        if obj.url_imatge:
            return format_html('<img src="{}" style="width: 100px; height: auto;" />', obj.url_imatge.url)
        return "Sin imagen"

class ItemInline(admin.TabularInline):
    model = Item
    extra = 1
    # Definimos los campos que queremos ver. Al no incluir 'id', no saldrá.
    # Incluimos 'preview_destacada_inline' para que se vea la miniatura.
    fields = ('nom', 'preview_destacada_inline')
    readonly_fields = ('preview_destacada_inline',)

    def preview_destacada_inline(self, obj):
        return get_preview_html(obj)
    preview_destacada_inline.short_description = "Destacada"

# --- Admin Classes ---

@admin.register(Etiqueta)
class EtiquetaAdmin(admin.ModelAdmin):
    list_display = ('nom', 'parent')

@admin.register(Expo)
class ExpoAdmin(admin.ModelAdmin):
    list_display = ('nom', 'estat', 'data_creacio')
    inlines = [ItemInline] # Ahora el inline mostrará la miniatura

@admin.register(Item)
class ItemAdmin(admin.ModelAdmin):
    # 1. En la lista (tabla principal)
    list_display = ('nom', 'expo', 'preview_destacada')
    
    # 2. En el formulario de edición
    # Al definir 'fields', le decimos a Django exactamente qué ver y qué no (fuera ID)
    fields = ('nom', 'expo', 'descripcio', 'etiquetes', 'preview_destacada')
    
    # Ponemos la previsualización como readonly para que aparezca en el form
    readonly_fields = ('preview_destacada',)
    
    inlines = [ImatgeInline]
    filter_horizontal = ('etiquetes',)
    raw_id_fields = ('imatge_destacada',)

    # Tu función para la miniatura
    def preview_destacada(self, obj):
        return get_preview_html(obj)
    
    preview_destacada.short_description = "Vista Previa Destacada"

@admin.register(Imatge)
class ImatgeAdmin(admin.ModelAdmin):
    list_display = ('item', 'tipus', 'es_publica', 'image_preview_admin')
    readonly_fields = ('image_preview_admin',)

    def image_preview_admin(self, obj):
        if obj.url_imatge:
            return format_html('<img src="{}" style="width: 100px; height: auto;" />', obj.url_imatge.url)
        return "No hay imagen"
    image_preview_admin.short_description = "Vista previa"

@admin.register(Intent)
class IntentAdmin(admin.ModelAdmin):
    list_display = ("usuari", "expo", "data_intent", "image_preview_admin")
    readonly_fields = ("image_preview_admin",)

    def image_preview_admin(self, obj):
        return image_preview(obj.url_foto_enviada)
    image_preview_admin.short_description = "Foto enviada"