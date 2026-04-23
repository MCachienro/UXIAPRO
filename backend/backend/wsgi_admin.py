"""
WSGI config for Django admin mounted under /admin.
"""

import os
from pathlib import Path

from dotenv import load_dotenv


BASE_DIR = Path(__file__).resolve().parent.parent
env_path = BASE_DIR / '.env'
load_dotenv(dotenv_path=env_path)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings_admin')

from django.core.wsgi import get_wsgi_application

application = get_wsgi_application()
